'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventData, eventApi } from '@/lib/api/events';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { i18n } from '@/lib/translation/i18n';

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

  // Debug: Log registrationData changes
  useEffect(() => {
    console.log('🔄 Registration data state changed:', registrationData);
  }, [registrationData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get event ID from URL params
        const eventId = searchParams.get('eventId');
        const registrationDataParam = searchParams.get('registrationData');
        
        console.log('🔍 Payment page params:', { eventId, registrationDataParam });
        
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            {i18n[currentLanguage]?.event_not_found || 'Không tìm thấy sự kiện.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {eventData.logo && (
                <img 
                  src={eventData.logo} 
                  alt={eventData.name}
                  className="h-12 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{eventData.name}</h1>
                <p className="text-sm text-gray-600">
                  {eventData.location && `${eventData.location} • `}
                  {eventData.start_date && new Date(eventData.start_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {i18n[currentLanguage]?.registration_successful || 'Đăng ký thành công!'}
          </h2>
          <p className="text-lg text-gray-600">
            {i18n[currentLanguage]?.thank_you_for_registration || 'Cảm ơn bạn đã đăng ký tham gia sự kiện của chúng tôi.'}
          </p>
        </div>

        {/* Registration Summary */}
        {registrationData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {i18n[currentLanguage]?.registration_summary || 'Thông tin đăng ký'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n[currentLanguage]?.full_name || 'Họ và tên'}
                </label>
                <p className="text-gray-900 font-medium">{registrationData.Full_Name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n[currentLanguage]?.email || 'Email'}
                </label>
                <p className="text-gray-900 font-medium">{registrationData.Email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n[currentLanguage]?.phone_number || 'Số điện thoại'}
                </label>
                <p className="text-gray-900 font-medium">{registrationData.Phone_Number}</p>
              </div>
              {registrationData.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {i18n[currentLanguage]?.company || 'Công ty'}
                  </label>
                  <p className="text-gray-900 font-medium">{registrationData.company}</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key}
                      </label>
                      <p className="text-gray-900 font-medium">{value}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Group Members Section */}
        {registrationData?.group_members && registrationData.group_members.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {i18n[currentLanguage]?.group_members || 'Danh sách thành viên nhóm'}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({registrationData.group_members.length} thành viên)
              </span>
            </h3>
            <div className="space-y-4">
              {registrationData.group_members.map((member, index) => (
                <div key={member.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {i18n[currentLanguage]?.member || 'Thành viên'} {index + 1}
                    </h4>
                    {member.status && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.status === 'submitted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status === 'submitted' ? 'Đã đăng ký' : member.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {i18n[currentLanguage]?.full_name || 'Họ và tên'}
                      </label>
                      <p className="text-gray-900 font-medium">{member.Full_Name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {i18n[currentLanguage]?.email || 'Email'}
                      </label>
                      <p className="text-gray-900 font-medium">{member.Email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {i18n[currentLanguage]?.phone_number || 'Số điện thoại'}
                      </label>
                      <p className="text-gray-900 font-medium">{member.Phone_Number}</p>
                    </div>
                    {member.Salutation && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {i18n[currentLanguage]?.salutation || 'Xưng hô'}
                        </label>
                        <p className="text-gray-900 font-medium">{member.Salutation}</p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {key}
                            </label>
                            <p className="text-gray-900 font-medium">{value}</p>
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

        {/* Event Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {i18n[currentLanguage]?.event_information || 'Thông tin sự kiện'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i18n[currentLanguage]?.event_name || 'Tên sự kiện'}
              </label>
              <p className="text-gray-900 font-medium">{eventData.name}</p>
            </div>
            {eventData.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n[currentLanguage]?.location || 'Địa điểm'}
                </label>
                <p className="text-gray-900 font-medium">{eventData.location}</p>
              </div>
            )}
            {eventData.start_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n[currentLanguage]?.start_date || 'Ngày bắt đầu'}
                </label>
                <p className="text-gray-900 font-medium">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i18n[currentLanguage]?.end_date || 'Ngày kết thúc'}
                </label>
                <p className="text-gray-900 font-medium">
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

        {/* Payment Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">
                {i18n[currentLanguage]?.payment_notice || 'Thông báo thanh toán'}
              </h3>
              <p className="mt-2 text-blue-800">
                {i18n[currentLanguage]?.payment_notice_description || 
                  'Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để hướng dẫn quy trình thanh toán và cung cấp thêm thông tin về sự kiện.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
          >
            {i18n[currentLanguage]?.back || 'Quay lại'}
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {i18n[currentLanguage]?.back_to_home || 'Về trang chủ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
