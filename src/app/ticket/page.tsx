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
    
    setCurrentLanguage(lang);

    console.log('🎫 Ticket page parameters:', {
      memberStatus,
      addEvent,
      masterRegistration,
      lang
    });

    // Determine Zoho Creator URL based on member_status
    let zohoUrl = '';
    
    if (memberStatus === 'Không') {
      // Buy Ticket form embed URL
      zohoUrl = `https://creatorapp.zohopublic.com/tsxcorp/registration1/form-embed/Buy_Ticket/08DqzfT4X8YVHC481NzxQNPuYvPkEfX6P0fTJbkzGyyVQQ4uJrH6tU81VwDsKOtePJqmzmB46Jdj1Nvn7vDGPV07vgVnWFnpT8XR?Add_Event=${addEvent}&object=Public&Master_Registration=${masterRegistration}`;
      console.log('🎫 Buy Ticket form embed URL:', zohoUrl);
    } else if (memberStatus === 'Có') {
      // Member Check form embed URL
      zohoUrl = `https://creatorapp.zohopublic.com/tsxcorp/registration1/form-embed/Member_Check/KwS16QdS1X48XECRqsb1P2p9RKSwzzVfZB1GqgD1b9ACUDgh6OtSVF9gbSh8gwQZwEeHQxtR09pVqwF0v4aOxRqjrardvKh66O5n?Add_Event=${addEvent}&Master_Registration=${masterRegistration}`;
      console.log('✅ Member Check form embed URL:', zohoUrl);
    }

    if (zohoUrl) {
      setIframeUrl(zohoUrl);
    }

    // Set loading to false after URL is determined
    setLoading(false);
  }, [searchParams]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" showLogo={true} />
          <p className="mt-4 text-gray-600">
            {i18n[currentLanguage]?.loading_ticket_form || 'Đang tải form vé...'}
          </p>
        </div>
      </div>
    );
  }

  // Get parameters for display
  const memberStatus = searchParams?.get('member_status');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {memberStatus === 'Có' 
                ? (i18n[currentLanguage]?.member_check_title || 'Kiểm tra thành viên')
                : (i18n[currentLanguage]?.buy_ticket_title || 'Mua vé')
              }
            </h1>
            <p className="text-gray-600 mt-1">
              {memberStatus === 'Có'
                ? (i18n[currentLanguage]?.member_check_subtitle || 'Xác minh thông tin thành viên')
                : (i18n[currentLanguage]?.buy_ticket_subtitle || 'Hoàn tất mua vé cho sự kiện')
              }
            </p>
          </div>
        </div>
      </div>

            {/* Iframe Container */}
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
            
            <iframe
              src={iframeUrl}
              height="100%"
              width="100%"
              frameBorder={0}
              scrolling="auto"
              title={memberStatus === 'Có' ? 'Member Check Form' : 'Buy Ticket Form'}
              className="w-full h-screen border-0"
              onLoad={() => {
                console.log('✅ Zoho Creator embed form loaded successfully');
                setIframeLoading(false);
              }}
              onError={(e) => {
                console.error('❌ Error loading Zoho Creator embed form:', e);
                setIframeLoading(false);
              }}
            />
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
