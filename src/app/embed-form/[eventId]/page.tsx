'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { EventData, eventApi } from '@/lib/api/events';
import RegistrationForm from '@/components/features/RegistrationForm';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { i18n } from '@/lib/translation/i18n';

export default function EmbedFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params?.eventId as string;
  const [originalEventData, setOriginalEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const formMigrationRef = useRef<((oldFields: any[], newFields: any[]) => void) | null>(null);

  // Get embed configuration from URL params
  const embedConfig = {
    theme: searchParams?.get('theme') || 'light',
    language: (searchParams?.get('lang') || 'vi') as 'vi' | 'en',
    showHeader: searchParams?.get('header') !== 'false',
    showFooter: searchParams?.get('footer') !== 'false',
    showProgress: searchParams?.get('progress') !== 'false',
    autoResize: searchParams?.get('autoResize') !== 'false'
  };

  // Use translation hook with originalEventData and embed language
  const {
    eventData,
    setEventData,
    currentLanguage,
    isTranslating,
    translateEventData,
    registerFormValuesMigration,
  } = useTranslation(originalEventData);

  // Load event data
  useEffect(() => {
    if (!eventId) return;
    
      setLoading(true);
      setError(false);
      
      // Test new API endpoint first, fallback to old API if it fails
      eventApi.getEventInfoRest(eventId)
        .then(res => {
          const event = res.event;
          setOriginalEventData(event);
          setError(false);
        })
        .catch(err => {
          // Fallback to original API
          return eventApi.getEventInfo(eventId);
        })
        .then(res => {
          if (res) {
            const event = res.event;
            setOriginalEventData(event);
            setError(false);
          }
        })
        .catch(err => {
          // For development: Use mock data if backend is not available
          if (err.message === 'Network Error' && process.env.NODE_ENV === 'development') {
          const mockEvent: EventData = {
            id: eventId,
            name: 'Sample Technology Exhibition - Embed Demo',
            description: '<p>This is a sample event for testing the embed form functionality.</p>',
            start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Convention Center - Hall A',
            registration_form: [],
            status: 'active',
            created_date: new Date().toISOString(),
            badge_size: 'W106mm x H146mm',
            badge_printing: true,
            ticket_mode: false,
            formFields: [
              {
                sort: 1,
                label: 'Họ và tên',
                type: 'Text',
                required: true,
                groupmember: false,
                helptext: '',
                placeholder: 'Nhập họ và tên của bạn',
                field_condition: '',
                section_name: 'THÔNG TIN ĐĂNG KÝ',
                section_sort: 1,
                section_condition: '',
                matching_field: false,
                field_id: 'full_name'
              },
              {
                sort: 2,
                label: 'Email',
                type: 'Email',
                required: true,
                groupmember: false,
                helptext: '',
                placeholder: 'example@email.com',
                field_condition: '',
                section_name: 'THÔNG TIN ĐĂNG KÝ',
                section_sort: 1,
                section_condition: '',
                matching_field: false,
                field_id: 'email'
              },
              {
                sort: 3,
                label: 'Số điện thoại',
                type: 'Text',
                required: true,
                groupmember: false,
                helptext: '',
                placeholder: '+84 123 456 789',
                field_condition: '',
                section_name: 'THÔNG TIN ĐĂNG KÝ',
                section_sort: 1,
                section_condition: '',
                matching_field: false,
                field_id: 'phone'
              }
            ]
          };
          setOriginalEventData(mockEvent);
          setError(false);
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  // Auto-resize functionality
  useEffect(() => {
    if (!embedConfig.autoResize) return;

    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );

      // Send height to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'resize',
          height: height + 50, // Add some padding
          source: 'nexpo-embed',
          eventId: eventId
        }, '*');
      }
    };

    // Send initial height
    setTimeout(sendHeight, 1000);

    // Send height on resize
    const resizeObserver = new ResizeObserver(sendHeight);
    resizeObserver.observe(document.body);

    // Send height on DOM changes
    const mutationObserver = new MutationObserver(sendHeight);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [embedConfig.autoResize, eventId]);

  // Register form migration callback
  useEffect(() => {
    if (formMigrationRef.current) {
      registerFormValuesMigration(formMigrationRef.current);
    }
  }, [registerFormValuesMigration]);

  const handleLanguageChange = async (newLanguage: string) => {
    if (originalEventData) {
      await translateEventData(newLanguage);
    }
  };

  // Function to register form migration from RegistrationForm
  const setFormMigrationCallback = (callback: (oldFields: any[], newFields: any[]) => void) => {
    formMigrationRef.current = callback;
    registerFormValuesMigration(callback);
  };

  // Apply theme classes
  const getThemeClasses = () => {
    switch (embedConfig.theme) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'minimal':
        return 'bg-white text-gray-900';
      default:
        return 'bg-gray-50 text-gray-900';
    }
  };

  // Show loading while loading event data OR while translation is in progress
  if (loading || (originalEventData && !eventData)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}>
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text={isTranslating 
            ? (i18n[currentLanguage]?.translating || 'Đang dịch nội dung...')
            : (i18n[currentLanguage]?.loading || 'Đang tải dữ liệu sự kiện...')
          }
        />
      </div>
    );
  }
  
  // Only show error if we have explicitly failed to load
  if (error || (!loading && !originalEventData)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}>
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            {i18n[currentLanguage]?.event_not_found || 'Không tìm thấy sự kiện.'}
          </p>
        </div>
      </div>
    );
  }

  // Render the embedded form
  const displayData = eventData || originalEventData;
  
  if (!displayData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}>
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text={i18n[currentLanguage]?.loading || 'Đang tải dữ liệu sự kiện...'}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()}`}>
      {/* Custom CSS for embed themes */}
      <style jsx global>{`
        .embed-form-container {
          max-width: none !important;
          margin: 0 !important;
          padding: 20px 16px !important;
        }
        
        /* Mobile optimization - full width */
        @media (max-width: 768px) {
          .embed-form-container {
            padding: 16px 12px !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
          
          .embed-form-container .card {
            border-radius: 8px !important;
            margin: 0 !important;
            padding: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
        
        .embed-form-container .hero-section {
          ${!embedConfig.showHeader ? 'display: none !important;' : ''}
          margin-bottom: 24px !important;
        }
        
        /* Add top margin when header is disabled */
        .embed-form-container .registration-form-container {
          ${!embedConfig.showHeader ? 'margin-top: 32px !important;' : ''}
        }
        
        /* Additional spacing for mobile when no header */
        @media (max-width: 768px) {
          .embed-form-container .registration-form-container {
            ${!embedConfig.showHeader ? 'margin-top: 24px !important;' : ''}
          }
        }
        
        .embed-form-container .footer-section {
          ${!embedConfig.showFooter ? 'display: none !important;' : ''}
        }
        
        .embed-form-container .progress-bar {
          ${!embedConfig.showProgress ? 'display: none !important;' : ''}
        }

        ${embedConfig.theme === 'dark' ? `
          .embed-form-container {
            background-color: #111827 !important;
            color: #f9fafb !important;
          }
          .embed-form-container .bg-white {
            background-color: #1f2937 !important;
            color: #f9fafb !important;
          }
          .embed-form-container .border-gray-200 {
            border-color: #374151 !important;
          }
          .embed-form-container .text-gray-900 {
            color: #f9fafb !important;
          }
          .embed-form-container .text-gray-600 {
            color: #d1d5db !important;
          }
        ` : ''}

        ${embedConfig.theme === 'minimal' ? `
          .embed-form-container {
            box-shadow: none !important;
            border: none !important;
          }
          .embed-form-container .card {
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          }
        ` : ''}
      `}</style>

      <div className="embed-form-container">
        {/* Event Header (if enabled) */}
        {embedConfig.showHeader && (
          <div className="hero-section text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {displayData.name}
            </h1>
            {displayData.description && (
              <div 
                className="text-gray-600 max-w-2xl mx-auto"
                dangerouslySetInnerHTML={{ 
                  __html: displayData.description.length > 200 
                    ? displayData.description.substring(0, 200) + '...'
                    : displayData.description
                }}
              />
            )}
          </div>
        )}

        {/* Registration Form or Inactive Message */}
        {displayData.status === 'Active' || displayData.status === 'active' || !displayData.status ? (
          <div className="registration-form-container">
            <RegistrationForm
              fields={displayData.formFields || []}
              eventId={eventId}
              eventData={displayData}
              currentLanguage={currentLanguage}
              onRegisterFormMigration={setFormMigrationCallback}
              isEmbedded={true}
              embedConfig={embedConfig}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Sự kiện tạm thời không khả dụng
              </h3>
              <p className="text-yellow-700 text-sm">
                Đăng ký cho sự kiện này hiện tại không khả dụng. Vui lòng quay lại sau.
              </p>
            </div>
          </div>
        )}

        {/* Footer (if enabled) */}
        {embedConfig.showFooter && (
          <div className="footer-section text-center mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>
              Powered by{' '}
              <a 
                href="https://nexpo.vn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Nexpo Event Management
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

