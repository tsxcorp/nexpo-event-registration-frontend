'use client';

import Header from '@/components/layouts/Header';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  // Extract event ID from the path (e.g., /register/4433256000008960019)
  const pathParts = pathname.split('/');
  const eventId = pathParts[2]; // Get the event ID after /register/
  
  // Get the event details from the sample events (you might want to fetch this from your API)
  const event = eventId ? {
    id: '4433256000008960019',
    name: 'Nexpo Tech Conference 2024',
    date: '2024-03-15',
    location: 'HCMC, Vietnam',
    type: 'conference'
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-9xl font-extrabold text-blue-700">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Page Not Found</h2>
          <p className="mt-4 text-lg text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="mt-8">
            {event ? (
              <Link
                href={`/register/${event.id}`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to {event.name}
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go back home
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 