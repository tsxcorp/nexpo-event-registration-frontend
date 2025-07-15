import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { EventData } from '@/lib/api/events';
import { i18n } from '@/lib/translation/i18n';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import RegistrationForm from '@/components/features/RegistrationForm';
import { buildBannerUrl, buildLogoUrl } from '@/lib/utils/imageUtils';
import { renderHtmlContent } from '@/lib/utils/htmlUtils';

interface EventInfoProps {
  event: EventData;
  currentLanguage: string;
  onLanguageChange?: (language: string) => void;
  isTranslating?: boolean;
  eventId?: string;
  onRegisterFormMigration?: (callback: (oldFields: any[], newFields: any[]) => void) => void;
}

const EventInfo: FC<EventInfoProps> = ({ 
  event, 
  currentLanguage, 
  onLanguageChange, 
  isTranslating,
  eventId,
  onRegisterFormMigration 
}) => {
  const t = i18n[currentLanguage] || i18n.vi;
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleVisibility = () => setIsVisible(true);
    
    window.addEventListener('scroll', handleScroll);
    // Trigger animations after component mounts
    setTimeout(handleVisibility, 100);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dummy data for fallback
  const dummyEvent: EventData = {
    id: 'dummy-event-id',
    name: currentLanguage === 'en' ? 'Sample Technology Exhibition' : 'Triển Lãm Công Nghệ Mẫu',
    description: currentLanguage === 'en' 
      ? '<p>This is a sample technology exhibition showcasing the latest innovations in industrial automation, smart manufacturing, and digital transformation.</p><p>Join us for an exciting journey through cutting-edge technologies that are shaping the future of industry.</p>'
      : '<p>Đây là triển lãm công nghệ mẫu giới thiệu những đổi mới mới nhất trong tự động hóa công nghiệp, sản xuất thông minh và chuyển đổi số.</p><p>Hãy tham gia cùng chúng tôi trong hành trình khám phá những công nghệ tiên tiến đang định hình tương lai của ngành công nghiệp.</p>',
    start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(),
    location: currentLanguage === 'en' ? 'Ho Chi Minh City Convention Center' : 'Trung Tâm Hội Nghị TP.HCM',
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop',
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
    formFields: []
  };

  // Use dummy data if event is invalid or missing
  const eventData = (!event || !event.start_date || !event.end_date) ? dummyEvent : event;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string, using current date:', dateStr);
      const fallbackDate = new Date();
      if (currentLanguage === 'en') {
        return {
          weekday: fallbackDate.toLocaleDateString('en-US', { weekday: 'long' }),
          day: fallbackDate.getDate().toString(),
          month: fallbackDate.toLocaleDateString('en-US', { month: 'long' }),
          year: fallbackDate.getFullYear().toString(),
          time: fallbackDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        return {
          weekday: fallbackDate.toLocaleDateString('vi-VN', { weekday: 'long' }),
          day: fallbackDate.getDate().toString(),
          month: fallbackDate.toLocaleDateString('vi-VN', { month: 'long' }),
          year: fallbackDate.getFullYear().toString(),
          time: fallbackDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    if (currentLanguage === 'en') {
      return {
        weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
        day: date.getDate().toString(),
        month: date.toLocaleDateString('en-US', { month: 'long' }),
        year: date.getFullYear().toString(),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } else {
      return {
        weekday: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
        day: date.getDate().toString(),
        month: date.toLocaleDateString('vi-VN', { month: 'long' }),
        year: date.getFullYear().toString(),
        time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }
  };

  const startDate = formatDate(eventData.start_date);
  const endDate = formatDate(eventData.end_date);
  
  // Calculate event duration
  const start = new Date(eventData.start_date);
  const end = new Date(eventData.end_date);
  
  let diffDays = 1; // Default to 1 day
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Handle image URLs using utility functions
  const bannerUrl = buildBannerUrl(eventData);
  const logoUrl = buildLogoUrl(eventData);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-24 h-24 bg-purple-500/5 rounded-full blur-xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.15}px)`, animationDelay: '1s' }}
        ></div>
        <div 
          className="absolute top-96 left-1/3 w-40 h-40 bg-green-500/5 rounded-full blur-xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.08}px)`, animationDelay: '2s' }}
        ></div>
      </div>
      {/* Fixed Header - Responsive */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-500 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {logoUrl && (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 transform transition-transform duration-300 hover:scale-110 flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt={`${eventData.name} logo`}
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                    quality={95}
                  />
                </div>
              )}
              <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 truncate animate-fade-in">
                {eventData.name}
              </h1>
            </div>
            
            {onLanguageChange && (
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <LanguageSwitcher
                  currentLanguage={currentLanguage}
                  onLanguageChange={onLanguageChange}
                  isTranslating={isTranslating}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Banner Section - Responsive with proper dimensions */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] mt-16 sm:mt-20">
        {bannerUrl ? (
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={bannerUrl}
              alt={eventData.name}
              fill
              sizes="100vw"
              className="object-cover object-center"
              quality={95}
              priority
              style={{
                transform: `translateY(${scrollY * 0.3}px)`,
              }}
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30"></div>
            
            {/* Content overlay - responsive positioning */}
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
              <div className="text-center text-white max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                  {eventData.name}
                </h1>
                {eventData.location && (
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90 drop-shadow-md">
                    {eventData.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Fallback when no banner image
          <div className="relative w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {eventData.name}
              </h1>
              {eventData.location && (
                <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90">
                  {eventData.location}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Floating particles effect - adjusted for mobile */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: `${25 + i * 20}%`,
                top: `${20 + i * 15}%`,
                animationDelay: `${i * 1}s`,
                animationDuration: `${4 + i * 0.5}s`
              }}
            ></div>
          ))}
        </div>
      </section>

      {/* Event Description Card - Responsive spacing */}
      <section className="relative -mt-16 sm:-mt-24 lg:-mt-32 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className={`bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-6 sm:p-8 md:p-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="text-center mb-8">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-4 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                {eventData.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                  {/* Location with hover animation */}
                <div className={`text-center transform transition-all duration-700 delay-700 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} sm:col-span-1 lg:col-span-1`}>
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 mb-2 sm:mb-3 transition-all duration-300 hover:bg-green-200 hover:shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 transition-transform duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {currentLanguage === 'en' ? 'Location' : 'Địa Điểm'}
                  </h3>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900 px-2">{eventData.location || 'TBA'}</p>
                </div>

                {/* Start Date with hover animation */}
                <div className={`text-center transform transition-all duration-700 delay-500 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} sm:col-span-1 lg:col-span-1`}>
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 mb-2 sm:mb-3 transition-all duration-300 hover:bg-blue-200 hover:shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transition-transform duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {currentLanguage === 'en' ? 'Start Date' : 'Ngày Bắt Đầu'}
                  </h3>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900">{startDate.day} {startDate.month} {startDate.year}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{startDate.weekday}, {startDate.time}</p>
                </div>

              

                {/* End Date with hover animation */}
                <div className={`text-center transform transition-all duration-700 delay-900 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} sm:col-span-2 lg:col-span-1`}>
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 mb-2 sm:mb-3 transition-all duration-300 hover:bg-purple-200 hover:shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 transition-transform duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {currentLanguage === 'en' ? 'End Date' : 'Ngày Kết Thúc'}
                  </h3>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900">{endDate.day} {endDate.month} {endDate.year}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{endDate.weekday}, {endDate.time}</p>
                </div>
              </div>
            </div>

            {/* Event Description with fade-in animation */}
            {eventData.description && (
              <div className={`border-t border-gray-200 pt-8 transform transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div 
                  {...renderHtmlContent(eventData.description, 'text-gray-700 leading-relaxed max-w-none')}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Registration Section with animated background */}
      <section id="registration-form" className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * -0.1}px)`, animationDelay: '1s' }}
          ></div>
        </div>
        <div className="relative max-w-4xl mx-auto">
          {/* Registration Header with slide-up animation */}
          <div className={`bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white rounded-2xl p-6 md:p-8 mb-8 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="text-center">
          
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 animate-fade-in">
                {i18n[currentLanguage]?.register_title || 'Đăng ký tham dự'}
              </h2>
              <div className="w-20 h-0.5 bg-white/30 mx-auto mb-3 animate-expand"></div>
              
            </div>
          </div>
          
          {/* Registration Form with entrance animation */}
          {eventId && (
            <div className={`bg-white rounded-2xl shadow-xl p-4 md:p-6 transform transition-all duration-1000 delay-500 hover:shadow-2xl ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <RegistrationForm 
                fields={eventData.formFields || []} 
                eventId={eventId} 
                currentLanguage={currentLanguage}
                onRegisterFormMigration={onRegisterFormMigration}
              />
            </div>
          )}
        </div>
      </section>

      {/* Event Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Event Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {logoUrl && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white">
                    <Image
                      src={logoUrl}
                      alt={`${eventData.name} logo`}
                      fill
                      sizes="48px"
                      className="object-contain p-2"
                      quality={95}
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold">{eventData.name}</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentLanguage === 'en' 
                  ? 'Join us for an exceptional event experience that brings together industry leaders, innovators, and professionals.'
                  : 'Tham gia cùng chúng tôi trong một trải nghiệm sự kiện đặc biệt, quy tụ các nhà lãnh đạo ngành, nhà đổi mới và các chuyên gia.'
                }
              </p>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">
                {currentLanguage === 'en' ? 'Event Details' : 'Chi Tiết Sự Kiện'}
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-gray-300">
                      {startDate.day} {startDate.month} {startDate.year} - {endDate.day} {endDate.month} {endDate.year}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {diffDays} {currentLanguage === 'en' ? (diffDays === 1 ? 'day' : 'days') : 'ngày'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-300">{eventData.location || 'TBA'}</p>
                </div>
              </div>
            </div>

            {/* Contact & Social */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">
                {currentLanguage === 'en' ? 'Connect With Us' : 'Kết Nối Với Chúng Tôi'}
              </h4>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {eventData.name}. {currentLanguage === 'en' ? 'All rights reserved.' : 'Tất cả quyền được bảo lưu.'}
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes expand {
          from { width: 0; }
          to { width: 5rem; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float ease-in-out infinite;
        }
        
        .animate-expand {
          animation: expand 1s ease-out 0.5s forwards;
          width: 0;
        }
      `}</style>
    </div>
  );
};

export default EventInfo;
