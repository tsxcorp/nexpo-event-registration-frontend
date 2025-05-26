import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

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
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />
      
      {eventData?.banner && (
        <section
          className="relative w-full h-[40vh] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `url(${eventData.banner || eventData.header})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="z-10 text-white text-center px-4">
            {eventData.logo && (
              <img src={eventData.logo} alt="Logo" className="h-24 md:h-32 mx-auto mb-6 drop-shadow-xl" />
            )}
          </div>
        </section>
      )}

      <main className="flex-1">
        {children}
      </main>

      {eventData?.footer && (
        <Footer footerImage={eventData.footer} />
      )}
    </div>
  );
} 