'use client';

import { useState, useEffect } from 'react';
import { nexpoPrintSDK, type PrinterInfo, type AgentStatus } from '@/lib/print/nexpo-print-sdk';
import { androidPrintService, type AndroidPrinterInfo, type AndroidDeviceInfo } from '@/lib/print/android-print-service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface PrintWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentReady: () => void;
  currentLanguage?: 'vi' | 'en';
}

type WizardStep = 'detect' | 'android-setup' | 'install' | 'pairing' | 'detect-printers' | 'test' | 'complete';

export default function PrintWizard({ isOpen, onClose, onAgentReady, currentLanguage = 'vi' }: PrintWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('detect');
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({ connected: false, printers: [] });
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [osType, setOsType] = useState<'windows' | 'macos' | 'linux' | 'android' | 'unknown'>('unknown');
  const [androidDeviceInfo, setAndroidDeviceInfo] = useState<AndroidDeviceInfo | null>(null);
  const [androidPrinters, setAndroidPrinters] = useState<AndroidPrinterInfo[]>([]);
  const [selectedAndroidPrinter, setSelectedAndroidPrinter] = useState<AndroidPrinterInfo | null>(null);

  // Detect OS type and Android device
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      setOsType('android');
      // Get Android device info
      const deviceInfo = androidPrintService.getDeviceInfo();
      setAndroidDeviceInfo(deviceInfo);
    } else if (userAgent.includes('windows')) {
      setOsType('windows');
    } else if (userAgent.includes('mac')) {
      setOsType('macos');
    } else if (userAgent.includes('linux')) {
      setOsType('linux');
    } else {
      setOsType('unknown');
    }
  }, []);

  // Check agent status on mount
  useEffect(() => {
    if (isOpen) {
      if (osType === 'android') {
        checkAndroidSetup();
      } else {
        checkAgentStatus();
      }
    }
  }, [isOpen, osType]);

  const checkAndroidSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🤖 Checking Android setup...');
      
      // Check if Android print service is available
      const isAvailable = androidPrintService.isAvailable();
      const deviceInfo = androidPrintService.getDeviceInfo();
      const detectedPrinters = androidPrintService.getDetectedPrinters();
      const defaultPrinter = androidPrintService.getDefaultPrinter();
      
      setAndroidDeviceInfo(deviceInfo);
      setAndroidPrinters(detectedPrinters);
      setSelectedAndroidPrinter(defaultPrinter);
      
      if (isAvailable && detectedPrinters.length > 0) {
        console.log('✅ Android setup complete, printers detected');
        setCurrentStep('test');
      } else if (isAvailable) {
        console.log('⚠️ Android setup complete but no printers detected');
        setCurrentStep('detect-printers');
      } else {
        console.log('❌ Android setup needed');
        setCurrentStep('android-setup');
      }
    } catch (error) {
      console.error('Error checking Android setup:', error);
      setError('Không thể kiểm tra thiết lập Android');
      setCurrentStep('android-setup');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAgentStatus = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const status = await nexpoPrintSDK.getStatus();
      setAgentStatus(status);
      
      if (status.connected) {
        setCurrentStep('detect-printers');
        setPrinters(status.printers);
        if (status.defaultPrinter) {
          setSelectedPrinter(status.defaultPrinter);
        }
      } else {
        setCurrentStep('install');
      }
    } catch (error) {
      console.error('Error checking agent status:', error);
      setError('Không thể kết nối với Nexpo Print Agent');
      setCurrentStep('install');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAndroidAutoSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🤖 Starting Android auto-setup...');
      
      // Refresh Android printers
      await androidPrintService.refreshPrinters();
      
      const detectedPrinters = androidPrintService.getDetectedPrinters();
      const defaultPrinter = androidPrintService.getDefaultPrinter();
      
      setAndroidPrinters(detectedPrinters);
      setSelectedAndroidPrinter(defaultPrinter);
      
      if (detectedPrinters.length > 0) {
        console.log('✅ Android auto-setup completed, printers detected:', detectedPrinters);
        setCurrentStep('test');
      } else {
        console.log('⚠️ No printers detected, manual setup needed');
        setError('Không tìm thấy máy in nào. Vui lòng kết nối máy in Bixolon.');
      }
    } catch (error) {
      console.error('❌ Android auto-setup failed:', error);
      setError('Không thể tự động thiết lập. Vui lòng kiểm tra kết nối máy in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🚀 Starting auto-setup process...');
      
      // Call auto-setup endpoint
      const response = await fetch('http://localhost:18082/v1/auto-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Auto-setup completed successfully');
        console.log('📋 Detected printers:', result.printers);
        setCurrentStep('test');
        setPrinters(result.printers);
        if (result.printers.length > 0) {
          setSelectedPrinter(result.printers[0].name);
        }
      } else {
        console.error('❌ Auto-setup failed:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('❌ Auto-setup failed:', error);
      setError('Failed to connect to print agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstall = () => {
    const downloadUrls = {
      windows: 'https://nexpo-print-agent.s3.amazonaws.com/NexpoPrintAgent_Setup.msi',
      macos: 'https://nexpo-print-agent.s3.amazonaws.com/NexpoPrintAgent.pkg',
      linux: 'https://nexpo-print-agent.s3.amazonaws.com/nexpo-agent.deb'
    };

    const url = downloadUrls[osType];
    if (url) {
      window.open(url, '_blank');
      setCurrentStep('pairing');
    } else {
      setError('Hệ điều hành không được hỗ trợ');
    }
  };

  const handlePairing = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Wait for agent to be ready
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds
      
      while (attempts < maxAttempts) {
        const isReady = await nexpoPrintSDK.detectAgent();
        if (isReady) {
          setCurrentStep('detect-printers');
          await checkAgentStatus();
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      setError('Không thể kết nối với agent sau khi cài đặt. Vui lòng khởi động lại agent.');
    } catch (error) {
      setError('Lỗi trong quá trình pairing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectPrinters = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const printerList = await nexpoPrintSDK.listPrinters();
      setPrinters(printerList);
      
      if (printerList.length === 0) {
        setError('Không tìm thấy máy in nào. Vui lòng kiểm tra kết nối máy in.');
      } else {
        setCurrentStep('test');
        // Auto-select first BIXOLON printer or first available
        const bixolonPrinter = printerList.find(p => p.name.toLowerCase().includes('bixolon'));
        setSelectedPrinter(bixolonPrinter?.name || printerList[0].name);
      }
    } catch (error) {
      setError('Không thể lấy danh sách máy in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAndroidTestPrint = async () => {
    if (!selectedAndroidPrinter) {
      setError('Vui lòng chọn máy in');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const testJob = {
        requestId: `android_test_${Date.now()}`,
        printerAddress: selectedAndroidPrinter.address,
        connectionType: selectedAndroidPrinter.connectionType,
        template: 'visitor_v1',
        data: {
          fullName: 'Test User',
          company: 'Nexpo Test',
          qr: 'NEXPO:TEST:ANDROID',
          customContent: ['ANDROID TEST PRINT']
        },
        copies: 1
      };

      const result = await androidPrintService.printBadge(testJob);
      
      if (result.result === 'OK') {
        setCurrentStep('complete');
        onAgentReady();
      } else {
        setError('Test print thất bại: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      setError('Lỗi test print: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrint = async () => {
    if (osType === 'android') {
      await handleAndroidTestPrint();
      return;
    }

    if (!selectedPrinter) {
      setError('Vui lòng chọn máy in');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const testJob = {
        requestId: nexpoPrintSDK.generateRequestId('test', 'wizard'),
        printer: selectedPrinter,
        template: 'visitor_v1',
        data: {
          fullName: 'Test User',
          company: 'Nexpo Test',
          qr: 'NEXPO:TEST:WIZARD',
          customContent: ['TEST PRINT']
        },
        copies: 1
      };

      const result = await nexpoPrintSDK.printBadge(testJob);
      
      if (result.result === 'OK') {
        setCurrentStep('complete');
        onAgentReady();
      } else {
        setError('Test print thất bại: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      setError('Lỗi test print: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onAgentReady();
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
            <h3 className="text-lg font-semibold mb-2">
              {osType === 'android' ? 'Đang kiểm tra thiết bị Android...' : 'Đang kiểm tra Nexpo Print Agent...'}
            </h3>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </div>
        );

      case 'android-setup':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thiết bị Android Imin Swan 2</h3>
            <p className="text-gray-600 mb-4">
              Phát hiện thiết bị Android Imin Swan 2. Hệ thống sẽ tự động thiết lập để in badge với máy in Bixolon.
            </p>
            
            {androidDeviceInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <h4 className="font-semibold text-gray-900 mb-2">Thông tin thiết bị:</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <div><strong>Model:</strong> {androidDeviceInfo.deviceModel}</div>
                  <div><strong>Android:</strong> {androidDeviceInfo.androidVersion}</div>
                  <div><strong>Chrome:</strong> {androidDeviceInfo.chromeVersion}</div>
                  <div><strong>Bixolon SDK:</strong> {androidDeviceInfo.hasBixolonSDK ? '✅ Có' : '❌ Chưa có'}</div>
                  <div><strong>Kết nối hỗ trợ:</strong> {androidDeviceInfo.supportedConnections.join(', ')}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={handleAndroidAutoSetup} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Đang thiết lập...' : '🚀 Tự động thiết lập Android + Bixolon'}
              </Button>
              <p className="text-xs text-gray-500">
                Hệ thống sẽ tự động tìm và kết nối với máy in Bixolon
              </p>
            </div>
          </div>
        );

      case 'install':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Cài đặt Nexpo Print Agent</h3>
            <p className="text-gray-600 mb-4">
              Để in badge tự động, bạn cần cài đặt Nexpo Print Agent trên máy tính.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-700">
                <strong>Hệ điều hành:</strong> {osType.toUpperCase()}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Agent sẽ được cài đặt tự động và chạy nền để hỗ trợ in badge.
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={handleAutoSetup} className="w-full bg-green-600 hover:bg-green-700">
                🚀 Tự động cài đặt tất cả (Khuyến nghị)
              </Button>
              <Button onClick={handleInstall} className="w-full bg-gray-600 hover:bg-gray-700">
                Tải xuống và cài đặt thủ công
              </Button>
            </div>
          </div>
        );

      case 'pairing':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-pulse w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Đang kết nối với Agent...</h3>
            <p className="text-gray-600 mb-4">
              Vui lòng chờ agent khởi động sau khi cài đặt.
            </p>
            <Button onClick={handlePairing} disabled={isLoading} className="w-full">
              {isLoading ? 'Đang kết nối...' : 'Kiểm tra kết nối'}
            </Button>
          </div>
        );

      case 'detect-printers':
        return (
          <div>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Tìm máy in</h3>
              <p className="text-gray-600">Đang quét các máy in có sẵn...</p>
            </div>
            <Button onClick={handleDetectPrinters} disabled={isLoading} className="w-full">
              {isLoading ? 'Đang quét...' : 'Quét máy in'}
            </Button>
          </div>
        );

      case 'test':
        return (
          <div>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Chọn máy in</h3>
              <p className="text-gray-600">Chọn máy in để test và sử dụng mặc định</p>
            </div>
            
            {osType === 'android' ? (
              <div className="space-y-2 mb-4">
                {androidPrinters.map((printer) => (
                  <label key={printer.address} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="androidPrinter"
                      value={printer.address}
                      checked={selectedAndroidPrinter?.address === printer.address}
                      onChange={() => setSelectedAndroidPrinter(printer)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {printer.name}
                        {printer.isBixolon && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">BIXOLON</span>}
                      </div>
                      <div className="text-sm text-gray-500">
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
            ) : (
              <div className="space-y-2 mb-4">
                {printers.map((printer) => (
                  <label key={printer.name} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="printer"
                      value={printer.name}
                      checked={selectedPrinter === printer.name}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{printer.name}</div>
                      <div className="text-sm text-gray-500">
                        Trạng thái: <span className={`font-medium ${
                          printer.status === 'ready' ? 'text-green-600' : 
                          printer.status === 'busy' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {printer.status === 'ready' ? 'Sẵn sàng' : 
                           printer.status === 'busy' ? 'Bận' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            <Button 
              onClick={handleTestPrint} 
              disabled={
                (osType === 'android' ? !selectedAndroidPrinter : !selectedPrinter) || isLoading
              } 
              className="w-full"
            >
              {isLoading ? 'Đang test...' : 'Test in thẻ'}
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
              Nexpo Print Agent đã sẵn sàng. Bạn có thể in badge tự động mà không cần popup.
            </p>
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
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Nexpo Print Setup</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
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
              <span>Bước 1: {osType === 'android' ? 'Android Setup' : 'Cài đặt'}</span>
              <span>Bước 2: Kết nối</span>
              <span>Bước 3: Test</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: currentStep === 'detect' ? '0%' :
                         currentStep === 'android-setup' ? '33%' :
                         currentStep === 'install' ? '33%' :
                         currentStep === 'pairing' ? '33%' :
                         currentStep === 'detect-printers' ? '66%' :
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
