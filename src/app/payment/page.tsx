'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventData, eventApi } from '@/lib/api/events';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { i18n } from '@/lib/translation/i18n';
import PoweredByFooter from '@/components/common/PoweredByFooter';

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

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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
                    className="w-48 h-48 mx-auto rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Compact Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
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

            {/* Compact Bank Transfer Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <svg className="h-4 w-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900">
                  {i18n[currentLanguage]?.bank_transfer_info || 'Thông tin chuyển khoản'}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
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
                  <p className="text-gray-900 font-medium">8618208888</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-600 mb-0.5">
                    {i18n[currentLanguage]?.account_holder || 'Chủ tài khoản'}
                  </label>
                  <p className="text-gray-900 font-medium text-xs">Hội Doanh Nhân Trẻ TP.HCM</p>
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
