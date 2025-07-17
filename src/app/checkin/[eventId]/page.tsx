'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EventData, eventApi } from '@/lib/api/events';
import { VisitorData, visitorApi } from '@/lib/api/visitors';
import { useEventMetadata } from '@/hooks/useEventMetadata';
import { Html5Qrcode } from 'html5-qrcode';

interface CheckinPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default function CheckinPage({ params }: CheckinPageProps) {
  const { eventId } = use(params);
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // State management
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [visitor, setVisitor] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(0);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanCooldown, setScanCooldown] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);

  const { generateShareUrls } = useEventMetadata({ 
    event: eventData, 
    currentLanguage: 'vi' 
  });

  // Modern Icon Component
  const Icon = ({ name, className = "w-5 h-5", fill = "none", ...props }: { name: string; className?: string; fill?: string }) => {
    const icons = {
      CameraIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      QrCodeIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      CheckCircleIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      PrinterIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
      ExclamationTriangleIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      ArrowRightIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      ),
      VideoCameraIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    };
    
    return icons[name as keyof typeof icons] || icons.QrCodeIcon;
  };

  // Check camera permission on page load
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (result.state === 'granted') {
          setCameraPermissionGranted(true);
        } else if (result.state === 'prompt') {
          setShowCameraPermissionDialog(true);
        }
      } catch (error) {
        console.log('Camera permission check not supported');
        setShowCameraPermissionDialog(true);
      }
    };

    checkCameraPermission();
  }, []);

  // Load event data
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Test backend connection first
        await visitorApi.checkBackendConnection();
        
        const response = await eventApi.getEventInfo(eventId);
        setEventData(response.event);
        
        console.log('📥 Event data loaded:', response.event);
        console.log('🖨️ Badge printing setting:', {
          badge_printing: response.event.badge_printing,
          enabled: !!response.event.badge_printing
        });
        
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 100);
      } catch (err: any) {
        console.error('Error loading event data:', err);
        setError('Không thể tải thông tin sự kiện. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId]);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionGranted(true);
      setShowCameraPermissionDialog(false);
    } catch (error) {
      console.error('Camera permission denied:', error);
      setError('Quyền truy cập camera bị từ chối. Bạn vẫn có thể sử dụng manual input.');
      setShowCameraPermissionDialog(false);
    }
  };

  // Initialize camera scanner
  const initializeCamera = async () => {
    if (!cameraPermissionGranted) {
      setShowCameraPermissionDialog(true);
      return;
    }

    try {
      setCameraEnabled(false);
      setError('');

      // Wait for DOM element
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById("qr-reader");
      if (!element) {
        throw new Error("QR reader element not found in DOM");
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          console.log('🔍 Camera QR Code detected:', decodedText);
          
          // Prevent duplicate scans in cooldown period
          if (scanCooldown) {
            console.log('🚫 Camera scan ignored - cooldown period active');
            return;
          }
          
          // Prevent duplicate scans of same code within 3 seconds
          const now = Date.now();
          if (lastScannedCode === decodedText && now - lastScanTime < 3000) {
            console.log('🚫 Camera scan ignored - duplicate code within 3s');
            return;
          }
          
          // Set cooldown to prevent rapid scanning
          setScanCooldown(true);
          setLastScannedCode(decodedText);
          setLastScanTime(now);
          
          console.log('✅ Processing camera scan:', decodedText);
          
          // Stop camera only if not in continuous mode
          if (!continuousMode) {
            stopCamera();
          }
          
          // Visual feedback for successful scan
          setSuccess('📷 Camera QR được quét thành công!');
          
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
          
          // Process the scanned code
          processCheckin(decodedText);
          
          // Clear cooldown after processing (shorter in continuous mode)
          setTimeout(() => {
            setScanCooldown(false);
          }, continuousMode ? 1000 : 2000);
        },
        () => {
          // Ignore scan errors
        }
      );

      setCameraEnabled(true);
      console.log('📹 Camera initialized successfully');
      
      // IMPORTANT: Keep focus on manual input for barcode scanner
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('🎯 Manual input refocused for barcode scanner compatibility');
        }
      }, 500);

    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setError('Không thể khởi tạo camera. Vui lòng sử dụng manual input.');
      setScanning(false);
    }
  };

  // Stop camera
  const stopCamera = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.log('Error stopping camera:', error);
    }
    setCameraEnabled(false);
    setScanning(false);
    
    // Always refocus input after stopping camera
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        console.log('🎯 Manual input refocused after stopping camera');
      }
    }, 100);
  };

  // Process check-in (unified for both manual and scanner)
  const processCheckin = async (visitorId: string) => {
    if (!visitorId.trim() || isProcessing) {
      console.log('🚫 processCheckin ignored - empty ID or already processing');
      return;
    }

    // Basic input validation
    const trimmedId = visitorId.trim();
    if (trimmedId.length < 3) {
      setError('❌ ID visitor phải có ít nhất 3 ký tự.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setVisitor(null);

    try {
      console.log('🔍 Processing visitor ID:', trimmedId);
      
      const response = await visitorApi.getVisitorInfo(trimmedId);
      
      if (response.visitor) {
        console.log('✅ Visitor found:', response.visitor);
        
        // IMPORTANT: Validate event_id match
        const visitorEventId = String(response.visitor.event_id);
        const currentEventId = String(eventId);
        
        console.log('🔍 Event validation:', {
          visitorEventId,
          currentEventId,
          match: visitorEventId === currentEventId
        });
        
        if (visitorEventId !== currentEventId) {
          console.error('❌ Event ID mismatch:', {
            visitor: response.visitor.name,
            visitorEventId,
            currentEventId,
            eventName: response.visitor.event_name
          });
          
          setError('❌ Không tìm thấy visitor với ID này. Vui lòng kiểm tra lại mã QR hoặc ID.');
          setIsProcessing(false);
          
          // Strong haptic feedback for error
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
          
          return;
        }
        
        // Submit check-in to Zoho Creator
        try {
          console.log('📝 Submitting check-in history to Zoho...');
          const checkinResult = await visitorApi.submitCheckin(response.visitor);
          console.log('✅ Check-in history submitted successfully:', checkinResult);
        } catch (submitError: any) {
          console.error('⚠️ Failed to submit check-in history:', submitError.message);
          // Don't fail the whole process if check-in submission fails
          // We still show success to user but log the error
        }
        
        // Test company extraction immediately after getting visitor data
        console.log('🔍 Testing company extraction for visitor:', response.visitor.id);
        const testCompanyInfo = getCompanyInfo(response.visitor);
        console.log('🏢 Company extraction test result:', {
          found: !!testCompanyInfo,
          company: testCompanyInfo,
          willShowOnBadge: !!testCompanyInfo
        });
        
        setVisitor(response.visitor);
        setSuccess(`✅ Check-in thành công cho ${response.visitor.name}!`);
        
        // Auto-print badge only if badge_printing is enabled
        if (eventData?.badge_printing) {
          setTimeout(() => {
            console.log('🖨️ Auto-printing badge for visitor (badge_printing=true):', response.visitor);
            printBadge(response.visitor);
          }, 500);
        } else {
          console.log('🚫 Badge printing disabled (badge_printing=false)');
        }
        
        // Show success screen
        setTimeout(() => {
          console.log('🎉 Setting showSuccessScreen to true');
          setShowSuccessScreen(true);
          startAutoReturnCountdown();
        }, 1000);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Clear manual input
        setManualInput('');
      } else {
        setError('❌ Không tìm thấy thông tin visitor.');
      }
    } catch (error: any) {
      console.error('❌ Check-in error:', error);
      
      // Handle specific error types
      let errorMessage = '❌ Có lỗi xảy ra khi check-in. Vui lòng thử lại.';
      
      if (error.message === 'Visitor not found') {
        errorMessage = '❌ Không tìm thấy visitor với ID này. Vui lòng kiểm tra lại mã QR hoặc ID.';
      } else if (error.message === 'Visitor ID is required') {
        errorMessage = '❌ Vui lòng nhập ID visitor.';
      } else if (error.message.includes('Server error')) {
        errorMessage = '❌ Lỗi hệ thống. Vui lòng thử lại sau.';
      } else if (error.message.includes('Failed to fetch visitor data')) {
        errorMessage = '❌ Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      }
      
      setError(errorMessage);
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual input submit (supports both manual typing and barcode scanner)
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      console.log('🔍 Manual/Barcode QR Code detected:', manualInput.trim());
      
      // Distinguish between manual typing and barcode scanner
      const isLikelyBarcodeScanner = manualInput.length > 8 && /^[A-Za-z0-9+/=]+$/.test(manualInput);
      
      if (isLikelyBarcodeScanner) {
        console.log('📟 Detected barcode scanner input');
        setSuccess('📟 Barcode scanner QR được quét thành công!');
      } else {
        console.log('⌨️ Detected manual typing input');
        setSuccess('⌨️ Manual input được xử lý thành công!');
      }
      
      processCheckin(manualInput.trim());
    }
  };

  // Enhanced input change handler with auto-focus maintenance
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualInput(value);
    
    // Clear error when user starts typing again
    if (error) {
      setError('');
    }
    
    // Auto-submit for barcode scanner (when input looks complete)
    // Only trigger if input length suggests barcode scanner and not already processing
    if (value.length > 15 && /^[A-Za-z0-9+/=]+$/.test(value) && !isProcessing) {
      console.log('📟 Auto-submitting barcode scanner input:', value);
      setTimeout(() => {
        // Double check conditions before auto-submit
        if (manualInput === value && !isProcessing && value.trim()) {
          console.log('📟 Executing auto-submit for barcode scanner');
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleManualSubmit(fakeEvent);
        }
      }, 200); // Slightly longer delay to ensure input is complete
    }
  };

  // Maintain input focus when camera is running
  useEffect(() => {
    if (cameraEnabled && inputRef.current) {
      const interval = setInterval(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
          console.log('🎯 Auto-refocused manual input for barcode scanner');
        }
      }, 2000); // Check every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [cameraEnabled]);

  // Handle key events for better barcode scanner support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key for manual submission
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSubmit(e as any);
    }
    
    // Handle Escape key to clear input
    if (e.key === 'Escape') {
      setManualInput('');
      setError('');
      setSuccess('');
    }
  };

  // Auto-return countdown
  const startAutoReturnCountdown = () => {
    // Shorter countdown in continuous mode for faster batch processing
    let countdown = continuousMode ? 2 : 4;
    setAutoReturnCountdown(countdown);
    
    const timer = setInterval(() => {
      countdown--;
      setAutoReturnCountdown(countdown);
      
      if (countdown === 0) {
        clearInterval(timer);
        resetForNextCheckin();
      }
    }, 1000);
  };

  // Debug success screen rendering
  useEffect(() => {
    if (showSuccessScreen && visitor) {
      console.log('🎉 Success screen is now visible with visitor:', visitor);
      console.log('🎯 Attempting to call generateBadgeContent...');
      // Test direct call
      try {
        const testBadge = generateBadgeContent(visitor);
        console.log('🎨 Badge content generated:', testBadge);
      } catch (error) {
        console.error('❌ Error generating badge content:', error);
      }
    }
  }, [showSuccessScreen, visitor]);

  // Reset for next check-in
  const resetForNextCheckin = () => {
    setVisitor(null);
    setSuccess('');
    setError('');
    setShowSuccessScreen(false);
    setAutoReturnCountdown(0);
    setManualInput('');
    
    // Reset camera states for next scan only if not in continuous mode
    if (!continuousMode) {
      setScanning(false);
      setCameraEnabled(false);
    }
    
    // Reset scan protection states
    setScanCooldown(false);
    setLastScannedCode('');
    setLastScanTime(0);
    
    // Reset printing state
    setIsPrinting(false);
    
    // Restart camera immediately if in continuous mode
    if (continuousMode && !scanning) {
      setTimeout(() => {
        setScanning(true);
        setTimeout(() => {
          initializeCamera();
        }, 100);
      }, 500);
    }
    
    // ALWAYS focus back to input (critical for barcode scanner)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        console.log('🎯 Manual input refocused after reset');
      }
    }, cameraEnabled ? 100 : 50); // Faster focus if camera not running
  };

  // Parse badge size
  const getBadgeSize = () => {
    const badgeSize = (eventData as any)?.badge_size;
    if (!badgeSize) return { width: 85, height: 54 };

    console.log('🎫 Badge size from backend:', badgeSize);

    // Handle different formats: "W106mm x H72mm" or "W106 x H72 mm" 
    const match = badgeSize.match(/W(\d+)mm?\s*x\s*H(\d+)mm?/i);
    if (match) {
      const size = {
        width: parseInt(match[1]),
        height: parseInt(match[2])
      };
      console.log('🎫 Parsed badge size:', size);
      return size;
    }
    
    console.log('🎫 Using default badge size');
    return { width: 85, height: 54 };
  };

  // Generate QR image with fallback (no React hooks)
  const generateQRImage = (qrData: string) => {
    console.log('🔥 Generating QR image for data:', qrData);
    
    // Primary QR API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    console.log('🔗 QR API URL:', qrUrl);
    
    return (
      <img 
        src={qrUrl}
        alt={`QR Code: ${qrData}`}
        style={{
          width: '18mm',
          height: '18mm',
          objectFit: 'contain'
        }}
        onError={(e) => {
          console.error('❌ QR API failed, showing fallback');
          // Replace with text fallback
          const img = e.target as HTMLImageElement;
          const fallback = document.createElement('div');
          fallback.style.cssText = `
            width: 18mm;
            height: 18mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px solid #000;
            font-size: 6px;
            text-align: center;
            color: #000;
            padding: 1mm;
            background: #fff;
            font-weight: bold;
          `;
          fallback.innerHTML = `QR<br/><small style="word-break: break-all; line-height: 1.1;">${qrData.slice(-12)}</small>`;
          img.parentNode?.replaceChild(fallback, img);
        }}
        onLoad={() => {
          console.log('✅ QR Code loaded successfully');
        }}
      />
    );
  };

  // Generate QR code for visitor  
  const generateQRCode = (visitorData: VisitorData) => {
    console.log('🎯 generateQRCode called with visitor:', visitorData);
    
    // Use badge_qr field directly (no decoding)
    const qrData = (visitorData as any)?.badge_qr || visitorData.id || '';
    
    console.log('🎫 QR Data for badge:', { 
      raw_badge_qr: (visitorData as any)?.badge_qr, 
      visitor_id: visitorData.id, 
      final_qr_data: qrData,
      qr_data_length: qrData.length,
      visitor_keys: Object.keys(visitorData)
    });
    
    return (
      <div style={{
        width: '20mm',
        height: '20mm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        flexShrink: 0,
        position: 'relative'
      }}>
        {generateQRImage(qrData)}
      </div>
    );
  };

  // Generate badge content
  const generateBadgeContent = (visitorData: VisitorData) => {
    console.log('🎨 generateBadgeContent called with visitor:', visitorData);
    
    const companyInfo = getCompanyInfo(visitorData);
    console.log('🏢 Badge company extraction result:', {
      hasCompany: !!companyInfo,
      company: companyInfo
    });
    
    const badgeSize = getBadgeSize();
    
    // Reserve space for header and footer (about 15mm each)
    const contentHeight = badgeSize.height - 30; // 30mm total for header + footer
    const headerFooterHeight = 15; // 15mm each

    return (
      <div 
        className="badge-container"
        style={{
          width: `${badgeSize.width}mm`,
          height: `${badgeSize.height}mm`,
          background: 'white',
          border: '2px solid #E5E7EB',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
          position: 'relative'
        }}
      >
        {/* Header Space - will be printed separately */}
        <div style={{
          height: `${headerFooterHeight}mm`,
          background: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#666'
        }}>
          HEADER
        </div>

        {/* Main Content */}
        <div style={{
          height: `${contentHeight}mm`,
          padding: '4mm',
          display: 'flex',
          alignItems: 'center',
          gap: '4mm'
        }}>
          {/* QR Code */}
          {(() => {
            console.log('🎯 About to call generateQRCode from generateBadgeContent');
            return generateQRCode(visitorData);
          })()}
          
          {/* Visitor Info */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0 // Allow text to shrink
          }}>
            {/* Visitor Name - with auto resize */}
            <div style={{
              fontSize: visitorData.name.length > 20 ? '14px' : visitorData.name.length > 15 ? '16px' : '18px',
              fontWeight: 'bold',
              marginBottom: '2mm',
              color: '#1F2937',
              wordWrap: 'break-word',
              lineHeight: '1.2'
            }}>
              {visitorData.name}
            </div>
            
            {/* Company (if available) */}
            {companyInfo && (
              <div style={{
                fontSize: companyInfo.length > 30 ? '10px' : '12px',
                fontWeight: '600',
                color: '#4B5563',
                wordWrap: 'break-word',
                lineHeight: '1.1'
              }}>
                {companyInfo}
              </div>
            )}
          </div>
        </div>

        {/* Footer Space - will be printed separately */}
        <div style={{
          height: `${headerFooterHeight}mm`,
          background: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#666'
        }}>
          FOOTER
        </div>
      </div>
    );
  };

  // Extract company information from custom_fields or company field
  const getCompanyInfo = (visitorData: VisitorData): string => {
    console.log('🏢 Extracting company info for visitor:', visitorData.name);
    console.log('🏢 Raw custom_fields:', visitorData.custom_fields);
    
    // Try company field first
    if (visitorData.company && visitorData.company.trim()) {
      console.log('✅ Found company in company field:', visitorData.company);
      return visitorData.company.trim();
    }
    
    // Try custom_fields
    try {
      const customFields = typeof visitorData.custom_fields === 'string' 
        ? JSON.parse(visitorData.custom_fields) 
        : visitorData.custom_fields;
        
      console.log('🏢 Parsed custom_fields:', customFields);
        
      // Check various possible field names for company
      const companyFieldNames = [
        'cng_company',          // For current event
        'Tên Công Ty', 
        'Company', 
        'Công ty', 
        'company',
        'ten_cong_ty',
        'company_name',
        'CompanyName',
        'Công ty làm việc',
        'Nơi làm việc',
        'Đơn vị công tác',
        'don_vi_cong_tac'
      ];
      
      for (const fieldName of companyFieldNames) {
        if (customFields[fieldName] && customFields[fieldName].trim()) {
          console.log(`✅ Found company in field "${fieldName}":`, customFields[fieldName]);
          return customFields[fieldName].trim();
        }
      }
      
      // Log all available field names for debugging
      console.log('📋 Available custom field names:', Object.keys(customFields));
    } catch (error) {
      console.log('⚠️ Error parsing custom_fields:', error);
    }
    
    console.log('❌ No company information found');
    return '';
  };

  // Generate QR fallback using Canvas (for mobile reliability)
  const generateQRFallback = (qrData: string): string => {
    try {
      console.log('🎨 Generating Canvas QR fallback for:', qrData);
      
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      // Simple QR-like pattern (placeholder)
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);
      
      ctx.fillStyle = '#fff';
      ctx.fillRect(10, 10, size - 20, size - 20);
      
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR CODE', size / 2, size / 2 - 10);
      ctx.fillText(qrData.slice(-12), size / 2, size / 2 + 10);
      
      const dataUrl = canvas.toDataURL('image/png');
      console.log('✅ Canvas QR fallback generated');
      return dataUrl;
    } catch (error) {
      console.error('❌ Canvas QR fallback failed:', error);
      return '';
    }
  };

  // Enhanced mobile print with progressive loading
  const printBadgeWithProgressiveLoading = (visitorData: VisitorData) => {
    console.log('📱 Using progressive loading for mobile print');
    
    const companyInfo = getCompanyInfo(visitorData);
    const badgeSize = getBadgeSize();
    const contentHeight = badgeSize.height - 30;
    const qrData = (visitorData as any)?.badge_qr || visitorData.id || '';
    
    // Try multiple QR sources
    const qrSources = [
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&format=png&ecc=M`,
      `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(qrData)}`,
      generateQRFallback(qrData) // Canvas fallback
    ].filter(Boolean);
    
    let currentSourceIndex = 0;
    
    const tryNextQRSource = () => {
      if (currentSourceIndex >= qrSources.length) {
        console.error('❌ All QR sources failed, using text fallback');
        printWithTextQR();
        return;
      }
      
      const qrUrl = qrSources[currentSourceIndex];
      console.log(`🔄 Trying QR source ${currentSourceIndex + 1}/${qrSources.length}`);
      
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      
      testImg.onload = () => {
        console.log(`✅ QR source ${currentSourceIndex + 1} loaded successfully`);
        printWithQRImage(qrUrl);
      };
      
      testImg.onerror = () => {
        console.log(`❌ QR source ${currentSourceIndex + 1} failed, trying next...`);
        currentSourceIndex++;
        setTimeout(tryNextQRSource, 500);
      };
      
      testImg.src = qrUrl;
      
      // Timeout for this source
      setTimeout(() => {
        if (!testImg.complete) {
          console.log(`⏰ QR source ${currentSourceIndex + 1} timeout`);
          testImg.onerror = null;
          testImg.onload = null;
          currentSourceIndex++;
          tryNextQRSource();
        }
      }, 3000);
    };
    
    const printWithQRImage = (qrUrl: string) => {
      // ... existing print logic with working QR URL
      printBadgeWithQR(visitorData, companyInfo, qrUrl);
    };
    
    const printWithTextQR = () => {
      // Direct print with text QR
      printBadgeWithTextQR(visitorData, companyInfo, qrData);
    };
    
    // Start trying QR sources
    tryNextQRSource();
  };

  // Helper function to print with working QR URL
  const printBadgeWithQR = (visitorData: VisitorData, companyInfo: string, qrUrl: string) => {
    const badgeSize = getBadgeSize();
    const contentHeight = badgeSize.height - 30;
    const nameSize = visitorData.name.length > 20 ? '14px' : visitorData.name.length > 15 ? '16px' : '18px';
    const companySize = companyInfo && companyInfo.length > 30 ? '10px' : '12px';
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('❌ Failed to open print window');
      setIsPrinting(false);
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Badge - ${visitorData.name}</title>
        <style>
          @media print {
            @page { size: ${badgeSize.width}mm ${contentHeight}mm; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; }
          .badge-content {
            width: ${badgeSize.width}mm; height: ${contentHeight}mm; padding: 4mm;
            display: flex; align-items: center; gap: 4mm; box-sizing: border-box;
          }
          .qr-container { width: 20mm; height: 20mm; display: flex; align-items: center; justify-content: center; background: #fff; flex-shrink: 0; }
          .qr-img { width: 18mm; height: 18mm; object-fit: contain; }
          .info { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
          .name { font-size: ${nameSize}; font-weight: bold; margin-bottom: 2mm; color: #1F2937; word-wrap: break-word; line-height: 1.2; }
          .company { font-size: ${companySize}; font-weight: 600; color: #4B5563; word-wrap: break-word; line-height: 1.1; }
        </style>
      </head>
      <body>
        <div class="badge-content">
          <div class="qr-container">
            <img src="${qrUrl}" alt="QR Code" class="qr-img" />
          </div>
          <div class="info">
            <div class="name">${visitorData.name}</div>
            ${companyInfo ? `<div class="company">${companyInfo}</div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
      console.log('🖨️ Print completed with QR image');
    }, 1000);
  };

  // Helper function to print with text QR fallback
  const printBadgeWithTextQR = (visitorData: VisitorData, companyInfo: string, qrData: string) => {
    console.log('📝 Printing with text QR fallback');
    
    const badgeSize = getBadgeSize();
    const contentHeight = badgeSize.height - 30;
    const nameSize = visitorData.name.length > 20 ? '14px' : visitorData.name.length > 15 ? '16px' : '18px';
    const companySize = companyInfo && companyInfo.length > 30 ? '10px' : '12px';
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('❌ Failed to open print window');
      setIsPrinting(false);
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Badge - ${visitorData.name}</title>
        <style>
          @media print {
            @page { size: ${badgeSize.width}mm ${contentHeight}mm; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; }
          .badge-content {
            width: ${badgeSize.width}mm; height: ${contentHeight}mm; padding: 4mm;
            display: flex; align-items: center; gap: 4mm; box-sizing: border-box;
          }
          .qr-fallback {
            width: 20mm; height: 20mm; border: 2px solid #000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-size: 8px; text-align: center; color: #000; background: #fff; font-weight: bold;
            flex-shrink: 0;
          }
          .info { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
          .name { font-size: ${nameSize}; font-weight: bold; margin-bottom: 2mm; color: #1F2937; word-wrap: break-word; line-height: 1.2; }
          .company { font-size: ${companySize}; font-weight: 600; color: #4B5563; word-wrap: break-word; line-height: 1.1; }
        </style>
      </head>
      <body>
        <div class="badge-content">
          <div class="qr-fallback">
            <div>QR CODE</div>
            <div style="font-size: 6px; margin-top: 2px; word-break: break-all; line-height: 1.1;">
              ${qrData.slice(-16)}
            </div>
          </div>
          <div class="info">
            <div class="name">${visitorData.name}</div>
            ${companyInfo ? `<div class="company">${companyInfo}</div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
      console.log('🖨️ Print completed with text QR fallback');
    }, 1000);
  };

  // Print badge using pre-rendered approach
  const printBadge = (visitorData: VisitorData) => {
    // Prevent multiple print calls
    if (isPrinting) {
      console.log('🚫 printBadge ignored - already printing');
      return;
    }
    
    setIsPrinting(true);
    console.log('🖨️ printBadge called with visitor:', visitorData);
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
    
    // Use progressive loading for mobile devices
    if (isMobile) {
      printBadgeWithProgressiveLoading(visitorData);
      return;
    }
    
    // Original desktop approach for backward compatibility
    try {
      const companyInfo = getCompanyInfo(visitorData);
      console.log('🏢 Print company extraction result:', {
        hasCompany: !!companyInfo,
        company: companyInfo
      });
      
      const badgeSize = getBadgeSize();
      const contentHeight = badgeSize.height - 30; // Reserve space for header/footer
      const qrData = (visitorData as any)?.badge_qr || visitorData.id || '';
      
      console.log('🖨️ Print QR data:', qrData);
      
      // Create hidden staging area to pre-render badge
      const stagingDiv = document.createElement('div');
      stagingDiv.style.cssText = `
        position: absolute; 
        top: -9999px; 
        left: -9999px; 
        width: ${badgeSize.width}mm; 
        height: ${contentHeight}mm;
        padding: 4mm;
        display: flex;
        align-items: center;
        gap: 4mm;
        box-sizing: border-box;
        background: white;
        font-family: Arial, sans-serif;
      `;
      
      // Auto-resize logic
      const nameSize = visitorData.name.length > 20 ? '14px' : visitorData.name.length > 15 ? '16px' : '18px';
      const companySize = companyInfo && companyInfo.length > 30 ? '10px' : '12px';
      
      // Generate QR code URL with mobile-friendly settings
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;
      console.log('🔗 Print QR URL:', qrUrl);
      
      stagingDiv.innerHTML = `
        <!-- QR Code -->
        <div style="width: 20mm; height: 20mm; display: flex; align-items: center; justify-content: center; background: #fff; flex-shrink: 0;">
          <img 
            id="print-qr-img"
            src="${qrUrl}" 
            alt="QR Code: ${qrData}"
            style="width: 18mm; height: 18mm; object-fit: contain;"
            crossorigin="anonymous"
          />
        </div>
        
        <!-- Visitor Info -->
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
          <div style="font-size: ${nameSize}; font-weight: bold; margin-bottom: 2mm; color: #1F2937; word-wrap: break-word; line-height: 1.2;">
            ${visitorData.name}
          </div>
          
          ${companyInfo ? `
            <div style="font-size: ${companySize}; font-weight: 600; color: #4B5563; word-wrap: break-word; line-height: 1.1;">
              ${companyInfo}
            </div>
          ` : ''}
        </div>
      `;
      
      // Add to DOM temporarily
      document.body.appendChild(stagingDiv);
      
      // Wait for QR image to load, then print
      const qrImg = stagingDiv.querySelector('#print-qr-img') as HTMLImageElement;
      let printExecuted = false;
      
      const handleQRLoad = () => {
        if (printExecuted) return;
        printExecuted = true;
        
        console.log('✅ QR image pre-loaded, starting print...');
        
        // Create print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
          console.error('❌ Failed to open print window');
          document.body.removeChild(stagingDiv);
          setIsPrinting(false);
          return;
        }
        
        // Write HTML with pre-rendered content
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Badge - ${visitorData.name}</title>
            <style>
              @media print {
                @page {
                  size: ${badgeSize.width}mm ${contentHeight}mm;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: Arial, sans-serif;
                }
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: white;
              }
              .badge-content {
                width: ${badgeSize.width}mm;
                height: ${contentHeight}mm;
                padding: 4mm;
                display: flex;
                align-items: center;
                gap: 4mm;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="badge-content">
              ${stagingDiv.innerHTML}
            </div>
          </body>
          </html>
        `);
        
        printWindow.document.close();
        
        // Wait a bit for content to render, then print
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
          console.log('🖨️ Print completed');
        }, isMobile ? 1000 : 500); // Longer wait on mobile
        
        // Clean up staging div
        document.body.removeChild(stagingDiv);
        
        // Clear printing flag
        setTimeout(() => {
          setIsPrinting(false);
        }, 1000);
      };
      
      const handleQRError = () => {
        if (printExecuted) return;
        printExecuted = true;
        
        console.error('❌ QR image failed to load, using text fallback');
        
        // Replace QR image with text fallback
        const qrContainer = stagingDiv.querySelector('div:first-child');
        if (qrContainer) {
          qrContainer.innerHTML = `
            <div style="
              width: 18mm; 
              height: 18mm; 
              border: 2px solid #000; 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              font-size: 6px; 
              text-align: center; 
              color: #000; 
              background: #fff; 
              font-weight: bold;
            ">
              QR<br/>
              <small style="word-break: break-all; line-height: 1.1;">${qrData.slice(-12)}</small>
            </div>
          `;
        }
        
        // Proceed with print
        handleQRLoad();
      };
      
      // Force QR image loading with better mobile support
      if (qrImg.complete && qrImg.naturalWidth > 0) {
        console.log('✅ QR image already loaded');
        handleQRLoad();
      } else {
        console.log('⏳ Waiting for QR image to load...');
        
        qrImg.onload = () => {
          console.log('✅ QR image onload event fired');
          handleQRLoad();
        };
        
        qrImg.onerror = () => {
          console.error('❌ QR image onerror event fired');
          handleQRError();
        };
        
        // Mobile-friendly timeout (longer for slow connections)
        const timeoutDuration = isMobile ? 10000 : 5000;
        setTimeout(() => {
          if (!printExecuted) {
            console.log(`⏰ QR load timeout after ${timeoutDuration}ms, proceeding with fallback`);
            handleQRError();
          }
        }, timeoutDuration);
        
        // Force image loading by setting src again (mobile fix)
        setTimeout(() => {
          if (!printExecuted && !qrImg.complete) {
            console.log('🔄 Force reloading QR image for mobile...');
            qrImg.src = qrUrl + '&t=' + Date.now(); // Add timestamp to force reload
          }
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error in printBadge:', error);
      setIsPrinting(false);
    }
  };

  // Demo function to test company extraction with different formats
  const testCompanyExtractionFormats = () => {
    console.log('🧪 Testing company extraction with different formats:');
    
    const testCases = [
      {
        name: 'Current Event (cng_company)',
        custom_fields: '{"cng_company":"Công ty Cổ phần BLUSaigon","cng_events":"Event ABC"}'
      },
      {
        name: 'Vietnamese Standard',
        custom_fields: '{"Tên Công Ty":"Công ty TNHH ABC","Job Function":"Manager"}'
      },
      {
        name: 'English Standard',
        custom_fields: '{"Company":"ABC Corp Ltd","company_name":"XYZ Company"}'
      },
      {
        name: 'No Company Info',
        custom_fields: '{"Job Function":"Developer","Event":"Conference 2024"}'
      }
    ];
    
    testCases.forEach((testCase, index) => {
      const mockVisitor = {
        name: `Test User ${index + 1}`,
        company: '',
        custom_fields: testCase.custom_fields
      } as unknown as VisitorData;
      
      const result = getCompanyInfo(mockVisitor);
      console.log(`📋 ${testCase.name}:`, result || '(no company found)');
    });
    
    // Test event validation scenarios
    console.log('🧪 Testing event validation scenarios:');
    console.log('📋 Current Event ID:', eventId);
    console.log('📋 Test scenarios:');
    console.log('  ✅ Same event: visitor.event_id === currentEventId → Allow check-in');
    console.log('  ❌ Different event: visitor.event_id !== currentEventId → Show error');
    console.log('📋 Badge printing status:', eventData?.badge_printing ? 'ENABLED' : 'DISABLED');
  };

  // Call test function in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      testCompanyExtractionFormats();
    }
  }, [eventData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopCamera();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner 
            size="lg" 
            showLogo={true} 
            text="Đang tải thông tin sự kiện..."
          />
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full mx-4 p-6 text-center shadow-xl rounded-3xl">
          <div className="text-red-500 mb-4">
            <Icon name="ExclamationTriangleIcon" className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy sự kiện</h2>
            <p className="text-sm text-gray-600">{error || 'Sự kiện không tồn tại hoặc đã kết thúc'}</p>
          </div>
          <Button 
            onClick={() => router.push('/')}
            variant="primary"
            className="w-full min-h-[48px]"
          >
            Về trang chủ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Global styles for html5-qrcode */}
      <style jsx global>{`
        #qr-reader {
          border-radius: 1rem !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__header_message {
          display: none !important;
        }
        #qr-reader__camera_selection {
          display: none !important;
        }
        #qr-reader__scan_region {
          border-radius: 1rem !important;
        }
        #qr-reader__scan_region video {
          border-radius: 1rem !important;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 shadow-xl sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {eventData.logo && (
                  <div className="w-10 h-10 rounded-xl bg-white flex-shrink-0 shadow-sm p-1">
                    <img 
                      src={eventData.logo} 
                      alt={eventData.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-base font-semibold text-white leading-tight">
                    Check-in System
                  </h1>
                  <p className="text-xs text-white/80">
                    {eventData.name}
                  </p>
                  
                  {/* Badge Printing Status */}
                  <div className="flex items-center gap-1 mt-1">
                    {eventData.badge_printing ? (
                      <div className="flex items-center gap-1 text-xs text-green-300">
                        <Icon name="PrinterIcon" className="w-3 h-3" />
                        <span>Event này sẽ tự động in thẻ đeo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-orange-300">
                        <Icon name="ExclamationTriangleIcon" className="w-3 h-3" />
                        <span>Event này không tự động in thẻ đeo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/insight/${eventId}`)}
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">
          {/* Manual Check-in Card (Primary) */}
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <Card className="p-6 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                  <Icon name="CheckCircleIcon" className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Check-in Visitor
                </h2>
                <p className="text-sm text-gray-600">
                  {cameraEnabled 
                    ? "Sử dụng máy scan barcode HOẶC camera để quét QR code"
                    : "Nhập Visitor ID hoặc quét QR code để check-in"
                  }
                </p>

                
                {/* Hybrid Mode Indicator */}
                {cameraEnabled && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>📟 Barcode Scanner</span>
                    </div>
                    <span className="text-blue-400">+</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>📷 Camera</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={manualInput}
                      onChange={handleManualInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={cameraEnabled 
                        ? "Máy scan barcode sẽ tự động nhập ở đây..."
                        : "Nhập Visitor ID để check-in..."
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={isProcessing}
                      autoFocus
                    />
                    
                    {/* Input Hints */}
                    {cameraEnabled && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <Icon name="CheckCircleIcon" className="w-3 h-3 text-green-500" />
                        <span>Input tự động focus để nhận dữ liệu từ máy scan</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!manualInput.trim() || isProcessing}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-colors duration-200 flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Icon name="ArrowRightIcon" className="w-5 h-5" />
                        Check-in
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Camera Scanner Toggle */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Hybrid Scanning {cameraEnabled && "(📟 + 📷)"}
                    </h3>
                  </div>
                  
                  {!scanning ? (
                    <Button
                      onClick={() => {
                        setScanning(true);
                        setTimeout(() => {
                          initializeCamera();
                        }, 100);
                      }}
                      variant="outline"
                      className="text-slate-600 border-slate-300 flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <Icon name="CameraIcon" className="w-4 h-4" />
                      Bật Camera
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          stopCamera();
                          setTimeout(() => {
                            setScanning(true);
                            setTimeout(() => {
                              initializeCamera();
                            }, 100);
                          }, 200);
                        }}
                        variant="outline"
                        className="text-blue-600 border-blue-300 flex items-center gap-1 text-sm px-3 py-1"
                      >
                        <Icon name="ArrowRightIcon" className="w-3 h-3" />
                        Scan Lại
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        className="text-red-600 border-red-300"
                      >
                        Tắt Camera
                      </Button>
                    </div>
                  )}
                </div>

                {/* Hybrid Mode Instructions */}
                <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">💡 Hướng dẫn Hybrid Scanning</h4>
                  <div className="text-xs text-yellow-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>📟</span>
                      <span><strong>Máy scan barcode:</strong> Quét trực tiếp vào ô input (luôn focus)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📷</span>
                      <span><strong>Camera phone:</strong> Quét QR code bằng camera</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⌨️</span>
                      <span><strong>Manual:</strong> Gõ tay Visitor ID vào ô input</span>
                    </div>
                  </div>
                </div>

                {/* Continuous Mode Toggle */}
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Chế độ quét liên tục</h4>
                      <p className="text-xs text-blue-700 mt-1">Camera sẽ luôn bật để quét hàng loạt QR codes</p>
                    </div>
                    <button
                      onClick={() => setContinuousMode(!continuousMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        continuousMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          continuousMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {continuousMode && (
                    <div className="mt-2 text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">
                      💡 Camera sẽ tự động restart sau mỗi lần check-in thành công
                    </div>
                  )}
                </div>

                {/* QR Scanner */}
                {scanning && (
                  <div className="relative">
                    <div 
                      id="qr-reader" 
                      className="w-full max-w-sm mx-auto rounded-2xl border border-gray-200 overflow-hidden"
                      style={{ minHeight: '250px' }}
                    ></div>

                    {!cameraEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
                        <div className="text-center">
                          <LoadingSpinner size="lg" />
                          <p className="text-sm text-gray-600 mt-2">Đang khởi tạo camera...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Continuous Mode Status */}
                    {continuousMode && cameraEnabled && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Chế độ liên tục
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Processing state */}
              {isProcessing && (
                <div className="text-center py-6 border-t border-gray-200 mt-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-sm text-gray-600 mt-2">Đang xử lý check-in...</p>
                </div>
              )}

              {/* Success message */}
              {success && !showSuccessScreen && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                  <Icon name="CheckCircleIcon" className="w-6 h-6 text-emerald-600" />
                  <div className="flex-1">
                    <span className="text-sm text-emerald-800 font-medium">{success}</span>
                    
                    {/* Show scanning method used */}
                    {success.includes('Camera') && (
                      <div className="text-xs text-emerald-700 mt-1">📷 Sử dụng camera phone để quét</div>
                    )}
                    {success.includes('Barcode scanner') && (
                      <div className="text-xs text-emerald-700 mt-1">📟 Sử dụng máy scan barcode</div>
                    )}
                    {success.includes('Manual input') && (
                      <div className="text-xs text-emerald-700 mt-1">⌨️ Sử dụng nhập tay</div>
                    )}
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Icon name="ExclamationTriangleIcon" className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-red-800 font-medium">
                        {error.includes('\n') ? (
                          <div className="space-y-1">
                            {error.split('\n').map((line, index) => (
                              <div key={index} className={line.startsWith('•') ? 'ml-2' : ''}>
                                {line}
                              </div>
                            ))}
                          </div>
                        ) : (
                          error
                        )}
                      </div>
                      
                      {/* Additional help for event mismatch errors */}
                      {error.includes('Event ID') && (
                        <div className="mt-2 text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                          💡 Đảm bảo bạn đang scan QR code đúng cho event này
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </Card>
          </div>
        </div>

        {/* Camera Permission Dialog */}
        {showCameraPermissionDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 rounded-3xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                <Icon name="VideoCameraIcon" className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Camera Access Needed
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                We need camera access to scan QR codes for check-in.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={requestCameraPermission}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Allow Camera Access
                </Button>
                <Button
                  onClick={() => setShowCameraPermissionDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Skip
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Auto Success Screen */}
        {showSuccessScreen && visitor && (
          <div className="fixed inset-0 bg-emerald-500/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full p-8 rounded-3xl text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6 animate-bounce">
                <Icon name="CheckCircleIcon" className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                ✅ Check-in thành công!
              </h3>
              
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {visitor.name}
                </p>
                {(() => {
                  const companyInfo = getCompanyInfo(visitor);
                  return companyInfo ? (
                    <p className="text-sm text-gray-600">
                      {companyInfo}
                    </p>
                  ) : null;
                })()}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                  <Icon name="CheckCircleIcon" className="w-4 h-4" />
                  <span>✓ Check-in thành công</span>
                </div>
                
                {eventData?.badge_printing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                    <Icon name="PrinterIcon" className="w-4 h-4" />
                    <span>✓ Thẻ đeo đã được in tự động</span>
                  </div>
                )}
              </div>

              {/* Continuous Mode Info */}
              {continuousMode && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-700 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Chế độ quét liên tục đang bật</span>
                  </div>
                  <p className="text-xs text-blue-600 text-center">
                    Camera sẽ tự động khởi động lại sau {autoReturnCountdown}s
                  </p>
                </div>
              )}

              {/* Auto countdown */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full border-4 border-emerald-200 mb-2">
                  <span className="text-lg font-bold text-emerald-600">{autoReturnCountdown}</span>
                </div>
                <p className="text-sm text-emerald-700">
                  {continuousMode ? 'Tự động quét tiếp sau' : 'Về trang chính sau'} {autoReturnCountdown} giây
                </p>
              </div>

              {/* Manual controls */}
              <div className="flex gap-3">
                <Button
                  onClick={resetForNextCheckin}
                  variant="outline"
                  className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {continuousMode ? 'Quét tiếp ngay' : 'Check-in tiếp'}
                </Button>
                
                {continuousMode && (
                  <Button
                    onClick={() => {
                      setContinuousMode(false);
                      resetForNextCheckin();
                    }}
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Tắt chế độ liên tục
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
} 