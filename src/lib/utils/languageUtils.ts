import translationService from '@/lib/translation/translationService';

// Language field mapping for different data types
export const LANGUAGE_FIELD_MAP = {
  // Company/Exhibitor fields
  company_name: { en: ['en_company_name', 'display_name'], vi: ['display_name', 'en_company_name'] },
  company_description: { en: ['eng_company_description'], vi: ['vie_company_description'] },
  company_address: { en: ['eng_address'], vi: ['vie_address'] },
  display_products: { en: ['eng_display_products'], vi: ['vie_display_products'] },
  
  // Event fields
  event_name: { en: ['name'], vi: ['name'] },
  event_description: { en: ['description'], vi: ['description'] },
  event_location: { en: ['location'], vi: ['location'] },
  
  // Session fields
  session_title: { en: ['title'], vi: ['title'] },
  session_description: { en: ['description'], vi: ['description'] },
  speaker_name: { en: ['speaker_name'], vi: ['speaker_name'] },
  area_name: { en: ['area_name'], vi: ['area_name'] },
  
  // Form fields
  field_label: { en: ['label'], vi: ['label'] },
  field_placeholder: { en: ['placeholder'], vi: ['placeholder'] },
  field_helptext: { en: ['helptext'], vi: ['helptext'] },
};

// Cache for translated content to avoid repeated API calls
const translationCache = new Map<string, string>();

/**
 * Get cache key for translation
 */
function getCacheKey(text: string, targetLanguage: string): string {
  return `${targetLanguage}:${text.substring(0, 100)}`;
}

/**
 * Get field value based on current language with smart fallback
 */
export function getLanguageField(
  data: any, 
  fieldType: keyof typeof LANGUAGE_FIELD_MAP, 
  currentLanguage: 'en' | 'vi'
): string {
  if (!data || !fieldType) return '';
  
  const fieldMapping = LANGUAGE_FIELD_MAP[fieldType];
  if (!fieldMapping) return '';
  
  // Try to get value in current language first
  const currentLangFields = fieldMapping[currentLanguage];
  for (const fieldName of currentLangFields) {
    const value = data[fieldName];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  
  // Fallback to other language
  const fallbackLang = currentLanguage === 'en' ? 'vi' : 'en';
  const fallbackFields = fieldMapping[fallbackLang];
  for (const fieldName of fallbackFields) {
    const value = data[fieldName];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  
  return '';
}

/**
 * Translate content if needed and cache result
 */
export async function translateAndCache(
  text: string, 
  targetLanguage: 'en' | 'vi',
  originalLanguage?: 'en' | 'vi'
): Promise<string> {
  if (!text || !text.trim()) return '';
  
  const cacheKey = getCacheKey(text, targetLanguage);
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  try {
    // If original language is same as target, no translation needed
    if (originalLanguage === targetLanguage) {
      translationCache.set(cacheKey, text);
      return text;
    }
    
    // Translate content
    const translated = await translationService.translate(text, targetLanguage);
    
    // Cache result
    translationCache.set(cacheKey, translated);
    
    return translated;
  } catch (error) {
    console.error('Translation failed:', error);
    // Return original text as fallback
    translationCache.set(cacheKey, text);
    return text;
  }
}

/**
 * Get smart language content with translation fallback
 */
export async function getSmartLanguageContent(
  data: any,
  fieldType: keyof typeof LANGUAGE_FIELD_MAP,
  targetLanguage: 'en' | 'vi',
  shouldTranslate: boolean = true
): Promise<string> {
  // First try to get content in target language
  const targetContent = getLanguageField(data, fieldType, targetLanguage);
  if (targetContent) {
    return targetContent;
  }
  
  // If not found, try fallback language
  const fallbackLanguage = targetLanguage === 'en' ? 'vi' : 'en';
  const fallbackContent = getLanguageField(data, fieldType, fallbackLanguage);
  
  if (!fallbackContent) {
    return '';
  }
  
  // If translation is enabled, translate the fallback content
  if (shouldTranslate) {
    return await translateAndCache(fallbackContent, targetLanguage, fallbackLanguage);
  }
  
  return fallbackContent;
}

/**
 * Process exhibitor data with smart language handling
 */
export async function processExhibitorLanguage(
  exhibitor: any,
  targetLanguage: 'en' | 'vi',
  shouldTranslate: boolean = true
): Promise<any> {
  const processed = { ...exhibitor };
  
  try {
    // Process each field that might need translation
    const fieldsToProcess = [
      { field: 'company_name', target: 'display_name' },
      { field: 'company_description', target: 'company_description' },
      { field: 'company_address', target: 'address' },
      { field: 'display_products', target: 'products' }
    ] as const;
    
    for (const { field, target } of fieldsToProcess) {
      const content = await getSmartLanguageContent(
        exhibitor, 
        field, 
        targetLanguage, 
        shouldTranslate
      );
      
      if (content) {
        processed[target] = content;
      }
    }
    
    return processed;
  } catch (error) {
    console.error('Error processing exhibitor language:', error);
    return processed;
  }
}

/**
 * Process event data with smart language handling
 */
export async function processEventLanguage(
  eventData: any,
  targetLanguage: 'en' | 'vi', 
  shouldTranslate: boolean = true
): Promise<any> {
  const processed = { ...eventData };
  
  try {
    // Process event fields
    const fieldsToProcess = [
      'event_name',
      'event_description', 
      'event_location'
    ] as const;
    
    for (const field of fieldsToProcess) {
      const content = await getSmartLanguageContent(
        eventData,
        field,
        targetLanguage,
        shouldTranslate
      );
      
      if (content) {
        const targetField = field.replace('event_', '');
        processed[targetField] = content;
      }
    }
    
    // Process exhibitors if present
    if (eventData.exhibitors && Array.isArray(eventData.exhibitors)) {
      processed.exhibitors = await Promise.all(
        eventData.exhibitors.map((exhibitor: any) => 
          processExhibitorLanguage(exhibitor, targetLanguage, shouldTranslate)
        )
      );
    }
    
    // Process sessions if present
    if (eventData.sessions && Array.isArray(eventData.sessions)) {
      processed.sessions = await Promise.all(
        eventData.sessions.map(async (session: any) => {
          const processedSession = { ...session };
          
          const sessionFields = [
            'session_title',
            'session_description',
            'speaker_name',
            'area_name'
          ] as const;
          
          for (const field of sessionFields) {
            const content = await getSmartLanguageContent(
              session,
              field,
              targetLanguage,
              shouldTranslate
            );
            
            if (content) {
              const targetField = field.replace('session_', '');
              processedSession[targetField] = content;
            }
          }
          
          return processedSession;
        })
      );
    }
    
    return processed;
  } catch (error) {
    console.error('Error processing event language:', error);
    return processed;
  }
}

/**
 * Clear translation cache (useful for memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys())
  };
} 