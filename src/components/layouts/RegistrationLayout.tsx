import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { buildBannerUrl, buildLogoUrl, buildFooterUrl } from '@/lib/utils/imageUtils';

interface RegistrationLayoutProps {
  children: ReactNode;
  eventData?: {
    banner?: string;
    header?: string;
    logo?: string;
    footer?: string;
  };
}

export default function RegistrationLayout({ children, eventData }: RegistrationLayoutProps) {
  const bannerUrl = buildBannerUrl(eventData || {});
  const logoUrl = buildLogoUrl(eventData || {});
  const footerUrl = buildFooterUrl(eventData || {});

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* <Header /> */}
      
      {bannerUrl && (
        <section
          className="relative w-full h-[40vh] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="z-10 text-white text-center px-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-24 md:h-32 mx-auto mb-6 drop-shadow-xl" />
            )}
          </div>
        </section>
      )}

      <main className="flex-1">
        {children}
      </main>

      {footerUrl && (
        <Footer footerImage={footerUrl} />
      )}
    </div>
  );
} 