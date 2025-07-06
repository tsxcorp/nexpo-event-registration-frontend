import Head from 'next/head';
import { EventData } from '@/lib/api/events';

interface StructuredDataProps {
  event: EventData;
  currentLanguage?: string;
}

const StructuredData: React.FC<StructuredDataProps> = ({ event, currentLanguage = 'vi' }) => {
  if (!event) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.name,
    "description": event.description?.replace(/<[^>]*>/g, '') || '', // Strip HTML tags
    "image": event.banner || event.logo || '/nexpo-logo.png',
    "url": typeof window !== 'undefined' ? window.location.href : '',
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "organizer": {
      "@type": "Organization",
      "name": "NEXPO Events",
      "url": "https://nexpo.vn"
    },
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "price": "0",
      "priceCurrency": "VND",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    },
    "inLanguage": currentLanguage === 'en' ? 'en-US' : 'vi-VN'
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2)
        }}
      />
    </Head>
  );
};

export default StructuredData; 