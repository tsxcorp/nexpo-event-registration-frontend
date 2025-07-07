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
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const formMigrationRef = useRef<((oldFields: any[], newFields: any[]) => void) | null>(null);

  // Load event data first
  useEffect(() => {
    if (!eventId) return;
    
    eventApi.getEventInfo(eventId)
      .then(res => {
        const event = res.event;
        console.log('📥 Event data loaded:', { 
          name: event.name, 
          fieldsCount: event.formFields?.length 
        });
        setOriginalEventData(event);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

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

  // Set event data when originalEventData is loaded
  useEffect(() => {
    if (originalEventData && !eventData) {
      setEventData(originalEventData);
    }
  }, [originalEventData, eventData, setEventData]);

  // Debug: Log eventData changes
  useEffect(() => {
    if (eventData) {
      console.log('🔄 RegisterPage: eventData updated:', {
        name: eventData.name,
        description: eventData.description?.substring(0, 100) + '...',
        fieldsCount: eventData.formFields?.length,
        fullDescription: eventData.description // Log full description for debugging
      });
      
      // Force re-render by updating key
      setForceUpdateKey(prev => prev + 1);
    }
  }, [eventData]);

  // Register form migration callback
  useEffect(() => {
    if (formMigrationRef.current) {
      registerFormValuesMigration(formMigrationRef.current);
    }
  }, [registerFormValuesMigration]);

  const handleLanguageChange = async (newLanguage: string) => {
    if (originalEventData) {
      console.log('🔄 Language change requested:', { from: currentLanguage, to: newLanguage });
      await translateEventData(newLanguage);
    }
  };

  // Function to register form migration from RegistrationForm
  const setFormMigrationCallback = (callback: (oldFields: any[], newFields: any[]) => void) => {
    formMigrationRef.current = callback;
    registerFormValuesMigration(callback);
  };

  if (loading) {
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
  
  if (!eventData) {
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

  return (
    <>
      <StructuredData event={eventData} currentLanguage={currentLanguage} />
      
      {/* Complete Event Information with integrated Registration Form */}
      <EventInfo 
        event={eventData} 
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        isTranslating={isTranslating}
        eventId={eventId}
        onRegisterFormMigration={setFormMigrationCallback}
        key={`event-info-${currentLanguage}-${forceUpdateKey}`}
      />
    </>
  );
} 