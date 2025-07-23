import { useState, useEffect, useCallback } from 'react';
import { EventData } from '@/lib/api/events';
import { processEventLanguage, clearTranslationCache, getCacheStats } from '@/lib/utils/languageUtils';
import { i18n } from '@/lib/translation/i18n';

export function useInsightTranslation(originalEventData: EventData | null) {
  const [eventData, setEventData] = useState<EventData | null>(null);
  // Always start with Vietnamese - no localStorage persistence  
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'vi'>('vi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [languageInitialized, setLanguageInitialized] = useState(false);

  // Get translated text helper
  const t = useCallback((key: string, fallback?: string): string => {
    const translations = i18n[currentLanguage];
    if (translations && translations[key]) {
      return translations[key];
    }
    // Fallback to other language if not found
    const fallbackLanguage = currentLanguage === 'en' ? 'vi' : 'en';
    const fallbackTranslations = i18n[fallbackLanguage];
    if (fallbackTranslations && fallbackTranslations[key]) {
      return fallbackTranslations[key];
    }
    // Return fallback or key itself
    return fallback || key;
  }, [currentLanguage]);

  // Initialize with Vietnamese as default
  useEffect(() => {
    if (originalEventData && !languageInitialized) {
      console.log('🌐 Initializing insight with Vietnamese as default language');
      setLanguageInitialized(true);
      
      // Start with original data in Vietnamese
      setEventData(originalEventData);
      console.log('✅ Using original event data in Vietnamese');
    }
  }, [originalEventData, languageInitialized]);

  // Process initial data for given language
  const processInitialData = useCallback(async (language: 'en' | 'vi') => {
    if (!originalEventData) return;

    console.log(`🔄 Processing initial data for language: ${language}`);
    setIsTranslating(true);

    try {
      // For English: prioritize English fields, translate Vietnamese fallbacks
      // For Vietnamese: prioritize Vietnamese fields, translate English fallbacks
      const shouldTranslate = true; // Always enable translation for missing content
      
      const processedData = await processEventLanguage(
        originalEventData,
        language,
        shouldTranslate
      );

      console.log(`✅ Processed data for ${language}:`, {
        originalName: originalEventData.name,
        processedName: processedData.name,
        exhibitorsCount: processedData.exhibitors?.length || 0,
        sessionsCount: processedData.sessions?.length || 0
      });

      setEventData(processedData);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('❌ Error processing initial data:', error);
      // Fallback to original data
      setEventData(originalEventData);
    } finally {
      setIsTranslating(false);
    }
  }, [originalEventData]);

  // Translate to new language
  const translateEventData = useCallback(async (newLanguage: 'en' | 'vi') => {
    if (!originalEventData || currentLanguage === newLanguage) {
      return;
    }

    console.log(`🔄 Translating from ${currentLanguage} to ${newLanguage}`);
    setIsTranslating(true);

    try {
      const shouldTranslate = true;
      const processedData = await processEventLanguage(
        originalEventData,
        newLanguage,
        shouldTranslate
      );

      console.log(`✅ Translation completed for ${newLanguage}:`, {
        originalName: originalEventData.name,
        translatedName: processedData.name,
        cacheStats: getCacheStats()
      });

      setEventData(processedData);
      setCurrentLanguage(newLanguage);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      // Keep current data on failure
    } finally {
      setIsTranslating(false);
    }
  }, [originalEventData, currentLanguage]);

  // Manual trigger for re-processing (useful for cache refresh)
  const refreshTranslation = useCallback(async () => {
    if (!originalEventData) return;
    
    console.log('🔄 Refreshing translation for current language:', currentLanguage);
    await processInitialData(currentLanguage);
  }, [originalEventData, currentLanguage, processInitialData]);

  // Clear cache (useful for memory management)
  const clearCache = useCallback(() => {
    console.log('🗑️ Clearing translation cache');
    clearTranslationCache();
  }, []);

  // Get cache information
  const getCacheInfo = useCallback(() => {
    return getCacheStats();
  }, []);

  return {
    eventData,
    currentLanguage,
    isTranslating,
    translateEventData,
    refreshTranslation,
    clearCache,
    getCacheInfo,
    languageInitialized,
    t // Translation helper function
  };
} 