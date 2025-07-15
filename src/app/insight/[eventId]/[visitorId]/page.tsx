'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ZohoImage from '@/components/ui/ZohoImage';
import { useEventMetadata } from '@/hooks/useEventMetadata';
import { EventData, ExhibitorData, eventApi } from '@/lib/api/events';
import { VisitorData, visitorApi } from '@/lib/api/visitors';
import FileViewer from '@/components/features/FileViewer';
import ExhibitorDetailModal from '@/components/features/ExhibitorDetailModal';
import { renderHtmlContent } from '@/lib/utils/htmlUtils';

interface DashboardPageProps {
  params: Promise<{
    eventId: string;
    visitorId: string;
  }>;
}

// VisitorData interface is now imported from '@/lib/api/visitors'
// ExhibitorData interface is now imported from '@/lib/api/events'

export default function InsightDashboardPage({ params }: DashboardPageProps) {
  const { eventId, visitorId } = use(params);
  const router = useRouter();
  
  // State management
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [exhibitors, setExhibitors] = useState<ExhibitorData[]>([]);
  const [filteredExhibitors, setFilteredExhibitors] = useState<ExhibitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInvalidVisitorId, setIsInvalidVisitorId] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [favoriteExhibitors, setFavoriteExhibitors] = useState<string[]>([]);
  const [selectedExhibitor, setSelectedExhibitor] = useState<ExhibitorData | null>(null);
  const [fileViewer, setFileViewer] = useState<{
    isOpen: boolean;
    title: string;
    fileUrl?: string;
    fileType?: 'pdf' | 'image' | 'unknown';
  }>({
    isOpen: false,
    title: '',
    fileUrl: '',
    fileType: 'unknown'
  });
  const [qrCodeError, setQrCodeError] = useState(false);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDistance, setRefreshDistance] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });
  const [qrMode, setQrMode] = useState<'personal' | 'group' | 'badge' | 'redeem'>('personal');
  const contentRef = useRef<HTMLDivElement>(null);

  const { generateShareUrls } = useEventMetadata({ 
    event: eventData, 
    currentLanguage: 'vi' 
  });

  const tabs = [
    { id: 'overview', label: 'Check-in', icon: 'ChartBarIcon' },
    { id: 'exhibitors', label: 'Exhibitors', icon: 'BuildingOfficeIcon' },
    { id: 'favorites', label: 'Yêu thích', icon: 'HeartIcon', count: favoriteExhibitors.length },
    { id: 'more', label: 'Thêm', icon: 'Cog6ToothIcon' }
  ];

  // Favorite exhibitors localStorage key
  const getFavoriteStorageKey = () => `nexpo_favorites_${eventId}_${visitorId}`;

  // Load favorites from localStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storageKey = getFavoriteStorageKey();
        const savedFavorites = localStorage.getItem(storageKey);
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites);
          setFavoriteExhibitors(parsed);
          console.log('📥 Loaded favorites from localStorage:', parsed);
        }
      } catch (error) {
        console.error('❌ Error loading favorites from localStorage:', error);
      }
    };

    // Only load after we have eventId and visitorId
    if (eventId && visitorId) {
      loadFavorites();
    }
  }, [eventId, visitorId]);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    const saveFavorites = () => {
      try {
        const storageKey = getFavoriteStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(favoriteExhibitors));
        console.log('💾 Saved favorites to localStorage:', favoriteExhibitors);
      } catch (error) {
        console.error('❌ Error saving favorites to localStorage:', error);
      }
    };

    // Only save if we have eventId, visitorId, and favorites array is not empty or has been initialized
    if (eventId && visitorId && favoriteExhibitors !== undefined) {
      saveFavorites();
    }
  }, [favoriteExhibitors, eventId, visitorId]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const filtered = exhibitors.filter(exhibitor => 
        exhibitor.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exhibitor as any).booth_no?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExhibitors(filtered);
      setIsSearching(false);
    } else {
      setFilteredExhibitors(exhibitors);
    }
  }, [searchQuery, exhibitors]);

  // Entrance animations and scroll effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleVisibility = () => setIsVisible(true);
    
    window.addEventListener('scroll', handleScroll);
    // Trigger animations after data is loaded
    if (eventData && visitorData) {
      setTimeout(handleVisibility, 100);
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [eventData, visitorData]);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, [eventId, visitorId]);

  // Invalid visitor ID redirect countdown
  useEffect(() => {
    if (isInvalidVisitorId && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isInvalidVisitorId && redirectCountdown === 0) {
      // Use setTimeout to avoid render cycle issues
      setTimeout(() => {
        router.push(`/insight/${eventId}`);
      }, 0);
    }
  }, [isInvalidVisitorId, redirectCountdown, router, eventId]);

  const cancelRedirect = () => {
    setIsInvalidVisitorId(false);
    setRedirectCountdown(5);
  };

  const loadInitialData = async () => {
    // Prevent concurrent calls
    if (isLoadingData) {
      console.log('🚫 Already loading data, skipping...');
      return;
    }
    
    try {
      setIsLoadingData(true);
      setLoading(true);
      setError('');
      setIsInvalidVisitorId(false);

      // Load event data first
      console.log('🔄 Loading event data for ID:', eventId);
      const eventResponse = await eventApi.getEventInfo(eventId);
      console.log('📥 Event data loaded:', eventResponse.event);
      setEventData(eventResponse.event);

      // Load visitor data - critical validation step
      console.log('🔄 Loading visitor data for ID:', visitorId);
      try {
        const visitorResponse = await visitorApi.getVisitorInfo(visitorId);
        console.log('📥 Visitor data loaded:', visitorResponse.visitor);
        
        // Additional safety check in case API doesn't throw error but returns invalid data
        const visitor = visitorResponse.visitor;
        if (!visitor || !visitor.id || !visitor.name || !visitor.email) {
          console.log('🚫 Invalid visitor data received after API call:', visitor);
          // Use setTimeout to avoid state update during render
          setTimeout(() => {
            setIsInvalidVisitorId(true);
            setError('Mã truy cập không hợp lệ hoặc không tồn tại');
            setLoading(false);
            setIsLoadingData(false);
          }, 0);
          return;
        }
        
        // Check if visitor ID matches what we requested
        if (visitor.id !== visitorId) {
          console.log('🚫 Visitor ID mismatch after API call - requested:', visitorId, 'received:', visitor.id);
          // Use setTimeout to avoid state update during render
          setTimeout(() => {
            setIsInvalidVisitorId(true);
            setError('Mã truy cập không hợp lệ hoặc không tồn tại');
            setLoading(false);
            setIsLoadingData(false);
          }, 0);
          return;
        }
        
        setVisitorData(visitor);
      } catch (visitorError: any) {
        console.error('❌ Visitor data loading failed:', visitorError);
        
        // Check if this is specifically a visitor not found error
        if (visitorError.message?.includes('Visitor not found') || 
            visitorError.message?.includes('not found') ||
            visitorError.message?.includes('Visitor ID is required') ||
            visitorError.response?.status === 404 ||
            visitorError.response?.status === 400) {
          console.log('🚫 Invalid visitor ID detected:', visitorError.message);
          // Use setTimeout to avoid state update during render
          setTimeout(() => {
            setIsInvalidVisitorId(true);
            setError('Mã truy cập không hợp lệ hoặc không tồn tại');
            setLoading(false);
            setIsLoadingData(false);
          }, 0);
          return; // Stop loading other data
        } else {
          // Other errors (network, server, etc.)
          console.log('🚫 Other error type:', visitorError);
          throw visitorError;
        }
      }

      // Load exhibitors from event data (only if visitor is valid)
      console.log('🔄 Loading exhibitors data from event');
      if (eventResponse.event.exhibitors) {
        console.log('📥 Exhibitors data loaded:', eventResponse.event.exhibitors.length, 'exhibitors');
        setExhibitors(eventResponse.event.exhibitors);
        setFilteredExhibitors(eventResponse.event.exhibitors);
      } else {
        console.log('⚠️ No exhibitors data found in event');
        setExhibitors([]);
        setFilteredExhibitors([]);
      }

    } catch (err: any) {
      console.error('💥 Error loading data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setIsLoadingData(false);
      setIsRefreshing(false);
    }
  };

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshDistance(0);
    await loadInitialData();
  };

  // Touch handlers for swipe navigation and pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Pull to refresh (only at top of page)
    if (window.scrollY === 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, 80);
      setRefreshDistance(distance);
      
      if (distance > 60 && !isRefreshing) {
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
    
    // Horizontal swipe for tab navigation
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      setIsSwipeInProgress(true);
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
  };

  const handleTouchEnd = () => {
    // Handle pull to refresh
    if (refreshDistance > 60 && !isRefreshing) {
      handleRefresh();
    } else {
      setRefreshDistance(0);
    }
    
    // Handle swipe navigation
    if (isSwipeInProgress && swipeDirection) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (swipeDirection === 'left' && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id);
      } else if (swipeDirection === 'right' && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1].id);
      }
    }
    
    setIsSwipeInProgress(false);
    setSwipeDirection(null);
  };

  const toggleFavorite = (exhibitorName: string) => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    setFavoriteExhibitors(prev => {
      const isCurrentlyFavorite = prev.includes(exhibitorName);
      const newFavorites = isCurrentlyFavorite
        ? prev.filter(name => name !== exhibitorName)
        : [...prev, exhibitorName];
      
      // Show toast notification
      const action = isCurrentlyFavorite ? 'đã xóa khỏi' : 'đã thêm vào';
      showToast(`${exhibitorName} ${action} danh sách yêu thích`, 'success');
      
      return newFavorites;
    });
  };

  const clearAllFavorites = () => {
    if (favoriteExhibitors.length === 0) return;
    
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tất cả ${favoriteExhibitors.length} exhibitors yêu thích?`
    );
    
    if (confirmed) {
      const count = favoriteExhibitors.length;
      setFavoriteExhibitors([]);
      showToast(`Đã xóa ${count} exhibitors khỏi danh sách yêu thích`, 'info');
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const isFavorite = (exhibitorName: string) => {
    return favoriteExhibitors.includes(exhibitorName);
  };

  const generateQRCode = () => {
    if (!visitorData) return '';
    
    let qrData = '';
    
    if (hasCheckedIn) {
      // User has checked in - show badge QR or redeem QR
      if (qrMode === 'badge') {
        // Use badge QR from backend if available
        if (visitorData.badge_qr) {
          qrData = visitorData.badge_qr;
        } else {
          // Fallback to visitor ID if no badge_qr
          qrData = visitorId;
        }
      } else if (qrMode === 'redeem') {
        // Show redeem QR for re-printing card
        qrData = visitorData.group_id || visitorId;
      }
    } else {
      // User hasn't checked in - show personal or group QR for check-in
      if (qrMode === 'personal') {
        qrData = visitorId;
      } else if (qrMode === 'group') {
        qrData = visitorData.group_id || visitorId;
      }
    }
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  const openFileViewer = (title: string, fileUrl?: string, fileType?: 'pdf' | 'image' | 'unknown') => {
    setFileViewer({
      isOpen: true,
      title,
      fileUrl,
      fileType
    });
  };

  const closeFileViewer = () => {
    setFileViewer({
      isOpen: false,
      title: '',
      fileUrl: '',
      fileType: 'unknown'
    });
  };

  const openFacebookEvent = () => {
    const facebookUrl = (eventData as any)?.facebook_url;
    if (facebookUrl) {
      window.open(facebookUrl, '_blank');
    } else {
      // If no specific Facebook URL, search for event on Facebook
      const searchQuery = encodeURIComponent(eventData?.name || '');
      window.open(`https://www.facebook.com/search/events/?q=${searchQuery}`, '_blank');
    }
  };

  // Modern Icon Component
  const Icon = ({ name, className = "w-5 h-5", fill = "none", ...props }: { name: string; className?: string; fill?: string }) => {
    const icons = {
      ChartBarIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      BuildingOfficeIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      Cog6ToothIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      MapIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      BookOpenIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      ShareIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      InformationCircleIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      Bars3Icon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      MagnifyingGlassIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
        </svg>
      ),
      XMarkIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      HeartIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    };
    
    return icons[name as keyof typeof icons] || icons.InformationCircleIcon;
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => {
      setToastMessage({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  // Check if user has checked in
  const hasCheckedIn = visitorData && visitorData.check_in_history && visitorData.check_in_history.length > 0;

  // Set initial QR mode based on check-in status
  useEffect(() => {
    if (visitorData) {
      if (hasCheckedIn) {
        setQrMode('badge'); // Default to badge QR for checked-in users
      } else {
        setQrMode('personal'); // Default to personal QR for non-checked-in users
      }
    }
  }, [visitorData, hasCheckedIn]);

  // Auto-switch to personal mode if no group_id and currently in group mode
  useEffect(() => {
    if (visitorData && !hasCheckedIn && qrMode === 'group' && !visitorData.group_id) {
      setQrMode('personal');
      showToast('Đã chuyển về QR cá nhân vì bạn chưa có nhóm', 'info');
    }
  }, [visitorData, hasCheckedIn, qrMode]);

  // Handle QR mode change with haptic feedback
  const handleQrModeChange = (newMode: 'personal' | 'group' | 'badge' | 'redeem') => {
    setQrMode(newMode);
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    // Show toast notification
    const modeNames = {
      personal: 'QR Check-in Cá nhân',
      group: 'QR Check-in Nhóm',
      badge: 'Badge QR',
      redeem: 'Redeem QR'
    };
    
    showToast(`Đã chuyển sang ${modeNames[newMode]}`, 'info');
  };

  // Copy QR data to clipboard
  const copyQrDataToClipboard = async () => {
    if (!visitorData) return;
    
    try {
      // Get the actual QR data, not the URL
      let qrData = '';
      
      if (hasCheckedIn) {
        if (qrMode === 'badge') {
          if (visitorData.badge_qr) {
            qrData = visitorData.badge_qr;
          } else {
            qrData = visitorId;
          }
        } else if (qrMode === 'redeem') {
          qrData = visitorData.group_id || visitorId;
        }
      } else {
        if (qrMode === 'personal') {
          qrData = visitorId;
        } else if (qrMode === 'group') {
          qrData = visitorData.group_id || visitorId;
        }
      }
      
      await navigator.clipboard.writeText(qrData);
      showToast('Đã copy QR data vào clipboard', 'success');
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToast('Không thể copy QR data', 'error');
    }
  };

  // Generate QR code with loading state
  const generateQRCodeWithLoading = () => {
    setQrCodeLoading(true);
    setQrCodeError(false);
    
    const qrUrl = generateQRCode();
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setQrCodeLoading(false);
    }, 300);
    
    return qrUrl;
  };

  // Trigger QR code regeneration when mode changes
  useEffect(() => {
    if (visitorData && qrMode) {
      setQrCodeLoading(true);
      setQrCodeError(false);
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        setQrCodeLoading(false);
      }, 300);
    }
  }, [qrMode, visitorData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner 
            size="lg" 
            showLogo={true} 
            text="Đang tải thông tin..."
          />
          <div className="mt-4 text-gray-600">
            <p className="text-sm">Vui lòng chờ trong giây lát...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !eventData || !visitorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full mx-4 p-6 text-center shadow-xl">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isInvalidVisitorId ? (
              <>
                <h2 className="insight-h1 mb-2">Mã truy cập không hợp lệ</h2>
                <p className="insight-text-secondary mb-4">
                  Visitor ID "<span className="insight-monospace text-red-600">{visitorId}</span>" không tồn tại hoặc không hợp lệ.
                </p>
                <p className="insight-text-muted mb-4">
                  Vui lòng kiểm tra lại mã truy cập từ ban tổ chức.
                </p>
              </>
            ) : (
              <>
                <h2 className="insight-h1 mb-2">Có lỗi xảy ra</h2>
                <p className="insight-text-secondary">{error || 'Không thể tải thông tin'}</p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => {
                // Use setTimeout to avoid render cycle issues
                setTimeout(() => {
                  router.push(`/insight/${eventId}`);
                }, 0);
              }}
              variant="primary"
              className="w-full min-h-[48px] text-base"
            >
              {isInvalidVisitorId ? 'Nhập lại mã truy cập' : 'Thử lại'}
            </Button>
            {isInvalidVisitorId && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="insight-text-secondary text-blue-700 font-medium">
                  🔄 Tự động chuyển về trang nhập mã truy cập sau {redirectCountdown} giây
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(redirectCountdown / 5) * 100}%` }}
                  ></div>
                </div>
                <button
                  onClick={cancelRedirect}
                  className="mt-2 insight-text-muted text-blue-600 hover:text-blue-800 underline min-h-[44px]"
                >
                  Hủy tự động chuyển
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden smooth-scroll">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * -0.1}px)`, animationDelay: '1s' }}
        ></div>
      </div>

      {/* Pull to refresh indicator */}
      {refreshDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 bg-white/80 backdrop-blur-sm"
          style={{ 
            height: refreshDistance,
            transform: `translateY(-${60 - refreshDistance}px)`
          }}
        >
          <div className="flex items-center space-x-2 text-gray-600">
            {isRefreshing ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="text-sm">Đang tải lại...</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 animate-spin">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="text-sm">
                  {refreshDistance > 60 ? 'Thả để tải lại' : 'Kéo xuống để tải lại'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl sticky top-0 z-10 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-start space-x-3">
            {eventData.logo && (
              <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 shadow-sm mt-1 p-1">
                <img 
                  src={eventData.logo} 
                  alt={eventData.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white leading-tight break-words">
                {eventData.name || 'Event Dashboard'}
              </h1>
              <p className="text-sm text-white/80 font-medium mt-1">
                {new Date(eventData.start_date).toLocaleDateString('vi-VN')} - {new Date(eventData.end_date).toLocaleDateString('vi-VN')}
              </p>
              {visitorData.registration_date && (
                <p className="text-xs text-white/70 mt-1">
                  Đăng ký: {new Date(visitorData.registration_date).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Content */}
      <div 
        ref={contentRef}
        className="max-w-md mx-auto px-4 py-4 mobile-content-spacing space-y-4 relative smooth-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >



        {/* Search Bar - Only show in exhibitors tab */}
        {activeTab === 'exhibitors' && (
          <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <Icon name="MagnifyingGlassIcon" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm exhibitor hoặc booth..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <Icon name="XMarkIcon" className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {isSearching ? 'Đang tìm kiếm...' : `Tìm thấy ${filteredExhibitors.length} kết quả`}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab Content */}
        <div className="relative">
          {/* Swipe transition overlay */}
          {isSwipeInProgress && (
            <div className="absolute inset-0 bg-gray-100/50 z-10 rounded-lg" />
          )}
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Visitor Info Card */}
              <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
                  <div className="insight-card-header">
                    <h3 className="insight-h3 font-bold text-gray-900">Thông tin của bạn</h3>
                    <div className={`insight-badge ${
                      hasCheckedIn
                        ? 'insight-status-success'
                        : visitorData.status?.toLowerCase() === 'confirmed' 
                          ? 'insight-status-success' 
                          : 'insight-status-info'
                    }`}>
                      {hasCheckedIn ? 'Đã check-in' : (visitorData.status || 'Đã đăng ký')}
                    </div>
                  </div>
                  
                  <div className="insight-info-grid">
                    <div className="insight-info-row">
                      <span className="insight-label">Tên:</span>
                      <span className="insight-value">{visitorData.name}</span>
                    </div>
                    <div className="insight-info-row">
                      <span className="insight-label">Email:</span>
                      <span className="insight-value-sm">{visitorData.email}</span>
                    </div>
                    <div className="insight-info-row">
                      <span className="insight-label">SĐT:</span>
                      <span className="insight-value">{visitorData.phone || 'Không có'}</span>
                    </div>
                    {visitorData.company && (
                      <div className="insight-info-row">
                        <span className="insight-label">Công ty:</span>
                        <span className="insight-value-sm">{visitorData.company}</span>
                      </div>
                    )}
                    {visitorData.job_title && (
                      <div className="insight-info-row">
                        <span className="insight-label">Chức vụ:</span>
                        <span className="insight-value-sm">{visitorData.job_title}</span>
                      </div>
                    )}
                    {visitorData.group_id && (
                      <div className="insight-info-row">
                        <span className="insight-label">Group ID:</span>
                        <span className="insight-value-sm">{visitorData.group_id}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="insight-section-divider">
                    <div className="text-center">
                      {/* QR Mode Selection */}
                      <div className="mb-4">
                        {hasCheckedIn ? (
                          // User has checked in - show badge/redeem tabs
                          <div className="flex bg-gray-100 rounded-lg p-1 max-w-xs mx-auto">
                            <button
                              onClick={() => handleQrModeChange('badge')}
                              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                                qrMode === 'badge'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              Badge QR
                            </button>
                            <button
                              onClick={() => handleQrModeChange('redeem')}
                              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                                qrMode === 'redeem'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              Redeem QR
                            </button>
                          </div>
                        ) : (
                          // User hasn't checked in - show personal/group switch
                          <div className="flex bg-gray-100 rounded-lg p-1 max-w-xs mx-auto">
                            <button
                              onClick={() => handleQrModeChange('personal')}
                              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                                qrMode === 'personal'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              Cá nhân
                            </button>
                            <button
                              onClick={() => handleQrModeChange('group')}
                              disabled={!visitorData.group_id}
                              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                                qrMode === 'group'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : !visitorData.group_id
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              Nhóm {!visitorData.group_id && '(N/A)'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* QR Code Display */}
                      <div className="mb-4">
                        <p className="insight-text-secondary mb-2">
                          {hasCheckedIn ? (
                            qrMode === 'badge' ? 'Badge QR Code' : 'Redeem QR Code (để in lại thẻ)'
                          ) : (
                            qrMode === 'personal' ? 'QR Check-in (Cá nhân)' : 'QR Check-in (Nhóm)'
                          )}
                        </p>
                        <div className="inline-block p-2 bg-white rounded-lg shadow-sm relative">
                          {qrCodeLoading ? (
                            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded animate-pulse">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                          ) : qrCodeError ? (
                            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded">
                              <span className="insight-text-muted">QR Error</span>
                            </div>
                          ) : (
                            <img 
                              src={generateQRCode()}
                              alt="QR Code"
                              className="w-24 h-24 mx-auto"
                              onError={(e) => {
                                console.error('QR Code failed to load');
                                setQrCodeError(true);
                                setQrCodeLoading(false);
                              }}
                              onLoad={() => {
                                setQrCodeLoading(false);
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Copy Button */}
                        <div className="mt-2">
                          <button
                            onClick={copyQrDataToClipboard}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full"
                          >
                            📋 Copy QR Data
                          </button>
                        </div>
                      </div>

                      {/* Additional Info for Group Mode */}
                      {!hasCheckedIn && qrMode === 'group' && visitorData.group_id && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="insight-text-caption text-blue-700">
                            <strong>Group ID:</strong> {visitorData.group_id}
                          </p>
                          <p className="insight-text-caption text-blue-600 mt-1">
                            QR này sẽ check-in toàn bộ nhóm cùng lúc
                          </p>
                        </div>
                      )}

                      {/* Warning for missing Group ID */}
                      {!hasCheckedIn && qrMode === 'group' && !visitorData.group_id && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <p className="insight-text-caption text-yellow-700">
                            ⚠️ Bạn chưa được phân vào nhóm nào
                          </p>
                          <p className="insight-text-caption text-yellow-600 mt-1">
                            Vui lòng liên hệ ban tổ chức để được hỗ trợ
                          </p>
                        </div>
                      )}

                      {/* QR Code Description */}
                      <div className="text-center">
                        <p className="insight-text-caption text-gray-500">
                          {hasCheckedIn ? (
                            qrMode === 'badge' 
                              ? 'Sử dụng QR này để truy cập các dịch vụ tại sự kiện'
                              : 'Scan QR này để in lại thẻ đeo nếu bạn làm mất thẻ'
                          ) : (
                            qrMode === 'personal'
                              ? 'Scan QR này để check-in cá nhân và nhận thẻ đeo'
                              : 'Scan QR này để check-in theo nhóm và nhận thẻ đeo'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Check-in History */}
              {visitorData.check_in_history && visitorData.check_in_history.length > 0 && (
                <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="insight-h3 font-bold text-gray-900 mb-3">Lịch sử check-in</h3>
                    <div className="insight-content-spacing-sm">
                      {visitorData.check_in_history.map((checkin, index) => (
                        <div key={index} className="insight-info-row p-2 bg-gray-50 rounded">
                          <span className="insight-label">Check-in {index + 1}:</span>
                          <span className="insight-value-sm">{String(checkin)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* App Guide */}
              <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <h3 className="insight-h3 font-bold text-blue-900 mb-3 flex items-center">
                    <Icon name="InformationCircleIcon" className="w-5 h-5 mr-2 text-blue-600" />
                    Hướng dẫn sử dụng
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Icon name="BuildingOfficeIcon" className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">Exhibitors</h4>
                        <p className="text-xs text-blue-700">Khám phá danh sách nhà triển lãm, tìm kiếm theo tên hoặc số booth</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <Icon name="HeartIcon" className="w-4 h-4 text-white" fill="currentColor" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">Yêu thích</h4>
                        <p className="text-xs text-blue-700">Lưu các exhibitors quan tâm để dễ dàng quay lại xem sau</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Icon name="Cog6ToothIcon" className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">Thêm</h4>
                        <p className="text-xs text-blue-700">Truy cập Floor Plan, Directory và các liên kết hữu ích khác</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'exhibitors' && (
            <div className="space-y-4">
              {filteredExhibitors.length === 0 ? (
                <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                  <Card className="p-6 text-center">
                    <div className="text-gray-400 mb-4">
                      <Icon name="BuildingOfficeIcon" className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-gray-600">
                      {searchQuery ? 'Không tìm thấy exhibitor phù hợp' : 'Chưa có thông tin exhibitors'}
                    </p>
                  </Card>
                </div>
              ) : (
                <>
                  {/* All Exhibitors */}
                  <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                    <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
                      <h3 className="insight-h3 font-bold text-gray-900 mb-3">
                        {searchQuery ? `Kết quả tìm kiếm (${filteredExhibitors.length})` : `Exhibitors (${filteredExhibitors.length})`}
                      </h3>
                      <div className="space-y-2">
                        {filteredExhibitors.map((exhibitor, index) => (
                          <div 
                            key={`${exhibitor.display_name}-${index}`} 
                            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer touch-manipulation transform hover:scale-[1.02] active:scale-[0.98] min-h-[68px]"
                            onClick={() => setSelectedExhibitor(exhibitor)}
                            style={{ transitionDelay: `${index * 50}ms` }}
                          >
                            {/* Logo */}
                            <div className="flex-shrink-0 w-12 h-12 mr-3">
                              <ZohoImage
                                src={exhibitor.company_logo}
                                alt={`${exhibitor.display_name} logo`}
                                className="w-12 h-12 border border-gray-200 rounded-lg"
                                fallbackText={exhibitor.display_name.charAt(0)}
                                sizes="48px"
                              />
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="insight-h4 font-semibold text-gray-900 truncate">
                                    {exhibitor.display_name}
                                  </h4>
                                  <div className="flex items-center flex-wrap gap-1 mt-1">
                                    {(exhibitor as any).booth_no && (
                                      <span className="insight-text-muted text-white bg-blue-500 px-2 py-0.5 rounded-full text-xs font-medium">
                                        Booth {(exhibitor as any).booth_no}
                                      </span>
                                    )}
                                    <span className="insight-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                                      {exhibitor.country}
                                    </span>
                                    {(exhibitor.vie_display_products || exhibitor.eng_display_products) && (
                                      <span className="insight-text-muted text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                        {exhibitor.vie_display_products || exhibitor.eng_display_products}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Favorite button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(exhibitor.display_name);
                                  }}
                                  className={`p-3 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                    isFavorite(exhibitor.display_name)
                                      ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                  }`}
                                >
                                  <Icon name="HeartIcon" className="w-5 h-5" fill={isFavorite(exhibitor.display_name) ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex-shrink-0 ml-1">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>


                </>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {favoriteExhibitors.length === 0 ? (
                <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                  <Card className="p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <Icon name="HeartIcon" className="w-20 h-20 mx-auto" />
                    </div>
                    <h3 className="insight-h3 font-bold text-gray-900 mb-2">
                      Chưa có exhibitors yêu thích
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Thả tim các exhibitors bạn quan tâm để lưu vào danh sách yêu thích
                    </p>
                    <Button
                      onClick={() => setActiveTab('exhibitors')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      Khám phá Exhibitors
                    </Button>
                  </Card>
                </div>
              ) : (
                <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="insight-h3 font-bold text-gray-900 flex items-center">
                        <Icon name="HeartIcon" className="w-5 h-5 text-red-500 mr-2" fill="currentColor" />
                        Exhibitors yêu thích ({favoriteExhibitors.length})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setActiveTab('exhibitors')}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-blue-50"
                        >
                          Thêm exhibitors
                        </button>
                        <button
                          onClick={clearAllFavorites}
                          className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-red-50"
                          title="Xóa tất cả favorites"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {exhibitors
                        .filter(ex => isFavorite(ex.display_name))
                        .map((exhibitor, index) => (
                          <div 
                            key={`fav-${exhibitor.display_name}-${index}`} 
                            className="flex items-center p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg hover:from-red-100 hover:to-pink-100 transition-all duration-200 cursor-pointer touch-manipulation transform hover:scale-[1.02] active:scale-[0.98] min-h-[72px]"
                            onClick={() => setSelectedExhibitor(exhibitor)}
                            style={{ transitionDelay: `${index * 100}ms` }}
                          >
                            {/* Logo */}
                            <div className="flex-shrink-0 w-12 h-12 mr-4">
                              <ZohoImage
                                src={exhibitor.company_logo}
                                alt={`${exhibitor.display_name} logo`}
                                className="w-12 h-12 border-2 border-red-200 rounded-lg shadow-sm"
                                fallbackText={exhibitor.display_name.charAt(0)}
                                fallbackClassName="w-12 h-12 bg-gradient-to-br from-red-200 to-pink-200 rounded-lg flex items-center justify-center text-red-700 font-bold shadow-sm"
                                sizes="48px"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0 pr-3">
                              <h4 className="insight-h4 font-bold text-gray-900 truncate mb-1">
                                {exhibitor.display_name}
                              </h4>
                              <div className="flex items-center flex-wrap gap-2 mb-1">
                                {(exhibitor as any).booth_no && (
                                  <span className="text-xs font-semibold text-white bg-red-500 px-2 py-1 rounded-full">
                                    Booth {(exhibitor as any).booth_no}
                                  </span>
                                )}
                                <span className="text-xs text-gray-600 bg-red-100 px-2 py-1 rounded-full">
                                  {exhibitor.country}
                                </span>
                              </div>
                              {(exhibitor.vie_display_products || exhibitor.eng_display_products) && (
                                <p className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full inline-block max-w-[200px] truncate">
                                  {exhibitor.vie_display_products || exhibitor.eng_display_products}
                                </p>
                              )}
                            </div>
                            
                            {/* Favorite button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(exhibitor.display_name);
                              }}
                              className="flex-shrink-0 p-3 rounded-full bg-red-100 hover:bg-red-200 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <Icon name="HeartIcon" className="w-5 h-5 text-red-500" fill="currentColor" />
                            </button>
                            
                            {/* Arrow */}
                            <div className="flex-shrink-0 ml-2">
                              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === 'more' && (
            <div className="space-y-4">
              {/* Social & External Links */}
              <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="insight-h3 font-bold text-gray-900 mb-3">Liên kết ngoài</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[52px]"
                      onClick={openFacebookEvent}
                    >
                      <div className="flex items-center">
                        <Icon name="ShareIcon" className="w-5 h-5 mr-3 text-blue-600" />
                        <span className="font-medium">Facebook Event</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[52px]"
                      onClick={() => openFileViewer('Floor Plan', (eventData as any)?.floor_plan_url, 'pdf')}
                    >
                      <div className="flex items-center">
                        <Icon name="MapIcon" className="w-5 h-5 mr-3 text-emerald-600" />
                        <span className="font-medium">Floor Plan</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[52px]"
                      onClick={() => openFileViewer('Directory', (eventData as any)?.directory_url, 'pdf')}
                    >
                      <div className="flex items-center">
                        <Icon name="BookOpenIcon" className="w-5 h-5 mr-3 text-purple-600" />
                        <span className="font-medium">Directory</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Settings */}
              <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="insight-h3 font-bold text-gray-900 mb-3">Cài đặt</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[52px]"
                    >
                      <div className="flex items-center">
                        <Icon name="ShareIcon" className="w-5 h-5 mr-3 text-blue-600" />
                        <span className="font-medium">Chia sẻ QR Code</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[52px]"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 17h5l-5 5v-5z" />
                        </svg>
                        <span className="font-medium">Thông báo</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[52px]"
                    >
                      <div className="flex items-center">
                        <Icon name="InformationCircleIcon" className="w-5 h-5 mr-3 text-emerald-600" />
                        <span className="font-medium">Liên hệ hỗ trợ</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Viewer Modal */}
      {fileViewer.isOpen && (
        <FileViewer
          title={fileViewer.title}
          fileUrl={fileViewer.fileUrl}
          fileType={fileViewer.fileType}
          onClose={closeFileViewer}
        />
      )}

      {/* Exhibitor Detail Modal */}
      {selectedExhibitor && (
        <ExhibitorDetailModal
          exhibitor={selectedExhibitor}
          onClose={() => setSelectedExhibitor(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage.show && (
        <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
          toastMessage.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`flex items-center p-4 max-w-sm bg-white rounded-lg shadow-lg border-l-4 ${
            toastMessage.type === 'success' ? 'border-green-500' : 
            toastMessage.type === 'error' ? 'border-red-500' : 'border-blue-500'
          }`}>
            <div className="flex-shrink-0">
              {toastMessage.type === 'success' && (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toastMessage.type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toastMessage.type === 'info' && (
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                toastMessage.type === 'success' ? 'text-green-800' : 
                toastMessage.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {toastMessage.message}
              </p>
            </div>
            <button
              onClick={() => setToastMessage({ show: false, message: '', type: 'info' })}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Native App Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 bottom-nav-shadow z-50">
        {/* Swipe indicator */}
        {isSwipeInProgress && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-200 overflow-hidden">
            <div 
              className={`h-full bg-blue-500 transition-transform duration-200 ${
                swipeDirection === 'left' ? 'translate-x-2' : '-translate-x-2'
              }`}
              style={{ width: '25%' }}
            />
          </div>
        )}
        
        <div className="max-w-md mx-auto px-4 pt-2 pb-safe">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Add haptic feedback
                  if ('vibrate' in navigator) {
                    navigator.vibrate(30);
                  }
                }}
                className={`flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-300 transform active:scale-95 min-h-[60px] relative touch-manipulation ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <Icon 
                    name={tab.icon} 
                    className={`w-6 h-6 mb-1 transition-all duration-300 ${
                      activeTab === tab.id ? 'scale-110' : ''
                    }`} 
                    fill={tab.icon === 'HeartIcon' ? 'currentColor' : 'none'} 
                  />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === tab.id ? 'font-semibold' : ''
                }`}>
                  {tab.label}
                </span>
                
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 