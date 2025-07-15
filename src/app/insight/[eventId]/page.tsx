'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EventData, eventApi } from '@/lib/api/events';
import { useEventMetadata } from '@/hooks/useEventMetadata';

interface InsightAccessPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default function InsightAccessPage({ params }: InsightAccessPageProps) {
  const { eventId } = use(params);
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [visitorId, setVisitorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { generateShareUrls } = useEventMetadata({ 
    event: eventData, 
    currentLanguage: 'vi' 
  });

  // Animated background with parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load event data
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await eventApi.getEventInfo(eventId);
        setEventData(response.event);
        
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitorId.trim()) {
      setError('Vui lòng nhập mã truy cập');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Navigate to visitor dashboard
      router.push(`/insight/${eventId}/${visitorId.trim()}`);
    } catch (err: any) {
      console.error('Error navigating:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Modern Icon Component
  const Icon = ({ name, className = "w-5 h-5", ...props }: { name: string; className?: string }) => {
    const icons = {
      KeyIcon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      ArrowRightIcon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      ),
      ShieldCheckIcon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      ExclamationTriangleIcon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )
    };
    
    return icons[name as keyof typeof icons] || icons.KeyIcon;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner 
            size="lg" 
            showLogo={true} 
            text="Đang tải thông tin sự kiện..."
          />
          <div className="mt-4 text-gray-600">
            <p className="text-sm">Vui lòng chờ trong giây lát...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full mx-4 p-6 text-center shadow-xl">
          <div className="text-red-500 mb-4">
            <Icon name="ExclamationTriangleIcon" className="w-16 h-16 mx-auto mb-4" />
            <h2 className="insight-h2 font-bold text-gray-900 mb-2">Không tìm thấy sự kiện</h2>
            <p className="insight-text-secondary">{error || 'Sự kiện không tồn tại hoặc đã kết thúc'}</p>
          </div>
          <Button 
            onClick={() => window.location.href = '/'}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background elements with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles with parallax effect */}
        <div 
          className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
          style={{ 
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)`,
            animation: 'insight-pulse 3s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
          style={{ 
            transform: `translate(${scrollY * -0.1}px, ${scrollY * 0.08}px)`,
            animation: 'insight-pulse 4s ease-in-out infinite',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"
          style={{ 
            transform: `translate(${scrollY * 0.15}px, ${scrollY * -0.1}px)`,
            animation: 'insight-pulse 5s ease-in-out infinite',
            animationDelay: '2s'
          }}
        />
        
        {/* Geometric shapes */}
        <div 
          className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-2xl blur-xl rotate-45"
          style={{ 
            transform: `translate(-50%, -50%) rotate(${scrollY * 0.1}deg)`,
            animation: 'insight-bounce 6s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-lg"
          style={{ 
            transform: `translate(${scrollY * -0.05}px, ${scrollY * 0.1}px)`,
            animation: 'insight-pulse 4s ease-in-out infinite reverse'
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Event header with enhanced animation */}
          <div className={`text-center mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {eventData.logo && (
              <div className="mb-6">
                <img 
                  src={eventData.logo} 
                  alt={eventData.name}
                  className="w-20 h-20 mx-auto rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 object-cover"
                />
              </div>
            )}
            <h1 className="insight-h1 font-extrabold text-gray-900 mb-2 leading-tight">
              {eventData.name}
            </h1>
            <p className="insight-text-secondary text-gray-600 mb-1">
              {new Date(eventData.start_date).toLocaleDateString('vi-VN')} - {new Date(eventData.end_date).toLocaleDateString('vi-VN')}
            </p>
            <p className="insight-text-muted text-gray-500">
              {eventData.location}
            </p>
          </div>

          {/* Access form with enhanced styling */}
          <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="insight-card p-8 shadow-2xl backdrop-blur-sm bg-white/90 border-0 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                  <Icon name="KeyIcon" className="w-8 h-8 text-white" />
                </div>
                <h2 className="insight-h2 font-bold text-gray-900 mb-2">
                  Truy cập Dashboard
                </h2>
                <p className="insight-text-secondary text-gray-600">
                  Nhập mã truy cập được cung cấp bởi ban tổ chức
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="visitorId" className="insight-label block text-sm font-semibold text-gray-700 mb-2">
                    Mã truy cập
                  </label>
                  <div className="relative">
                    <input
                      id="visitorId"
                      type="text"
                      value={visitorId}
                      onChange={(e) => setVisitorId(e.target.value)}
                      placeholder="Nhập mã truy cập của bạn"
                      className="insight-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                      disabled={submitting}
                      autoComplete="off"
                      autoCapitalize="off"
                    />
                    {visitorId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Icon name="ShieldCheckIcon" className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="insight-alert insight-alert-error flex items-center gap-2 animate-pulse">
                    <Icon name="ExclamationTriangleIcon" className="w-5 h-5 text-red-500" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || !visitorId.trim()}
                  className="w-full min-h-[52px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Đang xử lý...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Truy cập Dashboard</span>
                      <Icon name="ArrowRightIcon" className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center space-y-2">
                  <p className="insight-text-muted text-gray-500 text-sm">
                    Chưa có mã truy cập?
                  </p>
                  <p className="insight-text-caption text-gray-400 text-xs">
                    Liên hệ ban tổ chức để được hỗ trợ
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Event info card with enhanced styling */}
          <div className={`mt-8 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="insight-card p-6 shadow-lg backdrop-blur-sm bg-white/80 border-0 hover:shadow-xl transition-all duration-300">
              <h3 className="insight-h4 font-bold text-gray-900 mb-3">
                Thông tin sự kiện
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="insight-h6 font-semibold text-gray-700 mb-1">Mô tả</h4>
                  <p className="insight-text-secondary text-gray-600 text-sm leading-relaxed">
                    {eventData.description || 'Không có mô tả'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <h4 className="insight-h6 font-semibold text-gray-700 mb-1">Thời gian</h4>
                    <p className="insight-text-secondary text-gray-600 text-sm">
                      {new Date(eventData.start_date).toLocaleDateString('vi-VN')} - {new Date(eventData.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <h4 className="insight-h6 font-semibold text-gray-700 mb-1">Địa điểm</h4>
                    <p className="insight-text-secondary text-gray-600 text-sm">
                      {eventData.location}
                    </p>
                  </div>
                  {eventData.exhibitors && eventData.exhibitors.length > 0 && (
                    <div>
                      <h4 className="insight-h6 font-semibold text-gray-700 mb-1">Exhibitors</h4>
                      <div className="insight-badge insight-status-info inline-flex">
                        {eventData.exhibitors.length} exhibitors tham gia
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Security notice with enhanced styling */}
          <div className={`mt-6 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="insight-alert insight-alert-info flex items-start gap-3 bg-blue-50/80 backdrop-blur-sm border-blue-200">
              <Icon name="ShieldCheckIcon" className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="insight-h6 font-semibold text-blue-800 mb-1">
                  Bảo mật thông tin
                </h4>
                <p className="insight-text-caption text-blue-700 text-sm">
                  Mã truy cập của bạn được bảo vệ và chỉ có thể sử dụng cho sự kiện này. 
                  Không chia sẻ mã này với người khác.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 