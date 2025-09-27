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
      
      // Always start with original data in Vietnamese
        setEventData(initialEventData);
      
      setLanguageInitialized(true);
    }
  }, [initialEventData, languageInitialized]);

  // Initialize field mappings when event data changes
  useEffect(() => {
    if (eventData && eventData.formFields) {
      initializeFieldMappings(eventData.formFields);
    }
  }, [eventData]);

  // Register form values migration callback
  const registerFormValuesMigration = useCallback((callback: (oldFields: any[], newFields: any[]) => void) => {
    setFormValuesMigrationCallback(() => callback);
  }, []);

  // Translate event data
  const translateEventData = useCallback(async (targetLanguage: string) => {
    if (!initialEventData || targetLanguage === currentLanguage) {
      return;
    }

    setIsTranslating(true);

    try {
      // Store original fields for migration
      const originalFields = eventData?.formFields || initialEventData.formFields || [];
      
      // Always translate from the original event data to ensure consistency
      const sourceData = initialEventData;
      
      // Translate the event data
      const translatedData = await translationService.translateEventData(sourceData, targetLanguage);
      
      // Update field mappings after translation
      if (translatedData.formFields) {
        initializeFieldMappings(translatedData.formFields);
        
        // Migrate form values if callback is registered
        if (formValuesMigrationCallback) {
          formValuesMigrationCallback(originalFields, translatedData.formFields);
        } else {
        }
      }
      
      // Update state
      setEventData(translatedData);
      setCurrentLanguage(targetLanguage);
      

    } catch (error) {
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