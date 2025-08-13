'use client';

import { useState } from 'react';
import translationService from '@/lib/translation/translationService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function TestTranslationPage() {
  const [originalText, setOriginalText] = useState('Mục đích tham quan');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Test HTML content
  const [htmlContent, setHtmlContent] = useState(`<p>1. Mục đích thu thập thông tin bao gồm:</p><p>Đăng kí trước, hoàn thành hợp đồng</p>`);
  const [translatedHtml, setTranslatedHtml] = useState('');

  // Test translation object
  const [translationObjectResult, setTranslationObjectResult] = useState('');

  const handleTranslate = async () => {
    setIsLoading(true);
    try {
      const result = await translationService.translate(originalText, 'en');
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslatedText('Translation failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateHtml = async () => {
    setIsLoading(true);
    try {
      // Direct test of translateHtmlContent through a public method
      const mockEventData = {
        id: 'test',
        name: 'Test Event',
        description: 'Test Description',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        location: 'Test Location',
        banner: '',
        logo: '',
        favicon: '',
        header: '',
        footer: '',
        email: '',
        formFields: [{
          type: 'Agreement' as const,
          content: htmlContent,
          label: 'Test Agreement',
          sort: 1,
          required: false,
          groupmember: false,
          helptext: '',
          placeholder: '',
          default: '',
          field_condition: '',
          section_name: 'Test',
          section_sort: 1,
          section_condition: '',
          matching_field: false,
          values: []
        }],
        registration_form: [],
        status: 'active',
        created_date: '2024-01-01',
        badge_size: 'standard',
        badge_printing: false
      };
      
      console.log('🚀 Starting HTML translation test...');
      console.log('📋 Mock field data:', mockEventData.formFields[0]);
      
      const translatedEvent = await translationService.translateEventData(mockEventData, 'en');
      const translatedField = translatedEvent.formFields?.[0];
      
      console.log('🎯 Translation result field:', translatedField);
      
      setTranslatedHtml(translatedField?.content || 'Translation failed - no content returned');
    } catch (error) {
      console.error('HTML Translation failed:', error);
      setTranslatedHtml('HTML Translation failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // Test translation object logic
  const handleTestTranslationObject = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing translation object logic...');
      
      // Create mock event data with translation objects
      const mockEventData = {
        id: 'test',
        name: 'Test Event',
        description: 'Test Description',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        location: 'Test Location',
        banner: '',
        logo: '',
        favicon: '',
        header: '',
        footer: '',
        email: '',
        formFields: [
          {
            field_id: 'aw2025_policy',
            sort: 1,
            label: 'CHÍNH SÁCH BẢO MẬT EN',
            type: 'Agreement',
            placeholder: '',
            values: [''],
            required: true,
            helptext: '',
            field_condition: '',
            section_name: 'CHÍNH SÁCH & ĐIỀU KHOẢN',
            section_sort: 0,
            section_condition: '',
            title: '',
            content: '<div><b>1. Mục đích thu thập thông tin bao gồm:</b> Đăng kí trước, hoàn thành hợp đồng...</div>',
            checkbox_label: 'Tôi đã đọc và đồng ý với chính sách bảo mật (bắt buộc) EN',
            link_text: '',
            link_url: '',
            groupmember: false,
            matching_field: false,
            translation: {
              en_sectionname: 'PRIVACY POLICY & TERMS',
              en_label: 'PRIVACY POLICY',
              en_value: '',
              en_placeholder: '',
              en_helptext: '',
              en_agreementcontent: '<div><b>1. Purpose of information collection includes:</b> Pre-registration, contract completion...</div>',
              en_agreementtitle: '',
              en_checkboxlabel: 'I have read and agree to the privacy policy (required)',
              en_linktext: ''
            }
          },
          {
            field_id: 'aw2025_company_name',
            sort: 4,
            label: ' Tên Công Ty',
            type: 'Text',
            placeholder: '',
            values: [''],
            required: true,
            helptext: '',
            field_condition: '',
            section_name: 'THÔNG TIN CÔNG TY',
            section_sort: 2,
            section_condition: '',
            title: '',
            content: '',
            checkbox_label: '',
            link_text: '',
            link_url: '',
            groupmember: false,
            matching_field: false,
            translation: {
              en_sectionname: 'COMPANY INFORMATION',
              en_label: 'Company Name',
              en_value: '',
              en_placeholder: '',
              en_helptext: '',
              en_agreementcontent: '',
              en_agreementtitle: '',
              en_checkboxlabel: '',
              en_linktext: ''
            }
          },
          {
            field_id: 'aw2025_company_type',
            sort: 0,
            label: 'Loại hình doanh nghiệp',
            type: 'Select',
            placeholder: '',
            values: ['Xuất Khẩu Nhập Khẩu ', 'Sản Xuất', ' Phân Phối', ' Dịch Vụ', ' Khác'],
            required: true,
            helptext: '',
            field_condition: 'show if {aw2025_purpose} = "Kết nối giao thương"',
            section_name: 'THÔNG TIN CÔNG TY',
            section_sort: 2,
            section_condition: '',
            title: '',
            content: '',
            checkbox_label: '',
            link_text: '',
            link_url: '',
            groupmember: false,
            matching_field: false,
            translation: {
              en_sectionname: 'COMPANY INFORMATION',
              en_label: 'Business Type',
              en_value: 'Import Export,Manufacturing,Distribution,Services,Other',
              en_placeholder: '',
              en_helptext: '',
              en_agreementcontent: '',
              en_agreementtitle: '',
              en_checkboxlabel: '',
              en_linktext: ''
            }
          }
        ],
        registration_form: [],
        status: 'active',
        created_date: '2024-01-01',
        badge_size: 'standard',
        badge_printing: false
      };
      
      console.log('🚀 Starting translation object test...');
      console.log('📋 Mock event data with translation objects:', mockEventData);
      
      const translatedEvent = await translationService.translateEventData(mockEventData, 'en');
      
      console.log('🎯 Translation result:', translatedEvent);
      
      // Format the results for display
      const results = translatedEvent.formFields?.map((field, index) => {
        return `
          <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
            <h4>Field ${index + 1}: ${field.field_id}</h4>
            <p><strong>Original Label:</strong> ${mockEventData.formFields[index].label}</p>
            <p><strong>Translated Label:</strong> ${field.label}</p>
            <p><strong>Original Section:</strong> ${mockEventData.formFields[index].section_name}</p>
            <p><strong>Translated Section:</strong> ${field.section_name}</p>
            ${field.type === 'Agreement' ? `<p><strong>Original Checkbox:</strong> ${mockEventData.formFields[index].checkbox_label}</p>
            <p><strong>Translated Checkbox:</strong> ${field.checkbox_label}</p>` : ''}
            ${field.type === 'Select' ? `<p><strong>Original Values:</strong> ${JSON.stringify(mockEventData.formFields[index].values)}</p>
            <p><strong>Translated Values:</strong> ${JSON.stringify(field.values)}</p>` : ''}
          </div>
        `;
      }).join('');
      
      setTranslationObjectResult(`
        <h3>Translation Object Test Results:</h3>
        ${results}
      `);
      
    } catch (error) {
      console.error('Translation object test failed:', error);
      setTranslationObjectResult('Translation object test failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // Test direct HTML translation
  const handleDirectHtmlTest = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing direct HTML translation...');
      
      // Test 1: Simple text
      const simpleText = "Mục đích thu thập thông tin";
      const simpleResult = await translationService.translate(simpleText, 'en');
      console.log('✅ Simple text result:', simpleResult);
      
      // Test 2: Extract text from HTML manually
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const extractedText = tempDiv.textContent || tempDiv.innerText || '';
      console.log('📝 Extracted text:', extractedText);
      
      const extractedResult = await translationService.translate(extractedText, 'en');
      console.log('✅ Extracted text translation:', extractedResult);
      
      setTranslatedHtml(`
        <div>
          <h3>Test Results:</h3>
          <p><strong>Simple text:</strong> ${simpleText} → ${simpleResult}</p>
          <p><strong>Extracted text:</strong> ${extractedText} → ${extractedResult}</p>
          <p><strong>Original HTML:</strong> ${htmlContent}</p>
        </div>
      `);
    } catch (error) {
      console.error('Direct HTML test failed:', error);
      setTranslatedHtml('Direct test failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-6">Test Translation</h1>
        
        {/* Simple Text Translation */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Simple Text Translation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Text (Vietnamese)
              </label>
              <input
                type="text"
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleTranslate}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              <span>{isLoading ? 'Translating...' : 'Translate to English'}</span>
            </button>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Translated Text (English)
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[40px]">
                {translatedText || 'Translation will appear here...'}
              </div>
            </div>
          </div>
        </div>

        {/* Translation Object Test */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Translation Object Test</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This test verifies that fields with translation objects use the pre-defined translations instead of Google Translate.
            </p>
            
            <button
              onClick={handleTestTranslationObject}
              disabled={isLoading}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              <span>{isLoading ? 'Testing...' : 'Test Translation Object Logic'}</span>
            </button>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Translation Object Results
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[200px]">
                <div dangerouslySetInnerHTML={{ __html: translationObjectResult || 'Translation object test results will appear here...' }} />
              </div>
            </div>
          </div>
        </div>

        {/* HTML Content Translation */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Agreement HTML Content Translation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original HTML Content (Vietnamese)
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleTranslateHtml}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                <span>{isLoading ? 'Translating HTML...' : 'Translate via Event Data'}</span>
              </button>
              
              <button
                onClick={handleDirectHtmlTest}
                disabled={isLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                <span>{isLoading ? 'Testing...' : 'Direct HTML Test'}</span>
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Translation Result
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[120px]">
                <div dangerouslySetInnerHTML={{ __html: translatedHtml || 'Translation result will appear here...' }} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raw Output
              </label>
              <pre className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-xs overflow-x-auto max-h-40">
                {translatedHtml || 'Raw output will appear here...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 