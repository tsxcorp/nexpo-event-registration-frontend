'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PoweredByFooter from '@/components/common/PoweredByFooter';
import { i18n } from '@/lib/translation/i18n';

function CheckInContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [iframeUrl, setIframeUrl] = useState<string>('');

  useEffect(() => {
    // Get URL parameters
    const addEvent = searchParams?.get('Add_Event');
    const conference = searchParams?.get('conference');
    const subSession = searchParams?.get('sub_session');
    const lang = searchParams?.get('lang') || 'vi';
    
    setCurrentLanguage(lang);

    console.log('🔍 Check-in parameters:', {
      addEvent,
      conference,
      subSession,
      lang
    });

    // Base Zoho Creator check-in form URL
    let baseUrl = 'https://creatorapp.zohopublic.com/tsxcorp/registration1/form-embed/Check_In/P6xtKFO8FSQNdxWVFuDUXKR1b9Z0ShVPX23KqPpjTr5dv6444w5KnfEEyq3MKsda0zFyTpGQHCUQvY5DDUsrxrTw188HG4r8xGmX';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (addEvent) {
      params.append('Add_Event', addEvent);
    }
    if (conference) {
      params.append('conference', conference);
    }
    if (subSession) {
      params.append('sub_session', subSession);
    }
    
    // Combine base URL with parameters
    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    setIframeUrl(finalUrl);
    setLoading(false);
    
    console.log('🔍 Check-in Form URL:', finalUrl);
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
            minHeight: '120px',
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
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '120px',
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
              Check-in Go Global 2025
            </h1>
            <p style={{
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              fontWeight: '600',
              color: '#f8fafc',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              lineHeight: '1.4',
              maxWidth: '600px'
            }}>
              Xác nhận tham dự HỘI NGHỊ CHIẾN LƯỢC CẤP CAO dành cho cộng đồng doanh nhân Việt Nam
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
                  title="Go Global 2025 Check-in Form"
                  className="w-full border-0"
                  style={{
                    minHeight: 'calc(100vh - 120px)', // Account for header and footer
                    height: 'auto'
                  }}
                  onLoad={() => {
                    console.log('✅ Check-in form loaded successfully');
                    setIframeLoading(false);
                  }}
                  onError={(e) => {
                    console.error('❌ Error loading check-in form:', e);
                    setIframeLoading(false);
                  }}
                />
                
                {/* Bottom spacing to ensure submit button is visible */}
                <div className="h-16 bg-transparent"></div>
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
                  Không thể tải form check-in. Vui lòng thử lại sau.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Simple Image Section */}
        <div className="w-full py-2">
          <a 
            href="https://media.tsx.vn/upload/bea1af77-94e7-4a2d-83de-9cc20e138073.png"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src="https://media.tsx.vn/upload/bea1af77-94e7-4a2d-83de-9cc20e138073.png"
              alt="Event Image"
              className="w-full h-auto"
            />
          </a>
        </div>
        
        {/* Powered by Nexpo Footer */}
        <PoweredByFooter variant="minimal" className="border-t-0" />
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" showLogo={true} />
      </div>
    }>
      <CheckInContent />
    </Suspense>
  );
}
