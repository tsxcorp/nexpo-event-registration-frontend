'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon, EnvelopeIcon, PhoneIcon, LanguageIcon } from '@heroicons/react/24/solid';

function ExhibitorThankYouContent() {
  const searchParams = useSearchParams();
  const exhibitorName = searchParams.get('name') || 'Exhibitor';
  const email = searchParams.get('email') || '';
  const company = searchParams.get('company') || '';
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  const translations = {
    vi: {
      title: 'Đăng ký thành công!',
      subtitle: 'Cảm ơn bạn đã đăng ký làm nhà trưng bày',
      whatsNext: 'Các bước tiếp theo',
      step1Title: 'Xét duyệt hồ sơ',
      step1Desc: 'Đội ngũ của chúng tôi sẽ xem xét đơn đăng ký của bạn trong vòng 2-3 ngày làm việc.',
      step2Title: 'Email xác nhận',
      step2Desc: email 
        ? `Chúng tôi đã gửi email xác nhận đến ${email}. Vui lòng kiểm tra hộp thư (và thư mục spam) để biết thêm chi tiết. Đội ngũ chúng tôi sẽ liên hệ với bạn sớm.`
        : 'Chúng tôi đã gửi email xác nhận đến địa chỉ email bạn đã đăng ký. Đội ngũ chúng tôi sẽ liên hệ với bạn sớm.',
      step3Title: 'Thông tin gian hàng',
      step3Desc: 'Sau khi được phê duyệt, bạn sẽ nhận được thông tin chi tiết về việc thiết lập gian hàng, lịch trình sự kiện và hướng dẫn dành cho nhà trưng bày.',
      registrationDetails: 'Thông tin đăng ký',
      contactPerson: 'Người liên hệ',
      needHelp: 'Cần hỗ trợ?',
      backHome: 'Về trang chủ',
      registerAnother: 'Đăng ký nhà trưng bày khác',
      noteTitle: 'Trang xác nhận này dành cho đăng ký nhà trưng bày.',
      noteVisitor: 'Để đăng ký tham dự sự kiện, vui lòng truy cập',
      noteLink: 'trang đăng ký chính',
    },
    en: {
      title: 'Registration Successful!',
      subtitle: 'Thank you for registering as an exhibitor',
      whatsNext: "What's Next?",
      step1Title: 'Application Review',
      step1Desc: 'Our team will review your application within 2-3 business days.',
      step2Title: 'Confirmation Email',
      step2Desc: email
        ? `We've sent a confirmation email to ${email}. Please check your inbox (and spam folder) for more details. Our team will contact you soon.`
        : "We've sent a confirmation email to your registered address. Our team will contact you soon.",
      step3Title: 'Booth Setup Information',
      step3Desc: "Once approved, you'll receive detailed information about booth setup, event schedule, and exhibitor guidelines.",
      registrationDetails: 'Registration Details',
      contactPerson: 'Contact Person',
      needHelp: 'Need Help?',
      backHome: 'Back to Home',
      registerAnother: 'Register Another Exhibitor',
      noteTitle: 'This confirmation page is for exhibitor registration only.',
      noteVisitor: 'For visitor registration, please visit our',
      noteLink: 'main registration page',
    },
  };

  const t = translations[language];

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
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
            aria-label="Switch language"
          >
            <LanguageIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{language === 'vi' ? 'English' : 'Tiếng Việt'}</span>
            <span className="sm:hidden">{language === 'vi' ? 'EN' : 'VI'}</span>
          </button>
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
                {t.title}
              </h1>
              <p className="text-xl text-green-50">
                {t.subtitle}
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-10">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {t.whatsNext}
                </h2>
                <div className="space-y-4 text-gray-600">
                  {/* Step 1: Application Review */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">1</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {t.step1Title}
                      </h3>
                      <p>{t.step1Desc}</p>
                    </div>
                  </div>

                  {/* Step 2: Confirmation Email */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">2</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {t.step2Title}
                      </h3>
                      <p>{t.step2Desc}</p>
                    </div>
                  </div>

                  {/* Step 3: Booth Setup Information */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">3</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {t.step3Title}
                      </h3>
                      <p>{t.step3Desc}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              {(exhibitorName !== 'Exhibitor' || company) && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t.registrationDetails}
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    {exhibitorName !== 'Exhibitor' && (
                      <p>
                        <span className="font-medium">{t.contactPerson}:</span> {exhibitorName}
                      </p>
                    )}
                    {company && (
                      <p>
                        <span className="font-medium">{language === 'vi' ? 'Công ty' : 'Company'}:</span> {company}
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
                  {t.needHelp}
                </h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600 mr-3" />
                    <a 
                      href="mailto:contact@nexpo.com" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      contact@nexpo.com
                    </a>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-blue-600 mr-3" />
                    <a 
                      href="tel:02866827794" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      028 6682 7794
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
                  {t.backHome}
                </Link>
                <Link
                  href="/exhibitor-registration"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg text-center transition-colors duration-200"
                >
                  {t.registerAnother}
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">
              {t.noteTitle}
            </p>
            <p className="text-sm mt-2">
              {t.noteVisitor}{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                {t.noteLink}
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

