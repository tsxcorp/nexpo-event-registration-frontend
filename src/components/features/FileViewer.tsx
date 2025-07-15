'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface FileViewerProps {
  title: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'image' | 'unknown';
  onClose: () => void;
}

export default function FileViewer({ title, fileUrl, fileType = 'unknown', onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const renderContent = () => {
    if (!fileUrl) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">Tài liệu chưa có sẵn</p>
          <p className="text-sm text-gray-500 mt-2">Vui lòng liên hệ ban tổ chức để biết thêm chi tiết</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">Không thể tải tài liệu</p>
          <Button 
            onClick={() => {
              setError(false);
              setLoading(true);
            }}
            variant="outline"
            className="mt-4"
          >
            Thử lại
          </Button>
        </div>
      );
    }

    return (
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <LoadingSpinner size="lg" text="Đang tải tài liệu..." />
          </div>
        )}
        
        {fileType === 'pdf' && (
          <iframe
            src={fileUrl}
            className="w-full h-96 border-0 rounded-lg"
            onLoad={handleLoad}
            onError={handleError}
            title={title}
          />
        )}
        
        {fileType === 'image' && (
          <img
            src={fileUrl}
            alt={title}
            className="w-full h-auto rounded-lg"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
        
        {fileType === 'unknown' && (
          <div className="text-center py-8">
            <div className="text-blue-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">Tài liệu sẽ được mở trong tab mới</p>
            <Button 
              onClick={() => window.open(fileUrl, '_blank')}
              variant="primary"
            >
              Mở tài liệu
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 space-x-3">
          {fileUrl && (
            <Button
              onClick={() => window.open(fileUrl, '_blank')}
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Mở trong tab mới
            </Button>
          )}
          <Button onClick={onClose} variant="primary">
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
} 