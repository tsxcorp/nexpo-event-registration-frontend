import { Metadata } from 'next';
import Script from 'next/script';

interface InsightLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({ params }: InsightLayoutProps): Promise<Metadata> {
  const { eventId } = await params;
  
  return {
    title: `Dashboard - Event ${eventId}`,
    description: `Event dashboard and insights for ${eventId}`,
    // PWA will use dynamic manifest
    manifest: `/api/manifest?start_url=/insight/${eventId}&page_name=Dashboard - Event ${eventId}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: `Dashboard ${eventId}`,
    },
  };
}

export default async function InsightLayout({ children, params }: InsightLayoutProps) {
  const { eventId } = await params;
  
  return (
    <>
      {/* Inject dynamic manifest link */}
      <head>
        <link 
          rel="manifest" 
          href={`/api/manifest?start_url=/insight/${eventId}&page_name=Dashboard - Event ${eventId}`}
        />
      </head>
      
      {/* Page-specific script to update service worker scope */}
      <Script id="insight-pwa-config" strategy="afterInteractive">
        {`
          // Update PWA configuration for this specific page
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              console.log('[PWA] Insight page - Dynamic manifest configured for /insight/${eventId}');
              
              // Update manifest link if not already updated
              const manifestLink = document.querySelector('link[rel="manifest"]');
              if (manifestLink) {
                const expectedHref = '/api/manifest?start_url=/insight/${eventId}&page_name=Dashboard - Event ${eventId}';
                if (manifestLink.getAttribute('href') !== expectedHref) {
                  manifestLink.setAttribute('href', expectedHref);
                  console.log('[PWA] Manifest link updated to:', expectedHref);
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
