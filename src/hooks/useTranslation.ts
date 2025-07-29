import { useState, useEffect, useCallback } from 'react';
import { EventData } from '@/lib/api/events';
import translationService from '@/lib/translation/translationService';
import { initializeFieldMappings } from '@/lib/utils/conditionalDisplay';

/**
 * Detect the language of the content based on text analysis
 * @param eventData - Event data to analyze
 * @returns Detected language code
 */
function detectContentLanguage(eventData: EventData): string {
  if (!eventData) return 'vi'; // Default fallback
  
  // Check for Vietnamese characteristics in event name and description
  const textToAnalyze = [
    eventData.name || '',
    eventData.description || '',
    ...(eventData.formFields?.slice(0, 3).map(f => f.label) || []) // Check first few field labels
  ].join(' ').toLowerCase();
  
  // Vietnamese indicators
  const vietnameseIndicators = [
    'việt nam', 'vietnam', 'triển lãm', 'đăng ký', 'thông tin', 'công ty',
    'sự kiện', 'tham quan', 'giao thương', 'chính sách', 'điều khoản',
    'ô', 'ă', 'â', 'ê', 'ô', 'ư', 'á', 'à', 'ả', 'ã', 'ạ'
  ];
  
  // English indicators  
  const englishIndicators = [
    'exhibition', 'registration', 'company', 'information', 'event',
    'privacy', 'policy', 'terms', 'visit', 'trade', 'automation'
  ];
  
  let vietnameseScore = 0;
  let englishScore = 0;
  
  // Score based on indicators
  vietnameseIndicators.forEach(indicator => {
    if (textToAnalyze.includes(indicator)) {
      vietnameseScore += indicator.length > 1 ? 2 : 1;
    }
  });
  
  englishIndicators.forEach(indicator => {
    if (textToAnalyze.includes(indicator)) {
      englishScore += 1;
    }
  });
  
  console.log('🔍 Language detection:', {
    textSample: textToAnalyze.substring(0, 100),
    vietnameseScore,
    englishScore,
    detected: vietnameseScore > englishScore ? 'vi' : 'en'
  });
  
  return vietnameseScore > englishScore ? 'vi' : 'en';
}

export function useTranslation(initialEventData: EventData | null) {
  const [eventData, setEventData] = useState<EventData | null>(null);
  // Always start with Vietnamese - no localStorage persistence
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [formValuesMigrationCallback, setFormValuesMigrationCallback] = useState<((oldFields: any[], newFields: any[]) => void) | null>(null);
  const [languageInitialized, setLanguageInitialized] = useState(false);

  // Initialize language and event data when initial data becomes available
  useEffect(() => {
    if (initialEventData && !languageInitialized) {
      console.log('🌐 Initializing with Vietnamese as default language');
      
      // Always start with original data in Vietnamese
        setEventData(initialEventData);
      console.log('✅ Using original event data');
      
      setLanguageInitialized(true);
    }
  }, [initialEventData, languageInitialized]);

  // Initialize field mappings when event data changes
  useEffect(() => {
    if (eventData && eventData.formFields) {
      console.log('🗃️ Initializing field mappings for conditional logic...');
      initializeFieldMappings(eventData.formFields);
    }
  }, [eventData]);

  // Register form values migration callback
  const registerFormValuesMigration = useCallback((callback: (oldFields: any[], newFields: any[]) => void) => {
    console.log('📝 Registering form values migration callback');
    setFormValuesMigrationCallback(() => callback);
  }, []);

  // Translate event data
  const translateEventData = useCallback(async (targetLanguage: string) => {
    if (!initialEventData || targetLanguage === currentLanguage) {
      console.log('⏭️ Skipping translation - no data or same language');
      return;
    }

    console.log('🚀 Starting translation process:', { from: currentLanguage, to: targetLanguage });
    setIsTranslating(true);

    try {
      // Store original fields for migration
      const originalFields = eventData?.formFields || initialEventData.formFields || [];
      console.log('📋 Original fields count:', originalFields.length);
      
      // Always translate from the original event data to ensure consistency
      const sourceData = initialEventData;
      
      // Translate the event data
      const translatedData = await translationService.translateEventData(sourceData, targetLanguage);
      console.log('✅ Translation completed');
      
      // Update field mappings after translation
      if (translatedData.formFields) {
        console.log('🔄 Updating field mappings after translation...');
        initializeFieldMappings(translatedData.formFields);
        
        // Migrate form values if callback is registered
        if (formValuesMigrationCallback) {
          console.log('🔄 Calling form values migration callback...');
          formValuesMigrationCallback(originalFields, translatedData.formFields);
        } else {
          console.log('ℹ️ No form values migration callback registered yet');
        }
      }
      
      // Update state
      console.log('🔄 Updating eventData state with translated data...');
      setEventData(translatedData);
      setCurrentLanguage(targetLanguage);
      
      console.log('✅ Translation process completed successfully');

    } catch (error) {
      console.error('❌ Translation failed:', error);
      // Fallback to original data if translation fails
      setEventData(initialEventData);
    } finally {
      setIsTranslating(false);
    }
  }, [initialEventData, currentLanguage, formValuesMigrationCallback, eventData]);

  return {
    eventData,
    setEventData,
    currentLanguage,
    isTranslating,
    translateEventData,
    registerFormValuesMigration,
  };
} 