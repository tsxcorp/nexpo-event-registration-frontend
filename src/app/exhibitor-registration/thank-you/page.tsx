'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/solid';

function ExhibitorThankYouContent() {
  const searchParams = useSearchParams();
  const exhibitorName = searchParams.get('name') || 'Exhibitor';
  const email = searchParams.get('email') || '';
  const company = searchParams.get('company') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
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
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
              <div className="flex justify-center mb-6">
                <CheckCircleIcon className="w-24 h-24 text-white animate-bounce" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Registration Successful!
              </h1>
              <p className="text-xl text-green-50">
                Thank you for registering as an exhibitor
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-10">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  What's Next?
                </h2>
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">1</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Confirmation Email
                      </h3>
                      <p>
                        We've sent a confirmation email to <strong>{email || 'your registered email'}</strong>. 
                        Please check your inbox (and spam folder) for more details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">2</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Application Review
                      </h3>
                      <p>
                        Our team will review your application within 2-3 business days. 
                        You will receive an update via email.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">3</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Booth Setup Information
                      </h3>
                      <p>
                        Once approved, you'll receive detailed information about booth setup, 
                        event schedule, and exhibitor guidelines.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              {(exhibitorName !== 'Exhibitor' || company) && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Registration Details
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    {exhibitorName !== 'Exhibitor' && (
                      <p>
                        <span className="font-medium">Contact Person:</span> {exhibitorName}
                      </p>
                    )}
                    {company && (
                      <p>
                        <span className="font-medium">Company:</span> {company}
                      </p>
                    )}
                    {email && (
                      <p>
                        <span className="font-medium">Email:</span> {email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Need Help?
                </h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600 mr-3" />
                    <a 
                      href="mailto:exhibitor@nexpo.com" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      exhibitor@nexpo.com
                    </a>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-blue-600 mr-3" />
                    <a 
                      href="tel:+841234567890" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      +84 123 456 7890
                    </a>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors duration-200"
                >
                  Back to Home
                </Link>
                <Link
                  href="/exhibitor-registration"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg text-center transition-colors duration-200"
                >
                  Register Another Exhibitor
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">
              This confirmation page is for exhibitor registration only.
            </p>
            <p className="text-sm mt-2">
              For visitor registration, please visit our{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                main registration page
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <p className="mb-2 sm:mb-0">
              © {new Date().getFullYear()} Nexpo. All rights reserved.
            </p>
            <p className="text-center sm:text-right">
              Need help? Contact us at{' '}
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

export default function ExhibitorThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ExhibitorThankYouContent />
    </Suspense>
  );
}

