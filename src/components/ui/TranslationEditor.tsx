'use client';

import { useState, useEffect } from 'react';
import translationService from '@/lib/translation/translationService';
import Button from './Button';
import Card from './Card';

interface TranslationEditorProps {
  originalText: string;
  currentTranslation: string;
  targetLanguage: string;
  onTranslationUpdate: (newTranslation: string) => void;
  onClose: () => void;
}

export default function TranslationEditor({
  originalText,
  currentTranslation,
  targetLanguage,
  onTranslationUpdate,
  onClose,
}: TranslationEditorProps) {
  const [editedTranslation, setEditedTranslation] = useState(currentTranslation);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Get translation suggestions
    const suggestions = translationService.getTranslationSuggestions(originalText, targetLanguage);
    setSuggestions(suggestions);
  }, [originalText, targetLanguage]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Add custom translation
      translationService.addCustomTranslation(originalText, targetLanguage, editedTranslation);
      
      // Update the current translation
      onTranslationUpdate(editedTranslation);
      
      // Close the editor
      onClose();
    } catch (error) {
      console.error('Failed to save translation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEditedTranslation(suggestion);
  };

  const languageNames: { [key: string]: string } = {
    'vi': 'Tiếng Việt',
    'en': 'English',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Chỉnh sửa bản dịch
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Original Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Văn bản gốc:
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-gray-900">
              {originalText}
            </div>
          </div>

          {/* Target Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngôn ngữ đích: {languageNames[targetLanguage]}
            </label>
          </div>

          {/* Translation Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bản dịch:
            </label>
            <textarea
              value={editedTranslation}
              onChange={(e) => setEditedTranslation(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Nhập bản dịch..."
            />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gợi ý:
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !editedTranslation.trim()}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu bản dịch'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 