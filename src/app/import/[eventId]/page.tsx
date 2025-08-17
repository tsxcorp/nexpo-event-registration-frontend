'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { apiClient } from '@/lib/api/client';
import * as XLSX from 'xlsx';
import { EventData, eventApi, FormField } from '@/lib/api/events';
import { normalizeFieldOptions, getFieldValue, getFieldLabel } from '@/lib/utils/fieldUtils';
import RegistrationLayout from '@/components/layouts/RegistrationLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProgressBar from '@/components/common/ProgressBar';
import { i18n } from '@/lib/translation/i18n';

type RowStatus = 'unvalidated' | 'valid' | 'invalid' | 'importing' | 'success' | 'error';
type ImportPolicy = 'stopOnError' | 'skipErrors';

type RowResult = {
  status: RowStatus;
  message?: string;
};

const MAX_RECORDS = 2000;
const BATCH_SIZE = 50;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Validation & Normalization Utilities ---

const processPhoneNumber = (rawPhone: any): { isValid: boolean; normalized: string; error?: string } => {
  // VALIDATION DISABLED: Accept all phone number formats for easier importing
  if (!rawPhone && rawPhone !== 0) {
    return { isValid: true, normalized: '' };
  }

  // Just normalize by converting to string and trimming
  const normalized = String(rawPhone).trim();
  
  // Always return valid - no validation
  return { isValid: true, normalized };
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

  // Custom fields (skip Agreement fields)
  for (const field of formFields) {
    if (field.type === 'Agreement') continue;
    if (field.required && !row[field.label]) {
      return { isValid: false, normalizedRow, error: `Trường "${field.label}" là bắt buộc.` };
    }

    // Validate Select and Multi Select fields
    if (row[field.label] && (field.type === 'Select' || field.type === 'Multi Select')) {
      const availableOptions = normalizeFieldOptions(field);
      const availableValues = availableOptions.map(opt => getFieldValue(opt).toLowerCase());
      const availableLabels = availableOptions.map(opt => getFieldLabel(opt));
      
      if (availableOptions.length > 0) {
        if (field.type === 'Select') {
          // Single select: value must be in available options (case-insensitive, trim)
          const value = String(row[field.label]).trim().toLowerCase();
          if (!availableValues.includes(value)) {
            return {
              isValid: false,
              normalizedRow,
              error: `Giá trị "${row[field.label]}" không hợp lệ cho trường "${field.label}". Các giá trị hợp lệ: ${availableLabels.join(', ')}`
            };
          }
        } else if (field.type === 'Multi Select') {
          // Multi select: split by comma, trim, lowercase, validate each value
          const selectedValues = String(row[field.label])
            .split(',')
            .map((v: string) => v.trim().toLowerCase())
            .filter((v: string) => v);
          const invalidValues = selectedValues.filter((value: string) => !availableValues.includes(value));

          if (invalidValues.length > 0) {
            return {
              isValid: false,
              normalizedRow,
              error: `Giá trị "${invalidValues.join(', ')}" không hợp lệ cho trường "${field.label}". Các giá trị hợp lệ: ${availableLabels.join(', ')}`
            };
          }

          // Normalize multi-select value (join with comma and space, original case)
          const originalSelected = String(row[field.label])
            .split(',')
            .map((v: string) => v.trim())
            .filter((v: string) => v);
          normalizedRow[field.label] = originalSelected.join(', ');
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
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi');

  // Track import history and final report
  const [importHistory, setImportHistory] = useState<{
    totalProcessed: number;
    totalSuccess: number;
    totalFailed: number;
    failedRecords: Array<{ row: any; error: string; rowIndex: number }>;
    isCompleted: boolean;
  }>({
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
    failedRecords: [],
    isCompleted: false
  });

  const validationSummary = useMemo(() => {
    const total = previewData.length;
    if (total === 0) return { total: 0, valid: 0, invalid: 0, success: 0, imported: 0 };
    
    const invalid = Object.values(rowResults).filter(r => r.status === 'invalid').length;
    const success = Object.values(rowResults).filter(r => r.status === 'success').length;
    const error = Object.values(rowResults).filter(r => r.status === 'error').length;
    const imported = success + error;
    const valid = total - invalid - imported;
    
    return { total, valid, invalid, success, imported, error };
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
    // Reset import history when new file is loaded
    setImportHistory({
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      failedRecords: [],
      isCompleted: false
    });

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
          // Filter out Agreement fields from headers
          const agreementLabels = (eventData?.formFields || []).filter(f => f.type === 'Agreement').map(f => f.label);
          setHeaders(Object.keys(json[0]).filter(h => !agreementLabels.includes(h)));
          const initialResults: Record<number, RowResult> = {};
          const normalizedData: any[] = [];
          const formFields = eventData?.formFields || [];
          json.forEach((row, index) => {
            // Remove Agreement fields from row
            agreementLabels.forEach(label => delete row[label]);
            const { isValid, normalizedRow, error } = validateAndNormalizeRow(row, formFields);
            normalizedData.push(normalizedRow);
            initialResults[index] = {
              status: isValid ? 'valid' : 'invalid',
              message: error,
            };
          });
          setRowResults(initialResults);
          setPreviewData(normalizedData);
          
          // Auto scroll to first error after a short delay
          setTimeout(() => {
            const firstErrorRow = document.querySelector('tr.bg-red-50');
            if (firstErrorRow) {
              firstErrorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      } catch (error) {
        setGeneralError("File không hợp lệ hoặc không đúng định dạng.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

    const handleImport = async () => {
    console.log('🚀 Starting import process...');
    console.log('Event ID:', eventId);
    console.log('Preview data length:', previewData.length);
    console.log('Validation summary:', validationSummary);
    console.log('Import policy:', importPolicy);
    
    if (!eventData || validationSummary.invalid > 0 && importPolicy === 'stopOnError') {
              setGeneralError(i18n[currentLanguage]?.please_fix_errors_before_import || "Vui lòng sửa các lỗi trong file trước khi import.");
      return;
    }
    
    setIsProcessing(true);
    setGeneralError(null);
    setImportProgress({ processed: 0, total: previewData.length });

    // Only import valid records (not already imported)
    const dataToImport = previewData.filter((_, index) => rowResults[index]?.status === 'valid');
    console.log('Data to import:', dataToImport.length, 'records');
    setImportProgress({ processed: 0, total: dataToImport.length });

    // Initialize import tracking
    const currentBatchFailures: Array<{ row: any; error: string; rowIndex: number }> = [];
    let batchSuccessCount = 0;
    let batchFailureCount = 0;

    console.log('📋 Starting batch processing for all valid records...');

    for (let i = 0; i < dataToImport.length; i += BATCH_SIZE) {
      const batch = dataToImport.slice(i, i + BATCH_SIZE);
      const batchIndices = previewData.map((row, index) => dataToImport.includes(row) ? index : -1).filter(index => index !== -1).slice(i, i + BATCH_SIZE);
      
      try {
        // Create FormData for the batch
        const formData = new FormData();
        
        // Transform data to match backend expectations
        const agreementLabels = (eventData?.formFields || []).filter(f => f.type === 'Agreement').map(f => f.label);
        const transformedBatch = batch.map(row => {
          const transformedRow: any = {};
          
          // Map core fields to expected names
          if (row.title !== undefined) transformedRow.title = row.title;
          if (row.full_name !== undefined) transformedRow.full_name = row.full_name;
          if (row.email !== undefined) transformedRow.email = row.email;
          if (row.mobile_number !== undefined) transformedRow.mobile_number = row.mobile_number;
          
          // Add all other fields as custom fields, except Agreement
          Object.keys(row).forEach(key => {
            if (!['title', 'full_name', 'email', 'mobile_number'].includes(key.toLowerCase()) && !agreementLabels.includes(key)) {
              transformedRow[key] = row[key];
            }
          });
          
          // Set Agreement fields to true
          agreementLabels.forEach(label => {
            transformedRow[label] = true;
          });
          
          return transformedRow;
        });
        
        // Create Excel file from transformed batch data
        console.log('Creating Excel file for batch:', transformedBatch);
        const ws = XLSX.utils.json_to_sheet(transformedBatch);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Import');
        
        // Generate buffer and create file
        console.log('Writing Excel workbook to buffer...');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        // Create a File object with a simpler MIME type
        const excelFile = new File([excelBuffer], `import-batch-${i / BATCH_SIZE + 1}.xlsx`, {
          type: 'application/vnd.ms-excel'
        });
        
        console.log('Created Excel file:', {
          name: excelFile.name,
          size: excelFile.size,
          type: excelFile.type,
          bufferSize: excelBuffer.byteLength
        });
        
        formData.append('file', excelFile);
        formData.append('event_id', eventId);

        // Make API call to backend
        console.log(`🚀 Sending batch ${i / BATCH_SIZE + 1} with ${batch.length} records to backend...`);
        console.log('API Client base URL:', apiClient.defaults.baseURL);
        const formDataFile = formData.get('file');
        console.log('FormData contents:', {
          hasFile: formData.has('file'),
          hasEventId: formData.has('event_id'),
          eventId: formData.get('event_id'),
          fileType: typeof formDataFile,
          isFile: formDataFile instanceof File,
          isBlob: formDataFile instanceof Blob,
          fileDetails: formDataFile instanceof File ? {
            name: formDataFile.name,
            size: formDataFile.size,
            type: formDataFile.type
          } : 'Not a File object'
        });
        
        // Sử dụng axios trực tiếp thay vì apiClient để tránh conflict với JSON config
        const importUrl = `${apiClient.defaults.baseURL}/api/imports`;
        console.log('🌐 Import URL:', importUrl);
        const response = await axios.post(importUrl, formData, {
          headers: {
            // Không set Content-Type, để axios tự động set multipart/form-data
          },
        });
        console.log(`✅ Backend response for batch ${i / BATCH_SIZE + 1}:`, response.data);

        // Process backend response
        const { report, success, total } = response.data;
        console.log('Processing backend response:', { success, total, reportLength: report?.length });
        
        const newResults = { ...rowResults };
        
        if (report && Array.isArray(report)) {
          report.forEach((result: any, reportIndex: number) => {
            const actualIndex = batchIndices[reportIndex];
            console.log(`Processing result ${reportIndex}:`, result, 'for index:', actualIndex);
            
            if (actualIndex !== undefined) {
              const isSuccess = result.status.includes('✅') || result.status.includes('Success');
              const errorMessage = result.error || result.status || 'Lỗi không xác định';
              
              newResults[actualIndex] = {
                status: isSuccess ? 'success' : 'error',
                message: isSuccess ? 'Import thành công' : errorMessage
              };

              // Track success/failure for final report
              if (isSuccess) {
                batchSuccessCount++;
              } else {
                batchFailureCount++;
                currentBatchFailures.push({
                  row: previewData[actualIndex],
                  error: errorMessage,
                  rowIndex: actualIndex
                });
              }
            }
          });
        } else {
          console.error('Invalid report format:', report);
          // Mark all as error if report is invalid
          batchIndices.forEach(index => {
            const errorMessage = 'Phản hồi từ server không hợp lệ';
            newResults[index] = { 
              status: 'error', 
              message: errorMessage
            };
            batchFailureCount++;
            currentBatchFailures.push({
              row: previewData[index],
              error: errorMessage,
              rowIndex: index
            });
          });
        }
        
        setRowResults(newResults);

      } catch (err: any) {
        console.error(`❌ Import batch ${i / BATCH_SIZE + 1} error:`, err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config
        });
        
        // Mark all records in this batch as failed
        const newResults = { ...rowResults };
        const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'Lỗi kết nối API';
        
        batchIndices.forEach(index => {
          newResults[index] = { 
            status: 'error', 
            message: errorMessage
          };
          batchFailureCount++;
          currentBatchFailures.push({
            row: previewData[index],
            error: errorMessage,
            rowIndex: index
          });
        });
        setRowResults(newResults);

        if (importPolicy === 'stopOnError') {
          setGeneralError(`Lỗi khi xử lý lô ${i / BATCH_SIZE + 1}: ${err.response?.data?.details || err.response?.data?.error || err.message}`);
          setIsProcessing(false);
          return;
        }
      }
      setImportProgress(prev => ({ ...prev, processed: prev.processed + batch.length }));
      
      // Add delay between batches to avoid overwhelming the backend
      if (i + BATCH_SIZE < dataToImport.length) {
        await sleep(1000);
      }
    }

    console.log('✅ Import process completed');
    
    // Update import history with final results
    setImportHistory(prev => ({
      totalProcessed: prev.totalProcessed + batchSuccessCount + batchFailureCount,
      totalSuccess: prev.totalSuccess + batchSuccessCount,
      totalFailed: prev.totalFailed + batchFailureCount,
      failedRecords: [...prev.failedRecords, ...currentBatchFailures],
      isCompleted: true
    }));
    
    setIsProcessing(false);
  };

  const handleExportFailedRecords = () => {
    if (importHistory.failedRecords.length === 0) {
      alert('Không có dòng lỗi nào để xuất.');
      return;
    }

    try {
      // Prepare failed records data for export
      const failedData = importHistory.failedRecords.map(({ row, error, rowIndex }) => ({
        'STT': rowIndex + 1,
        'Lỗi': error,
        ...row
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');

      // Auto-adjust column widths
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const columnWidths: { wch: number }[] = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 10;
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, Math.min(cellLength, 50));
          }
        }
        columnWidths.push({ wch: maxWidth });
      }
      ws['!cols'] = columnWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toLocaleString('vi-VN').replace(/[/:]/g, '-');
      const filename = `loi-import-${timestamp}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, filename);
      
      console.log(`✅ Exported ${failedData.length} failed records to ${filename}`);
    } catch (error) {
      console.error('❌ Error exporting failed records:', error);
              alert(i18n[currentLanguage]?.error_exporting_error_report || 'Có lỗi khi xuất file báo cáo lỗi.');
    }
  };

  const handleExportSample = () => {
    if (!eventData) return;
    
    setIsProcessing(true);
    try {
      const coreHeaders = ['title', 'full_name', 'email', 'mobile_number'];
      // Skip Agreement fields
      const customHeaders = eventData.formFields.filter(f => f.type !== 'Agreement').map(field => field.label);
      const allHeaders = [...coreHeaders, ...customHeaders];
      
      // Find the maximum number of options among Select/Multi Select fields
      let maxOptions = 1;
      const selectFields = eventData.formFields.filter(field => 
        field.type === 'Select' || field.type === 'Multi Select'
      );
      
      selectFields.forEach(field => {
        const options = normalizeFieldOptions(field);
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
          if (field.type === 'Agreement') return;
          const isSelectable = field.type === 'Select' || field.type === 'Multi Select';
          const availableOptions = normalizeFieldOptions(field);

          if (isSelectable && availableOptions && availableOptions.length > 0) {
            if (field.type === 'Select') {
              // Cycle through options for different records
              const optionIndex = i % availableOptions.length;
              sampleRecord[field.label] = getFieldValue(availableOptions[optionIndex]);
            } else if (field.type === 'Multi Select') {
              // For Multi Select: randomly select 1-3 values
              const numValues = Math.min(Math.floor(Math.random() * 3) + 1, availableOptions.length);
              const shuffledOptions = [...availableOptions].sort(() => Math.random() - 0.5);
              const selectedValues = shuffledOptions.slice(0, numValues);
              sampleRecord[field.label] = selectedValues.map(opt => getFieldValue(opt)).join(', ');
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
    // Reset import history
    setImportHistory({
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      failedRecords: [],
      isCompleted: false
    });
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const scrollToNextError = () => {
    const errorRows = document.querySelectorAll('tr.bg-red-50');
    const currentScroll = window.scrollY;
    let nextErrorRow = null;
    
    for (let i = 0; i < errorRows.length; i++) {
      const row = errorRows[i];
      const rect = row.getBoundingClientRect();
      if (rect.top > 100) { // 100px from top
        nextErrorRow = row;
        break;
      }
    }
    
    if (nextErrorRow) {
      nextErrorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errorRows.length > 0) {
      // If no next error found, scroll to first error
      errorRows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Inline editing functions
  const startEditing = (rowIndex: number, header: string, currentValue: any) => {
    setEditingCell({ rowIndex, header });
    setEditValue(String(currentValue || ''));

    // Handle Multi Select fields
    const fieldInfo = getFieldOptions(header);
    if (fieldInfo.type === 'Multi Select') {
      // Always reset and normalize values
      const currentValues = String(currentValue || '')
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v);
      setMultiSelectValues(currentValues);
    } else {
      setMultiSelectValues([]); // Always reset for non-multiselect
    }
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;
    const newData = [...previewData];
    newData[rowIndex] = { ...newData[rowIndex], [header]: editValue };
    setPreviewData(newData);

    // Re-validate the row only if it hasn't been imported yet
    const currentStatus = rowResults[rowIndex]?.status;
    const newResults = { ...rowResults };
    
    // Don't re-validate if already imported (success/error status should be preserved)
    if (currentStatus !== 'success' && currentStatus !== 'error') {
    const formFields = eventData?.formFields || [];
    const { isValid, normalizedRow, error } = validateAndNormalizeRow(newData[rowIndex], formFields);

    newResults[rowIndex] = {
      status: isValid ? 'valid' : 'invalid',
      message: error,
    };

      // Update the row with normalized data only if re-validating
    newData[rowIndex] = normalizedRow;
    setPreviewData(newData);
    }
    
    setRowResults(newResults);

    setEditingCell(null);
    setEditValue('');
    setMultiSelectValues([]); // Always reset
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setMultiSelectValues([]); // Always reset
  };

  const handleMultiSelectSave = () => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;
    // Normalize: trim, remove duplicates, join with ', '
    const uniqueValues = Array.from(new Set(multiSelectValues.map(v => v.trim()).filter(v => v)));
    const newValue = uniqueValues.join(', ');
    const newData = [...previewData];
    newData[rowIndex] = { ...newData[rowIndex], [header]: newValue };
    setPreviewData(newData);

    // Re-validate the row only if it hasn't been imported yet
    const currentStatus = rowResults[rowIndex]?.status;
    const newResults = { ...rowResults };
    
    // Don't re-validate if already imported (success/error status should be preserved)
    if (currentStatus !== 'success' && currentStatus !== 'error') {
    const formFields = eventData?.formFields || [];
    const { isValid, normalizedRow, error } = validateAndNormalizeRow(newData[rowIndex], formFields);

    newResults[rowIndex] = {
      status: isValid ? 'valid' : 'invalid',
      message: error,
    };
    }
    
    setRowResults(newResults);

    setEditingCell(null);
    setEditValue('');
    setMultiSelectValues([]); // Always reset
  };

  const handleMultiSelectChange = (option: string, checked: boolean) => {
    if (checked) {
      setMultiSelectValues(prev => Array.from(new Set([...prev, option])));
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
        options: normalizeFieldOptions(field), 
        type: field.type 
      };
    }
    return { options: [], type: 'text' };
  };

  // Helper function to render editable cell content
  const renderEditableCell = (rowIndex: number, header: string, cellValue: any, isEditing: boolean, isImported: boolean = false) => {
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
                    checked={multiSelectValues.includes(getFieldValue(option))}
                    onChange={(e) => handleMultiSelectChange(getFieldValue(option), e.target.checked)}
                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>{getFieldLabel(option)}</span>
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
                <option key={index} value={getFieldValue(option)}>
                  {getFieldLabel(option)}
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
        <div className="group flex items-center w-full">
          <span className="flex-1 truncate mr-1" title={String(cellValue || '')}>
            {cellValue}
          </span>
          {!isImported && (
            <span className="flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
            {isSelectField ? (fieldInfo.type === 'Multi Select' ? '📋📋' : '📋') : '✏️'}
          </span>
          )}
          {isImported && (
            <span className="flex-shrink-0 text-green-600 text-xs">
              ✅
            </span>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text="Đang tải thông tin sự kiện..."
        />
      </div>
    );
  }
  
  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            Không tìm thấy sự kiện.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationLayout eventData={eventData}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 Import Dữ Liệu: {eventData.name}</h1>
          <p className="mt-2 text-sm text-gray-600">Quy trình 3 bước: Tải file, xem trước và xác thực, sau đó tiến hành import.</p>
        </Card>

        {/* --- Step 1 & 2: Upload and Settings --- */}
        <div className="grid lg:grid-cols-4 gap-8">
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
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Bước 3: Xem Trước & Import</h2>
                <div className="mt-2 text-sm flex space-x-4">
                  <span>Tổng số: <span className="font-bold">{validationSummary.total}</span></span>
                  <span className="text-blue-600">Hợp lệ: <span className="font-bold">{validationSummary.valid}</span></span>
                  <span className="text-green-600">Thành công: <span className="font-bold">{validationSummary.success}</span></span>
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
                  <div className="text-center py-10 border-2 border-dashed rounded-lg"><p>{i18n[currentLanguage]?.please_upload_file_to_preview || "Vui lòng tải file để xem trước."}</p></div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-blue-800">
                          📊 File đã sẵn sàng để import
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Bảng dữ liệu chi tiết hiển thị bên dưới với khả năng chỉnh sửa trực tiếp
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="grid grid-cols-5 gap-3 text-center">
                          <div>
                            <p className="text-xl font-bold text-gray-700">{validationSummary.total}</p>
                            <p className="text-xs text-gray-600">Tổng số</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-blue-600">{validationSummary.valid}</p>
                            <p className="text-xs text-blue-600">Hợp lệ</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-green-600">{validationSummary.success}</p>
                            <p className="text-xs text-green-600">Thành công</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-red-600">{validationSummary.invalid}</p>
                            <p className="text-xs text-red-600">Lỗi</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-purple-600">{validationSummary.imported}</p>
                            <p className="text-xs text-purple-600">Đã import</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Error Summary */}
                    {validationSummary.invalid > 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="mb-3 p-2 bg-red-100 rounded text-xs text-red-800">
                          💡 <strong>Hướng dẫn sửa lỗi:</strong> 
                          <ul className="mt-1 ml-4 list-disc">
                            <li>Click vào ô có lỗi để chỉnh sửa trực tiếp</li>
                            <li>Sử dụng nút "Lỗi tiếp theo" để di chuyển giữa các lỗi</li>
                            <li>Sau khi sửa, lỗi sẽ tự động biến mất khi hợp lệ</li>
                          </ul>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-red-800">
                            🚨 Tổng hợp lỗi ({validationSummary.invalid} dòng)
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-red-600">
                              Click vào từng dòng để xem chi tiết và sửa lỗi
                            </span>
                            <button
                              onClick={scrollToNextError}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              🔍 Lỗi tiếp theo
                            </button>
                          </div>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          {Object.entries(rowResults)
                            .filter(([_, result]) => result?.status === 'invalid')
                            .slice(0, 10) // Chỉ hiển thị 10 lỗi đầu tiên
                            .map(([index, result]) => (
                              <div key={index} className="text-xs text-red-700 mb-1 flex items-start">
                                <span className="font-medium mr-2">Dòng {Number(index) + 1}:</span>
                                <span className="flex-1">{result?.message}</span>
                              </div>
                            ))}
                          {validationSummary.invalid > 10 && (
                            <div className="text-xs text-red-600 mt-1">
                              ... và {validationSummary.invalid - 10} lỗi khác. Vui lòng xem bảng dưới để sửa tất cả lỗi.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Final Import Report */}
        {importHistory.isCompleted && (
          <div className="mt-8">
            <Card className="p-6 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-indigo-800">📊 Báo Cáo Import Hoàn Thành</h2>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleString('vi-VN')}
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{importHistory.totalSuccess}</p>
                      <p className="text-sm text-green-700">Thành công</p>
                    </div>
                    <div className="text-green-500">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600">{importHistory.totalFailed}</p>
                      <p className="text-sm text-red-700">Thất bại</p>
                    </div>
                    <div className="text-red-500">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{importHistory.totalProcessed}</p>
                      <p className="text-sm text-blue-700">Tổng xử lý</p>
                    </div>
                    <div className="text-blue-500">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {importHistory.failedRecords.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-red-700">
                      🚨 Danh sách lỗi ({importHistory.failedRecords.length} dòng)
                    </h3>
                    <Button 
                      onClick={handleExportFailedRecords}
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      📤 Xuất file lỗi
                    </Button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-red-700">STT</th>
                          <th className="px-3 py-2 text-left font-medium text-red-700">Lỗi</th>
                          <th className="px-3 py-2 text-left font-medium text-red-700">Dữ liệu</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importHistory.failedRecords.map(({ row, error, rowIndex }, index) => (
                          <tr key={index} className="hover:bg-red-50">
                            <td className="px-3 py-2 text-red-600 font-medium">{rowIndex + 1}</td>
                            <td className="px-3 py-2 text-red-700 max-w-xs">
                              <div className="truncate" title={error}>{error}</div>
                            </td>
                            <td className="px-3 py-2 text-gray-700 max-w-md">
                              <div className="truncate" title={JSON.stringify(row)}>
                                {Object.entries(row).slice(0, 3).map(([key, value]) => 
                                  `${key}: ${value}`
                                ).join(', ')}
                                {Object.keys(row).length > 3 && '...'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {importHistory.totalFailed === 0 && (
                <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-600 text-4xl mb-2">🎉</div>
                  <p className="text-lg font-semibold text-green-800">Import hoàn thành thành công!</p>
                  <p className="text-sm text-green-600 mt-1">Tất cả {importHistory.totalSuccess} dòng đã được import thành công.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Full Width Preview Table */}
        {previewData.length > 0 && (
          <div className="mt-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📋 Bảng Dữ Liệu Chi Tiết</h2>
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Chỉnh sửa trực tiếp:</strong> Click vào ô để chỉnh sửa dữ liệu. Nhấn Enter để lưu, Esc để hủy. 
                      </p>
                    </div>
              <div className="overflow-x-auto border rounded-lg max-h-[70vh]">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Trạng Thái</th>
                      {headers.map(header => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-gray-600 capitalize min-w-[120px] max-w-[200px]">
                          <div className="truncate" title={header.replace(/_/g, ' ')}>
                            {header.replace(/_/g, ' ')}
                          </div>
                        </th>
                      ))}
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
                        <tr key={rowIndex} className={
                          result?.status === 'invalid' || result?.status === 'error' ? 'bg-red-50' : 
                          result?.status === 'success' ? 'bg-green-50' : ''
                        }>
                          <td className="px-3 py-2 w-24">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[result?.status || 'unvalidated'].color}`}>
                                    {statusConfig[result?.status || 'unvalidated'].text}
                                  </span>
                                  {(result?.status === 'invalid' || result?.status === 'error') && (
                              <div className="mt-1">
                                <p className="text-red-600 text-xs break-words" title={result.message}>
                                  {result.message}
                                </p>
                                <p className="text-red-500 text-xs mt-1">
                                  💡 Click vào ô để sửa lỗi
                                </p>
                              </div>
                            )}
                            {result?.status === 'success' && (
                              <p className="text-green-600 text-xs mt-1">✅</p>
                                  )}
                                </td>
                                {headers.map(header => {
                                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.header === header;
                                  const cellValue = row[header];
                            const isImported = result?.status === 'success' || result?.status === 'error';
                                  
                                  return (
                                    <td 
                                      key={header} 
                                 className={`px-3 py-2 text-gray-800 transition-colors min-w-[120px] max-w-[200px] ${
                                   isImported 
                                     ? 'opacity-75'
                                     : 'cursor-pointer hover:bg-gray-50'
                                 } ${
                                        isEditing ? 'bg-blue-50 border border-blue-300' : ''
                                      }`}
                                 onClick={() => !isEditing && !isImported && startEditing(rowIndex, header, cellValue)}
                                    >
                                 {renderEditableCell(rowIndex, header, cellValue, isEditing, isImported)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RegistrationLayout>
  );
} 