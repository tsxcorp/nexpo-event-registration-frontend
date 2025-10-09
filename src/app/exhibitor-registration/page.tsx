'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function ExhibitorRegistrationContent() {
  const searchParams = useSearchParams();
  
  // Build the iframe URL with all query parameters
  const baseUrl = 'https://creatorapp.zohopublic.com/tsxcorp/nxp/form-embed/Exhibitor_Approval/xKuf5DfmHRZqrSjJW64hYV4RAATP5SACJPXfBqGYEZAugeZSe2qTMUHAz49q7Qz11bGE6qqk3FsgqtQVEX7F2ACyXUy714ebjn4C';
  
  // Get all query params and pass them to the iframe
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    params.append(key, value);
  });
  
  const queryString = params.toString();
  const iframeUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="h-1 w-full bg-blue-700" />
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/nexpo-logo.png" 
                alt="Nexpo Logo" 
                width={100} 
                height={50} 
                className="object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Exhibitor Registration
            </h1>
          </div>
        </nav>
      </header>

      {/* Main Content - Iframe */}
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-8">
        <div className="w-full max-w-5xl mx-auto px-4">
          <iframe
            width="100%"
            height="800px"
            frameBorder="0"
            scrolling="auto"
            src={iframeUrl}
            title="Exhibitor Registration Form"
            className="w-full border-0 rounded-lg shadow-lg bg-white"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <p className="mb-2 sm:mb-0">
              © {new Date().getFullYear()} Nexpo. All rights reserved.
            </p>
            <p className="text-center sm:text-right">
              Need help? Contact our support team at{' '}
              <a href="mailto:contact@nexpo.com" className="text-blue-600 hover:text-blue-800">
                contact@nexpo.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ExhibitorRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exhibitor registration form...</p>
        </div>
      </div>
    }>
      <ExhibitorRegistrationContent />
    </Suspense>
  );
}
