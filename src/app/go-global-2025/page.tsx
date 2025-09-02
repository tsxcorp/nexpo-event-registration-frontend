'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PoweredByFooter from '@/components/common/PoweredByFooter';
import { i18n } from '@/lib/translation/i18n';

function GoGlobal2025Content() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [iframeUrl, setIframeUrl] = useState<string>('');

  useEffect(() => {
    // Get URL parameters
    const addEvent = searchParams?.get('Add_Event');
    const utmSource = searchParams?.get('utm_source');
    const lang = searchParams?.get('lang') || 'vi';
    
    setCurrentLanguage(lang);

    console.log('🌍 Go Global 2025 parameters:', {
      addEvent,
      utmSource,
      lang
    });

    // Base Zoho Creator form URL
    let baseUrl = 'https://creatorapp.zohopublic.com/tsxcorp/registration1/form-embed/Registration/z4SVWgygRRPqr54jjC7xbdbBdd0Pa9DCquppJmY8WwY9Sp4thd7n4epv4kSE6b9zepXNGut0pCMS9OWupOMsMN4ujHnvsPHFZsGq';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (addEvent) {
      params.append('Add_Event', addEvent);
    }
    if (utmSource) {
      params.append('utm_source', utmSource);
    }
    
    // Combine base URL with parameters
    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    setIframeUrl(finalUrl);
    setLoading(false);
    
    console.log('🌍 Go Global 2025 Form URL:', finalUrl);
  }, [searchParams]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" showLogo={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Custom Header with Unique Styling */}
        <header 
          className="go-global-header"
          style={{
            background: 'linear-gradient(135deg, #1e40af, #3b82f6, #1d4ed8, #1e3a8a)',
            minHeight: '140px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}
        >
          {/* Animated Background Elements */}
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '25%',
              width: '128px',
              height: '128px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              filter: 'blur(32px)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '-16px',
              right: '33%',
              width: '96px',
              height: '96px',
              background: 'rgba(147, 197, 253, 0.3)',
              borderRadius: '50%',
              filter: 'blur(24px)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: '1s'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '67%',
              width: '80px',
              height: '80px',
              background: 'rgba(129, 140, 248, 0.3)',
              borderRadius: '50%',
              filter: 'blur(20px)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: '2s'
            }}></div>
          </div>
          
          {/* Subtle overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, transparent, rgba(30, 58, 138, 0.2), transparent)'
          }}></div>
          
          {/* Header Content */}
          <div style={{
            position: 'relative',
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '140px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)',
              fontWeight: '700',
              marginBottom: '6px',
              letterSpacing: '0.025em',
              color: '#ffffff',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              lineHeight: '1.2'
            }}>
              Go Global 2025
            </h1>
            <p style={{
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              fontWeight: '600',
              color: '#f8fafc',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              lineHeight: '1.4',
              maxWidth: '600px'
            }}>
              Đăng ký tham gia HỘI NGHỊ CHIẾN LƯỢC CẤP CAO dành cho cộng đồng doanh nhân Việt Nam
            </p>
          </div>
        </header>

        {/* Iframe Container - Natural scrolling */}
        <div className="flex-1 relative">
          {iframeUrl ? (
            <>
              {/* Loading Overlay */}
              {iframeLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="text-center">
                    <LoadingSpinner size="lg" showLogo={true} />
                    <p className="mt-2 text-sm text-gray-500">
                      {i18n[currentLanguage]?.please_wait || 'Vui lòng chờ trong giây lát...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Natural scrolling iframe container */}
              <div className="relative w-full">
                <iframe
                  src={iframeUrl}
                  width="100%"
                  frameBorder={0}
                  scrolling="auto"
                  title="Go Global 2025 Registration Form"
                  className="w-full border-0"
                  style={{
                    minHeight: 'calc(100vh - 140px)', // Account for header and footer
                    height: 'auto'
                  }}
                  onLoad={() => {
                    console.log('✅ Go Global 2025 form loaded successfully');
                    setIframeLoading(false);
                  }}
                  onError={(e) => {
                    console.error('❌ Error loading Go Global 2025 form:', e);
                    setIframeLoading(false);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">❌</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Form không khả dụng
                </h2>
                <p className="text-gray-600">
                  Không thể tải form đăng ký. Vui lòng thử lại sau.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Powered by Nexpo Footer */}
        <PoweredByFooter variant="minimal" className="border-t-0" />
      </div>
    </div>
  );
}

export default function GoGlobal2025Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" showLogo={true} />
      </div>
    }>
      <GoGlobal2025Content />
    </Suspense>
  );
}
