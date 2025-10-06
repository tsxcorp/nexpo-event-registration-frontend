import { Metadata } from 'next';
import Script from 'next/script';

interface CheckinLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({ params }: CheckinLayoutProps): Promise<Metadata> {
  const { eventId } = await params;
  
  return {
    title: `Check-in - Event ${eventId}`,
    description: `Event check-in kiosk for ${eventId}`,
    // PWA will use dynamic manifest
    manifest: `/api/manifest?start_url=/checkin/${eventId}&page_name=Check-in - Event ${eventId}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: `Check-in ${eventId}`,
    },
  };
}

export default async function CheckinLayout({ children, params }: CheckinLayoutProps) {
  const { eventId } = await params;
  
  return (
    <>
      {/* Page-specific script to update service worker scope */}
      <Script id="checkin-pwa-config" strategy="afterInteractive">
        {`
          // Update PWA configuration for this specific page
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              const manifestLink = document.querySelector('link[rel="manifest"]');
              if (manifestLink) {
                const expectedHref = '/api/manifest?start_url=/checkin/${eventId}&page_name=Check-in - Event ${eventId}';
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

