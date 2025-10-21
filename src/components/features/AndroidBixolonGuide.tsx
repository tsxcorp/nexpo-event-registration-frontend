'use client';

import { useState, useEffect } from 'react';
import { androidPrintService, type AndroidDeviceInfo, type AndroidPrinterInfo } from '@/lib/print/android-print-service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface AndroidBixolonGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
  currentLanguage?: 'vi' | 'en';
}

type SetupStep = 'detect' | 'connect' | 'test' | 'complete';

export default function AndroidBixolonGuide({ 
  isOpen, 
  onClose, 
  onSetupComplete,
  currentLanguage = 'vi' 
}: AndroidBixolonGuideProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('detect');
  const [deviceInfo, setDeviceInfo] = useState<AndroidDeviceInfo | null>(null);
  const [detectedPrinters, setDetectedPrinters] = useState<AndroidPrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<AndroidPrinterInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [connectionMethod, setConnectionMethod] = useState<'usb' | 'bluetooth' | 'wifi'>('usb');

  useEffect(() => {
    if (isOpen) {
      initializeSetup();
    }
  }, [isOpen]);

  const initializeSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🤖 Initializing Android Bixolon setup...');
      
      // Get device info
      const info = androidPrintService.getDeviceInfo();
      setDeviceInfo(info);
      
      if (!info?.isAndroid) {
        setError('Thiết bị không phải Android');
        return;
      }
      
      if (!info?.isIminSwan2) {
        console.log('⚠️ Not Imin Swan 2, but continuing with Android setup');
      }
      
      // Auto-detect printers
      await detectPrinters();
      
    } catch (error) {
      console.error('Error initializing setup:', error);
      setError('Không thể khởi tạo thiết lập Android');
    } finally {
      setIsLoading(false);
    }
  };

  const detectPrinters = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔍 Detecting Bixolon printers...');
      
      // Refresh printer list
      await androidPrintService.refreshPrinters();
      
      const printers = androidPrintService.getDetectedPrinters();
      const defaultPrinter = androidPrintService.getDefaultPrinter();
      
      setDetectedPrinters(printers);
      setSelectedPrinter(defaultPrinter);
      
      if (printers.length > 0) {
        console.log('✅ Printers detected:', printers);
        setCurrentStep('test');
      } else {
        console.log('⚠️ No printers detected, showing connection guide');
        setCurrentStep('connect');
      }
      
    } catch (error) {
      console.error('Error detecting printers:', error);
      setError('Không thể tìm thấy máy in Bixolon');
      setCurrentStep('connect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionMethodChange = (method: 'usb' | 'bluetooth' | 'wifi') => {
    setConnectionMethod(method);
  };

  const handleTestConnection = async () => {
    if (!selectedPrinter) {
      setError('Vui lòng chọn máy in');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('🧪 Testing connection to:', selectedPrinter.name);
      
      const testJob = {
        requestId: `test_${Date.now()}`,
        printerAddress: selectedPrinter.address,
        connectionType: selectedPrinter.connectionType,
        template: 'visitor_v1',
        data: {
          fullName: 'Test User',
          company: 'Nexpo Test',
          qr: 'NEXPO:TEST:ANDROID',
          customContent: ['ANDROID CONNECTION TEST']
        },
        copies: 1
      };

      const result = await androidPrintService.printBadge(testJob);
      
      if (result.result === 'OK') {
        console.log('✅ Test print successful');
        setCurrentStep('complete');
        onSetupComplete();
      } else {
        setError('Test in thất bại: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Test print error:', error);
      setError('Lỗi test in: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onSetupComplete();
    onClose();
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 'detect':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Đang phát hiện thiết bị...</h3>
            <p className="text-gray-600">Kiểm tra thiết bị Android và máy in Bixolon</p>
          </div>
        );

      case 'connect':
        return (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Kết nối máy in Bixolon</h3>
              <p className="text-gray-600">Chọn phương thức kết nối với máy in Bixolon</p>
            </div>

            {deviceInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Thông tin thiết bị:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><strong>Model:</strong> {deviceInfo.deviceModel}</div>
                  <div><strong>Android:</strong> {deviceInfo.androidVersion}</div>
                  <div><strong>Chrome:</strong> {deviceInfo.chromeVersion}</div>
                  <div><strong>SDK:</strong> {deviceInfo.hasBixolonSDK ? '✅' : '❌'}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Phương thức kết nối:</h4>
              
              {/* USB Connection */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                connectionMethod === 'usb' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => handleConnectionMethodChange('usb')}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="connection"
                    value="usb"
                    checked={connectionMethod === 'usb'}
                    onChange={() => handleConnectionMethodChange('usb')}
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <span>🔌 USB</span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Khuyến nghị</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Kết nối trực tiếp qua cáp USB. Ổn định và dễ thiết lập.
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      <strong>Hướng dẫn:</strong> Cắm cáp USB từ máy in vào thiết bị Android
                    </div>
                  </div>
                </div>
              </div>

              {/* Bluetooth Connection */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                connectionMethod === 'bluetooth' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => handleConnectionMethodChange('bluetooth')}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="connection"
                    value="bluetooth"
                    checked={connectionMethod === 'bluetooth'}
                    onChange={() => handleConnectionMethodChange('bluetooth')}
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <span>📶 Bluetooth</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Kết nối không dây qua Bluetooth. Linh hoạt nhưng cần pairing.
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      <strong>Hướng dẫn:</strong> Bật Bluetooth trên cả hai thiết bị và thực hiện pairing
                    </div>
                  </div>
                </div>
              </div>

              {/* WiFi Connection */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                connectionMethod === 'wifi' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => handleConnectionMethodChange('wifi')}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="connection"
                    value="wifi"
                    checked={connectionMethod === 'wifi'}
                    onChange={() => handleConnectionMethodChange('wifi')}
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <span>📡 WiFi</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Kết nối qua mạng WiFi. Cần cả hai thiết bị cùng mạng.
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      <strong>Hướng dẫn:</strong> Kết nối máy in và thiết bị Android vào cùng mạng WiFi
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button 
                onClick={detectPrinters} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Đang tìm kiếm...' : '🔍 Tìm kiếm máy in'}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Sau khi kết nối máy in, click để tìm kiếm
              </p>
            </div>
          </div>
        );

      case 'test':
        return (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Máy in đã được phát hiện</h3>
              <p className="text-gray-600">Chọn máy in để test kết nối</p>
            </div>

            <div className="space-y-3 mb-6">
              {detectedPrinters.map((printer) => (
                <label key={printer.address} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="printer"
                    value={printer.address}
                    checked={selectedPrinter?.address === printer.address}
                    onChange={() => setSelectedPrinter(printer)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {printer.name}
                      {printer.isBixolon && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">BIXOLON</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <div>Kết nối: <span className="font-medium">{printer.connectionType.toUpperCase()}</span></div>
                      <div>Địa chỉ: <span className="font-medium">{printer.address}</span></div>
                      <div>Trạng thái: <span className={`font-medium ${
                        printer.status === 'connected' ? 'text-green-600' : 
                        printer.status === 'disconnected' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {printer.status === 'connected' ? 'Đã kết nối' : 
                         printer.status === 'disconnected' ? 'Chưa kết nối' : 'Lỗi'}
                      </span></div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <Button 
              onClick={handleTestConnection}
              disabled={!selectedPrinter || isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Đang test...' : '🧪 Test in thẻ'}
            </Button>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-green-600">Thiết lập hoàn tất!</h3>
            <p className="text-gray-600 mb-4">
              Android Imin Swan 2 đã sẵn sàng in badge với máy in Bixolon.
            </p>
            {selectedPrinter && (
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-green-900 mb-2">Máy in đã kết nối:</h4>
                <div className="text-sm text-green-800">
                  <div><strong>Tên:</strong> {selectedPrinter.name}</div>
                  <div><strong>Kết nối:</strong> {selectedPrinter.connectionType.toUpperCase()}</div>
                  <div><strong>Địa chỉ:</strong> {selectedPrinter.address}</div>
                </div>
              </div>
            )}
            <Button onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
              Bắt đầu sử dụng
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Android Bixolon Setup
                </h2>
                <p className="text-sm text-gray-600">
                  Thiết lập in badge cho Android Imin Swan 2
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {renderStep()}

          {/* Progress indicator */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Bước 1: Phát hiện</span>
              <span>Bước 2: Kết nối</span>
              <span>Bước 3: Test</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: currentStep === 'detect' ? '33%' :
                         currentStep === 'connect' ? '66%' :
                         currentStep === 'test' ? '66%' :
                         currentStep === 'complete' ? '100%' : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
