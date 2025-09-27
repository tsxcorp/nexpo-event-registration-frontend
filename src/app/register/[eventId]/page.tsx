'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { EventData, eventApi } from '@/lib/api/events';
import EventInfo from '@/components/features/EventInfo';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StructuredData from '@/components/seo/StructuredData';
import { useTranslation } from '@/hooks/useTranslation';
import { useEventMetadata } from '@/hooks/useEventMetadata';
import { i18n } from '@/lib/translation/i18n';

export default function RegisterPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const [originalEventData, setOriginalEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const formMigrationRef = useRef<((oldFields: any[], newFields: any[]) => void) | null>(null);

  // Use translation hook with originalEventData for auto-detection
  const {
    eventData,
    setEventData,
    currentLanguage,
    isTranslating,
    translateEventData,
    registerFormValuesMigration,
  } = useTranslation(originalEventData);
  


  // Use metadata hook for dynamic favicon, title, and social sharing
  const { generateShareUrls } = useEventMetadata({ 
    event: eventData, 
    currentLanguage 
  });

  // Load event data first
  useEffect(() => {
    if (!eventId) return;
    
        setLoading(true);
        setError(false);
        
        // Test new API endpoint first, fallback to old API if it fails
        eventApi.getEventInfoRest(eventId)
          .then(res => {
            const event = res.event;
            setOriginalEventData(event);
            setError(false);
          })
          .catch(err => {
            // Fallback to original API
            return eventApi.getEventInfo(eventId);
          })
          .then(res => {
            if (res) {
              const event = res.event;
              setOriginalEventData(event);
              setError(false);
            }
          })
          .catch(err => {
            setError(true);
          })
      .finally(() => setLoading(false));
  }, [eventId]);

  // Force re-render when eventData changes
  useEffect(() => {
    if (eventData) {
      setForceUpdateKey(prev => prev + 1);
    }
  }, [eventData, eventId]);

  // Register form migration callback
  useEffect(() => {
    if (formMigrationRef.current) {
      registerFormValuesMigration(formMigrationRef.current);
    }
  }, [registerFormValuesMigration]);

  const handleLanguageChange = async (newLanguage: string) => {
    if (originalEventData) {
      await translateEventData(newLanguage);
    }
  };

  // Function to register form migration from RegistrationForm
  const setFormMigrationCallback = (callback: (oldFields: any[], newFields: any[]) => void) => {
    formMigrationRef.current = callback;
    registerFormValuesMigration(callback);
  };

  // Show loading while loading event data OR while translation is in progress
  if (loading || (originalEventData && !eventData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text={isTranslating 
            ? (i18n[currentLanguage]?.translating || 'Đang dịch nội dung...')
            : (i18n[currentLanguage]?.loading || 'Đang tải dữ liệu sự kiện...')
          }
        />
      </div>
    );
  }
  
  // Only show error if we have explicitly failed to load (not during language detection)
  if (error || (!loading && !originalEventData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            {i18n[currentLanguage]?.event_not_found || 'Không tìm thấy sự kiện.'}
          </p>
        </div>
      </div>
    );
  }

  // Render the page even if eventData is temporarily null during language switching
  const displayData = eventData || originalEventData;
  
  if (!displayData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text={i18n[currentLanguage]?.loading || 'Đang tải dữ liệu sự kiện...'}
        />
      </div>
    );
  }

  return (
    <>
      <StructuredData event={displayData} currentLanguage={currentLanguage} />
      
      {/* Complete Event Information with integrated Registration Form */}
      <EventInfo 
        event={displayData} 
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        isTranslating={isTranslating}
        eventId={eventId}
        onRegisterFormMigration={setFormMigrationCallback}
        key={`event-info-${currentLanguage}`}
      />
    </>
  );
} 