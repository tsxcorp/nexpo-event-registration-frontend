'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Dynamically import react-pdf to avoid SSR issues
const DynamicDocument = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Document })),
  { ssr: false }
);

const DynamicPage = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Page })),
  { ssr: false }
);

// Configure PDF.js worker only on client side
const configurePdfWorker = () => {
  if (typeof window !== 'undefined') {
    import('react-pdf').then((pdfjs) => {
      pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.js`;
    });
  }
};

interface FileViewerProps {
  title: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'image' | 'unknown';
  onClose: () => void;
}

export default function FileViewer({ title, fileUrl, fileType = 'unknown', onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState<'advanced' | 'iframe' | 'download'>('iframe');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client side
  useEffect(() => {
    setIsClient(true);
    configurePdfWorker();
  }, []);

  // Determine best viewer mode for PDF
  useEffect(() => {
    if (fileType === 'pdf' && fileUrl && isClient) {
      // Check if it's a Zoho or download link
      if (fileUrl.includes('zoho') || fileUrl.includes('download') || fileUrl.includes('attachment')) {
        // For Zoho/download links, use Google Drive viewer first
        setViewerMode('iframe');
        const googleViewerUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(fileUrl)}`;
        setPdfData(googleViewerUrl);
        setLoading(false);
      } else if (fileUrl.endsWith('.pdf')) {
        // Direct PDF links - try advanced viewer
        setViewerMode('advanced');
        setPdfData(fileUrl);
        setLoading(false);
      } else {
        // Unknown format - use iframe
        setViewerMode('iframe');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [fileUrl, fileType, isClient]);

  const fetchPdfData = useCallback(async (url: string) => {
    try {
      setLoading(true);
      
      // Try to fetch the PDF
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/pdf,*/*',
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        
        // Check if it's actually a PDF
        if (blob.type.includes('pdf') || blob.size > 1000) {
          const dataUrl = URL.createObjectURL(blob);
          setPdfData(dataUrl);
          setLoading(false);
          return;
        }
      }
      
      throw new Error('Not a valid PDF or fetch failed');
    } catch (err) {
      console.log('Advanced PDF viewer failed, falling back to iframe:', err);
             // Fallback to iframe
       setViewerMode('iframe');
       setPdfData(fileUrl || null);
       setLoading(false);
    }
  }, [fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(false);
  };

  const onDocumentLoadError = (error: any) => {
    console.log('PDF document load error, falling back to iframe:', error);
    setError(false);
    setViewerMode('iframe');
    setPdfData(fileUrl || null);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const changePage = (delta: number) => {
    setPageNumber(prevPage => {
      const newPage = prevPage + delta;
      if (newPage < 1) return 1;
      if (numPages && newPage > numPages) return numPages;
      return newPage;
    });
  };

  const changeScale = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(3.0, newScale)));
  };

  const switchToIframe = () => {
    setViewerMode('iframe');
    setPdfData(fileUrl || null);
    setLoading(false);
    setError(false);
  };

  const renderAdvancedPdfViewer = () => {
    if (!pdfData || !isClient) return null;

    return (
      <div className="flex flex-col h-full">
        {/* PDF Controls */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              variant="outline"
              className="px-2 py-1 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              {numPages ? `${pageNumber} / ${numPages}` : pageNumber}
            </span>
            
            <Button
              onClick={() => changePage(1)}
              disabled={numPages ? pageNumber >= numPages : false}
              variant="outline"
              className="px-2 py-1 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => changeScale(scale - 0.2)}
              disabled={scale <= 0.5}
              variant="outline"
              className="px-2 py-1 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            
            <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button
              onClick={() => changeScale(scale + 0.2)}
              disabled={scale >= 3.0}
              variant="outline"
              className="px-2 py-1 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>

            <Button
              onClick={switchToIframe}
              variant="outline"
              className="px-2 py-1 text-xs ml-2"
              title="Switch to browser PDF viewer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </Button>
          </div>
        </div>

        {/* PDF Document */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            <DynamicDocument
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" text="Đang tải PDF..." />
                </div>
              }
            >
              <DynamicPage
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
              />
            </DynamicDocument>
          </div>
        </div>
      </div>
    );
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
          <p className="text-sm text-gray-500 mt-2">Tài liệu có thể cần được download</p>
          <div className="space-y-2 mt-4">
            <Button 
              onClick={() => window.open(fileUrl, '_blank')}
              variant="primary"
            >
              Tải xuống tài liệu
            </Button>
            <Button 
              onClick={() => {
                setError(false);
                setLoading(true);
                if (fileType === 'pdf' && fileUrl) {
                  setViewerMode('iframe');
                  setPdfData(fileUrl);
                }
              }}
              variant="outline"
            >
              Thử lại
            </Button>
          </div>
        </div>
      );
    }

    // Advanced PDF viewer
    if (fileType === 'pdf' && viewerMode === 'advanced' && isClient) {
      return (
        <div className="h-[70vh] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <LoadingSpinner size="lg" text="Đang tải PDF..." />
            </div>
          )}
          {renderAdvancedPdfViewer()}
        </div>
      );
    }

    // Fallback rendering for iframe mode or other types
    return (
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <LoadingSpinner size="lg" text="Đang tải tài liệu..." />
          </div>
        )}
        
                {fileType === 'pdf' && (
          <iframe
            src={pdfData || fileUrl}
            className="w-full h-96 border-0 rounded-lg"
            onLoad={handleLoad}
            onError={handleError}
            title={title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
      <Card className="max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
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
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 space-x-3 flex-shrink-0">
          {fileUrl && (
            <Button
              onClick={() => window.open(fileUrl, '_blank')}
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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