'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PWAManifestConfig {
  startUrl: string;
  pageName: string;
  scope: string;
}

export function usePWAManifest() {
  const pathname = usePathname();
  const [manifestConfig, setManifestConfig] = useState<PWAManifestConfig | null>(null);

  useEffect(() => {
    const updateManifest = () => {
      let config: PWAManifestConfig | null = null;

      // Check-in page
      if (pathname.includes('/checkin/')) {
        const eventId = pathname.split('/checkin/')[1];
        config = {
          startUrl: pathname,
          pageName: `Check-in - Event ${eventId}`,
          scope: pathname
        };
      }
      // Register page
      else if (pathname.includes('/register/')) {
        const eventId = pathname.split('/register/')[1];
        config = {
          startUrl: pathname,
          pageName: `Register - Event ${eventId}`,
          scope: pathname
        };
      }
      // Insight page
      else if (pathname.includes('/insight/')) {
        const eventId = pathname.split('/insight/')[1];
        config = {
          startUrl: pathname,
          pageName: `Dashboard - Event ${eventId}`,
          scope: pathname
        };
      }
      // Default app
      else {
        config = {
          startUrl: '/',
          pageName: 'Nexpo Event Registration',
          scope: '/'
        };
      }

      if (config) {
        setManifestConfig(config);
        
        // Update manifest link in DOM
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          const newHref = `/api/manifest?start_url=${encodeURIComponent(config.startUrl)}&page_name=${encodeURIComponent(config.pageName)}`;
          
          if (manifestLink.getAttribute('href') !== newHref) {
            manifestLink.setAttribute('href', newHref);
            console.log('[PWA] Manifest updated:', {
              pathname,
              startUrl: config.startUrl,
              pageName: config.pageName,
              scope: config.scope
            });
          }
        }
      }
    };

    // Update manifest on pathname change
    updateManifest();

    // Also listen for manual navigation
    const handlePopState = () => {
      setTimeout(updateManifest, 100); // Small delay to ensure pathname is updated
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return {
    manifestConfig,
    isEventPage: manifestConfig?.startUrl !== '/',
    currentPageType: pathname.includes('/checkin/') ? 'checkin' :
                   pathname.includes('/register/') ? 'register' :
                   pathname.includes('/insight/') ? 'insight' : 'home'
  };
}
