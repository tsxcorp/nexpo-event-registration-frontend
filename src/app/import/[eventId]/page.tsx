'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { EventData, eventApi, FormField } from '@/lib/api/events';
import RegistrationLayout from '@/components/layouts/RegistrationLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProgressBar from '@/components/common/ProgressBar';

type RowStatus = 'unvalidated' | 'valid' | 'invalid' | 'importing' | 'success' | 'error';
type ImportPolicy = 'stopOnError' | 'skipErrors';

type RowResult = {
  status: RowStatus;
  message?: string;
};

const MAX_RECORDS = 1000;
const BATCH_SIZE = 50;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Validation & Normalization Utilities ---

const processPhoneNumber = (rawPhone: any): { isValid: boolean; normalized: string; error?: string } => {
  // Return valid for empty cells, as required status is checked separately.
  if (!rawPhone && rawPhone !== 0) {
    return { isValid: true, normalized: '' };
  }

  // 1. Clean the data: remove spaces, dots, dashes, parentheses
  const cleaned = String(rawPhone).replace(/[\s.()-]/g, '');

  // 2. Handle VN formats
  // +84xxxxxxxxx -> 0xxxxxxxxx
  if (cleaned.startsWith('+84') && /^\d{9}$/.test(cleaned.substring(3))) {
    return { isValid: true, normalized: '0' + cleaned.substring(3) };
  }
  // 84xxxxxxxxx -> 0xxxxxxxxx
  if (cleaned.startsWith('84') && /^\d{9}$/.test(cleaned.substring(2))) {
    return { isValid: true, normalized: '0' + cleaned.substring(2) };
  }
  // 9xxxxxxxxx (9 digits) -> 09xxxxxxxxx
  if (/^\d{9}$/.test(cleaned)) {
    return { isValid: true, normalized: '0' + cleaned };
  }
  // 0xxxxxxxxx (10 digits) - standard
  if (/^0\d{9}$/.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }
  
  // 3. Handle international formats
  if (/^\+\d{8,15}$/.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  // 4. If none of the above, it's invalid
  return { isValid: false, normalized: String(rawPhone), error: 'SĐT không hợp lệ.' };
};

const validateAndNormalizeRow = (row: any, formFields: FormField[]): { isValid: boolean; normalizedRow: any; error?: string } => {
  const normalizedRow = { ...row };

  // --- Field by field validation and normalization ---

  // Basic fields
  if (!row.full_name) return { isValid: false, normalizedRow, error: "Họ và tên là bắt buộc." };
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return { isValid: false, normalizedRow, error: "Email không hợp lệ." };

  // Phone number
  const phoneKey = Object.keys(row).find(k => k.toLowerCase().replace(/_/g, '') === 'mobilenumber' || k.toLowerCase().replace(/_/g, '') === 'phonenumber');
  if (phoneKey) {
    const phoneResult = processPhoneNumber(row[phoneKey]);
    if (!phoneResult.isValid) {
      return { isValid: false, normalizedRow, error: phoneResult.error };
    }
    normalizedRow[phoneKey] = phoneResult.normalized; // Update row with normalized number
  }

  // Custom fields
  for (const field of formFields) {
    if (field.required && !row[field.label]) {
      return { isValid: false, normalizedRow, error: `Trường "${field.label}" là bắt buộc.` };
    }

    // Validate Select and Multi Select fields
    if (row[field.label] && (field.type === 'Select' || field.type === 'Multi Select')) {
      const availableOptions = field.values || field.options || [];
      if (availableOptions.length > 0) {
        if (field.type === 'Select') {
          // Single select: value must be in available options
          if (!availableOptions.includes(row[field.label])) {
            return { 
              isValid: false, 
              normalizedRow, 
              error: `Giá trị "${row[field.label]}" không hợp lệ cho trường "${field.label}". Các giá trị hợp lệ: ${availableOptions.join(', ')}` 
            };
          }
        } else if (field.type === 'Multi Select') {
          // Multi select: split by comma and validate each value
          const selectedValues = String(row[field.label]).split(',').map((v: string) => v.trim()).filter((v: string) => v);
          const invalidValues = selectedValues.filter((value: string) => !availableOptions.includes(value));
          
          if (invalidValues.length > 0) {
            return { 
              isValid: false, 
              normalizedRow, 
              error: `Giá trị "${invalidValues.join(', ')}" không hợp lệ cho trường "${field.label}". Các giá trị hợp lệ: ${availableOptions.join(', ')}` 
            };
          }
          
          // Normalize multi-select value (join with comma)
          normalizedRow[field.label] = selectedValues.join(', ');
        }
      }
    }
  }
  
  return { isValid: true, normalizedRow };
};

export default function ImportExcelPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowResults, setRowResults] = useState<Record<number, RowResult>>({});
  
  // New state for inline editing
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; header: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  
  const [importPolicy, setImportPolicy] = useState<ImportPolicy>('stopOnError');
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validationSummary = useMemo(() => {
    const total = previewData.length;
    if (total === 0) return { total: 0, valid: 0, invalid: 0 };
    const invalid = Object.values(rowResults).filter(r => r.status === 'invalid').length;
    return { total, valid: total - invalid, invalid };
  }, [previewData, rowResults]);

  // Load event info
  useEffect(() => {
    if (!eventId) return;
    eventApi.getEventInfo(eventId)
      .then(res => setEventData(res.event))
      .catch(err => {
        console.error('Failed to load event data:', err);
        setEventData(null);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setGeneralError(null);
    setPreviewData([]);
    setHeaders([]);
    setRowResults({});

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length > MAX_RECORDS) {
          setGeneralError(`Số lượng bản ghi vượt quá giới hạn cho phép (${MAX_RECORDS}).`);
          return;
        }

        if (json.length > 0) {
          setHeaders(Object.keys(json[0]));
          
          const initialResults: Record<number, RowResult> = {};
          const normalizedData: any[] = [];
          const formFields = eventData?.formFields || [];

          json.forEach((row, index) => {
            const { isValid, normalizedRow, error } = validateAndNormalizeRow(row, formFields);
            normalizedData.push(normalizedRow);
            initialResults[index] = {
              status: isValid ? 'valid' : 'invalid',
              message: error,
            };
          });
          
          setRowResults(initialResults);
          setPreviewData(normalizedData);
        }
      } catch (error) {
        setGeneralError("File không hợp lệ hoặc không đúng định dạng.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (!eventData || validationSummary.invalid > 0 && importPolicy === 'stopOnError') {
      setGeneralError("Vui lòng sửa các lỗi trong file trước khi import.");
      return;
    }
    
    setIsProcessing(true);
    setGeneralError(null);
    setImportProgress({ processed: 0, total: previewData.length });

    const dataToImport = previewData.filter((_, index) => rowResults[index]?.status === 'valid');
    setImportProgress({ processed: 0, total: dataToImport.length });

    for (let i = 0; i < dataToImport.length; i += BATCH_SIZE) {
      const batch = dataToImport.slice(i, i + BATCH_SIZE);
      const batchIndices = previewData.map((row, index) => dataToImport.includes(row) ? index : -1).filter(index => index !== -1).slice(i, i + BATCH_SIZE);
      
      try {
        // Here we would send the batch to a new backend endpoint
        // For now, let's simulate with a delay
        await sleep(500); // SIMULATE API CALL
        
        const newResults = { ...rowResults };
        batchIndices.forEach(index => {
          // This is where you would process real API response
          const isSuccess = Math.random() > 0.1; // Simulate success/failure
          if(isSuccess) {
            newResults[index] = { status: 'success', message: 'Import thành công' };
          } else {
            newResults[index] = { status: 'error', message: 'Lỗi từ Zoho (mô phỏng)' };
          }
        });
        setRowResults(newResults);

      } catch (err: any) {
        setGeneralError(`Lỗi khi xử lý lô ${i / BATCH_SIZE + 1}.`);
        setIsProcessing(false);
        return;
      }
      setImportProgress(prev => ({ ...prev, processed: prev.processed + batch.length }));
    }

    setIsProcessing(false);
  };

  const handleExportSample = () => {
    if (!eventData) return;
    
    setIsProcessing(true);
    try {
      const coreHeaders = ['title', 'full_name', 'email', 'mobile_number'];
      const customHeaders = eventData.formFields.map(field => field.label);
      
      const allHeaders = [...coreHeaders, ...customHeaders];
      
      // Find the maximum number of options among Select/Multi Select fields
      let maxOptions = 1;
      const selectFields = eventData.formFields.filter(field => 
        field.type === 'Select' || field.type === 'Multi Select'
      );
      
      selectFields.forEach(field => {
        const options = field.values || field.options || [];
        if (options.length > maxOptions) {
          maxOptions = options.length;
        }
      });
      
      // Create multiple sample records
      const sampleRecords = [];
      for (let i = 0; i < Math.min(maxOptions, 10); i++) { // Limit to 10 records max
        const sampleRecord: { [key: string]: any } = {
          title: i === 0 ? 'Mr.' : (i === 1 ? 'Ms.' : 'Dr.'),
          full_name: `Nguyen Van ${String.fromCharCode(65 + i)}`, // A, B, C, ...
          email: `example${i + 1}@email.com`,
          mobile_number: `090123456${i}`,
        };

        eventData.formFields.forEach(field => {
          const isSelectable = field.type === 'Select' || field.type === 'Multi Select';
          const availableOptions = field.values || field.options;

          if (isSelectable && availableOptions && availableOptions.length > 0) {
            if (field.type === 'Select') {
              // Cycle through options for different records
              const optionIndex = i % availableOptions.length;
              sampleRecord[field.label] = availableOptions[optionIndex];
            } else if (field.type === 'Multi Select') {
              // For Multi Select: randomly select 1-3 values
              const numValues = Math.min(Math.floor(Math.random() * 3) + 1, availableOptions.length);
              const shuffledOptions = [...availableOptions].sort(() => Math.random() - 0.5);
              const selectedValues = shuffledOptions.slice(0, numValues);
              sampleRecord[field.label] = selectedValues.join(', ');
            }
          } else if (field.default) {
            sampleRecord[field.label] = field.default;
          } else {
            if (!coreHeaders.includes(field.label.toLowerCase().replace(/ /g, '_'))) {
              sampleRecord[field.label] = `Sample ${i + 1} for ${field.label}`;
            }
          }
        });
        
        sampleRecords.push(sampleRecord);
      }

      const ws = XLSX.utils.json_to_sheet(sampleRecords, { header: allHeaders });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
      XLSX.writeFile(wb, `sample-template-${eventId}.xlsx`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setRowResults({});
    setGeneralError(null);
    setImportProgress({ processed: 0, total: 0 });
    setIsProcessing(false);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Inline editing functions
  const startEditing = (rowIndex: number, header: string, currentValue: any) => {
    setEditingCell({ rowIndex, header });
    setEditValue(String(currentValue || ''));
    
    // Handle Multi Select fields
    const fieldInfo = getFieldOptions(header);
    if (fieldInfo.type === 'Multi Select') {
      const currentValues = String(currentValue || '').split(',').map((v: string) => v.trim()).filter((v: string) => v);
      setMultiSelectValues(currentValues);
    }
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;
    const newData = [...previewData];
    newData[rowIndex] = { ...newData[rowIndex], [header]: editValue };
    setPreviewData(newData);

    // Re-validate the row
    const formFields = eventData?.formFields || [];
    const { isValid, normalizedRow, error } = validateAndNormalizeRow(newData[rowIndex], formFields);
    
    const newResults = { ...rowResults };
    newResults[rowIndex] = {
      status: isValid ? 'valid' : 'invalid',
      message: error,
    };
    setRowResults(newResults);

    // Update the row with normalized data
    newData[rowIndex] = normalizedRow;
    setPreviewData(newData);

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setMultiSelectValues([]);
  };

  const handleMultiSelectSave = () => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;
    const newValue = multiSelectValues.join(', ');
    const newData = [...previewData];
    newData[rowIndex] = { ...newData[rowIndex], [header]: newValue };
    setPreviewData(newData);

    // Re-validate the row
    const formFields = eventData?.formFields || [];
    const { isValid, normalizedRow, error } = validateAndNormalizeRow(newData[rowIndex], formFields);
    
    const newResults = { ...rowResults };
    newResults[rowIndex] = {
      status: isValid ? 'valid' : 'invalid',
      message: error,
    };
    setRowResults(newResults);

    setEditingCell(null);
    setEditValue('');
    setMultiSelectValues([]);
  };

  const handleMultiSelectChange = (option: string, checked: boolean) => {
    if (checked) {
      setMultiSelectValues(prev => [...prev, option]);
    } else {
      setMultiSelectValues(prev => prev.filter(v => v !== option));
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Helper function to get field options for dropdown
  const getFieldOptions = (header: string) => {
    if (!eventData) return { options: [], type: 'text' };
    
    const field = eventData.formFields.find(f => f.label === header);
    if (field && (field.type === 'Select' || field.type === 'Multi Select')) {
      return { 
        options: field.values || field.options || [], 
        type: field.type 
      };
    }
    return { options: [], type: 'text' };
  };

  // Helper function to render editable cell content
  const renderEditableCell = (rowIndex: number, header: string, cellValue: any, isEditing: boolean) => {
    const fieldInfo = getFieldOptions(header);
    const isSelectField = fieldInfo.options.length > 0;

    if (isEditing) {
      if (isSelectField && fieldInfo.type === 'Multi Select') {
        // Multi Select with checkboxes
        return (
          <div className="space-y-2">
            <div className="max-h-32 overflow-y-auto space-y-1">
              {fieldInfo.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={multiSelectValues.includes(option)}
                    onChange={(e) => handleMultiSelectChange(option, e.target.checked)}
                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMultiSelectSave();
                }}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                ✓ Lưu
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEdit();
                }}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                ✕ Hủy
              </button>
            </div>
          </div>
        );
      } else if (isSelectField && fieldInfo.type === 'Select') {
        // Single Select with dropdown
        return (
          <div className="flex items-center space-x-2">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={saveEdit}
              className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="">-- Chọn --</option>
              {fieldInfo.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveEdit();
              }}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelEdit();
              }}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ✕
            </button>
          </div>
        );
      } else {
        // Regular text input
        return (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={saveEdit}
              className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveEdit();
              }}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelEdit();
              }}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ✕
            </button>
          </div>
        );
      }
    } else {
      return (
        <div className="group">
          <span>{cellValue}</span>
          <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
            {isSelectField ? (fieldInfo.type === 'Multi Select' ? '📋📋' : '📋') : '✏️'}
          </span>
        </div>
      );
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!eventData) return <div className="min-h-screen flex items-center justify-center"><Card className="p-8 text-center text-red-600">Không tìm thấy sự kiện.</Card></div>;

  return (
    <RegistrationLayout eventData={eventData}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 Import Dữ Liệu: {eventData.name}</h1>
          <p className="mt-2 text-sm text-gray-600">Quy trình 3 bước: Tải file, xem trước và xác thực, sau đó tiến hành import.</p>
        </Card>

        {/* --- Step 1 & 2: Upload and Settings --- */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Bước 1: Tải File</h2>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gray-100 hover:file:bg-gray-200" />
              <div className="mt-4 space-y-2">
                <Button onClick={handleExportSample} variant="secondary" className="w-full">📄 Tải Template Mẫu (Nhiều Records)</Button>
                {file && (
                  <Button onClick={handleReset} variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                    🔄 Làm Lại (Reset)
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Bước 2: Cấu Hình</h2>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Khi gặp lỗi:</label>
                <div className="flex items-center">
                  <input id="stopOnError" type="radio" name="policy" value="stopOnError" checked={importPolicy === 'stopOnError'} onChange={() => setImportPolicy('stopOnError')} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="stopOnError" className="ml-3 block text-sm text-gray-900">Dừng lại</label>
                </div>
                <div className="flex items-center">
                  <input id="skipErrors" type="radio" name="policy" value="skipErrors" checked={importPolicy === 'skipErrors'} onChange={() => setImportPolicy('skipErrors')} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="skipErrors" className="ml-3 block text-sm text-gray-900">Bỏ qua dòng lỗi</label>
                </div>
              </div>
            </Card>
          </div>

          {/* --- Step 3: Preview and Import --- */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Bước 3: Xem Trước & Import</h2>
                <div className="mt-2 text-sm flex space-x-4">
                  <span>Tổng số: <span className="font-bold">{validationSummary.total}</span></span>
                  <span className="text-green-600">Hợp lệ: <span className="font-bold">{validationSummary.valid}</span></span>
                  <span className="text-red-600">Lỗi: <span className="font-bold">{validationSummary.invalid}</span></span>
                </div>
              </div>

              {previewData.length > 0 && (
                <div className="space-y-4">
                   <Button onClick={handleImport} disabled={isProcessing || (validationSummary.invalid > 0 && importPolicy === 'stopOnError')} variant="primary" className="w-full">
                    {isProcessing ? 'Đang Import...' : '🚀 Bắt đầu Import'}
                  </Button>
                  
                  {isProcessing && (
                     <ProgressBar value={importProgress.processed} max={importProgress.total} label={`Đang xử lý ${importProgress.processed}/${importProgress.total}...`} />
                  )}
                </div>
              )}

              {generalError && <p className="text-red-500 my-4 text-center">{generalError}</p>}

              <div className="mt-4">
                {previewData.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg"><p>Vui lòng tải file để xem trước.</p></div>
                ) : (
                  <>
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Chỉnh sửa trực tiếp:</strong> Click vào ô để chỉnh sửa dữ liệu. Nhấn Enter để lưu, Esc để hủy. 
                        Dữ liệu sẽ được validate tự động sau khi chỉnh sửa.
                        <br />
                        📋 <strong>Trường Select:</strong> Sẽ hiển thị dropdown với các options có sẵn để chọn.
                        <br />
                        📋📋 <strong>Trường Multi Select:</strong> Sẽ hiển thị checkbox để chọn nhiều giá trị, cách nhau bằng dấu phẩy.
                        <br />
                        ✅ <strong>Validation:</strong> Tự động kiểm tra giá trị hợp lệ cho Select/Multi Select để tránh lỗi khi import.
                      </p>
                    </div>
                    <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-600">Trạng Thái</th>
                            {headers.map(header => <th key={header} className="px-4 py-2 text-left font-medium text-gray-600 capitalize">{header.replace(/_/g, ' ')}</th>)}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.map((row, rowIndex) => {
                            const result = rowResults[rowIndex];
                            const statusConfig = {
                              unvalidated: { text: 'Chưa xác thực', color: 'gray-400' },
                              valid: { text: 'Hợp lệ', color: 'green-100 text-green-800' },
                              invalid: { text: 'Lỗi', color: 'red-100 text-red-800' },
                              importing: { text: 'Đang xử lý', color: 'blue-100 text-blue-800' },
                              success: { text: 'Thành công', color: 'green-200 text-green-900' },
                              error: { text: 'Thất bại', color: 'red-200 text-red-900' },
                            };
                            return (
                              <tr key={rowIndex} className={result?.status === 'invalid' || result?.status === 'error' ? 'bg-red-50' : ''}>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[result?.status || 'unvalidated'].color}`}>
                                    {statusConfig[result?.status || 'unvalidated'].text}
                                  </span>
                                  {(result?.status === 'invalid' || result?.status === 'error') && (
                                    <p className="text-red-600 text-xs mt-1">{result.message}</p>
                                  )}
                                </td>
                                {headers.map(header => {
                                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.header === header;
                                  const cellValue = row[header];
                                  
                                  return (
                                    <td 
                                      key={header} 
                                      className={`px-4 py-2 text-gray-800 whitespace-nowrap cursor-pointer hover:bg-gray-50 transition-colors ${
                                        isEditing ? 'bg-blue-50 border border-blue-300' : ''
                                      }`}
                                      onClick={() => !isEditing && startEditing(rowIndex, header, cellValue)}
                                    >
                                      {renderEditableCell(rowIndex, header, cellValue, isEditing)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RegistrationLayout>
  );
} 