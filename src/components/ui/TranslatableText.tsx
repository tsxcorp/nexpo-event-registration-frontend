'use client';

import { useState } from 'react';
import TranslationEditor from './TranslationEditor';

interface TranslatableTextProps {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  onTranslationUpdate: (newTranslation: string) => void;
  className?: string;
  showEditButton?: boolean;
}

export default function TranslatableText({
  originalText,
  translatedText,
  targetLanguage,
  onTranslationUpdate,
  className = '',
  showEditButton = false,
}: TranslatableTextProps) {
  const [showEditor, setShowEditor] = useState(false);

  const handleEditClick = () => {
    setShowEditor(true);
  };

  const handleTranslationUpdate = (newTranslation: string) => {
    onTranslationUpdate(newTranslation);
  };

  return (
    <>
      <span className={`relative group ${className}`}>
        {translatedText}
        
        {showEditButton && (
          <button
            onClick={handleEditClick}
            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 text-xs"
            title="Chỉnh sửa bản dịch"
          >
            ✏️
          </button>
        )}
      </span>

      {showEditor && (
        <TranslationEditor
          originalText={originalText}
          currentTranslation={translatedText}
          targetLanguage={targetLanguage}
          onTranslationUpdate={handleTranslationUpdate}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
} 