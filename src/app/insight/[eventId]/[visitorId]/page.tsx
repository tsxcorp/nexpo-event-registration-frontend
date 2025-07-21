'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
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
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });
  const [qrMode, setQrMode] = useState<'personal' | 'group' | 'badge' | 'redeem'>('personal');
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Matching state
  const [isMatchingFormOpen, setIsMatchingFormOpen] = useState(false);
  const [selectedMatchingExhibitor, setSelectedMatchingExhibitor] = useState<ExhibitorData | null>(null);
  const [matchingSearchQuery, setMatchingSearchQuery] = useState('');
  const [matchingFormData, setMatchingFormData] = useState({
    exhibitor: null as ExhibitorData | null,
    date: '',
    time: '',
    message: ''
  });

  const { generateShareUrls } = useEventMetadata({ 
    event: eventData, 
    currentLanguage: 'vi' 
  });

  const tabs = [
    { id: 'overview', label: 'Check-in', icon: 'ChartBarIcon' },
    { id: 'exhibitors', label: 'Exhibitors', icon: 'BuildingOfficeIcon' },
    { id: 'favorites', label: 'Yêu thích', icon: 'HeartIcon', count: favoriteExhibitors.length },
    { id: 'matching', label: 'Matching', icon: 'UserGroupIcon' },
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
        console.log('🔍 Loading favorites from localStorage:', { storageKey, savedFavorites });
        
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites);
          
          // Remove duplicates and ensure array is clean
          const cleanedFavorites = Array.isArray(parsed) 
            ? Array.from(new Set(parsed.filter(item => typeof item === 'string' && item.trim().length > 0)))
            : [];
          
          console.log('📥 Cleaned favorites loaded:', {
            original: parsed,
            cleaned: cleanedFavorites,
            duplicatesRemoved: parsed.length - cleanedFavorites.length
          });
          
          setFavoriteExhibitors(cleanedFavorites);
        } else {
          console.log('📥 No saved favorites found, starting with empty array');
          setFavoriteExhibitors([]);
        }
      } catch (error) {
        console.error('❌ Error loading favorites from localStorage:', error);
        setFavoriteExhibitors([]);
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

  // Get unique categories from exhibitors
  const getUniqueCategories = () => {
    const categories: string[] = exhibitors
      .map(ex => {
        const cat = (ex as any).category;
        // Handle both string and array categories
        if (Array.isArray(cat) && cat.length > 0) {
          return typeof cat[0] === 'string' ? cat[0].trim() : '';
        }
        if (typeof cat === 'string') {
          return cat.trim();
        }
        return '';
      })
      .filter(cat => cat.length > 0);
    const uniqueCategories = Array.from(new Set(categories)).sort();
    return uniqueCategories;
  };

  // Advanced search functionality
  useEffect(() => {
    let filtered = exhibitors;

    // Filter by category first
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exhibitor => {
        const category = (exhibitor as any).category;
        
        // Extract string from category (handle both string and array)
        let categoryString: string = '';
        if (Array.isArray(category) && category.length > 0) {
          categoryString = typeof category[0] === 'string' ? category[0].trim() : '';
        } else if (typeof category === 'string') {
          categoryString = category.trim();
        }
        
        return categoryString && categoryString === selectedCategory;
      });
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      setIsSearching(true);
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exhibitor => {
        const exhibitorAny = exhibitor as any;
        const safeStringSearch = (value: any) => 
          value && typeof value === 'string' && value.toLowerCase().includes(query);
        
        return (
          // Company name
          safeStringSearch(exhibitor.display_name) ||
          // Booth number
          safeStringSearch(exhibitorAny.booth_no) ||
          // Category
          safeStringSearch(exhibitorAny.category) ||
          // Product services (Vietnamese)
          safeStringSearch(exhibitor.vie_display_products) ||
          // Product services (English)
          safeStringSearch(exhibitor.eng_display_products) ||
          // Country
          safeStringSearch(exhibitor.country) ||
          // Company profile
          safeStringSearch(exhibitorAny.vie_company_profile) ||
          safeStringSearch(exhibitorAny.eng_company_profile)
        );
      });
      setIsSearching(false);
    }

    setFilteredExhibitors(filtered);
  }, [searchQuery, selectedCategory, exhibitors]);

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
        const exhibitorNames = eventResponse.event.exhibitors.map(ex => ex.display_name);
        console.log('📥 Exhibitors data loaded:', {
          count: eventResponse.event.exhibitors.length,
          names: exhibitorNames
        });
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

  // Generate unique identifier for exhibitor (for favorites)
  const getExhibitorId = (exhibitor: ExhibitorData) => {
    const exhibitorAny = exhibitor as any;
    // Use display_name if available, otherwise fallback to booth_no, otherwise use a combination
    const name = exhibitor.display_name?.trim();
    const booth = exhibitorAny.booth_no?.trim();
    
    if (name && name.length > 0) {
      return name;
    } else if (booth && booth.length > 0) {
      return `Booth_${booth}`;
    } else {
      // Last resort: use country + random identifier
      return `${exhibitor.country || 'Unknown'}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  // Get exhibitor profile ID for backend matching API
  const getExhibitorProfileId = (exhibitor: ExhibitorData) => {
    const exhibitorAny = exhibitor as any;
    return exhibitorAny.id || 
           exhibitorAny.profile_id || 
           exhibitorAny.exhibitor_id || 
           exhibitorAny.exhibitor_profile_id ||
           exhibitor.display_name; // Fallback to display name
  };

  // Get display name for UI (with fallback)
  const getExhibitorDisplayName = (exhibitor: ExhibitorData) => {
    const exhibitorAny = exhibitor as any;
    const name = exhibitor.display_name?.trim();
    const booth = exhibitorAny.booth_no?.trim();
    
    if (name && name.length > 0) {
      return name;
    } else if (booth && booth.length > 0) {
      return `Booth ${booth}`;
    } else {
      return `${exhibitor.country || 'Unknown Company'}`;
    }
  };

  const toggleFavorite = (exhibitorId: string, displayName: string) => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    setFavoriteExhibitors(prev => {
      const isCurrentlyFavorite = prev.includes(exhibitorId);
      const newFavorites = isCurrentlyFavorite
        ? prev.filter(id => id !== exhibitorId)
        : [...prev, exhibitorId];
      
      // Debug logging
      console.log('🔍 Toggle Favorite Debug:', {
        exhibitorId,
        displayName,
        isCurrentlyFavorite,
        previousFavorites: prev,
        newFavorites,
        newFavoritesLength: newFavorites.length
      });
      
      // Show toast notification
      const action = isCurrentlyFavorite ? 'đã xóa khỏi' : 'đã thêm vào';
      showToast(`${displayName} ${action} danh sách yêu thích`, 'success');
      
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

  const isFavorite = (exhibitor: ExhibitorData) => {
    const exhibitorId = getExhibitorId(exhibitor);
    const result = favoriteExhibitors.includes(exhibitorId);
    return result;
  };

  // Get favorite exhibitors data with debug logging
  const getFavoriteExhibitorsData = () => {
    const favoriteData = exhibitors.filter(ex => isFavorite(ex));
    
    console.log('🔍 Favorites Debug:', {
      favoriteExhibitorsArray: favoriteExhibitors,
      favoriteExhibitorsLength: favoriteExhibitors.length,
      totalExhibitors: exhibitors.length,
      favoriteDataFound: favoriteData.length,
      favoriteDataItems: favoriteData.map(ex => ({
        id: getExhibitorId(ex),
        name: getExhibitorDisplayName(ex)
      }))
    });
    
    return favoriteData;
  };

  // Generate QR Code with Nexpo favicon in center
  const generateQRCodeWithLogo = async (data: string, size: number = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Import QRCode library dynamically for client-side only
        import('qrcode').then(QRCode => {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Canvas context not available');
            return;
          }

          canvas.width = size;
          canvas.height = size;

                     // Generate QR code with higher error correction to allow logo overlay
           QRCode.toCanvas(canvas, data, {
             width: size,
             margin: 1,
             color: {
               dark: '#000000',
               light: '#ffffff'
             },
             errorCorrectionLevel: 'H' // High error correction for logo overlay
          }, (error: Error | null | undefined) => {
            if (error) {
              console.error('QR generation error:', error);
              reject(error);
              return;
            }

                         // Load and draw Nexpo favicon
             const logo = new Image();
             logo.crossOrigin = 'anonymous';
             logo.onload = () => {
               try {
                 // Calculate favicon size (about 25% of QR code size for better visibility)
                 const logoSize = Math.floor(size * 0.25);
                 const logoX = (size - logoSize) / 2;
                 const logoY = (size - logoSize) / 2;

                 // Create a white background with shadow effect
                 const bgRadius = logoSize / 2 + 8;
                 
                 // Draw shadow
                 ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                 ctx.shadowBlur = 4;
                 ctx.shadowOffsetX = 2;
                 ctx.shadowOffsetY = 2;
                 
                 // White background circle
                 ctx.fillStyle = '#ffffff';
                 ctx.beginPath();
                 ctx.arc(size / 2, size / 2, bgRadius, 0, 2 * Math.PI);
                 ctx.fill();

                 // Reset shadow
                 ctx.shadowColor = 'transparent';
                 ctx.shadowBlur = 0;
                 ctx.shadowOffsetX = 0;
                 ctx.shadowOffsetY = 0;

                 // Add gradient border around logo background
                 const gradient = ctx.createRadialGradient(size / 2, size / 2, bgRadius - 3, size / 2, size / 2, bgRadius);
                 gradient.addColorStop(0, '#3b82f6');
                 gradient.addColorStop(1, '#1d4ed8');
                 ctx.strokeStyle = gradient;
                 ctx.lineWidth = 2;
                 ctx.stroke();

                 // Draw the logo with rounded corners effect
                 ctx.save();
                 ctx.beginPath();
                 ctx.arc(size / 2, size / 2, logoSize / 2 - 2, 0, 2 * Math.PI);
                 ctx.clip();
                 ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
                 ctx.restore();

                 // Add subtle inner glow
                 ctx.save();
                 ctx.globalCompositeOperation = 'multiply';
                 ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
                 ctx.beginPath();
                 ctx.arc(size / 2, size / 2, bgRadius - 1, 0, 2 * Math.PI);
                 ctx.fill();
                 ctx.restore();

                 // Convert canvas to data URL
                 const dataURL = canvas.toDataURL('image/png');
                 resolve(dataURL);
               } catch (err) {
                 console.error('Logo drawing error:', err);
                 reject(err);
               }
             };

            logo.onerror = (err) => {
              console.error('Logo load error:', err);
              // Fallback: return QR code without logo
              resolve(canvas.toDataURL('image/png'));
            };

                         // Set logo source - use favicon for center logo
             logo.src = '/nexpo-favicon.ico';
          });
        }).catch(err => {
          console.error('QRCode import error:', err);
          reject(err);
        });
      } catch (error) {
        console.error('QR generation setup error:', error);
        reject(error);
      }
    });
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
    
    // Return data for async QR generation with logo
    return qrData;
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
      UserGroupIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      ChevronRightIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ),
      MapPinIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      TagIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      CubeIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      AdjustmentsHorizontalIcon: (
        <svg className={className} fill={fill} stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
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

  // Export favorites to PDF
  const exportFavoritesToPDF = async () => {
    if (favoriteExhibitors.length === 0 || !eventData || !visitorData) return;
    
    try {
      showToast('Đang tạo PDF cẩm nang...', 'info');
      
      // Get favorite exhibitor data
      const favoriteExhibitorData = getFavoriteExhibitorsData();
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #3B82F6, #8B5CF6);
              color: white;
              border-radius: 10px;
            }
            .event-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .event-date { 
              font-size: 16px; 
              opacity: 0.9; 
            }
            .visitor-info {
              background: #F3F4F6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid #3B82F6;
            }
            .exhibitor-card {
              background: white;
              border: 1px solid #E5E7EB;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              page-break-inside: avoid;
            }
            .exhibitor-header {
              display: flex;
              align-items: flex-start;
              margin-bottom: 15px;
              gap: 15px;
            }
            .exhibitor-logo {
              width: 60px;
              height: 60px;
              border-radius: 8px;
              background: white;
              border: 2px solid #E5E7EB;
              padding: 4px;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              object-fit: contain;
            }
            .exhibitor-logo img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .exhibitor-logo-placeholder {
              width: 60px;
              height: 60px;
              border-radius: 8px;
              background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
              border: 2px solid #D1D5DB;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 18px;
              color: #6B7280;
              flex-shrink: 0;
            }
            .exhibitor-info {
              flex: 1;
              min-width: 0;
            }
            .exhibitor-name {
              font-size: 20px;
              font-weight: bold;
              color: #1F2937;
              margin-bottom: 8px;
              border-bottom: 2px solid #EF4444;
              padding-bottom: 5px;
            }
            .booth-number {
              background: #3B82F6;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              display: inline-block;
              margin-bottom: 10px;
            }
            .country {
              background: #F3F4F6;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              display: inline-block;
              margin-left: 10px;
              margin-bottom: 10px;
            }
            .products {
              background: #FEF3C7;
              padding: 10px;
              border-radius: 6px;
              margin: 10px 0;
              border-left: 3px solid #F59E0B;
            }
            .contact-info {
              background: #ECFDF5;
              padding: 10px;
              border-radius: 6px;
              margin: 10px 0;
              border-left: 3px solid #10B981;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding: 15px;
              background: #F9FAFB;
              border-radius: 8px;
              font-size: 12px;
              color: #6B7280;
            }
            .page-break { page-break-before: always; }
            .info-row { margin: 5px 0; }
            .label { font-weight: 600; color: #374151; }
            .value { color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="event-title">${eventData.name}</div>
            <div class="event-date">${new Date(eventData.start_date).toLocaleDateString('vi-VN')} - ${new Date(eventData.end_date).toLocaleDateString('vi-VN')}</div>
          </div>
          
          <div class="visitor-info">
            <h3 style="margin: 0 0 10px 0; color: #1F2937;">📋 Thông tin khách tham quan</h3>
            <div class="info-row"><span class="label">Tên:</span> <span class="value">${visitorData.name}</span></div>
            <div class="info-row"><span class="label">Email:</span> <span class="value">${visitorData.email}</span></div>
            ${visitorData.company ? `<div class="info-row"><span class="label">Công ty:</span> <span class="value">${visitorData.company}</span></div>` : ''}
            <div class="info-row"><span class="label">Ngày tạo:</span> <span class="value">${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</span></div>
          </div>

          <h2 style="color: #1F2937; border-bottom: 2px solid #EF4444; padding-bottom: 10px; margin-bottom: 20px;">
            ❤️ Cẩm nang Exhibitors yêu thích (${favoriteExhibitorData.length} nhà triển lãm)
          </h2>
          
          ${favoriteExhibitorData.map((exhibitor, index) => {
            const exhibitorAny = exhibitor as any;
            return `
            <div class="exhibitor-card">
              <div class="exhibitor-header">
                ${exhibitor.company_logo ? `
                  <div class="exhibitor-logo">
                    <img src="${exhibitor.company_logo}" alt="${exhibitor.display_name} logo" onerror="this.parentElement.outerHTML='<div class=&quot;exhibitor-logo-placeholder&quot;>${exhibitor.display_name.charAt(0)}</div>'">
                  </div>
                ` : `
                  <div class="exhibitor-logo-placeholder">
                    ${exhibitor.display_name.charAt(0)}
                  </div>
                `}
                <div class="exhibitor-info">
                  <div class="exhibitor-name">${exhibitor.display_name}</div>
                  <div style="margin-bottom: 10px;">
                    ${exhibitorAny.booth_no ? `<span class="booth-number">Booth ${exhibitorAny.booth_no}</span>` : ''}
                    <span class="country">${exhibitor.country}</span>
                    ${exhibitorAny.category ? `<span style="background: #F3E8FF; color: #7C3AED; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-left: 10px; font-weight: 600;">${Array.isArray(exhibitorAny.category) && exhibitorAny.category.length > 0 ? exhibitorAny.category[0] : exhibitorAny.category}</span>` : ''}
                  </div>
                </div>
              </div>

              ${exhibitor.vie_display_products || exhibitor.eng_display_products ? `
                <div class="products">
                  <strong>🎯 Sản phẩm/Dịch vụ:</strong><br>
                  ${exhibitor.vie_display_products || exhibitor.eng_display_products}
                </div>
              ` : ''}

              ${exhibitorAny.contact_person || exhibitorAny.email || exhibitorAny.phone || exhibitorAny.website ? `
                <div class="contact-info">
                  <strong>📞 Thông tin liên hệ:</strong><br>
                  ${exhibitorAny.contact_person ? `<div class="info-row">Người liên hệ: ${exhibitorAny.contact_person}</div>` : ''}
                  ${exhibitorAny.email ? `<div class="info-row">Email: ${exhibitorAny.email}</div>` : ''}
                  ${exhibitorAny.phone ? `<div class="info-row">Điện thoại: ${exhibitorAny.phone}</div>` : ''}
                  ${exhibitorAny.website ? `<div class="info-row">Website: ${exhibitorAny.website}</div>` : ''}
                </div>
              ` : ''}

              ${exhibitorAny.vie_company_profile ? `
                <div style="margin-top: 10px;">
                  <strong>🏢 Giới thiệu công ty:</strong><br>
                  <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-top: 5px; font-size: 14px;">
                    ${exhibitorAny.vie_company_profile.substring(0, 300)}${exhibitorAny.vie_company_profile.length > 300 ? '...' : ''}
                  </div>
                </div>
              ` : ''}
              
              <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
                <strong>📝 Ghi chú:</strong> ________________________________<br><br>
                <strong>⭐ Đánh giá:</strong> ☐ Rất quan tâm &nbsp;&nbsp; ☐ Quan tâm &nbsp;&nbsp; ☐ Có thể hợp tác
              </div>
            </div>
            ${index < favoriteExhibitorData.length - 1 ? '<div style="margin: 20px 0;"></div>' : ''}
          `;
          }).join('')}
          
          <div class="footer">
            <p><strong>📱 Ứng dụng Visitor Dashboard</strong></p>
            <p>Cẩm nang này được tạo tự động từ danh sách exhibitors yêu thích của bạn</p>
            <p>Chúc bạn có một chuyến tham quan triển lãm thành công! 🎉</p>
          </div>
        </body>
        </html>
      `;

      // Create a temporary element to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Use html2pdf if available, otherwise create simple download
      if (typeof window !== 'undefined' && (window as any).html2pdf) {
        const opt = {
          margin: 0.5,
          filename: `${eventData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Favorites_${new Date().getTime()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        await (window as any).html2pdf().set(opt).from(tempDiv).save();
      } else {
        // Fallback: create a new window with the content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          newWindow.print();
        }
      }

      // Clean up
      document.body.removeChild(tempDiv);
      
      showToast('✅ PDF cẩm nang với logo exhibitors đã được tạo thành công!', 'success');
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
    } catch (error) {
      console.error('Error creating PDF:', error);
      showToast('❌ Có lỗi khi tạo PDF. Vui lòng thử lại.', 'error');
    }
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

  // Generate available dates from event
  const getEventDates = () => {
    if (!eventData) return [];
    
    const startDate = new Date(eventData.start_date);
    const endDate = new Date(eventData.end_date);
    const dates = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Open matching form
  const openMatchingForm = (exhibitor?: ExhibitorData) => {
    setMatchingFormData({
      exhibitor: exhibitor || null,
      date: '',
      time: '',
      message: ''
    });
    setIsMatchingFormOpen(true);
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // Close matching form
  const closeMatchingForm = () => {
    setIsMatchingFormOpen(false);
    setMatchingFormData({
      exhibitor: null,
      date: '',
      time: '',
      message: ''
    });
    setMatchingSearchQuery('');
  };

  // Submit matching request
  const submitMatchingRequest = async () => {
    if (!eventData || !visitorData || !matchingFormData.exhibitor) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    if (!matchingFormData.date || !matchingFormData.time) {
      showToast('Vui lòng chọn ngày và giờ', 'error');
      return;
    }

    try {
      const exhibitorProfileId = getExhibitorProfileId(matchingFormData.exhibitor);

      const matchingData = {
        event_id: eventId,
        registration_id: visitorId,
        exhibitor_company: exhibitorProfileId,
        date: matchingFormData.date,
        time: matchingFormData.time,
        message: matchingFormData.message || 'Looking forward to the meeting.'
      };

      const { matchingApi } = await import('@/lib/api/matching');
      
      // Validate locally first
      const validation = matchingApi.validateLocally(matchingData);
      if (!validation.isValid) {
        showToast(`Validation Error: ${validation.errors.join(', ')}`, 'error');
        return;
      }
      
      // Submit to backend
      const response = await matchingApi.submitRequest(matchingData);
      
      showToast(`✅ ${response.message}`, 'success');
      closeMatchingForm();
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Có lỗi khi gửi yêu cầu matching';
      showToast(errorMessage, 'error');
    }
  };

  // Filter exhibitors for matching search
  const getFilteredMatchingExhibitors = () => {
    if (!matchingSearchQuery.trim()) return exhibitors;
    
    const query = matchingSearchQuery.toLowerCase();
    return exhibitors.filter(exhibitor => {
      const exhibitorAny = exhibitor as any;
      const safeStringSearch = (value: any) => 
        value && typeof value === 'string' && value.toLowerCase().includes(query);
      
      return (
        safeStringSearch(exhibitor.display_name) ||
        safeStringSearch(exhibitorAny.booth_no) ||
        safeStringSearch(exhibitorAny.category) ||
        safeStringSearch(exhibitor.country)
      );
    });
  };





  // Generate QR code with loading state and logo
  const generateQRCodeWithLoading = useCallback(async () => {
    setQrCodeLoading(true);
    setQrCodeError(false);
    setQrCodeImage('');
    
    try {
      const qrData = generateQRCode();
      if (qrData) {
        const qrImageUrl = await generateQRCodeWithLogo(qrData, 320);
        setQrCodeImage(qrImageUrl);
      }
    } catch (error) {
      console.error('Error generating QR code with logo:', error);
      setQrCodeError(true);
      // Fallback to simple QR code without logo
      const qrData = generateQRCode();
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrData)}`;
      setQrCodeImage(fallbackUrl);
    } finally {
      setQrCodeLoading(false);
    }
  }, [visitorData, qrMode, hasCheckedIn, visitorId]);

  // Trigger QR code regeneration when mode changes
  useEffect(() => {
    if (visitorData && qrMode) {
      generateQRCodeWithLoading();
    }
  }, [qrMode, visitorData, generateQRCodeWithLoading]);

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
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 relative overflow-hidden smooth-scroll">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-500/3 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gray-500/3 rounded-full blur-3xl animate-pulse"
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

      {/* Header - Soft Gradient */}
      <div className={`bg-gradient-to-r from-slate-600 to-slate-700 shadow-xl sticky top-0 z-10 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-md mx-auto px-4 py-3.5">
          <div className="flex items-start space-x-3">
            {eventData.logo && (
              <div className="w-10 h-10 rounded-xl bg-white flex-shrink-0 shadow-sm mt-0.5 p-1">
                <img 
                  src={eventData.logo} 
                  alt={eventData.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-white leading-tight break-words">
                {eventData.name || 'Event Dashboard'}
              </h1>
              <p className="text-xs text-white/80 font-medium mt-1">
                {new Date(eventData.start_date).toLocaleDateString('vi-VN')} - {new Date(eventData.end_date).toLocaleDateString('vi-VN')}
              </p>
              {visitorData.registration_date && (
                <p className="text-xs text-white/70 mt-0.5">
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



        {/* Modern Search & Filter Bar */}
        {activeTab === 'exhibitors' && (
          <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            {/* Search Input - Soft Style */}
            <div className="relative mb-6 px-1">
              <div className="relative bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden">
                <Icon name="MagnifyingGlassIcon" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exhibitors, booth, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-0 border-0 bg-transparent placeholder-gray-400 text-gray-700"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Icon name="XMarkIcon" className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Soft Category Filter Pills */}
            {getUniqueCategories().length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 px-1 mb-3">
                  <Icon name="AdjustmentsHorizontalIcon" className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Categories</span>
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedCategory === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>All</span>
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      selectedCategory === 'all' ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {exhibitors.length}
                    </span>
                  </button>
                  {getUniqueCategories().map((category) => {
                    const count = exhibitors.filter(ex => {
                      const cat = (ex as any).category;
                      let categoryString = '';
                      if (Array.isArray(cat) && cat.length > 0) {
                        categoryString = typeof cat[0] === 'string' ? cat[0].trim() : '';
                      } else if (typeof cat === 'string') {
                        categoryString = cat.trim();
                      }
                      return categoryString === category;
                    }).length;
                    
                    // Truncate long category names
                    const displayName = category.length > 20 ? category.substring(0, 20) + '...' : category;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 max-w-[180px] ${
                          selectedCategory === category
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
                        }`}
                        title={category}
                      >
                        <span className="truncate">{displayName}</span>
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs flex-shrink-0 ${
                          selectedCategory === category ? 'bg-white/20' : 'bg-white'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Results Info - Clean */}
            {(searchQuery || selectedCategory !== 'all') && (
              <div className="flex items-center justify-between px-1 mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSearching ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <p className="text-xs text-gray-500 font-medium">
                    {isSearching ? 'Searching...' : `${filteredExhibitors.length} results`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(searchQuery || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Icon name="XMarkIcon" className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content */}
        <div className="relative">
          {/* Swipe transition overlay */}
          {isSwipeInProgress && (
            <div className="absolute inset-0 bg-gray-100/50 z-10 rounded-lg" />
          )}
          
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Visitor Info Card */}
              <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
                  <div className="insight-card-header">
                    <h3 className="insight-h3">Thông tin của bạn</h3>
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
                      <div className="mb-2">
                        <p className="insight-text-secondary mb-1">
                          {hasCheckedIn ? (
                            qrMode === 'badge' ? 'Badge QR Code' : 'Redeem QR Code (để in lại thẻ)'
                          ) : (
                            qrMode === 'personal' ? 'QR Check-in (Cá nhân)' : 'QR Check-in (Nhóm)'
                          )}
                        </p>
                        <div className="inline-block p-1.5 bg-white rounded-2xl shadow-sm relative">
                          {qrCodeLoading ? (
                            <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 relative overflow-hidden">
                              {/* Animated background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-indigo-100/50 to-blue-100/50 animate-pulse"></div>
                              {/* Spinning logo indicator */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
                                <div className="text-[10px] text-blue-600 font-semibold mt-2 animate-pulse">Generating</div>
                              </div>
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shimmer"></div>
                            </div>
                          ) : qrCodeError ? (
                            <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 relative">
                              <div className="text-center relative z-10">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                                  <span className="text-red-500 text-lg">⚠️</span>
                                </div>
                                <div className="text-[10px] text-red-600 font-semibold">Error</div>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-r from-red-100/30 to-orange-100/30 rounded-xl"></div>
                            </div>
                          ) : qrCodeImage ? (
                            <div className="relative group">
                              <img 
                                src={qrCodeImage}
                                alt="QR Code with Nexpo Favicon"
                                className="w-32 h-32 mx-auto rounded-xl shadow-lg border-2 border-gradient-to-r from-blue-100 to-indigo-100 group-hover:shadow-xl transition-all duration-300"
                                onError={(e) => {
                                  console.error('QR Code failed to load');
                                  setQrCodeError(true);
                                }}
                              />
                              {/* Nexpo Full Logo Badge */}
                              <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <div className="w-7 h-7 relative">
                                  <div className="absolute inset-0 bg-white rounded-full"></div>
                                  <div className="absolute inset-0.5 bg-white rounded-full flex items-center justify-center overflow-hidden">
                                    <img 
                                      src="/nexpo-logo.png" 
                                      alt="Nexpo"
                                      className="w-full h-full object-contain p-0.5"
                                      onError={(e) => {
                                        // Fallback to text if logo fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = '<span class="text-blue-600 text-[6px] font-extrabold">N</span>';
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Premium glow effect */}
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                          ) : (
                            <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200 relative">
                              <div className="text-center relative z-10">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                                  <span className="text-gray-400 text-lg">📱</span>
                                </div>
                                <div className="text-[10px] text-gray-500 font-semibold">No QR</div>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-100/30 to-slate-100/30 rounded-xl"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Copy Button */}
                        <div className="mt-1">
                          <button
                            onClick={copyQrDataToClipboard}
                            className="text-xs text-slate-600 hover:text-slate-800 transition-colors duration-200 bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-full"
                          >
                            📋 Copy QR Data
                          </button>
                        </div>
                      </div>

                      {/* Additional Info for Group Mode */}
                      {!hasCheckedIn && qrMode === 'group' && visitorData.group_id && (
                        <div className="mb-2 p-2 bg-blue-50 rounded-lg">
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
                        <div className="mb-2 p-2 bg-yellow-50 rounded-lg">
                          <p className="insight-text-caption text-yellow-700">
                            ⚠️ Bạn chưa được phân vào nhóm nào
                          </p>
                          <p className="insight-text-caption text-yellow-600 mt-1">
                            Vui lòng liên hệ ban tổ chức để được hỗ trợ
                          </p>
                        </div>
                      )}

                      {/* QR Code Description */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-blue-700 font-semibold text-xs uppercase tracking-wider">
                            {hasCheckedIn ? 'Active Badge' : 'Check-in Ready'}
                          </span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          {hasCheckedIn ? (
                            qrMode === 'badge' 
                              ? '✨ Sử dụng QR này để truy cập các dịch vụ tại sự kiện'
                              : '🎫 Scan QR này để in lại thẻ đeo nếu bạn làm mất thẻ'
                          ) : (
                            qrMode === 'personal'
                              ? '👤 Scan QR này để check-in cá nhân và nhận thẻ đeo'
                              : '👥 Scan QR này để check-in theo nhóm và nhận thẻ đeo'
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
                  <Card className="p-4 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
                    <h3 className="insight-h3 mb-3">Lịch sử check-in</h3>
                    <div className="insight-content-spacing-sm">
                      {visitorData.check_in_history.map((checkin, index) => (
                        <div key={index} className="insight-info-row p-2 bg-gray-50 rounded-xl">
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
                <Card className="p-4 hover:shadow-md transition-shadow duration-300 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-3xl">
                  <h3 className="insight-h3 text-slate-800 mb-3 flex items-center">
                    <Icon name="InformationCircleIcon" className="w-4 h-4 mr-2 text-slate-600" />
                    Hướng dẫn sử dụng
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-slate-500 rounded-full flex items-center justify-center">
                        <Icon name="BuildingOfficeIcon" className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">Exhibitors</h4>
                        <p className="text-xs text-slate-600">Khám phá danh sách nhà triển lãm, tìm kiếm theo tên hoặc số booth</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center">
                        <Icon name="HeartIcon" className="w-3.5 h-3.5 text-white" fill="currentColor" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">Yêu thích</h4>
                        <p className="text-xs text-slate-600">Lưu các exhibitors quan tâm để dễ dàng quay lại xem sau</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Icon name="Cog6ToothIcon" className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">Thêm</h4>
                        <p className="text-xs text-slate-600">Truy cập Floor Plan, Directory và các liên kết hữu ích khác</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'exhibitors' && (
            <div className="space-y-3">
              {filteredExhibitors.length === 0 ? (
                <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                  <Card className="p-6 text-center rounded-3xl border-gray-100">
                    <div className="text-gray-300 mb-4">
                      <Icon name="BuildingOfficeIcon" className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="insight-text-base">
                      {searchQuery ? 'Không tìm thấy exhibitor phù hợp' : 'Chưa có thông tin exhibitors'}
                    </p>
                  </Card>
                </div>
              ) : (
                <>
                  {/* All Exhibitors */}
                  <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
                      <h3 className="insight-h3 mb-3">
                        {searchQuery ? `Kết quả tìm kiếm (${filteredExhibitors.length})` : `Exhibitors (${filteredExhibitors.length})`}
                      </h3>
                      <div className="space-y-4">
                        {filteredExhibitors.map((exhibitor, index) => (
                          <div
                            key={`${exhibitor.display_name}-${index}`}
                            onClick={() => setSelectedExhibitor(exhibitor)}
                            className="group bg-white rounded-3xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-gray-100 hover:border-gray-200 overflow-hidden"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Logo Section - Clean Rectangle */}
                              <div className="flex-shrink-0">
                                <div className="w-20 h-16 rounded-2xl bg-gray-50 border border-gray-100 group-hover:border-gray-200 transition-all duration-300 overflow-hidden">
                                  <ZohoImage
                                    src={exhibitor.company_logo}
                                    alt={`${getExhibitorDisplayName(exhibitor)} logo`}
                                    className="w-full h-full object-contain p-2"
                                    fallbackClassName="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg font-medium text-gray-500"
                                    fallbackText={getExhibitorDisplayName(exhibitor).charAt(0)}
                                    sizes="80px"
                                  />
                                </div>
                              </div>
                              
                              {/* Content Area */}
                              <div className="flex-1 min-w-0">
                                {/* Company Name (max 2 lines) */}
                                <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1.5 line-clamp-2 group-hover:text-gray-900 transition-colors duration-300">
                                  {getExhibitorDisplayName(exhibitor)}
                                </h3>
                                
                                {/* Booth Number */}
                                {(exhibitor as any).booth_no && (
                                  <div className="mb-1.5">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                      <Icon name="MapPinIcon" className="w-2.5 h-2.5" />
                                      Booth {(exhibitor as any).booth_no}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Category */}
                                {(exhibitor as any).category && (
                                  <div className="mb-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const category = (exhibitor as any).category;
                                        let categoryString = '';
                                        if (Array.isArray(category) && category.length > 0) {
                                          categoryString = typeof category[0] === 'string' ? category[0].trim() : '';
                                        } else if (typeof category === 'string') {
                                          categoryString = category.trim();
                                        }
                                        setSelectedCategory(categoryString);
                                        showToast('Filtered by: ' + categoryString, 'info');
                                      }}
                                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full transition-colors duration-200 max-w-full"
                                    >
                                      <Icon name="TagIcon" className="w-2.5 h-2.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {(() => {
                                          const cat = (exhibitor as any).category;
                                          if (Array.isArray(cat) && cat.length > 0) {
                                            const categoryStr = typeof cat[0] === 'string' ? cat[0] : cat[0];
                                            return categoryStr.length > 30 ? categoryStr.substring(0, 30) + '...' : categoryStr;
                                          }
                                          return cat.length > 30 ? cat.substring(0, 30) + '...' : cat;
                                        })()}
                                      </span>
                                    </button>
                                  </div>
                                )}
                                
                                {/* Products/Services */}
                                {(exhibitor.vie_display_products || exhibitor.eng_display_products) && (
                                  <div className="mb-1">
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full max-w-full">
                                      <Icon name="CubeIcon" className="w-2.5 h-2.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {(() => {
                                          const products = exhibitor.vie_display_products || exhibitor.eng_display_products;
                                          return products.length > 35 ? products.substring(0, 35) + '...' : products;
                                        })()}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right Side Actions */}
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                {/* Favorite Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(getExhibitorId(exhibitor), getExhibitorDisplayName(exhibitor));
                                  }}
                                  className={`p-1.5 rounded-full transition-all duration-200 ${
                                    isFavorite(exhibitor)
                                      ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                                      : 'text-gray-300 hover:text-rose-400 hover:bg-rose-50'
                                  }`}
                                >
                                  <Icon name="HeartIcon" className="w-3.5 h-3.5" fill={isFavorite(exhibitor) ? 'currentColor' : 'none'} />
                                </button>
                                
                                {/* Action Arrow */}
                                <div className="p-1.5 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-all duration-300">
                                  <Icon name="ChevronRightIcon" className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" />
                                </div>
                              </div>
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
            <div className="space-y-3">
              {favoriteExhibitors.length === 0 ? (
                <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                  <Card className="p-6 text-center rounded-3xl border-gray-100">
                    <div className="text-gray-300 mb-4">
                      <Icon name="HeartIcon" className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="insight-h3 mb-2">
                      Chưa có exhibitors yêu thích
                    </h3>
                    <p className="insight-text-base mb-4">
                      Thả tim các exhibitors bạn quan tâm để lưu vào danh sách yêu thích
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-amber-800 font-medium">💡 Mẹo hay:</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Sử dụng search để tìm theo tên, booth, category, sản phẩm/dịch vụ. Sau khi thêm exhibitors yêu thích, bạn có thể xuất PDF cẩm nang với logo để mang theo khi tham quan!
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setActiveTab('exhibitors')}
                      className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded-2xl transition-colors duration-200"
                    >
                      Khám phá Exhibitors
                    </Button>
                  </Card>
                </div>
              ) : (
                <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="insight-h3 flex items-center">
                        <Icon name="HeartIcon" className="w-4 h-4 text-rose-500 mr-2" fill="currentColor" />
                        Exhibitors yêu thích ({favoriteExhibitors.length})
                      </h3>
                      <div className="flex items-center space-x-2">
                        {favoriteExhibitors.length > 0 && (
                          <button
                            onClick={exportFavoritesToPDF}
                            className="text-sm text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 px-3 py-2 rounded-lg flex items-center space-x-1"
                            title="Xuất PDF cẩm nang exhibitors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Xuất PDF</span>
                          </button>
                        )}
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
                        <button
                          onClick={() => {
                            const storageKey = getFavoriteStorageKey();
                            localStorage.removeItem(storageKey);
                            setFavoriteExhibitors([]);
                            showToast('🔧 Đã xóa localStorage và reset favorites', 'info');
                            console.log('🔧 Debug: Cleared localStorage key:', storageKey);
                          }}
                          className="text-sm text-orange-500 hover:text-orange-700 transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-orange-50"
                          title="Debug: Clear localStorage"
                        >
                          🔧 Debug
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {getFavoriteExhibitorsData()
                        .map((exhibitor, index) => (
                          <div
                            key={`fav-${exhibitor.display_name}-${index}`}
                            onClick={() => setSelectedExhibitor(exhibitor)}
                            className="group bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 rounded-3xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-rose-200 hover:border-rose-300 overflow-hidden"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Logo Section - Clean Rectangle with Favorite Indicator */}
                              <div className="flex-shrink-0 relative">
                                <div className="w-20 h-16 rounded-2xl bg-rose-50 border border-rose-200 group-hover:border-rose-300 transition-all duration-300 overflow-hidden">
                                  <ZohoImage
                                    src={exhibitor.company_logo}
                                    alt={`${getExhibitorDisplayName(exhibitor)} logo`}
                                    className="w-full h-full object-contain p-2"
                                    fallbackClassName="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-lg font-medium text-rose-600"
                                    fallbackText={getExhibitorDisplayName(exhibitor).charAt(0)}
                                    sizes="80px"
                                  />
                                </div>
                                {/* Favorite Heart Badge */}
                                <div className="absolute -bottom-0.5 -left-0.5 bg-rose-500 text-white p-1 rounded-full shadow-sm">
                                  <Icon name="HeartIcon" className="w-2.5 h-2.5" fill="currentColor" />
                                </div>
                              </div>
                              
                              {/* Content Area */}
                              <div className="flex-1 min-w-0">
                                {/* Company Name (max 2 lines) */}
                                <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1.5 line-clamp-2 group-hover:text-gray-900 transition-colors duration-300">
                                  {getExhibitorDisplayName(exhibitor)}
                                </h3>
                                
                                {/* Booth Number */}
                                {(exhibitor as any).booth_no && (
                                  <div className="mb-1.5">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                      <Icon name="MapPinIcon" className="w-2.5 h-2.5" />
                                      Booth {(exhibitor as any).booth_no}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Category */}
                                {(exhibitor as any).category && (
                                  <div className="mb-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const category = (exhibitor as any).category;
                                        let categoryString = '';
                                        if (Array.isArray(category) && category.length > 0) {
                                          categoryString = typeof category[0] === 'string' ? category[0].trim() : '';
                                        } else if (typeof category === 'string') {
                                          categoryString = category.trim();
                                        }
                                        setSelectedCategory(categoryString);
                                        setActiveTab('exhibitors');
                                        showToast('Filtered by: ' + categoryString, 'info');
                                      }}
                                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full transition-colors duration-200 max-w-full"
                                    >
                                      <Icon name="TagIcon" className="w-2.5 h-2.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {(() => {
                                          const cat = (exhibitor as any).category;
                                          if (Array.isArray(cat) && cat.length > 0) {
                                            const categoryStr = typeof cat[0] === 'string' ? cat[0] : cat[0];
                                            return categoryStr.length > 30 ? categoryStr.substring(0, 30) + '...' : categoryStr;
                                          }
                                          return cat.length > 30 ? cat.substring(0, 30) + '...' : cat;
                                        })()}
                                      </span>
                                    </button>
                                  </div>
                                )}
                                
                                {/* Products/Services */}
                                {(exhibitor.vie_display_products || exhibitor.eng_display_products) && (
                                  <div className="mb-1">
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full max-w-full">
                                      <Icon name="CubeIcon" className="w-2.5 h-2.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {(() => {
                                          const products = exhibitor.vie_display_products || exhibitor.eng_display_products;
                                          return products.length > 35 ? products.substring(0, 35) + '...' : products;
                                        })()}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right Side Actions */}
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                {/* Remove from Favorites Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(getExhibitorId(exhibitor), getExhibitorDisplayName(exhibitor));
                                  }}
                                  className="p-1.5 rounded-full bg-rose-100 text-rose-500 hover:bg-rose-200 hover:text-rose-600 transition-all duration-200"
                                  title="Remove from favorites"
                                >
                                  <Icon name="HeartIcon" className="w-3.5 h-3.5" fill="currentColor" />
                                </button>
                                
                                {/* Action Arrow */}
                                <div className="p-1.5 rounded-full bg-rose-50 group-hover:bg-rose-100 transition-all duration-300">
                                  <Icon name="ChevronRightIcon" className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matching' && (
            <div className="space-y-3">
              {/* Quick Matching Button */}
              <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
                  <h3 className="insight-h3 mb-3 flex items-center">
                    <Icon name="UserGroupIcon" className="w-4 h-4 text-indigo-600 mr-2" />
                    Business Matching
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tạo yêu cầu kết nối với các exhibitors để tối ưu hóa cơ hội kinh doanh tại sự kiện
                  </p>
                  
                  <Button
                    onClick={() => openMatchingForm()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Icon name="UserGroupIcon" className="w-5 h-5" />
                    <span>Tạo yêu cầu Matching</span>
                  </Button>
                </Card>
              </div>

              {/* Matching Guide */}
              <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-md transition-shadow duration-300 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-3xl">
                  <h3 className="insight-h3 text-indigo-800 mb-3 flex items-center">
                    <Icon name="InformationCircleIcon" className="w-4 h-4 mr-2 text-indigo-600" />
                    Hướng dẫn Matching
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-indigo-800">Chọn Exhibitor</h4>
                        <p className="text-xs text-indigo-600">Tìm kiếm và chọn exhibitor bạn muốn kết nối</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-indigo-800">Chọn thời gian</h4>
                        <p className="text-xs text-indigo-600">Đặt lịch gặp mặt trong thời gian diễn ra sự kiện</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-indigo-800">Gửi yêu cầu</h4>
                        <p className="text-xs text-indigo-600">Exhibitor sẽ nhận được thông báo và phản hồi</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'more' && (
            <div className="space-y-3">
              {/* Social & External Links */}
              <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
                  <h3 className="insight-h3 mb-3">Liên kết ngoài</h3>
                  <div className="space-y-2.5">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[48px] rounded-2xl border-gray-200 hover:border-gray-300"
                      onClick={openFacebookEvent}
                    >
                      <div className="flex items-center">
                        <Icon name="ShareIcon" className="w-4 h-4 mr-3 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Facebook Event</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[48px] rounded-2xl border-gray-200 hover:border-gray-300"
                      onClick={() => openFileViewer('Floor Plan', (eventData as any)?.floor_plan_url, 'pdf')}
                    >
                      <div className="flex items-center">
                        <Icon name="MapIcon" className="w-4 h-4 mr-3 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Floor Plan</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-between transform hover:scale-105 transition-transform duration-200 min-h-[48px] rounded-2xl border-gray-200 hover:border-gray-300"
                      onClick={() => openFileViewer('Directory', (eventData as any)?.directory_url, 'pdf')}
                    >
                      <div className="flex items-center">
                        <Icon name="BookOpenIcon" className="w-4 h-4 mr-3 text-indigo-600" />
                        <span className="text-sm font-medium text-slate-700">Directory</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Settings */}
              <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <Card className="p-4 hover:shadow-md transition-shadow duration-300 rounded-3xl border-gray-100">
                  <h3 className="insight-h3 mb-3">Cài đặt</h3>
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
          onMatching={() => openMatchingForm(selectedExhibitor)}
        />
      )}

      {/* Matching Form Modal */}
      {isMatchingFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center">
                  <Icon name="UserGroupIcon" className="w-5 h-5 mr-2" />
                  Business Matching
                </h2>
                <button
                  onClick={closeMatchingForm}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                >
                  <Icon name="XMarkIcon" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Exhibitor Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn Exhibitor
                </label>
                
                {matchingFormData.exhibitor ? (
                  // Selected Exhibitor Display
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-white border border-indigo-200 overflow-hidden flex-shrink-0">
                        <ZohoImage
                          src={matchingFormData.exhibitor.company_logo}
                          alt={`${getExhibitorDisplayName(matchingFormData.exhibitor)} logo`}
                          className="w-full h-full object-contain p-1"
                          fallbackClassName="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-sm font-medium text-indigo-600"
                          fallbackText={getExhibitorDisplayName(matchingFormData.exhibitor).charAt(0)}
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-indigo-800 truncate">
                          {getExhibitorDisplayName(matchingFormData.exhibitor)}
                        </h4>
                                                 {(matchingFormData.exhibitor as any).booth_no && (
                           <p className="text-xs text-indigo-600">
                             Booth {(matchingFormData.exhibitor as any).booth_no}
                           </p>
                         )}
                      </div>
                      <button
                        onClick={() => setMatchingFormData({...matchingFormData, exhibitor: null})}
                        className="p-1 hover:bg-indigo-200 rounded-full transition-colors duration-200 flex-shrink-0"
                      >
                        <Icon name="XMarkIcon" className="w-4 h-4 text-indigo-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Exhibitor Search & Selection
                  <div>
                    <div className="relative mb-3">
                      <Icon name="MagnifyingGlassIcon" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm exhibitor..."
                        value={matchingSearchQuery}
                        onChange={(e) => setMatchingSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 relative">
                      {/* Results count indicator */}
                      {getFilteredMatchingExhibitors().length > 0 && (
                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-gray-100 mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-medium">
                              📋 {getFilteredMatchingExhibitors().length} exhibitors
                            </span>
                            {getFilteredMatchingExhibitors().length > 5 && (
                              <span className="text-xs text-indigo-600 font-medium">
                                👆 Scroll để xem thêm
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {getFilteredMatchingExhibitors().map((exhibitor, index) => (
                        <button
                          key={`matching-${exhibitor.display_name}-${index}`}
                          onClick={() => setMatchingFormData({...matchingFormData, exhibitor})}
                          className="w-full bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl p-3 transition-colors duration-200 text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-8 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0 group-hover:border-indigo-300 transition-colors">
                              <ZohoImage
                                src={exhibitor.company_logo}
                                alt={`${getExhibitorDisplayName(exhibitor)} logo`}
                                className="w-full h-full object-contain p-1"
                                fallbackClassName="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-medium text-gray-500"
                                fallbackText={getExhibitorDisplayName(exhibitor).charAt(0)}
                                sizes="40px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-800 transition-colors">
                                {getExhibitorDisplayName(exhibitor)}
                              </h4>
                              {(exhibitor as any).booth_no && (
                                <p className="text-xs text-gray-500 group-hover:text-indigo-600 transition-colors">
                                  🏢 Booth {(exhibitor as any).booth_no}
                                </p>
                              )}
                              {(exhibitor as any).category && (
                                <p className="text-xs text-gray-400 truncate group-hover:text-indigo-500 transition-colors">
                                  🏷️ {(exhibitor as any).category}
                                </p>
                              )}
                            </div>
                            <div className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                                              ))}
                      
                      {getFilteredMatchingExhibitors().length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          <div className="text-2xl mb-2">🔍</div>
                          <p className="font-medium">Không tìm thấy exhibitor phù hợp</p>
                          <p className="text-xs text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                      )}
                      
                      {/* Fade gradient at bottom when there are many items */}
                      {getFilteredMatchingExhibitors().length > 5 && (
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-xl"></div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày gặp mặt
                </label>
                <select
                  value={matchingFormData.date}
                  onChange={(e) => setMatchingFormData({...matchingFormData, date: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Chọn ngày...</option>
                  {getEventDates().map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ gặp mặt
                </label>
                <select
                  value={matchingFormData.time}
                  onChange={(e) => setMatchingFormData({...matchingFormData, time: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Chọn giờ...</option>
                  <option value="09:00">09:00</option>
                  <option value="09:30">09:30</option>
                  <option value="10:00">10:00</option>
                  <option value="10:30">10:30</option>
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="15:00">15:00</option>
                  <option value="15:30">15:30</option>
                  <option value="16:00">16:00</option>
                  <option value="16:30">16:30</option>
                  <option value="17:00">17:00</option>
                  <option value="17:30">17:30</option>
                </select>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tin nhắn (tùy chọn)
                </label>
                <textarea
                  value={matchingFormData.message}
                  onChange={(e) => setMatchingFormData({...matchingFormData, message: e.target.value})}
                  placeholder="Mô tả ngắn gọn về mục đích gặp mặt..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={closeMatchingForm}
                  variant="outline"
                  className="flex-1 py-2.5 text-sm rounded-xl border-gray-200 hover:border-gray-300"
                >
                  Hủy
                </Button>
                <Button
                  onClick={submitMatchingRequest}
                  disabled={!matchingFormData.exhibitor || !matchingFormData.date || !matchingFormData.time}
                  className="flex-1 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Gửi yêu cầu
                </Button>
              </div>
            </div>
          </div>
        </div>
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
          <div className="grid grid-cols-5 gap-1">
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