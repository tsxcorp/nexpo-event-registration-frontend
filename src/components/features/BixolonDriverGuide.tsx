'use client';

import { useState, useEffect } from 'react';
import { nativePrintService } from '@/lib/print/native-print-service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface BixolonDriverGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverInstalled: () => void;
  currentLanguage?: 'vi' | 'en';
}

export default function BixolonDriverGuide({ 
  isOpen, 
  onClose, 
  onDriverInstalled,
  currentLanguage = 'vi' 
}: BixolonDriverGuideProps) {
  const [setupGuide, setSetupGuide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadSetupGuide();
    }
  }, [isOpen]);

  const loadSetupGuide = async () => {
    setIsLoading(true);
    try {
      const result = await nativePrintService.checkBixolonPrinter();
      if (result.setupGuide) {
        setSetupGuide(result.setupGuide);
      }
    } catch (error) {
      console.error('Failed to load setup guide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDriver = () => {
    if (setupGuide?.downloadUrl) {
      window.open(setupGuide.downloadUrl, '_blank');
    }
  };

  const handleNextStep = () => {
    if (setupGuide?.steps && currentStep < setupGuide.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCheckDriver = async () => {
    setIsLoading(true);
    try {
      const result = await nativePrintService.checkBixolonPrinter();
      if (result.hasBixolon) {
        onDriverInstalled();
        onClose();
      } else {
        alert('BIXOLON driver chưa được cài đặt. Vui lòng làm theo hướng dẫn bên dưới.');
      }
    } catch (error) {
      console.error('Failed to check driver:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Cài đặt BIXOLON Driver
                </h2>
                <p className="text-sm text-gray-600">
                  Để in badge tự động, bạn cần cài đặt BIXOLON driver
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải hướng dẫn...</p>
            </div>
          ) : setupGuide ? (
            <div className="space-y-6">
              {/* System Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Thông tin hệ thống</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Hệ điều hành:</span>
                    <span className="ml-2 font-medium">{setupGuide.platform?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Kiến trúc:</span>
                    <span className="ml-2 font-medium">{setupGuide.arch?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Bước 1: Tải xuống Driver</h3>
                <p className="text-blue-800 text-sm mb-4">
                  Tải xuống BIXOLON driver phù hợp với hệ điều hành của bạn
                </p>
                <Button
                  onClick={handleDownloadDriver}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  📥 Tải xuống BIXOLON Driver
                </Button>
              </div>

              {/* Installation Steps */}
              {setupGuide.instructions?.steps && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Hướng dẫn cài đặt</h3>
                  {setupGuide.instructions.steps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        index === currentStep
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === currentStep
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {step.title}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              {setupGuide.instructions?.steps && setupGuide.instructions.steps.length > 1 && (
                <div className="flex justify-between">
                  <Button
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
                  >
                    ← Bước trước
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={currentStep === setupGuide.instructions.steps.length - 1}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    Bước tiếp →
                  </Button>
                </div>
              )}

              {/* Check Driver Button */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Kiểm tra cài đặt</h3>
                <p className="text-green-800 text-sm mb-4">
                  Sau khi cài đặt driver, click nút bên dưới để kiểm tra
                </p>
                <Button
                  onClick={handleCheckDriver}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? 'Đang kiểm tra...' : '✅ Kiểm tra BIXOLON Driver'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Không thể tải hướng dẫn
              </h3>
              <p className="text-gray-600 mb-4">
                Vui lòng thử lại hoặc liên hệ hỗ trợ kỹ thuật
              </p>
              <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white">
                Đóng
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
