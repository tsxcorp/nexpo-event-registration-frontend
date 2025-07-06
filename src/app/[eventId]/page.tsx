'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/layouts/Header';
import Head from 'next/head';

export default function EventPage() {
  const params = useParams();
  const eventId = params?.eventId as string;

  // In a real implementation, you would fetch the event details using eventId
  const event = {
    id: eventId,
    name: 'Nexpo Tech Conference 2024',
    date: '2024-03-15',
    location: 'HCMC, Vietnam',
    type: 'conference',
    favicon: '', // Add favicon property for demonstration
  };

  // Use event.name for title and event.favicon for favicon (fallback to default)
  const pageTitle = event.name || 'Nexpo Event Registration';
  const faviconUrl = event.favicon || '/nexpo-favicon.ico';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <link rel="icon" href={faviconUrl} />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">{event.name}</h1>
            <p className="mt-4 text-lg text-gray-600">
              {event.date} - {event.location}
            </p>
            {/* Add your event registration form or content here */}
          </div>
        </main>
      </div>
    </>
  );
} 