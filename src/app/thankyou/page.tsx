'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RegistrationLayout from '@/components/layouts/RegistrationLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import QRCode from 'react-qr-code';
import { useTranslation } from '@/hooks/useTranslation';
import { useEventMetadata } from '@/hooks/useEventMetadata';
import { i18n } from '@/lib/translation/i18n';
import { eventApi } from '@/lib/api/events';
import translationService from '@/lib/translation/translationService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import StructuredData from '@/components/seo/StructuredData';

interface RegistrationData {
  Salutation: string;
  Full_Name: string;
  Email: string;
  Phone_Number: string;
  zoho_record_id: string;
  group_id?: string;
  group_members?: Array<{
    Salutation: string;
    Full_Name: string;
    Email: string;
    Phone_Number: string;
    [key: string]: string;
  }>;
  [key: string]: any;
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text="Đang tải thông tin..."
        />
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [translatedData, setTranslatedData] = useState<RegistrationData | null>(null);
  const [translatedLabels, setTranslatedLabels] = useState<{[key: string]: string}>({});
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [translatingValues, setTranslatingValues] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  
  const dataParam = searchParams.get('data');
  const langParam = searchParams.get('lang'); // Get language from URL

  useEffect(() => {
    // Set language from URL parameter or localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const finalLanguage = langParam || savedLanguage || 'vi';
    setCurrentLanguage(finalLanguage);
    
    if (!dataParam) {
      console.error('No data parameter found in URL');
      setLoading(false);
      return;
    }

    try {
      const parsedData = JSON.parse(dataParam);
      console.log('🎯 Thank You page received data:', parsedData);
      console.log('🌍 Current language:', finalLanguage);
      console.log('👥 Group members structure:', parsedData.group_members);
      console.log('🆔 Group ID:', parsedData.group_id);
      console.log('🔗 Zoho Record ID:', parsedData.zoho_record_id);
      
      // Debug each group member
      if (parsedData.group_members && parsedData.group_members.length > 0) {
        parsedData.group_members.forEach((member: any, idx: number) => {
          console.log(`👤 Member ${idx + 1}:`, {
            hasFullInfo: !!(member.Full_Name || member.full_name),
            zohoId: member.id,
            memberData: member
          });
        });
      }
      setRegistrationData(parsedData);
    } catch (error) {
      console.error('Error parsing registration data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataParam, langParam]);

  // Get translations for current language
  const t = i18n[currentLanguage] || i18n['vi'] || {};

  // Use metadata hook for dynamic favicon, title, and social sharing
  const { generateShareUrls } = useEventMetadata({ 
    event: eventData, 
    currentLanguage 
  });

  // Helper function to translate field labels
  const translateFieldLabel = (key: string) => {
    // Check if we have a dynamic translation for this label
    if (translatedLabels[key]) {
      return translatedLabels[key];
    }
    
    const normalizedKey = key.toLowerCase().trim();
    
    // Try direct match first
    if (t[normalizedKey]) return t[normalizedKey];
    
    // Try with spaces normalized
    const spacesNormalized = normalizedKey.replace(/\s+/g, ' ');
    if (t[spacesNormalized]) return t[spacesNormalized];
    
    // Try with underscores replaced with spaces
    const underscoresReplaced = normalizedKey.replace(/_/g, ' ');
    if (t[underscoresReplaced]) return t[underscoresReplaced];
    
    // Try with special characters removed
    const specialCharsRemoved = normalizedKey.replace(/[^a-z0-9\s]/g, '');
    if (t[specialCharsRemoved]) return t[specialCharsRemoved];
    
    // Fallback to formatted key
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Translate field values when language or registration data changes
  useEffect(() => {
    if (!registrationData || !registrationData.Event_Info) {
      setTranslatedData(registrationData);
      return;
    }

    const translateFieldValues = async () => {
      try {
        setTranslatingValues(true);
        console.log('🔄 Translating field values for Thank You page...');
        
        // Get event details to access field definitions
        const eventDetails = await eventApi.getEventInfo(registrationData.Event_Info);
        const formFields = eventDetails.event.formFields || [];
        
        // Set event data for metadata hook
        if (!eventData) {
          setEventData(eventDetails.event);
        }
        
        console.log('📋 Found form fields for translation:', formFields.length);
        
        // Create translated data copy
        const translatedDataCopy = { ...registrationData };
        
        // Translate each field value if it's a select/multiselect field
        for (const [key, value] of Object.entries(registrationData)) {
          // Skip system fields
          if (['zoho_record_id', 'group_id', 'group_members', 'Event_Info', 'Salutation', 'Full_Name', 'Email', 'Phone_Number'].includes(key)) {
            continue;
          }
          
          // Find the corresponding field definition by label or field_id
          const fieldDef = formFields.find(f => f.label === key || f.field_id === key);
          
          if (fieldDef && (fieldDef.type === 'Select' || fieldDef.type === 'Multi Select') && fieldDef.values) {
            console.log(`🔄 Translating field: ${key} = ${value}`);
            
            if (fieldDef.type === 'Multi Select' && typeof value === 'string') {
              // Handle multi-select values (comma-separated)
              const values = value.split(',').map(v => v.trim());
              const translatedValues = await Promise.all(
                values.map(async (val) => {
                  if (val) {
                    // Use translation service for dynamic translation
                    const translated = await translationService.translate(val, currentLanguage);
                    console.log(`  ✅ ${val} → ${translated}`);
                    return translated;
                  }
                  return val;
                })
              );
              translatedDataCopy[key] = translatedValues.join(', ');
            } else if (fieldDef.type === 'Select' && typeof value === 'string') {
              // Handle single select values
              // Use translation service for dynamic translation
              const translated = await translationService.translate(value, currentLanguage);
              console.log(`  ✅ ${value} → ${translated}`);
              translatedDataCopy[key] = translated;
            }
          } else {
            // For non-select fields, still try to translate if it's a meaningful value
            if (typeof value === 'string' && value !== 'true' && value !== 'false' && value.trim() !== '') {
              // Only translate if it looks like Vietnamese text (contains Vietnamese characters or is longer than 3 chars)
              const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(value);
              const isLongEnough = value.length > 3;
              
              if (hasVietnameseChars || isLongEnough) {
                try {
                  const translated = await translationService.translate(value, currentLanguage);
                  console.log(`🔄 Translating non-select field: ${key} = ${value} → ${translated}`);
                  translatedDataCopy[key] = translated;
                } catch (error) {
                  console.log(`❌ Failed to translate: ${value}`);
                }
              }
            }
          }
        }
        
        console.log('✅ Field values translation completed');
        setTranslatedData(translatedDataCopy);
        
        // Also translate field labels if needed
        if (currentLanguage !== 'vi') {
          console.log('🔄 Translating field labels...');
          const labelTranslations: {[key: string]: string} = {};
          
          for (const key of Object.keys(registrationData)) {
            // Skip system fields
            if (['zoho_record_id', 'group_id', 'group_members', 'Event_Info', 'Salutation', 'Full_Name', 'Email', 'Phone_Number'].includes(key)) {
              continue;
            }
            
            // Check if this field label contains Vietnamese characters
            const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(key);
            
            if (hasVietnameseChars) {
              try {
                const translatedLabel = await translationService.translate(key, currentLanguage);
                labelTranslations[key] = translatedLabel;
                console.log(`  ✅ Label: ${key} → ${translatedLabel}`);
              } catch (error) {
                console.log(`❌ Failed to translate label: ${key}`);
              }
            }
          }
          
          setTranslatedLabels(labelTranslations);
        }
        
      } catch (error) {
        console.error('❌ Error translating field values:', error);
        setTranslatedData(registrationData); // Fallback to original data
      } finally {
        setTranslatingValues(false);
      }
    };

    if (currentLanguage !== 'vi') {
      // Only translate if not in Vietnamese (original language)
      translateFieldValues();
    } else {
      setTranslatedData(registrationData);
    }
  }, [registrationData, currentLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text={t.loading || 'Đang tải dữ liệu...'}
        />
      </div>
    );
  }
  
  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            {t.event_not_found || 'Không tìm thấy thông tin đăng ký.'}
          </p>
        </div>
      </div>
    );
  }

  // Use translated data if available, otherwise use original data
  const displayData = translatedData || registrationData;
  const isGroup = displayData.group_members && displayData.group_members.length > 0;

  return (
    <>
      {eventData && <StructuredData event={eventData} currentLanguage={currentLanguage} />}
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-break {
            page-break-after: always;
          }
          
          .qr-container {
            text-align: center;
            margin: 1rem 0;
          }
          
          .member-card {
            border: 1px solid #ddd !important;
            margin-bottom: 1rem;
            padding: 1rem;
            break-inside: avoid;
          }
        }
      `}</style>
      
      <RegistrationLayout>
      <section className="max-w-2xl mx-auto px-6 py-16">
        <Card className="p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t.thank_you_title || 'Cảm ơn bạn đã đăng ký!'}
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            {t.greeting || 'Xin chào'} {displayData.Salutation} {displayData.Full_Name},
          </p>
          <p className="text-lg text-gray-600 mb-8">
            {t.registration_received || 'Chúng tôi đã nhận được thông tin đăng ký của bạn. Vui lòng kiểm tra email'} {displayData.Email} {t.for_confirmation || 'để xác nhận'}.
          </p>

          {/* QR Code Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                🎫 {t.qr_code_title || 'Mã QR xác nhận'}
              </h3>
              <button
                onClick={() => window.print()}
                className="no-print px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <span>📄</span>
                <span>{t.print_pdf || 'In PDF'}</span>
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              {t.qr_code_instruction || 'Vui lòng trình mã QR này khi đến sự kiện'}
            </p>

            {isGroup ? (
              <div className="space-y-6">
                {/* Group Leader QR Code - Individual Style */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold mb-3 text-blue-700 text-center">
                    👤 {t.leader_qr_code || 'Mã QR Người đăng ký'}
                  </h4>
                  <p className="text-sm text-blue-600 mb-4 text-center">
                    👤 Mã QR cá nhân dành cho người đăng ký để check-in tại sự kiện.
                  </p>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
                      <QRCode
                        value={displayData.zoho_record_id}
                        size={200}
                        style={{ height: 'auto', maxWidth: '100%', width: '200px' }}
                        title={`Leader QR Code: ${displayData.zoho_record_id}`}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center font-mono">
                        {displayData.zoho_record_id}
                      </p>
                    </div>
                  </div>
                  
                  {/* Leader Registration Details */}
                  <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="text-lg font-semibold mb-3 text-blue-800 text-center">
                      Thông tin người đăng ký
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Salutation</span>
                        <span className="text-blue-800 font-semibold">{displayData.Salutation}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Full Name</span>
                        <span className="text-blue-800 font-semibold">{displayData.Full_Name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Email</span>
                        <span className="text-blue-800 font-semibold">{displayData.Email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Phone Number</span>
                        <span className="text-blue-800 font-semibold">{displayData.Phone_Number}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group QR Code + Compact Member List - Improved Layout */}
                {displayData.group_id && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    {/* Header */}
                    <h4 className="text-lg font-bold mb-6 text-gray-800 text-center">
                      GROUP DETAILS
                    </h4>
                    
                    {/* Main Group QR - Large and Centered */}
                    <div className="flex justify-center mb-6">
                      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-300">
                        <div className="text-center mb-3">
                          <p className="text-sm font-bold text-gray-800">QR GROUP</p>
                        </div>
                        <QRCode
                          value={displayData.group_id}
                          size={180}
                          style={{ height: 'auto', maxWidth: '100%', width: '180px' }}
                          title={`Group QR Code: ${displayData.group_id}`}
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center font-mono">
                          {displayData.group_id}
                        </p>
                      </div>
                    </div>
                    
                    {/* Member Cards - Horizontal Layout */}
                    <div className="space-y-3">
                      {/* Group Leader Info Card */}
                      <div className="bg-white rounded-lg p-4 border-2 border-blue-300 flex items-center gap-4">
                        {/* Leader Icon on the left */}
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 bg-blue-50 rounded-lg border-2 border-blue-200 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl mb-1">👤</div>
                              <p className="text-xs font-bold text-blue-700">Người đăng ký</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Member Info on the right */}
                        <div className="flex-1">
                          <h5 className="font-bold text-blue-800 text-base mb-1">
                            {displayData.Salutation} {displayData.Full_Name}
                          </h5>
                          <p className="text-sm text-gray-700 mb-1">{displayData.Email}</p>
                          <p className="text-sm text-gray-700">{displayData.Phone_Number}</p>
                        </div>
                      </div>

                      {/* Other Members */}
                      {displayData.group_members && displayData.group_members.map((member, idx) => {
                        const isFullMember = member.Full_Name || member.Email || member.Phone_Number;
                        const memberZohoId = member.id;
                        
                        return (
                          <div key={idx} className="bg-white rounded-lg p-4 border-2 border-green-300 flex items-center gap-4">
                            {/* QR on the left */}
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 bg-green-50 rounded-lg border-2 border-green-200 flex items-center justify-center p-2">
                                {memberZohoId ? (
                                  <QRCode
                                    value={memberZohoId}
                                    size={80}
                                    style={{ height: 'auto', maxWidth: '100%', width: '80px' }}
                                    title={`Member ${idx + 1} QR: ${memberZohoId}`}
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                                    <span className="text-xs text-gray-500">No QR</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Member Info on the right */}
                            <div className="flex-1">
                              {isFullMember ? (
                                <>
                                  <h5 className="font-bold text-green-800 text-base mb-1">
                                    {member.Salutation || member.title} {member.Full_Name || member.full_name}
                                  </h5>
                                  <p className="text-sm text-gray-700 mb-1">{member.Email || member.email}</p>
                                  <p className="text-sm text-gray-700">{member.Phone_Number || member.mobile_number}</p>
                                </>
                              ) : (
                                <>
                                  <h5 className="font-bold text-green-800 text-base mb-1">
                                    Thành viên {idx + 1}
                                  </h5>
                                  <p className="text-sm text-gray-600 mb-1">Email thành viên {idx + 1}</p>
                                  <p className="text-sm text-gray-600">SĐT thành viên {idx + 1}</p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Usage Instructions */}
                    <div className="mt-6 space-y-3">
                      <div className="bg-green-100 rounded-lg p-3">
                        <p className="text-xs text-green-700 font-medium text-center">
                          💡 Sử dụng QR nhóm để check-in tất cả thành viên cùng lúc
                        </p>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3">
                        <p className="text-xs text-blue-700 font-medium text-center">
                          👤 Mỗi thành viên có thể sử dụng QR cá nhân để check-in riêng lẻ
                        </p>
                      </div>
                      <div className="bg-orange-100 rounded-lg p-3">
                        <p className="text-xs text-orange-700 font-medium text-center">
                          📱 Lưu hoặc in trang này để dễ dàng truy cập QR codes tại sự kiện
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold mb-3 text-blue-700 text-center">
                    👤 {t.individual_qr_code || 'Mã QR cá nhân'}
                  </h4>
                  <p className="text-sm text-blue-600 mb-4 text-center">
                    {t.individual_qr_instruction || 'Mã QR này dành riêng cho bạn để check-in tại sự kiện.'}
                  </p>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
                      <QRCode
                        value={displayData.zoho_record_id}
                        size={200}
                        style={{ height: 'auto', maxWidth: '100%', width: '200px' }}
                        title={`Individual QR Code: ${displayData.zoho_record_id}`}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center font-mono">
                        {displayData.zoho_record_id}
                      </p>
                    </div>
                  </div>
                  
                  {/* Individual Usage Instructions */}
                  <div className="mt-4 bg-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium text-center">
                      📱 Trình QR code này tại quầy đăng ký để check-in vào sự kiện
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registration Details - Only show for individual registrations */}
          {!isGroup && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">
                {t.registration_details || 'Thông tin đăng ký'}
              </h3>
              {translatingValues && (
                <div className="mb-4 text-center">
                  <p className="text-sm text-gray-500">
                    🔄 {currentLanguage === 'en' ? 'Translating content...' : 'Đang dịch nội dung...'}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(displayData)
                      .filter(([key]) => !['group_members', 'group_id', 'zoho_record_id', 'Event_Info'].includes(key))
                      .map(([key, value], index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-0">
                          <td className="py-2 text-gray-600 capitalize font-medium text-left w-1/3">
                            {/* Translate field names */}
                            {translateFieldLabel(key)}
                          </td>
                          <td className="py-2 text-left font-semibold text-blue-800">
                            {Array.isArray(value) ? value.join(', ') : 
                             typeof value === 'boolean' ? (value ? (t.yes || 'Có') : (t.no || 'Không')) : 
                             value}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}





          {/* Back to home button
          <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
            className="mt-4"
          >
            {t.back_to_home || 'Quay về trang chủ'}
          </Button> */}
        </Card>
      </section>
    </RegistrationLayout>
    </>
  );
} 