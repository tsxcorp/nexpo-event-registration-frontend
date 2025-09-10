'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { i18n } from '@/lib/translation/i18n';

function TicketPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [iframeUrl, setIframeUrl] = useState<string>('');

  useEffect(() => {
    // Get parameters from URL
    const memberStatus = searchParams?.get('member_status');
    const addEvent = searchParams?.get('Add_Event');
    const masterRegistration = searchParams?.get('Master_Registration');
    const lang = searchParams?.get('lang') || 'vi';
    const flow = searchParams?.get('flow');
    
    setCurrentLanguage(lang);

    console.log('🎫 Ticket page parameters:', {
      memberStatus,
      addEvent,
      masterRegistration,
      lang,
      flow
    });

    // Determine Zoho Creator URL - always use Buy_Ticket form for special event
    let zohoUrl = '';
    
    // For special event 4433256000013547003, always use Buy_Ticket form
    if (addEvent === '4433256000014035047') {
      // Buy Ticket form embed URL (always for special event)
      zohoUrl = `https://creatorapp.zohopublic.com/tsxcorp/registration1/form-embed/Buy_Ticket/08DqzfT4X8YVHC481NzxQNPuYvPkEfX6P0fTJbkzGyyVQQ4uJrH6tU81VwDsKOtePJqmzmB46Jdj1Nvn7vDGPV07vgVnWFnpT8XR?Add_Event=${addEvent}&object=Public&Master_Registration=${masterRegistration}`;
      console.log('🎫 Buy Ticket form embed URL (special event):', zohoUrl);
    } else {
      // For other events, use original logic
      if (memberStatus === 'Không' || flow === 'buy_ticket' || object === 'Member') {
        // Buy Ticket form embed URL (for both Public and Member objects)
        zohoUrl = `https://creatorapp.zohopublic.com/tsxcorp/registration1/form-embed/Buy_Ticket/08DqzfT4X8YVHC481NzxQNPuYvPkEfX6P0fTJbkzGyyVQQ4uJrH6tU81VwDsKOtePJqmzmB46Jdj1Nvn7vDGPV07vgVnWFnpT8XR?Add_Event=${addEvent}&object=${object}&Master_Registration=${masterRegistration}`;
        console.log('🎫 Buy Ticket form embed URL:', zohoUrl);
      } else if (memberStatus === 'Có' && flow === 'member_check') {
        // Member Check form embed URL
        zohoUrl = `https://creatorapp.zohopublic.com/tsxcorp/registration1/form-embed/Member_Check/KwS16QdS1X48XECRqsb1P2p9RKSwzzVfZB1GqgD1b9ACUDgh6OtSVF9gbSh8gwQZwEeHQxtR09pVqwF0v4aOxRqjrardvKh66O5n?Add_Event=${addEvent}&Master_Registration=${masterRegistration}`;
        console.log('✅ Member Check form embed URL:', zohoUrl);
      }
    }

    if (zohoUrl) {
      setIframeUrl(zohoUrl);
    }

    // Set loading to false after URL is determined
    setLoading(false);
  }, [searchParams]);

  // Get parameters for display
  const memberStatus = searchParams?.get('member_status');
  const flow = searchParams?.get('flow');
  const object = searchParams?.get('object') || 'Public';
  const addEvent = searchParams?.get('Add_Event');

  // Determine title based on flow and object
  const isSpecialEvent = addEvent === '4433256000014035047';
  const isMemberCheckFlow = !isSpecialEvent && memberStatus === 'Có' && flow === 'member_check';
  const isBuyTicketFlow = isSpecialEvent || memberStatus === 'Không' || flow === 'buy_ticket' || object === 'Member';

  // Simple iframe load handler
  const handleIframeLoad = () => {
    console.log('✅ Zoho Creator embed form loaded successfully');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
      {/* Enhanced Header with Beautiful Gradient */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 shadow-xl flex-shrink-0 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -top-4 right-1/3 w-24 h-24 bg-purple-300/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-0 left-2/3 w-20 h-20 bg-blue-300/15 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Geometric Pattern */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <div className="absolute top-2 right-4 w-8 h-8 border border-white/30 rounded transform rotate-45"></div>
            <div className="absolute top-6 right-12 w-4 h-4 bg-white/20 rounded-full"></div>
            <div className="absolute bottom-3 right-8 w-6 h-6 border border-white/20 rounded-lg transform -rotate-12"></div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {isMemberCheckFlow
                ? (i18n[currentLanguage]?.member_check_title || 'Kiểm tra thành viên')
                : (i18n[currentLanguage]?.buy_ticket_title || 'Mua vé')
              }
            </h1>
            <p className="text-sm md:text-base text-blue-100 drop-shadow-sm">
              {isMemberCheckFlow
                ? (i18n[currentLanguage]?.member_check_subtitle || 'Xác minh thông tin thành viên')
                : (i18n[currentLanguage]?.buy_ticket_subtitle || 'Hoàn tất mua vé cho sự kiện')
              }
            </p>
          </div>
        </div>
      </div>

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
                title={isMemberCheckFlow ? 'Member Check Form' : 'Buy Ticket Form'}
                className="w-full border-0"
                style={{
                  minHeight: 'calc(100vh - 200px)', // Account for header and footer
                  height: 'auto'
                }}
                onLoad={() => {
                  console.log('✅ Zoho Creator embed form loaded successfully');
                  setIframeLoading(false);
                  
                  // For Member Check flow, we'll monitor for submission completion
                  if (isMemberCheckFlow) {
                    handleIframeLoad();
                  }
                }}
                onError={(e) => {
                  console.error('❌ Error loading Zoho Creator embed form:', e);
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
                {i18n[currentLanguage]?.form_not_available || 'Form không khả dụng'}
              </h2>
              <p className="text-gray-600">
                {i18n[currentLanguage]?.invalid_member_status || 'Trạng thái thành viên không hợp lệ.'}
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" showLogo={true} />
      </div>
    }>
      <TicketPageContent />
    </Suspense>
  );
}
