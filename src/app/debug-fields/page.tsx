'use client';

import { useEffect, useState } from 'react';
import { eventApi } from '@/lib/api/events';
import { initializeFieldMappings, parseCondition, evaluateCondition } from '@/lib/utils/conditionalDisplay';
import translationService from '@/lib/translation/translationService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DebugFieldsPage() {
  const [eventData, setEventData] = useState<any>(null);
  const [translatedData, setTranslatedData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAndTestData = async () => {
      try {
        // Load event data
        const result = await eventApi.getEventInfo('4433256000012332047');
        const originalData = result.event;
        setEventData(originalData);

        // Initialize field mappings
        initializeFieldMappings(originalData.formFields);

        // Test 1: Original Vietnamese conditional logic
        const purposeField = originalData.formFields.find((f: any) => f.field_id === 'aw2025_purpose');
        console.log('🔍 Purpose field found:', purposeField);

        // Test form values with Vietnamese labels
        const viFormValues = {
          'Mục đích tham quan': 'Tham quan thông thường' // No leading space
        };

        // Test condition parsing
        const condition1 = parseCondition('show if {aw2025_purpose} = "Kết nối giao thương"');
        const condition2 = parseCondition('show if {aw2025_purpose} = "Tham quan thông thường"');

        console.log('🔍 Parsed conditions:', { condition1, condition2 });

        // Test condition evaluation
        const result1 = evaluateCondition(condition1, viFormValues, originalData.formFields);
        const result2 = evaluateCondition(condition2, viFormValues, originalData.formFields);

        console.log('🔍 Vietnamese evaluation results:', { result1, result2 });

        // Translate to English
        const translatedEventData = await translationService.translateEventData(originalData, 'en');
        setTranslatedData(translatedEventData);

        // Initialize field mappings for translated data
        initializeFieldMappings(translatedEventData.formFields);

        // Test form values migration
        const migratedFormValues: Record<string, any> = { ...viFormValues };

        // Find the purpose field in translated data
        const translatedPurposeField = translatedEventData.formFields.find((f: any) => f.field_id === 'aw2025_purpose');
        console.log('🔍 Translated purpose field:', translatedPurposeField);

        // Simulate form migration
        if (translatedPurposeField && purposeField && purposeField.label !== translatedPurposeField.label) {
          console.log(`🔄 Migrating form value: "${purposeField.label}" → "${translatedPurposeField.label}"`);
          migratedFormValues[translatedPurposeField.label] = migratedFormValues[purposeField.label];
          delete migratedFormValues[purposeField.label];
        }

        console.log('🔍 Migrated form values:', migratedFormValues);

        // Test condition evaluation with migrated values
        const result3 = evaluateCondition(condition1, migratedFormValues, translatedEventData.formFields);
        const result4 = evaluateCondition(condition2, migratedFormValues, translatedEventData.formFields);

        console.log('🔍 English evaluation results:', { result3, result4 });

        // Test value trimming
        const formValuesWithSpace = {
          'Purpose of visit': ' Tham quan thông thường' // With leading space
        };

        const result5 = evaluateCondition(condition2, formValuesWithSpace, translatedEventData.formFields);
        console.log('🔍 Space trimming test result:', result5);

        setTestResults([
          { test: 'Vietnamese - Trade connection', result: result1, expected: false },
          { test: 'Vietnamese - Regular tour', result: result2, expected: true },
          { test: 'English - Trade connection', result: result3, expected: false },
          { test: 'English - Regular tour', result: result4, expected: true },
          { test: 'Space trimming test', result: result5, expected: true }
        ]);

      } catch (error) {
        console.error('❌ Test failed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAndTestData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text="Đang tải và kiểm tra dữ liệu..."
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Field Mapping & Conditional Logic</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Original Event Data</h2>
          {eventData && (
            <div className="text-sm">
              <p><strong>Event:</strong> {eventData.name}</p>
              <p><strong>Fields count:</strong> {eventData.formFields?.length}</p>
              <p><strong>Purpose field:</strong> {eventData.formFields?.find((f: any) => f.field_id === 'aw2025_purpose')?.label}</p>
            </div>
          )}
        </div>

        <div className="bg-blue-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Translated Event Data</h2>
          {translatedData && (
            <div className="text-sm">
              <p><strong>Event:</strong> {translatedData.name}</p>
              <p><strong>Fields count:</strong> {translatedData.formFields?.length}</p>
              <p><strong>Purpose field:</strong> {translatedData.formFields?.find((f: any) => f.field_id === 'aw2025_purpose')?.label}</p>
            </div>
          )}
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          {testResults.length > 0 ? (
            <div className="space-y-2">
              {testResults.map((test, index) => (
                <div key={index} className={`p-2 rounded ${test.result === test.expected ? 'bg-green-200' : 'bg-red-200'}`}>
                  <span className={test.result === test.expected ? '✅' : '❌'}></span>
                  <strong>{test.test}:</strong> {test.result ? 'TRUE' : 'FALSE'} 
                  (expected: {test.expected ? 'TRUE' : 'FALSE'})
                </div>
              ))}
            </div>
          ) : (
            <p>Running tests...</p>
          )}
        </div>
      </div>
    </div>
  );
} 