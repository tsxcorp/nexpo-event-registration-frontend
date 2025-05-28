'use client';

import Header from '@/components/layouts/Header';

export default function EventPage({ params }: { params: { eventId: string } }) {
  // In a real implementation, you would fetch the event details using params.eventId
  const event = {
    id: params.eventId,
    name: 'Nexpo Tech Conference 2024',
    date: '2024-03-15',
    location: 'HCMC, Vietnam',
    type: 'conference'
  };

  return (
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
  );
} 