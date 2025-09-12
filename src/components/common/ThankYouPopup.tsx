'use client';

import { useState, useEffect } from 'react';
import { i18n } from '@/lib/translation/i18n';

interface ThankYouPopupProps {
  isOpen: boolean;
  onClose: () => void;
  eventData?: {
    name?: string;
    date?: string;
    location?: string;
  };
  registrationData?: {
    Full_Name?: string;
    Email?: string;
    zoho_record_id?: string;
  };
  currentLanguage?: string;
  showCloseButton?: boolean;
  autoCloseDelay?: number; // in milliseconds, 0 means no auto close
}

export default function ThankYouPopup({
  isOpen,
  onClose,
  eventData,
  registrationData,
  currentLanguage = 'vi',
  showCloseButton = true,
  autoCloseDelay = 0
}: ThankYouPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Don't prevent body scroll - allow normal interaction
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      setCountdown(Math.ceil(autoCloseDelay / 1000));
      
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6 rounded-t-3xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {i18n[currentLanguage]?.registration_successful || 'Đăng ký thành công!'}
          </h2>
          <p className="text-green-100 text-sm">
            {i18n[currentLanguage]?.thank_you_message || 'Cảm ơn bạn đã đăng ký tham gia sự kiện'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Event Info */}
          {eventData && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs">📅</span>
                </div>
                {i18n[currentLanguage]?.event_info || 'Thông tin sự kiện'}
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {eventData.name && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm font-medium">Sự kiện:</span>
                    <span className="text-gray-900 font-semibold">{eventData.name}</span>
                  </div>
                )}
                {eventData.date && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm font-medium">Ngày:</span>
                    <span className="text-gray-900">{eventData.date}</span>
                  </div>
                )}
                {eventData.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm font-medium">Địa điểm:</span>
                    <span className="text-gray-900">{eventData.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Registration Info */}
          {registrationData && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">👤</span>
                </div>
                {i18n[currentLanguage]?.registration_info || 'Thông tin đăng ký'}
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {registrationData.Full_Name && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm font-medium">Họ tên:</span>
                    <span className="text-gray-900 font-semibold">{registrationData.Full_Name}</span>
                  </div>
                )}
                {registrationData.Email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm font-medium">Email:</span>
                    <span className="text-gray-900">{registrationData.Email}</span>
                  </div>
                )}
                {registrationData.zoho_record_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm font-medium">Mã đăng ký:</span>
                    <span className="text-gray-900 font-mono text-sm">{registrationData.zoho_record_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="text-center mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 text-sm font-medium">
                {i18n[currentLanguage]?.success_message || 'Bạn sẽ nhận được email xác nhận trong vài phút tới. Vui lòng kiểm tra hộp thư của bạn.'}
              </p>
            </div>
          </div>

          {/* Close Button */}
          {showCloseButton && (
            <div className="text-center">
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {i18n[currentLanguage]?.close || 'Đóng'}
              </button>
            </div>
          )}

          {/* Auto close countdown */}
          {autoCloseDelay > 0 && (
            <div className="text-center mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm font-medium">
                  {i18n[currentLanguage]?.auto_close_message || 'Popup sẽ tự động đóng sau'} 
                  <span className="font-bold text-blue-800 ml-1">{countdown}s</span>
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / Math.ceil(autoCloseDelay / 1000)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
