'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ZohoImage from '@/components/ui/ZohoImage';
import { ExhibitorData } from '@/lib/api/events';

interface ExhibitorDetailModalProps {
  exhibitor: ExhibitorData;
  onClose: () => void;
}

export default function ExhibitorDetailModal({ exhibitor, onClose }: ExhibitorDetailModalProps) {
  const [videoError, setVideoError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const cleanUrl = url.replace(/<[^>]*>/g, '');
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = cleanUrl.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(exhibitor.introduction_video);

  // Strip HTML tags from descriptions
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  // Get description based on available language
  const getDescription = () => {
    if (exhibitor.vie_company_description) {
      return stripHtml(exhibitor.vie_company_description);
    }
    return stripHtml(exhibitor.eng_company_description);
  };

  // Get products based on available language
  const getProducts = () => {
    if (exhibitor.vie_display_products) {
      return exhibitor.vie_display_products;
    }
    return exhibitor.eng_display_products;
  };

  // Clean website URL
  const getWebsiteUrl = () => {
    if (!exhibitor.website) return '';
    const cleanUrl = exhibitor.website.replace(/<[^>]*>/g, '').trim();
    if (cleanUrl && !cleanUrl.startsWith('http')) {
      return `https://${cleanUrl}`;
    }
    return cleanUrl;
  };

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Touch handlers for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;
    
    // Only allow downward swipes
    if (deltaY > 0) {
      setDragCurrentY(deltaY);
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If dragged more than 100px, close modal
    if (dragCurrentY > 100) {
      handleClose();
    } else {
      // Snap back to original position
      if (modalRef.current) {
        modalRef.current.style.transform = 'translateY(0)';
      }
    }
    
    setDragCurrentY(0);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      handleClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${
        isVisible && !isClosing ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-lg mx-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl transform transition-all duration-300 max-h-[90vh] flex flex-col ${
          isVisible && !isClosing 
            ? 'translate-y-0 opacity-100' 
            : isClosing 
              ? 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95' 
              : 'translate-y-full opacity-0 sm:translate-y-8 sm:scale-95'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 sm:hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12 h-12">
              <ZohoImage
                src={exhibitor.company_logo}
                alt={`${exhibitor.display_name} logo`}
                className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200"
                fallbackText={exhibitor.display_name.charAt(0)}
                fallbackClassName="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-lg font-semibold"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {exhibitor.display_name}
              </h2>
              <p className="text-sm text-gray-500 truncate">{exhibitor.country}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-100">
          {[
            { id: 'info', label: 'Thông tin', icon: '📋' },
            { id: 'contact', label: 'Liên hệ', icon: '📞' },
            { id: 'media', label: 'Media', icon: '🎬' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Cover Image */}
              {exhibitor.cover_image && (
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video">
                  <ZohoImage
                    src={exhibitor.cover_image}
                    alt={`${exhibitor.display_name} cover`}
                    className="w-full h-full"
                    fallbackText=""
                    fallbackClassName="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                    sizes="(max-width: 768px) 100vw, 500px"
                    objectFit="cover"
                  />
                </div>
              )}

              {/* Products */}
              {getProducts() && (
                <div className="bg-blue-50 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Sản phẩm & Dịch vụ</h3>
                  <p className="text-blue-800">{getProducts()}</p>
                </div>
              )}

              {/* Company Description */}
              {getDescription() && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Giới thiệu công ty</h3>
                  <p className="text-gray-700 leading-relaxed">{getDescription()}</p>
                </div>
              )}

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Địa chỉ</h3>
                <div className="space-y-3 text-gray-700">
                  {exhibitor.vie_address && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Tiếng Việt</p>
                      <p>{exhibitor.vie_address}</p>
                    </div>
                  )}
                  {exhibitor.eng_address && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">English</p>
                      <p>{exhibitor.eng_address}</p>
                    </div>
                  )}
                  {exhibitor.zip_code && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">Mã bưu điện:</span>
                      <span className="font-medium">{exhibitor.zip_code}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="grid gap-4">
                {exhibitor.email && (
                  <a 
                    href={`mailto:${exhibitor.email}`}
                    className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-500">{exhibitor.email}</p>
                    </div>
                  </a>
                )}
                
                {exhibitor.tel && (
                  <a 
                    href={`tel:${exhibitor.tel}`}
                    className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Điện thoại</p>
                      <p className="text-sm text-gray-500">{exhibitor.tel}</p>
                    </div>
                  </a>
                )}
                
                {exhibitor.mobile && (
                  <a 
                    href={`tel:${exhibitor.mobile}`}
                    className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Di động</p>
                      <p className="text-sm text-gray-500">{exhibitor.mobile}</p>
                    </div>
                  </a>
                )}
                
                {getWebsiteUrl() && (
                  <a 
                    href={getWebsiteUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Website</p>
                      <p className="text-sm text-gray-500">{getWebsiteUrl().replace(/^https?:\/\//, '')}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Introduction Video */}
              {videoId && !videoError && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Video giới thiệu</h3>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={`${exhibitor.display_name} introduction video`}
                      className="w-full h-full"
                      allowFullScreen
                      onError={() => setVideoError(true)}
                    />
                  </div>
                </div>
              )}
              
              {/* Gallery placeholder */}
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Không có media khác</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-4 sm:p-6">
          <div className="flex space-x-3">
            {getWebsiteUrl() && (
              <Button
                onClick={() => window.open(getWebsiteUrl(), '_blank')}
                variant="outline"
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Website
              </Button>
            )}
            {exhibitor.email && (
              <Button
                onClick={() => window.open(`mailto:${exhibitor.email}`, '_blank')}
                variant="primary"
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Liên hệ
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 