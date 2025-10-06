import { Metadata } from 'next';
import Script from 'next/script';

interface RegisterLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({ params }: RegisterLayoutProps): Promise<Metadata> {
  const { eventId } = await params;
  
  return {
    title: `Register - Event ${eventId}`,
    description: `Event registration for ${eventId}`,
    // PWA will use dynamic manifest
    manifest: `/api/manifest?start_url=/register/${eventId}&page_name=Register - Event ${eventId}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: `Register ${eventId}`,
    },
  };
}

export default async function RegisterLayout({ children, params }: RegisterLayoutProps) {
  const { eventId } = await params;
  
  return (
    <>
      {/* Page-specific script to update service worker scope */}
      <Script id="register-pwa-config" strategy="afterInteractive">
        {`
          // Update PWA configuration for this specific page
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              const manifestLink = document.querySelector('link[rel="manifest"]');
              if (manifestLink) {
                const expectedHref = '/api/manifest?start_url=/register/${eventId}&page_name=Register - Event ${eventId}';
                if (manifestLink.getAttribute('href') !== expectedHref) {
                  manifestLink.setAttribute('href', expectedHref);
                }
              }
            });
          }
        `}
      </Script>
      
      {children}
    </>
  );
}
