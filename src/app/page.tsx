'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EventData, eventApi } from '@/lib/api/events';

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await eventApi.getAllEvents();
        setEvents(response.events);
        
        console.log('📋 Loaded events:', response.events.length);
        console.log('🔍 Event statuses:', response.events.map(e => ({ 
          name: e.name, 
          status: e.status,
          badge_printing: e.badge_printing 
        })));
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError('Không thể tải danh sách sự kiện. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Clean HTML description and extract plain text
  const cleanDescription = (htmlString: string) => {
    if (!htmlString) return '';
    
    try {
      // Remove HTML tags and decode entities
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;
      let text = tempDiv.textContent || tempDiv.innerText || '';
      
      // Clean up extra whitespace
      text = text.replace(/\s+/g, ' ').trim();
      
      // Limit length for card display
      if (text.length > 120) {
        text = text.substring(0, 120) + '...';
      }
      
      return text;
    } catch {
      // Fallback: simple regex to remove HTML tags
      return htmlString.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 120);
    }
  };

  // Check if event is active
  const isEventActive = (status: any) => {
    if (typeof status === 'string') {
      return status.toLowerCase() === 'active';
    }
    if (typeof status === 'boolean') {
      return status === true;
    }
    if (typeof status === 'number') {
      return status === 1;
    }
    return false;
  };

  const handleRegisterClick = (eventId: string) => {
    router.push(`/register/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner 
            size="lg" 
            showLogo={true} 
            text="Đang tải danh sách sự kiện..."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full mx-4 p-6 text-center shadow-xl rounded-3xl">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="primary"
            className="w-full min-h-[48px]"
          >
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg mb-4 p-2">
                <img 
                  src="/nexpo-logo.png" 
                  alt="NEXPO Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NEXPO
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              NEXPO Event Registration
            </h1>
            
            <p className="text-xl text-blue-100 mb-6">
              Chọn sự kiện để đăng ký tham gia
            </p>

            {/* Platform Description */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-blue-50 text-lg leading-relaxed mb-4">
                  Nền tảng tiên phong, cung cấp các giải pháp triển lãm toàn diện, đóng vai trò kết nối hiệu quả giữa đơn vị tổ chức triển lãm, nhà triển lãm và khách tham quan.
                </p>
                <p className="text-blue-100 text-base leading-relaxed">
                  Với sứ mệnh nâng cao chất lượng triển lãm tại Việt Nam, NEXPO giúp các bên dễ dàng quảng bá, tìm kiếm sự kiện và mở rộng cơ hội hợp tác, tạo dựng mối quan hệ kinh doanh giá trị.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có sự kiện nào
            </h3>
            <p className="text-gray-600">
              Hiện tại chưa có sự kiện nào được tạo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="p-6 hover:shadow-lg transition-all duration-300 rounded-2xl border-gray-100 hover:border-blue-200 group"
              >
                {/* Event Banner/Logo */}
                <div className="mb-4 relative">
                  {/* Banner as main image */}
                  {event.banner ? (
                    <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden relative">
                      <img 
                        src={event.banner} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      {/* Fallback gradient */}
                      <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {event.name.charAt(0)}
                      </div>
                      
                      {/* Logo overlay in top-right corner */}
                      {event.logo && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden">
                          <img 
                            src={event.logo} 
                            alt="Logo"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {event.name.charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg relative">
                      {event.name.charAt(0)}
                      
                      {/* Logo overlay if no banner */}
                      {event.logo && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden">
                          <img 
                            src={event.logo} 
                            alt="Logo"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {event.name.charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {event.name}
                  </h3>
                  
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {cleanDescription(event.description)}
                    </p>
                  )}

                  {/* Event Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {formatDate(event.start_date)}
                      {event.end_date && event.end_date !== event.start_date && (
                        <> - {formatDate(event.end_date)}</>
                      )}
                    </span>
                  </div>

                  {/* Event Location */}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  {/* Event Status */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isEventActive(event.status) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isEventActive(event.status) ? 'Đang mở đăng ký' : 'Đã đóng'}
                    </div>
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  onClick={() => handleRegisterClick(event.id)}
                  variant="primary"
                  className="w-full min-h-[48px] group-hover:bg-blue-600 transition-colors"
                >
                  Đăng ký ngay
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 NEXPO Event Registration. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 