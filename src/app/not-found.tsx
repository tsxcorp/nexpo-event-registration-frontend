'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EventData, eventApi } from '@/lib/api/events';

export default function NotFound() {
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
        
        console.log('📋 Loaded events for 404 page:', response.events.length);
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(i18n[currentLanguage]?.unable_to_load_event_list || 'Không thể tải danh sách sự kiện. Vui lòng thử lại.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* 404 Header */}
      <header className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-red-600"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-3 p-1.5">
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
                <div className="hidden text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  NEXPO
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-3">404</h1>
            <h2 className="text-2xl font-semibold text-white mb-3">
              {i18n[currentLanguage]?.page_not_found || 'Trang không tồn tại'}
            </h2>
            <p className="text-lg text-red-100 mb-4">
              {i18n[currentLanguage]?.page_not_found_description || 'Trang bạn đang tìm kiếm không tồn tại. Vui lòng chọn một sự kiện bên dưới.'}
            </p>

            {/* Platform Description - Compact */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-red-50 text-sm leading-relaxed">
                  Nền tảng tiên phong, cung cấp các giải pháp triển lãm toàn diện, đóng vai trò kết nối hiệu quả giữa đơn vị tổ chức triển lãm, nhà triển lãm và khách tham quan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="primary"
            >
              Thử lại
            </Button>
          </div>
        ) : events.length === 0 ? (
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
          <>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Các sự kiện hiện có
              </h3>
              <p className="text-gray-600">
                Chọn một sự kiện để đăng ký tham gia
              </p>
            </div>
            
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
          </>
        )}
      </div>

      {/* Footer with Contact Info */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-white rounded-full p-1.5 mr-3">
                  <img 
                    src="/nexpo-logo.png" 
                    alt="NEXPO Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold">NEXPO</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Nền tảng tiên phong, cung cấp các giải pháp triển lãm toàn diện, đóng vai trò kết nối hiệu quả giữa đơn vị tổ chức triển lãm, nhà triển lãm và khách tham quan.
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact@nexpo.vn
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  028.6682.7794
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Lầu 5 - Toà nhà Ngọc Linh Nhi, 97 Trần Quang Diệu, Phường 14, Quận 3, TP.HCM
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Liên kết</h4>
              <div className="space-y-2">
                <button
                  onClick={() => window.open('https://nexpo.vn', '_blank')}
                  className="block text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Website chính thức
                </button>
                <button
                  onClick={() => window.open('mailto:contact@nexpo.vn', '_blank')}
                  className="block text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Gửi email
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center">
            <p className="text-sm text-gray-400">
              © 2024 NEXPO. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 