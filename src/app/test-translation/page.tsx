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
        }]
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