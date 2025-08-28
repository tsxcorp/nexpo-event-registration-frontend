'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventData, eventApi } from '@/lib/api/events';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { i18n } from '@/lib/translation/i18n';
import PoweredByFooter from '@/components/common/PoweredByFooter';

// Types for bank apps
interface BankApp {
  appId: string;
  appLogo: string;
  appName: string;
  bankName: string;
  monthlyInstall: number;
  deeplink: string;
  autofill?: number;
}

interface BankAppsResponse {
  apps: BankApp[];
}

interface GroupMember {
  Salutation: string;
  Full_Name: string;
  Email: string;
  Phone_Number: string;
  id?: string;
  index?: number;
  status?: string;
  [key: string]: any;
}

interface RegistrationData {
  Salutation?: string;
  Full_Name: string;
  Email: string;
  Phone_Number: string;
  company?: string;
  group_members?: GroupMember[];
  group_id?: string;
  [key: string]: any;
}

// Mobile detection hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [os, setOs] = useState<'android' | 'ios' | 'unknown'>('unknown');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    setIsMobile(isMobileDevice);
    
    if (userAgent.includes('android')) {
      setOs('android');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      setOs('ios');
    }
  }, []);

  return { isMobile, os };
};

// Hook to fetch bank apps
const useBankApps = (os: 'android' | 'ios' | 'unknown') => {
  const [bankApps, setBankApps] = useState<BankApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (os === 'unknown') return;

    const fetchBankApps = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiUrl = os === 'android' 
          ? 'https://api.vietqr.io/v2/android-app-deeplinks'
          : 'https://api.vietqr.io/v2/ios-app-deeplinks';
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch bank apps');
        }
        
        const data: BankAppsResponse = await response.json();
        
        // Sort by monthly installs (most popular first) and filter out apps with 0 installs
        const sortedApps = data.apps
          .filter(app => app.monthlyInstall > 0)
          .sort((a, b) => b.monthlyInstall - a.monthlyInstall)
          .slice(0, 12); // Limit to top 12 apps
        
        setBankApps(sortedApps);
      } catch (err) {
        console.error('Error fetching bank apps:', err);
        setError('Không thể tải danh sách ngân hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchBankApps();
  }, [os]);

  return { bankApps, loading, error };
};

// Function to generate deeplink with payment info
const generateDeeplink = (baseDeeplink: string, amount: string, addInfo?: string) => {
  const url = new URL(baseDeeplink);
  
  // Add payment parameters if available
  if (amount) {
    url.searchParams.set('am', amount);
  }
  
  if (addInfo) {
    url.searchParams.set('tn', addInfo);
  }
  
  // Add bank account info for BIDV
  url.searchParams.set('ba', '8618208888@bidv');
  
  return url.toString();
};

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Mobile detection and bank apps
  const { isMobile, os } = useMobileDetection();
  const { bankApps, loading: bankAppsLoading, error: bankAppsError } = useBankApps(os);

  // Debug: Log registrationData changes
  useEffect(() => {
    console.log('🔄 Registration data state changed:', registrationData);
  }, [registrationData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get parameters from URL
        const eventId = searchParams.get('eventId');
        const registrationDataParam = searchParams.get('registrationData');
        const amount = searchParams.get('amount');
        const addInfo = searchParams.get('addInfo');
        
        console.log('🔍 Payment page params:', { eventId, registrationDataParam, amount, addInfo });
        
        if (!eventId) {
          console.error('❌ No event ID provided');
          return;
        }

        // Load event data
        console.log('📥 Loading event data for:', eventId);
        const eventResponse = await eventApi.getEventInfo(eventId);
        console.log('📥 Event data loaded:', eventResponse.event);
        setEventData(eventResponse.event);

        // Parse registration data if provided
        if (registrationDataParam) {
          try {
            const parsedData = JSON.parse(decodeURIComponent(registrationDataParam));
            console.log('📋 Parsed registration data:', parsedData);
            setRegistrationData(parsedData);
          } catch (error) {
            console.error('❌ Error parsing registration data:', error);
          }
        } else {
          console.log('⚠️ No registration data provided');
        }

        // Generate QR code URL if amount is provided
        if (amount) {
          const baseQrUrl = 'https://api.vietqr.io/image/970418-8618208888-UN9emJm.jpg';
          const params = new URLSearchParams({
            accountName: 'HOI DOANH NHAN TRE THANH PHO HO CHI MINH',
            amount: amount
          });
          
          if (addInfo) {
            params.append('addInfo', addInfo);
          }
          
          const fullQrUrl = `${baseQrUrl}?${params.toString()}`;
          console.log('🎫 Generated QR code URL:', fullQrUrl);
          setQrCodeUrl(fullQrUrl);
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading payment page data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text={i18n[currentLanguage]?.loading || 'Đang tải thông tin thanh toán...'}
        />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            {i18n[currentLanguage]?.event_not_found || 'Không tìm thấy sự kiện.'}
          </p>
        </div>
      </div>
    );
  }

  const amount = searchParams.get('amount');
  const addInfo = searchParams.get('addInfo');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Compact Header for Mobile */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            {eventData.logo && (
              <div className="mb-2">
                <img 
                  src={eventData.logo} 
                  alt={eventData.name}
                  className="h-12 w-auto object-contain mx-auto"
                />
              </div>
            )}
            <h1 className="text-xl font-bold mb-1">{eventData.name}</h1>
            <p className="text-blue-100 text-sm">
              {eventData.location && `${eventData.location} • `}
              {eventData.start_date && new Date(eventData.start_date).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Compact Success Message */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3 shadow-md">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {i18n[currentLanguage]?.registration_successful || 'Đăng ký thành công!'}
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            {i18n[currentLanguage]?.thank_you_for_registration || 'Cảm ơn bạn đã đăng ký tham gia sự kiện của chúng tôi.'}
          </p>
          <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
            {i18n[currentLanguage]?.ticket_confirmation_notice || 
              'Vé sẽ được gửi qua email sau khi xác nhận thanh toán.'}
          </p>
        </div>

                {/* Payment Section - Mobile Optimized */}
        {amount && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-100">
            {/* Compact Amount Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 text-center border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">
                {i18n[currentLanguage]?.payment_amount || 'Số tiền thanh toán'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {parseInt(amount).toLocaleString('vi-VN')}
              </p>
              <p className="text-sm text-gray-600">VND</p>
            </div>

            {/* QR Code - Centered and Prominent */}
            {qrCodeUrl && (
              <div className="text-center mb-4">
                <div className="inline-block bg-white rounded-xl p-3 shadow-md border border-gray-200">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code thanh toán" 
                    className="w-56 h-56 mx-auto rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Mobile Bank Apps Section */}
            {isMobile && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                  {i18n[currentLanguage]?.pay_with_bank_app || 'Thanh toán bằng app ngân hàng'}
                </h4>
                
                {bankAppsLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Đang tải danh sách ngân hàng...</p>
                  </div>
                )}
                
                {bankAppsError && (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-600">{bankAppsError}</p>
                  </div>
                )}
                
                {!bankAppsLoading && !bankAppsError && bankApps.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {bankApps.map((app) => (
                      <button
                        key={app.appId}
                        onClick={() => {
                          const deeplink = generateDeeplink(app.deeplink, amount || '', addInfo || undefined);
                          window.location.href = deeplink;
                        }}
                        className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        title={`Thanh toán bằng ${app.appName}`}
                      >
                        <img 
                          src={app.appLogo} 
                          alt={app.appName}
                          className="w-10 h-10 rounded-lg mb-2 object-contain"
                          onError={(e) => {
                            // Fallback to a generic bank icon if logo fails to load
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMTIgMTZIMjhNMTYgMjBIMjRNMTIgMjRIMjgiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';
                          }}
                        />
                        <p className="text-xs text-gray-700 text-center font-medium leading-tight">
                          {app.appName}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                
                {!bankAppsLoading && !bankAppsError && bankApps.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Không tìm thấy app ngân hàng phù hợp</p>
                  </div>
                )}
              </div>
            )}

            {/* Compact Bank Transfer Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
              <div className="flex items-center mb-2">
                <svg className="h-4 w-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900">
                  {i18n[currentLanguage]?.bank_transfer_info || 'Thông tin chuyển khoản'}
                </h4>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-gray-600 mb-0.5">
                    {i18n[currentLanguage]?.bank_name || 'Ngân hàng'}
                  </label>
                  <p className="text-gray-900 font-medium">BIDV</p>
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">
                    {i18n[currentLanguage]?.account_number || 'Số tài khoản'}
                  </label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-medium">8618208888</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('8618208888');
                        // Show temporary success feedback
                        const button = event?.currentTarget as HTMLButtonElement;
                        if (button) {
                          const originalHTML = button.innerHTML;
                          button.innerHTML = `
                            <svg class="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          `;
                          setTimeout(() => {
                            button.innerHTML = originalHTML;
                          }, 1000);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy số tài khoản"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {addInfo && (
                  <div>
                    <label className="block text-gray-600 mb-0.5">
                      {i18n[currentLanguage]?.payment_content || 'Nội dung thanh toán'}
                    </label>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 font-medium break-all">{addInfo}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(addInfo);
                          // Show temporary success feedback
                          const button = event?.currentTarget as HTMLButtonElement;
                          if (button) {
                            const originalHTML = button.innerHTML;
                            button.innerHTML = `
                              <svg class="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            `;
                            setTimeout(() => {
                              button.innerHTML = originalHTML;
                            }, 1000);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Copy nội dung thanh toán"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-gray-600 mb-0.5">
                    {i18n[currentLanguage]?.account_holder || 'Chủ tài khoản'}
                  </label>
                  <p className="text-gray-900 font-medium text-xs">Hội Doanh Nhân Trẻ TP.HCM</p>
                </div>
              </div>
            </div>

            {/* Compact Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">
                    {i18n[currentLanguage]?.payment_instructions || 'Hướng dẫn thanh toán'}
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-800 text-xs">
                    <li>{i18n[currentLanguage]?.step_1_open_bank_app || 'Mở ứng dụng ngân hàng'}</li>
                    <li>{i18n[currentLanguage]?.step_2_select_qr || 'Chọn "Quét QR Code"'}</li>
                    <li>{i18n[currentLanguage]?.step_3_scan_qr || 'Quét mã QR bên trên'}</li>
                    <li>{i18n[currentLanguage]?.step_4_confirm_payment || 'Xác nhận và thanh toán'}</li>
                  </ol>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Registration Summary - Hidden on Mobile for QR Focus */}
        {registrationData && !amount && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {i18n[currentLanguage]?.registration_summary || 'Thông tin đăng ký'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {i18n[currentLanguage]?.full_name || 'Họ và tên'}
                </label>
                <p className="text-gray-900 font-medium text-lg">{registrationData.Full_Name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {i18n[currentLanguage]?.email || 'Email'}
                </label>
                <p className="text-gray-900 font-medium text-lg">{registrationData.Email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {i18n[currentLanguage]?.phone_number || 'Số điện thoại'}
                </label>
                <p className="text-gray-900 font-medium text-lg">{registrationData.Phone_Number}</p>
              </div>
              {registrationData.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n[currentLanguage]?.company || 'Công ty'}
                  </label>
                  <p className="text-gray-900 font-medium text-lg">{registrationData.company}</p>
                </div>
              )}
              
              {/* Display custom fields */}
              {Object.keys(registrationData).map(key => {
                // Skip core fields and special fields
                if (['Salutation', 'Full_Name', 'Email', 'Phone_Number', 'company', 'zoho_record_id', 'group_id', 'group_members', 'Event_Info'].includes(key)) {
                  return null;
                }
                
                const value = registrationData[key];
                if (value && typeof value === 'string' && value.trim()) {
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {key}
                      </label>
                      <p className="text-gray-900 font-medium text-lg">{value}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Group Members Section - Hidden on Mobile for QR Focus */}
        {registrationData?.group_members && registrationData.group_members.length > 0 && !amount && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {i18n[currentLanguage]?.group_members || 'Danh sách thành viên nhóm'}
              <span className="text-lg font-normal text-gray-500 ml-3">
                ({registrationData.group_members.length} thành viên)
              </span>
            </h3>
            <div className="space-y-6">
              {registrationData.group_members.map((member, index) => (
                <div key={member.id || index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-900">
                      {i18n[currentLanguage]?.member || 'Thành viên'} {index + 1}
                    </h4>
                    {member.status && (
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        member.status === 'submitted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status === 'submitted' ? 'Đã đăng ký' : member.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n[currentLanguage]?.full_name || 'Họ và tên'}
                      </label>
                      <p className="text-gray-900 font-medium text-lg">{member.Full_Name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n[currentLanguage]?.email || 'Email'}
                      </label>
                      <p className="text-gray-900 font-medium text-lg">{member.Email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n[currentLanguage]?.phone_number || 'Số điện thoại'}
                      </label>
                      <p className="text-gray-900 font-medium text-lg">{member.Phone_Number}</p>
                    </div>
                    {member.Salutation && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {i18n[currentLanguage]?.salutation || 'Xưng hô'}
                        </label>
                        <p className="text-gray-900 font-medium text-lg">{member.Salutation}</p>
                      </div>
                    )}
                    
                    {/* Display custom fields for group members */}
                    {Object.keys(member).map(key => {
                      // Skip core fields and special fields
                      if (['Salutation', 'Full_Name', 'Email', 'Phone_Number', 'id', 'index', 'status'].includes(key)) {
                        return null;
                      }
                      
                      const value = member[key];
                      if (value && typeof value === 'string' && value.trim()) {
                        return (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {key}
                            </label>
                            <p className="text-gray-900 font-medium text-lg">{value}</p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Information - Hidden on Mobile for QR Focus */}
        {!amount && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {i18n[currentLanguage]?.event_information || 'Thông tin sự kiện'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {i18n[currentLanguage]?.event_name || 'Tên sự kiện'}
                </label>
                <p className="text-gray-900 font-medium text-lg">{eventData.name}</p>
              </div>
              {eventData.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n[currentLanguage]?.location || 'Địa điểm'}
                  </label>
                  <p className="text-gray-900 font-medium text-lg">{eventData.location}</p>
                </div>
              )}
              {eventData.start_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n[currentLanguage]?.start_date || 'Ngày bắt đầu'}
                  </label>
                  <p className="text-gray-900 font-medium text-lg">
                    {new Date(eventData.start_date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {eventData.end_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {i18n[currentLanguage]?.end_date || 'Ngày kết thúc'}
                  </label>
                  <p className="text-gray-900 font-medium text-lg">
                    {new Date(eventData.end_date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}


      </div>

      {/* Footer */}
      <PoweredByFooter />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text="Đang tải trang thanh toán..."
        />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
