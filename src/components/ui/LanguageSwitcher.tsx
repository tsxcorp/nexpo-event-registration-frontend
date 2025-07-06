'use client';

import { useState, useEffect, useRef } from 'react';

interface LanguageSwitcherProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  isTranslating?: boolean;
}

const languages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export default function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  isTranslating = false,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useGoogleTranslate, setUseGoogleTranslate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Google Translate API key is available
    const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
    setUseGoogleTranslate(hasApiKey);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === currentLanguage || isTranslating) return;
    
    setIsOpen(false);
    await onLanguageChange(newLanguage);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Circular Button */}
      <button
        onClick={() => !isTranslating && setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-200 flex items-center justify-center relative disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Current: ${currentLang?.name}`}
      >
        {/* Current Language Flag */}
        <span className="text-2xl">
          {currentLang?.flag}
        </span>
        
        {/* Loading Spinner Overlay */}
        {isTranslating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-full">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Dropdown Arrow */}
        {!isTranslating && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg 
              className={`w-2 h-2 text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
        

      </button>

      {/* Dropdown Menu */}
      {isOpen && !isTranslating && (
        <div className="absolute top-14 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] z-50 animate-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                lang.code === currentLanguage ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {lang.code === currentLanguage && (
                <span className="ml-auto text-blue-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 