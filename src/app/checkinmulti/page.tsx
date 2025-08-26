'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EventData, eventApi } from '@/lib/api/events';
import { VisitorData, visitorApi, VisitorResponse } from '@/lib/api/visitors';
import { useEventMetadata } from '@/hooks/useEventMetadata';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { Html5Qrcode } from 'html5-qrcode';
import { i18n } from '@/lib/translation/i18n';

export default function CheckinMultiPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // State management
  const [availableEvents, setAvailableEvents] = useState<EventData[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<EventData[]>([]);
  const [matchedEvent, setMatchedEvent] = useState<EventData | null>(null);
  const [visitor, setVisitor] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
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
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi');
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { generateShareUrls } = useEventMetadata({ 
    event: matchedEvent, 
    currentLanguage: 'vi' 
  });

  const { trackCheckin, trackQRScan, trackBadgePrint } = useGoogleAnalytics();

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
      ),
      CollectionIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      SelectorIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
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

  // Load available events
  useEffect(() => {
    const loadAvailableEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Loading available events for multi-checkin...');
        
        // Test backend connection first (parallel with events loading)
        const backendCheck = visitorApi.checkBackendConnection();
        
        // Load events without detailed=true for faster loading
        const response = await eventApi.getAllEventsBasic();
        console.log('📋 Available events loaded:', response.events);
        
        // Wait for backend check to complete
        await backendCheck;
        
        // Filter active events or events that support check-in
        const activeEvents = response.events.filter(event => {
          // You can add more filtering logic here based on your needs
          // For now, we include all events
          return true;
        });
        
        setAvailableEvents(activeEvents);
        
        // Auto-select all events by default for multi-event check-in
        setSelectedEvents(activeEvents);
        console.log('🎯 Auto-selected all events for multi-event check-in:', activeEvents.map(e => e.name));
        
        // Trigger entrance animation immediately
        setIsVisible(true);
        
        // Load detailed event data in background for badge printing
        loadDetailedEventData(activeEvents);
        
      } catch (err: any) {
        console.error('Error loading available events:', err);
        setError(i18n[currentLanguage]?.unable_to_load_event_list || 'Không thể tải danh sách sự kiện. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadAvailableEvents();
  }, []);

  // Load detailed event data in background
  const loadDetailedEventData = async (events: EventData[]) => {
    try {
      console.log('🔄 Loading detailed event data in background...');
      const response = await eventApi.getAllEvents();
      
      // Update events with detailed data
      setAvailableEvents(prevEvents => 
        prevEvents.map(event => {
          const detailedEvent = response.events.find(e => e.id === event.id);
          return detailedEvent || event;
        })
      );
      
      console.log('✅ Detailed event data loaded successfully');
    } catch (error) {
      console.warn('⚠️ Failed to load detailed event data:', error);
      // Don't fail the whole process, just log warning
    }
  };

  // Auto-focus input when events are selected
  useEffect(() => {
    if (selectedEvents.length > 0 && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        console.log('🎯 Auto-focused input after event selection');
      }, 500);
    }
  }, [selectedEvents]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false);
      }
    };

    if (showEventDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventDropdown]);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionGranted(true);
      setShowCameraPermissionDialog(false);
    } catch (error) {
      console.error('Camera permission denied:', error);
      setError(i18n[currentLanguage]?.camera_access_denied_use_manual_input || 'Quyền truy cập camera bị từ chối. Bạn vẫn có thể sử dụng manual input.');
      setShowCameraPermissionDialog(false);
    }
  };

  // Initialize camera scanner
  const initializeCamera = async () => {
    if (selectedEvents.length === 0) {
      setError('Vui lòng chọn ít nhất một sự kiện trước khi sử dụng camera');
      return;
    }

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
          
          // Track camera QR scan
          trackQRScan('camera');
          
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
      setError(i18n[currentLanguage]?.unable_to_initialize_camera || 'Không thể khởi tạo camera. Vui lòng sử dụng manual input.');
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

  // Process check-in (unified for both manual and scanner) - Multi-Event Query Logic
  const processCheckin = async (visitorId: string) => {
    if (selectedEvents.length === 0) {
      setError('❌ Vui lòng chọn ít nhất một sự kiện trước khi check-in');
      return;
    }

    if (!visitorId.trim() || isProcessing) {
      console.log('🚫 processCheckin ignored - empty ID or already processing');
      return;
    }

    // Basic input validation
    const trimmedId = visitorId.trim();
    if (trimmedId.length < 3) {
      setError(i18n[currentLanguage]?.visitor_id_must_have_at_least_3_characters || '❌ ID visitor phải có ít nhất 3 ký tự.');
      setIsProcessing(false);
      // Reset input immediately for validation errors
      setManualInput('');
      console.log('🔄 Input reset after validation error');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setVisitor(null);
    setMatchedEvent(null);

    try {
      console.log('🔍 Processing visitor/group ID:', trimmedId, 'across', selectedEvents.length, 'events:', selectedEvents.map(e => e.name));
      
      // Check if this is a group ID
      const isGroupId = trimmedId.includes('GRP');
      console.log('🏷️ Processing type:', isGroupId ? 'Group' : 'Single Visitor');
      
      // Try to get visitor/group info - this will search across the database
      const response = await visitorApi.getVisitorInfo(trimmedId);
      
      if (isGroupId) {
        // Handle group check-in
        const groupResponse = response as any;
        if (groupResponse.visitors && Array.isArray(groupResponse.visitors)) {
          console.log('✅ Group found with', groupResponse.count, 'visitors:', groupResponse.visitors);
          
          // Initial delay after successful scan to ensure QR data is ready
          setSuccess(`🔄 Đang chuẩn bị xử lý nhóm ${groupResponse.count} visitors cho ${selectedEvents.length} sự kiện...`);
          await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay after scan
          
          // Process each visitor in the group
          let successCount = 0;
          let errorCount = 0;
          const results = [];
          
          setSuccess(`🔄 Đang xử lý nhóm ${groupResponse.count} visitors...`);
          
          for (let i = 0; i < groupResponse.visitors.length; i++) {
            const visitorEntry = groupResponse.visitors[i];
            const visitor = visitorEntry.visitor;
            
            console.log(`📋 Processing visitor ${i + 1}/${groupResponse.count}:`, visitor.name);
            
            // Check if visitor belongs to ANY of the selected events
            const visitorEventId = String(visitor.event_id);
            const matchingEvent = selectedEvents.find(event => String(event.id) === visitorEventId);
            
            if (!matchingEvent) {
              console.log(`❌ Visitor ${visitor.name} not in selected events`);
              errorCount++;
              results.push({
                visitor: visitor.name,
                status: 'error',
                message: `Không thuộc sự kiện đã chọn (${visitor.event_name})`
              });
              continue;
            }
            
            try {
              // Submit check-in for this visitor
              console.log(`📝 Submitting check-in for visitor ${i + 1}:`, visitor.name);
              await visitorApi.submitCheckin(visitor);
              
              // Track successful checkin
              trackCheckin(matchingEvent.id, matchingEvent.name, visitor.id);
              
              // Auto-print badge if enabled
              if (matchingEvent.badge_printing && autoPrintEnabled) {
                console.log(`🖨️ Auto-printing badge for visitor ${i + 1}:`, visitor.name);
                await printBadge(visitor, matchingEvent);
              }
              
              successCount++;
              results.push({
                visitor: visitor.name,
                status: 'success',
                event: matchingEvent.name,
                printed: matchingEvent.badge_printing && autoPrintEnabled
              });
              
              // Increased delay between visitors to ensure QR data is ready
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              console.error(`❌ Error processing visitor ${i + 1}:`, error);
              errorCount++;
              results.push({
                visitor: visitor.name,
                status: 'error',
                message: 'Lỗi khi submit check-in'
              });
            }
          }
          
          // Show group results
          const successMessage = `✅ Nhóm check-in hoàn thành!\n\n📊 Kết quả:\n• Thành công: ${successCount}/${groupResponse.count}\n• Lỗi: ${errorCount}/${groupResponse.count}`;
          
          if (errorCount > 0) {
            const errorDetails = results.filter(r => r.status === 'error')
              .map(r => `• ${r.visitor}: ${r.message}`)
              .join('\n');
            setError(`${successMessage}\n\n❌ Chi tiết lỗi:\n${errorDetails}`);
          } else {
            setSuccess(successMessage);
          }
          
          // Show success screen with group info
          setTimeout(() => {
            setShowSuccessScreen(true);
            startAutoReturnCountdown();
          }, 1000);
          
        } else {
          setError('❌ Dữ liệu nhóm không hợp lệ. Vui lòng thử lại.');
        }
      } else if ('visitor' in response && response.visitor) {
        const visitorResponse = response as VisitorResponse;
        console.log('✅ Visitor found:', visitorResponse.visitor);
        
        // CRITICAL: Check if visitor belongs to ANY of the selected events
        const visitorEventId = String(visitorResponse.visitor.event_id);
        const matchingEvent = selectedEvents.find(event => String(event.id) === visitorEventId);
        
        console.log('🔒 Multi-event cross-query validation:', {
          visitorEventId,
          visitorName: visitorResponse.visitor.name,
          visitorEventName: visitorResponse.visitor.event_name,
          selectedEventIds: selectedEvents.map(e => e.id),
          selectedEventNames: selectedEvents.map(e => e.name),
          matchingEvent: matchingEvent ? matchingEvent.name : null,
          validMatch: !!matchingEvent
        });
        
        if (!matchingEvent) {
          console.error('🚫 Event ID mismatch - Visitor not in any selected events:', {
            visitor: visitorResponse.visitor.name,
            visitorEventId,
            visitorEventName: visitorResponse.visitor.event_name,
            selectedEvents: selectedEvents.map(e => ({ id: e.id, name: e.name })),
            securityAction: 'MULTI_QUERY_DENIED'
          });
          
          const selectedEventNames = selectedEvents.map(e => e.name).join(', ');
          setError(`❌ Visitor không thuộc các sự kiện đã chọn.\n\n• Visitor: ${visitorResponse.visitor.name}\n• Thuộc sự kiện: ${visitorResponse.visitor.event_name}\n• Các sự kiện đã chọn: ${selectedEventNames}\n\n💡 Vui lòng chọn đúng sự kiện hoặc kiểm tra lại QR code.`);
          setIsProcessing(false);
          
          // Reset input immediately for security violations
          setManualInput('');
          console.log('🔄 Input reset after multi-event security violation');
          
          // Strong haptic feedback for security violation
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
          
          return;
        }
        
        console.log('✅ Multi-event cross-query validation passed - visitor belongs to event:', matchingEvent.name);
        
        // Set the matched event for badge printing and display
        setMatchedEvent(matchingEvent);
        
        // Submit check-in to Zoho Creator (if API exists)
        try {
          console.log('📝 Submitting multi-event check-in history to Zoho...');
          const checkinResult = await visitorApi.submitCheckin(visitorResponse.visitor);
          console.log('✅ Multi-event check-in history submitted successfully:', checkinResult);
        } catch (submitError: any) {
          console.error('⚠️ Failed to submit multi-event check-in history:', submitError.message);
          // Don't fail the whole process if check-in submission fails
          // This is expected if the check-in API doesn't exist yet
        }
        
        setVisitor(visitorResponse.visitor);
        setSuccess(`✅ Check-in thành công cho ${visitorResponse.visitor.name} vào sự kiện "${matchingEvent.name}"!`);
        
        // Track successful checkin with event info
        trackCheckin(matchingEvent.id, matchingEvent.name, visitorResponse.visitor.id);
        
        // Auto-print badge based on the MATCHED event's settings
        if (matchingEvent.badge_printing && autoPrintEnabled) {
          setTimeout(async () => {
            console.log('🖨️ Auto-printing badge for matched event:', matchingEvent.name, 'visitor:', visitorResponse.visitor.name);
            
            // Show printing status to user
            setSuccess(`✅ Check-in thành công cho ${visitorResponse.visitor.name}! 🖨️ Đang chuẩn bị in thẻ cho sự kiện "${matchingEvent.name}"...`);
            
            // Track badge printing
            trackBadgePrint(matchingEvent.id, matchingEvent.name);
            await printBadge(visitorResponse.visitor, matchingEvent);
          }, 500);
        } else if (matchingEvent.badge_printing && !autoPrintEnabled) {
          console.log('🚫 Badge printing disabled by user toggle for event:', matchingEvent.name);
          setSuccess(`✅ Check-in thành công cho ${visitorResponse.visitor.name} vào "${matchingEvent.name}"! (Auto-print đã tắt)`);
        } else {
          console.log('🚫 Badge printing disabled by backend for event:', matchingEvent.name, '(badge_printing=false)');
          setSuccess(`✅ Check-in thành công cho ${visitorResponse.visitor.name} vào "${matchingEvent.name}"! (Event không hỗ trợ in thẻ)`);
        }
        
        // Show success screen
        setTimeout(() => {
          console.log('🎉 Setting showSuccessScreen to true (multi-event matched to:', matchingEvent.name, ')');
          setShowSuccessScreen(true);
          startAutoReturnCountdown();
        }, 1000);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        setError(`❌ ${i18n[currentLanguage]?.visitor_info_not_found || 'Không tìm thấy thông tin visitor trong các sự kiện đã chọn.'}`);
        // Reset input for visitor not found
        setManualInput('');
        console.log('🔄 Input reset after visitor not found (multi-event)');
      }
    } catch (error: any) {
      console.error('❌ Multi-event check-in error:', error);
      
      // Handle specific error types
      let errorMessage = `❌ ${i18n[currentLanguage]?.error_during_checkin || 'Có lỗi xảy ra khi check-in. Vui lòng thử lại.'}`;
      
      if (error.message === 'Visitor not found' || error.message === 'Group not found') {
        errorMessage = `❌ ${i18n[currentLanguage]?.visitor_with_id_not_found || 'Không tìm thấy visitor/nhóm với ID này trong các sự kiện đã chọn.'}`;
      } else if (error.message === 'Visitor ID is required') {
        errorMessage = `❌ ${i18n[currentLanguage]?.please_enter_visitor_id || 'Vui lòng nhập ID visitor.'}`;
      } else if (error.message.includes('Server error')) {
        errorMessage = `❌ ${i18n[currentLanguage]?.system_error_try_again_later || 'Lỗi hệ thống. Vui lòng thử lại sau.'}`;
      } else if (error.message.includes('Failed to fetch visitor data')) {
        errorMessage = `❌ ${i18n[currentLanguage]?.unable_to_connect_to_server || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'}`;
      }
      
      setError(errorMessage);
      
      // Reset input for all other errors
      setManualInput('');
      console.log('🔄 Input reset after API error (multi-event)');
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } finally {
      setIsProcessing(false);
      
      // Always refocus input after processing completes (success or error)
      setTimeout(() => {
        if (inputRef.current && !showSuccessScreen) {
          inputRef.current.focus();
          console.log('🎯 Auto-focused input after multi-event processing completion');
        }
      }, 500);
    }
  };

  // Handle manual input submit (supports both manual typing and barcode scanner)
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      console.log('🔍 Multi-event Manual/Barcode QR Code detected:', manualInput.trim());
      
      // Distinguish between manual typing and barcode scanner
      const isLikelyBarcodeScanner = manualInput.length > 8 && /^[A-Za-z0-9+/=]+$/.test(manualInput);
      
      if (isLikelyBarcodeScanner) {
        console.log('📟 Detected barcode scanner input (multi-event)');
        setSuccess('📟 Barcode scanner QR được quét thành công!');
        trackQRScan('barcode');
      } else {
        console.log('⌨️ Detected manual typing input (multi-event)');
        setSuccess('⌨️ Manual input được xử lý thành công!');
        trackQRScan('manual');
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
      console.log('🎯 Error cleared by user input, maintaining focus (multi-event)');
    }
    
    // Auto-submit for barcode scanner (when input looks complete)
    if (value.length > 15 && /^[A-Za-z0-9+/=]+$/.test(value) && !isProcessing && selectedEvents.length > 0) {
      console.log('📟 Auto-submitting barcode scanner input (multi-event):', value);
      setTimeout(() => {
        if (manualInput === value && !isProcessing && value.trim()) {
          console.log('📟 Executing auto-submit for barcode scanner (multi-event)');
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleManualSubmit(fakeEvent);
        }
      }, 200);
    }
  };

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
    if (continuousMode && !scanning && selectedEvents.length > 0) {
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
        console.log('🎯 Manual input refocused after reset (multi-event)');
      }
    }, cameraEnabled ? 100 : 50);
  };

  // Parse badge size from event data
  const getBadgeSize = (eventData: EventData) => {
    const badgeSize = eventData?.badge_size;
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

  // Determine badge layout based on dimensions
  const getBadgeLayout = (eventData: EventData) => {
    const badgeSize = getBadgeSize(eventData);
    const aspectRatio = badgeSize.height / badgeSize.width;
    
    // If height is significantly more than width (aspect ratio > 1.2), use vertical layout
    const isVerticalLayout = aspectRatio > 1.2;
    
    console.log('🎫 Badge layout decision:', {
      width: badgeSize.width,
      height: badgeSize.height,
      aspectRatio: aspectRatio.toFixed(2),
      layout: isVerticalLayout ? 'vertical' : 'horizontal'
    });
    
    return {
      ...badgeSize,
      isVerticalLayout
    };
  };



  // Extract custom content from visitor data based on event's badge_custom_content
  const getCustomContent = (visitorData: VisitorData, eventToPrint: EventData): string[] => {
    const customContentField = (eventToPrint as any)?.badge_custom_content;
    if (!customContentField || typeof customContentField !== 'string') {
      return [];
    }

    console.log('🎨 Extracting custom content for fields:', customContentField);
    
    // Split by comma to handle multiple fields
    const fieldNames = customContentField.split(',').map(field => field.trim());
    const results: string[] = [];
    
    for (const fieldName of fieldNames) {
      console.log('🎨 Processing field:', fieldName);
      
      // Try direct field first
      if (visitorData[fieldName as keyof VisitorData]) {
        const value = visitorData[fieldName as keyof VisitorData];
                 if (value && String(value).trim()) {
           console.log('✅ Found custom content in direct field:', fieldName, value);
           results.push(String(value).trim().toUpperCase());
           continue;
         }
      }
      
      // Try custom_fields
      try {
        const customFields = typeof visitorData.custom_fields === 'string' 
          ? JSON.parse(visitorData.custom_fields) 
          : visitorData.custom_fields;
          
                 if (customFields[fieldName] && customFields[fieldName].trim()) {
           console.log('✅ Found custom content in custom_fields:', fieldName, customFields[fieldName]);
           results.push(customFields[fieldName].trim().toUpperCase());
           continue;
         }
      } catch (error) {
        console.log('⚠️ Error parsing custom_fields for field:', fieldName, error);
      }
      
      console.log('❌ No content found for field:', fieldName);
    }
    
    console.log('🎨 Final custom content results:', results);
    return results;
  };

  // Print badge function for matched event with enhanced QR handling
  const printBadge = async (visitorData: VisitorData, eventToPrint: EventData) => {
    console.log('🖨️ Multi-event printBadge called with visitor:', visitorData.name, 'for matched event:', eventToPrint.name);
    
    // Show printing feedback
    setSuccess(`✅ Check-in thành công! 🖨️ Đang kiểm tra QR code từ Zoho...`);
    
    // Check if badge_qr exists, if not fetch from Zoho
    let finalQrData = (visitorData as any)?.badge_qr;
    
    if (!finalQrData || finalQrData === '') {
      console.log('⚠️ badge_qr not found, fetching from Zoho...');
      setSuccess(`✅ Check-in thành công! 🖨️ Đang fetch QR code từ Zoho cho "${visitorData.name}"...`);
      
      try {
        // Fetch fresh visitor data from Zoho to get badge_qr
        const freshVisitorResponse = await visitorApi.getVisitorInfo(visitorData.id);
        
        const freshResponse = freshVisitorResponse as VisitorResponse;
        if (freshResponse.visitor && (freshResponse.visitor as any)?.badge_qr) {
          finalQrData = (freshResponse.visitor as any).badge_qr;
          console.log('✅ Successfully fetched badge_qr from Zoho:', finalQrData);
          setSuccess(`✅ Check-in thành công! 🖨️ QR code đã sẵn sàng, đang in thẻ...`);
        } else {
          console.error('❌ badge_qr still not available from Zoho after fetch');
          setSuccess(`✅ Check-in thành công cho ${visitorData.name}!`);
          setError('🕐 QR code đang được tạo bởi hệ thống.\n\n💡 Hướng dẫn:\n• Chờ 2-3 phút để hệ thống tạo QR code\n• Thử scan lại QR code sau khi chờ\n• Hoặc liên hệ ban tổ chức để được hỗ trợ\n\n✅ Check-in đã thành công, chỉ cần chờ QR code!');
          return; // Don't print without proper QR code
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch badge_qr from Zoho:', fetchError);
        setSuccess(`✅ Check-in thành công cho ${visitorData.name}!`);
                  setError('🌐 Đang gặp vấn đề kết nối với hệ thống.\n\n💡 Hướng dẫn:\n• Kiểm tra kết nối mạng\n• Thử lại sau 1-2 phút\n• Hoặc liên hệ ban tổ chức nếu vấn đề vẫn tiếp tục\n\n✅ Check-in đã thành công!');
        return; // Don't print without proper QR code
      }
    } else {
      console.log('✅ badge_qr already available:', finalQrData);
      setSuccess(`✅ Check-in thành công! 🖨️ Đang in thẻ cho sự kiện "${eventToPrint.name}"...`);
    }
    
    // Validate QR data
    if (!finalQrData || finalQrData === '') {
      console.error('❌ No valid QR data available for printing');
      setSuccess(`✅ Check-in thành công cho ${visitorData.name}!`);
                setError('🔄 Hệ thống đang xử lý thông tin QR code.\n\n💡 Hướng dẫn:\n• Chờ 1-2 phút để hệ thống xử lý\n• Thử scan lại QR code sau khi chờ\n• Hoặc liên hệ ban tổ chức để được hỗ trợ\n\n✅ Check-in đã thành công!');
      return;
    }
    
    // Get badge layout from matched event
    const badgeLayout = getBadgeLayout(eventToPrint);
    const contentHeight = badgeLayout.height - 30; // Reserve space for header/footer
    
    // Extract custom content
    const customContent = getCustomContent(visitorData, eventToPrint);
    
    // QR size for print - larger for vertical layout
    const printQrContainerSize = badgeLayout.isVerticalLayout ? '28mm' : '20mm';
    const printQrImageSize = badgeLayout.isVerticalLayout ? '26mm' : '18mm';
    
    const nameSize = badgeLayout.isVerticalLayout ? 
      (visitorData.name.length > 20 ? '16px' : visitorData.name.length > 15 ? '18px' : '20px') :
      (visitorData.name.length > 20 ? '14px' : visitorData.name.length > 15 ? '16px' : '18px');
    
    const customContentSize = '15px';
    
    // Multiple QR sources with fallback (same as single event)
    const qrSources = [
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalQrData)}&format=png&ecc=M`,
      `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(finalQrData)}`,
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalQrData)}`
    ];
    
    let currentSourceIndex = 0;
    
    const tryNextQRSource = () => {
      if (currentSourceIndex >= qrSources.length) {
        console.error('❌ All QR sources failed, using text fallback');
        printWithTextQR();
        return;
      }
      
      const qrUrl = qrSources[currentSourceIndex];
      console.log(`🔄 Trying QR source ${currentSourceIndex + 1}/${qrSources.length} for multi-event`);
      
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      
      testImg.onload = () => {
        if (testImg.complete && testImg.naturalWidth > 0) {
          console.log(`✅ QR source ${currentSourceIndex + 1} loaded successfully for multi-event`);
          printWithQRImage(qrUrl);
        } else {
          console.log(`⚠️ QR source ${currentSourceIndex + 1} onload fired but not fully loaded, retrying...`);
          setTimeout(() => {
            if (testImg.complete && testImg.naturalWidth > 0) {
              console.log(`✅ QR source ${currentSourceIndex + 1} verified as loaded`);
              printWithQRImage(qrUrl);
            } else {
              console.log(`❌ QR source ${currentSourceIndex + 1} failed verification`);
              testImg.onerror = null;
              testImg.onload = null;
              currentSourceIndex++;
              tryNextQRSource();
            }
          }, 1000);
        }
      };
      
      testImg.onerror = () => {
        console.log(`❌ QR source ${currentSourceIndex + 1} failed, trying next...`);
        testImg.onerror = null;
        testImg.onload = null;
        currentSourceIndex++;
        setTimeout(tryNextQRSource, 500);
      };
      
      testImg.src = qrUrl;
      
      // Timeout with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      const timeoutDuration = 4000;
      
      const timeoutHandler = () => {
        if (!testImg.complete || testImg.naturalWidth === 0) {
          retryCount++;
          console.log(`⏰ QR source ${currentSourceIndex + 1} attempt ${retryCount}/${maxRetries} timeout`);
          
          if (retryCount >= maxRetries) {
            console.log(`❌ QR source ${currentSourceIndex + 1} failed after ${maxRetries} attempts`);
            testImg.onerror = null;
            testImg.onload = null;
            currentSourceIndex++;
            tryNextQRSource();
          } else {
            console.log(`🔄 Retrying QR source ${currentSourceIndex + 1}...`);
            testImg.src = qrUrl + '&t=' + Date.now() + '&retry=' + retryCount;
            setTimeout(timeoutHandler, timeoutDuration);
          }
        }
      };
      
      setTimeout(timeoutHandler, timeoutDuration);
    };
    
    const printWithQRImage = (qrUrl: string) => {
      try {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
          alert(i18n[currentLanguage]?.unable_to_print_automatically || 'Không thể in tự động. Vui lòng nhấn Ctrl+P để in thủ công.');
          return;
        }
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Badge - ${visitorData.name} - ${eventToPrint.name}</title>
            <style>
              @media print {
                @page { size: ${badgeLayout.width}mm ${contentHeight}mm; margin: 0; }
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; }
              .badge-content {
                width: ${badgeLayout.width}mm; height: ${contentHeight}mm; padding: 4mm;
                display: flex; 
                flex-direction: ${badgeLayout.isVerticalLayout ? 'column' : 'row'};
                align-items: center; 
                justify-content: ${badgeLayout.isVerticalLayout ? 'center' : 'flex-start'};
                gap: 4mm; box-sizing: border-box;
              }
              .qr-container { 
                width: ${printQrContainerSize}; height: ${printQrContainerSize}; display: flex; align-items: center; justify-content: center; 
                background: #fff; flex-shrink: 0; order: ${badgeLayout.isVerticalLayout ? '1' : '0'}; 
              }
              .qr-img { width: ${printQrImageSize}; height: ${printQrImageSize}; object-fit: contain; }
              .info { 
                flex: ${badgeLayout.isVerticalLayout ? '0' : '1'}; 
                display: flex; flex-direction: column; justify-content: center; 
                align-items: ${badgeLayout.isVerticalLayout ? 'center' : 'flex-start'};
                text-align: ${badgeLayout.isVerticalLayout ? 'center' : 'left'};
                min-width: 0;
                margin-top: ${badgeLayout.isVerticalLayout ? '4mm' : '0'};
                order: ${badgeLayout.isVerticalLayout ? '2' : '1'};
              }
              .name { font-size: 20px; font-weight: bold; margin-bottom: 2mm; color: #1F2937; word-wrap: break-word; line-height: 1.2; }
              .custom-content { font-size: ${customContentSize}; color: #000000; word-wrap: break-word; line-height: 1.1; margin-bottom: 1mm; }
            </style>
          </head>
          <body>
            <div class="badge-content">
              <div class="qr-container">
                <img src="${qrUrl}" alt="QR Code" class="qr-img" />
              </div>
              <div class="info">
                <div class="name">${visitorData.name}</div>
                ${customContent.map(content => `<div class="custom-content">${content}</div>`).join('')}
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
          console.log('🖨️ Multi-event badge print completed with QR for event:', eventToPrint.name);
        }, 1000);
      } catch (error) {
        console.error('❌ Multi-event print error:', error);
        alert(i18n[currentLanguage]?.unable_to_print_automatically || 'Không thể in tự động. Vui lòng nhấn Ctrl+P để in thủ công.');
      }
    };
    
    const printWithTextQR = () => {
      try {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
          alert(i18n[currentLanguage]?.unable_to_print_automatically || 'Không thể in tự động. Vui lòng nhấn Ctrl+P để in thủ công.');
          return;
        }
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Badge - ${visitorData.name} - ${eventToPrint.name}</title>
            <style>
              @media print {
                @page { size: ${badgeLayout.width}mm ${contentHeight}mm; margin: 0; }
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; }
              .badge-content {
                width: ${badgeLayout.width}mm; height: ${contentHeight}mm; padding: 4mm;
                display: flex; 
                flex-direction: ${badgeLayout.isVerticalLayout ? 'column' : 'row'};
                align-items: center; 
                justify-content: ${badgeLayout.isVerticalLayout ? 'center' : 'flex-start'};
                gap: 4mm; box-sizing: border-box;
              }
              .qr-fallback {
                width: ${printQrContainerSize}; height: ${printQrContainerSize}; border: 2px solid #000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-size: ${printQrImageSize === '26mm' ? '10px' : '8px'}; text-align: center; color: #000; background: #fff; font-weight: bold;
                flex-shrink: 0; order: ${badgeLayout.isVerticalLayout ? '1' : '0'};
              }
              .info { 
                flex: ${badgeLayout.isVerticalLayout ? '0' : '1'}; 
                display: flex; flex-direction: column; justify-content: center; 
                align-items: ${badgeLayout.isVerticalLayout ? 'center' : 'flex-start'};
                text-align: ${badgeLayout.isVerticalLayout ? 'center' : 'left'};
                min-width: 0;
                margin-top: ${badgeLayout.isVerticalLayout ? '4mm' : '0'};
                order: ${badgeLayout.isVerticalLayout ? '2' : '1'};
              }
              .name { font-size: ${nameSize}; font-weight: bold; margin-bottom: 2mm; color: #1F2937; word-wrap: break-word; line-height: 1.2; }
              .custom-content { font-size: ${customContentSize}; color: #000000; word-wrap: break-word; line-height: 1.1; margin-bottom: 1mm; }
            </style>
          </head>
          <body>
            <div class="badge-content">
              <div class="qr-fallback">
                <div>QR CODE</div>
                <div style="font-size: 6px; margin-top: 2px; word-break: break-all; line-height: 1.1;">
                  ${finalQrData.slice(-16)}
                </div>
              </div>
              <div class="info">
                <div class="name">${visitorData.name}</div>
                ${customContent.map(content => `<div class="custom-content">${content}</div>`).join('')}
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
          console.log('🖨️ Multi-event badge print completed with text QR fallback for event:', eventToPrint.name);
        }, 1000);
      } catch (error) {
        console.error('❌ Multi-event print error:', error);
        alert(i18n[currentLanguage]?.unable_to_print_automatically || 'Không thể in tự động. Vui lòng nhấn Ctrl+P để in thủ công.');
      }
    };
    
    // Start trying QR sources
    tryNextQRSource();
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
            text={i18n[currentLanguage]?.loading_event_information || "Đang tải danh sách sự kiện..."} 
          />
        </div>
      </div>
    );
  }

  if (availableEvents.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full mx-4 p-6 text-center shadow-xl rounded-3xl">
          <div className="text-orange-500 mb-4">
            <Icon name="ExclamationTriangleIcon" className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {i18n[currentLanguage]?.no_events_have_been_created_yet || 'Hiện tại chưa có sự kiện nào được tạo.'}
            </h2>
            <p className="text-sm text-gray-600">{error || 'Vui lòng liên hệ ban tổ chức để biết thêm chi tiết.'}</p>
          </div>
          <Button 
            onClick={() => router.push('/')}
            variant="primary"
            className="w-full min-h-[48px]"
          >
            {i18n[currentLanguage]?.back_to_home || 'Về trang chủ'}
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-xl sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white flex-shrink-0 shadow-sm p-2 flex items-center justify-center">
                  <Icon name="CollectionIcon" className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white leading-tight">
                    Multi-Event Check-in System
                  </h1>
                  <p className="text-xs text-white/80">
                    {selectedEvents.length > 0 
                      ? `${selectedEvents.length}/${availableEvents.length} sự kiện đã chọn`
                      : `${availableEvents.length} sự kiện có sẵn`
                    }
                  </p>
                  
                  {/* Badge Printing Status Summary */}
                  {selectedEvents.length > 0 && (
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <div className="flex items-center gap-1 text-green-300">
                        <Icon name="PrinterIcon" className="w-3 h-3" />
                        <span>{selectedEvents.filter(e => e.badge_printing).length} hỗ trợ in thẻ</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-300">
                        <Icon name="QrCodeIcon" className="w-3 h-3" />
                        <span>{selectedEvents.length} check-in</span>
                      </div>
                      {selectedEvents.some(e => e.badge_printing) && (
                        <div className="flex items-center gap-1 text-yellow-300">
                          <Icon name="ExclamationTriangleIcon" className="w-3 h-3" />
                          <span>{selectedEvents.filter(e => !e.badge_printing).length} không in thẻ</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Auto-Print Toggle - Only show when any selected event allows printing */}
                {selectedEvents.some(e => e.badge_printing) && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon name="PrinterIcon" className="w-4 h-4 text-white" />
                      <span className="text-xs text-white font-medium">Auto-print</span>
                    </div>
                    <button
                      onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        autoPrintEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          autoPrintEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
                
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Trang chủ
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">
          {/* Multi-Event Selection Dropdown */}
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} relative z-40`}>
            <Card className="p-4 border-purple-100 bg-gradient-to-r from-purple-50 to-white rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <Icon name="CollectionIcon" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Chọn Events Check-in
                    </h3>
                    <p className="text-xs text-gray-600">
                      {selectedEvents.length}/{availableEvents.length} đã chọn
                    </p>
                  </div>
                </div>
                
                {/* Multi-Select Dropdown */}
                <div className="flex-1 relative" ref={dropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                      onClick={() => setShowEventDropdown(!showEventDropdown)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {selectedEvents.length === 0 ? (
                          <span className="text-gray-500 text-sm">Chọn events để check-in...</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {selectedEvents.slice(0, 2).map((event) => (
                              <span 
                                key={event.id}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                  event.badge_printing 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {event.name.length > 15 ? `${event.name.substring(0, 15)}...` : event.name}
                                {event.badge_printing ? (
                                  <Icon name="PrinterIcon" className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Icon name="ExclamationTriangleIcon" className="w-3 h-3 text-orange-600" />
                                )}
                              </span>
                            ))}
                            {selectedEvents.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{selectedEvents.length - 2} khác
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Icon 
                        name={showEventDropdown ? "ChevronUpIcon" : "ChevronDownIcon"} 
                        className="w-4 h-4 text-gray-400" 
                      />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showEventDropdown && (
                      <>
                        {/* Invisible backdrop to close dropdown */}
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setShowEventDropdown(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto backdrop-blur-sm">
                        {/* Quick Actions */}
                        <div className="p-2 border-b border-gray-100">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedEvents(availableEvents);
                                console.log('🎯 Selected all events for multi-checkin');
                              }}
                              className="flex-1 px-3 py-1 text-xs text-purple-600 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                              disabled={selectedEvents.length === availableEvents.length}
                            >
                              Chọn tất cả
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEvents([]);
                                console.log('🎯 Cleared all events from multi-checkin');
                              }}
                              className="flex-1 px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                              disabled={selectedEvents.length === 0}
                            >
                              Bỏ chọn
                            </button>
                          </div>
                        </div>
                        
                        {/* Event Options */}
                        <div className="py-1">
                          {availableEvents.map((event) => {
                            const isSelected = selectedEvents.some(e => e.id === event.id);
                            return (
                              <button
                                key={event.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedEvents(selectedEvents.filter(e => e.id !== event.id));
                                    console.log('🎯 Removed event from multi-checkin:', event.name);
                                  } else {
                                    setSelectedEvents([...selectedEvents, event]);
                                    console.log('🎯 Added event to multi-checkin:', event.name);
                                  }
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                                  isSelected ? 'bg-purple-50' : ''
                                }`}
                              >
                                {/* Checkbox */}
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected 
                                    ? 'border-purple-500 bg-purple-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <Icon name="CheckIcon" className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                
                                {/* Event Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium text-sm truncate ${
                                      isSelected ? 'text-purple-700' : 'text-gray-900'
                                    }`}>
                                      {event.name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {event.badge_printing ? (
                                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                          <Icon name="PrinterIcon" className="w-3 h-3" />
                                          <span>In thẻ</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                          <Icon name="ExclamationTriangleIcon" className="w-3 h-3" />
                                          <span>Không in</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                        <Icon name="QrCodeIcon" className="w-3 h-3" />
                                        <span>Check-in</span>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">
                                    ID: {event.id}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Check-in Card (Only shown when events are selected) */}
          {selectedEvents.length > 0 && (
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} relative z-10`}>
              <Card className="p-4 rounded-2xl border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                    <Icon name="CheckCircleIcon" className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Multi-Event Check-in
                    </h3>
                    <p className="text-xs text-gray-600">
                      Scan QR hoặc nhập ID để check-in
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Quét cho</div>
                    <div className="font-semibold text-emerald-600 text-sm">
                      {selectedEvents.length} events
                    </div>
                    
                    {/* Auto-Print Status */}
                    {selectedEvents.some(e => e.badge_printing) && (
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          autoPrintEnabled 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          <Icon name="PrinterIcon" className="w-3 h-3" />
                          <span>
                            {autoPrintEnabled ? 'Auto-print: Bật' : 'Auto-print: Tắt'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Input Form */}
                <form onSubmit={handleManualSubmit} className="mb-4">
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
                    </div>
                    <Button
                      type="submit"
                      disabled={!manualInput.trim() || isProcessing || selectedEvents.length === 0}
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

                {/* Camera Scanner Section */}
                <div className="border-t border-gray-200 pt-3">
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
                        disabled={isProcessing || selectedEvents.length === 0}
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
                      
                      {/* Show badge printing status */}
                      {matchedEvent && (
                        <div className="mt-1 text-xs text-emerald-700">
                          {matchedEvent.badge_printing ? (
                            autoPrintEnabled ? (
                              <span>🖨️ Auto-print đã bật cho event "{matchedEvent.name}"</span>
                            ) : (
                              <span>ℹ️ Auto-print đã tắt cho event "{matchedEvent.name}"</span>
                            )
                          ) : (
                            <span>⚠️ Event "{matchedEvent.name}" không hỗ trợ in thẻ đeo</span>
                          )}
                        </div>
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
                      </div>
                    </div>
                  </div>
                )}

              </Card>
            </div>
          )}
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

        {/* Success Screen */}
        {showSuccessScreen && visitor && matchedEvent && (
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
                <p className="text-sm text-purple-600 font-medium">
                  Sự kiện: {matchedEvent.name}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                  <Icon name="CheckCircleIcon" className="w-4 h-4" />
                  <span>✓ Check-in thành công</span>
                </div>
                
                {matchedEvent?.badge_printing && autoPrintEnabled && (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                    <Icon name="PrinterIcon" className="w-4 h-4" />
                    <span>✓ Thẻ đeo đã được in tự động</span>
                  </div>
                )}
                
                {matchedEvent?.badge_printing && !autoPrintEnabled && (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                    <Icon name="PrinterIcon" className="w-4 h-4" />
                    <span>ℹ️ Auto-print đã tắt (chỉ check-in)</span>
                  </div>
                )}
                
                {!matchedEvent?.badge_printing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-orange-700">
                    <Icon name="ExclamationTriangleIcon" className="w-4 h-4" />
                    <span>ℹ️ Event này không hỗ trợ in thẻ đeo</span>
                  </div>
                )}
              </div>

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
                
                <Button
                  onClick={() => {
                    resetForNextCheckin();
                  }}
                  variant="outline"
                  className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Thay đổi events
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
