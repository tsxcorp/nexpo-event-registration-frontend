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
        
        const response = await eventApi.getEventInfo(eventId);
        setEventData(response.event);
        
        console.log('📥 Event data loaded:', response.event);
        
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
          console.log('🔍 QR Code detected:', decodedText);
          processCheckin(decodedText);
        },
        () => {
          // Ignore scan errors
        }
      );

      setCameraEnabled(true);
      console.log('📹 Camera initialized successfully');

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
  };

  // Process check-in (unified for both manual and scanner)
  const processCheckin = async (visitorId: string) => {
    if (!visitorId.trim() || isProcessing) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setVisitor(null);

    try {
      console.log('🔍 Processing visitor ID:', visitorId);
      
      const response = await visitorApi.getVisitorInfo(visitorId.trim());
      
      if (response.visitor) {
        console.log('✅ Visitor found:', response.visitor);
        
        setVisitor(response.visitor);
        setSuccess(`✅ Check-in thành công cho ${response.visitor.name}!`);
        
        // Auto-print badge
        setTimeout(() => {
          console.log('🖨️ Auto-printing badge for visitor:', response.visitor);
          printBadge(response.visitor);
        }, 500);
        
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
      setError('❌ Có lỗi xảy ra khi check-in. Vui lòng thử lại.');
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual input submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processCheckin(manualInput.trim());
    }
  };

  // Auto-return countdown
  const startAutoReturnCountdown = () => {
    let countdown = 4;
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
    
    // Focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
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
            {visitorData.company && (
              <div style={{
                fontSize: visitorData.company.length > 30 ? '10px' : '12px',
                color: '#6B7280',
                wordWrap: 'break-word',
                lineHeight: '1.1'
              }}>
                {visitorData.company}
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

  // Print badge using pre-rendered approach
  const printBadge = (visitorData: VisitorData) => {
    console.log('🖨️ printBadge called with visitor:', visitorData);
    
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
    const companySize = visitorData.company && visitorData.company.length > 30 ? '10px' : '12px';
    
    // Generate QR code URL
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    console.log('🔗 Print QR URL:', qrUrl);
    
    stagingDiv.innerHTML = `
      <!-- QR Code -->
      <div style="width: 20mm; height: 20mm; display: flex; align-items: center; justify-content: center; background: #fff; flex-shrink: 0;">
        <img 
          id="print-qr-img"
          src="${qrUrl}" 
          alt="QR Code: ${qrData}"
          style="width: 18mm; height: 18mm; object-fit: contain;"
        />
      </div>
      
      <!-- Visitor Info -->
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
        <div style="font-size: ${nameSize}; font-weight: bold; margin-bottom: 2mm; color: #1F2937; word-wrap: break-word; line-height: 1.2;">
          ${visitorData.name}
        </div>
        
        ${visitorData.company ? `
          <div style="font-size: ${companySize}; color: #6B7280; word-wrap: break-word; line-height: 1.1;">
            ${visitorData.company}
          </div>
        ` : ''}
      </div>
    `;
    
    // Add to DOM temporarily
    document.body.appendChild(stagingDiv);
    
    // Wait for QR image to load, then print
    const qrImg = stagingDiv.querySelector('#print-qr-img') as HTMLImageElement;
    
    const handleQRLoad = () => {
      console.log('✅ QR image pre-loaded, starting print...');
      
      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        console.error('❌ Failed to open print window');
        document.body.removeChild(stagingDiv);
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
      }, 500);
      
      // Clean up staging div
      document.body.removeChild(stagingDiv);
    };
    
    const handleQRError = () => {
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
    
    // Set up QR image load handlers
    if (qrImg.complete) {
      handleQRLoad();
    } else {
      qrImg.onload = handleQRLoad;
      qrImg.onerror = handleQRError;
      
      // Timeout fallback after 5 seconds
      setTimeout(() => {
        if (!qrImg.complete) {
          console.log('⏰ QR load timeout, proceeding with fallback');
          handleQRError();
        }
      }, 5000);
    }
  };

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
                  Nhập Visitor ID hoặc quét QR code để check-in
                </p>
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Nhập Visitor ID để check-in..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
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
                  <h3 className="text-sm font-semibold text-gray-700">QR Scanner (Tùy chọn)</h3>
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
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="text-red-600 border-red-300"
                    >
                      Tắt Camera
                    </Button>
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
                  <span className="text-sm text-emerald-800 font-medium">{success}</span>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                  <Icon name="ExclamationTriangleIcon" className="w-6 h-6 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">{error}</span>
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
                {visitor.company && (
                  <p className="text-sm text-gray-600 mb-1">
                    {visitor.company}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {visitor.email}
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                  <Icon name="PrinterIcon" className="w-4 h-4" />
                  <span>✓ Badge đã được in tự động</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Tự động quay lại trong:
                </p>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full">
                  <span className="text-xl font-bold text-emerald-600">
                    {autoReturnCountdown}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sẵn sàng check-in visitor tiếp theo
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={resetForNextCheckin}
                  variant="outline"
                  className="text-gray-600 border-gray-300 text-sm"
                >
                  Check-in ngay ⚡
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
} 