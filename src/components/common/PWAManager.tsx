'use client';

import { useEffect } from 'react';
import { usePWAManifest } from '@/hooks/usePWAManifest';

interface PWAManagerProps {
  children: React.ReactNode;
}

export default function PWAManager({ children }: PWAManagerProps) {
  const { manifestConfig, isEventPage } = usePWAManifest();

  useEffect(() => {
    // Log PWA configuration for debugging
    if (manifestConfig) {
      console.log('[PWA Manager] Current configuration:', {
        startUrl: manifestConfig.startUrl,
        pageName: manifestConfig.pageName,
        scope: manifestConfig.scope,
        isEventPage
      });
    }

    // Update page title based on PWA configuration
    if (manifestConfig && isEventPage) {
      document.title = manifestConfig.pageName;
    }

    // Update meta description
    if (manifestConfig && isEventPage) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', `PWA for ${manifestConfig.pageName}`);
    }

    // Update theme color based on page type
    if (manifestConfig) {
      let themeColor = document.querySelector('meta[name="theme-color"]');
      if (!themeColor) {
        themeColor = document.createElement('meta');
        themeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(themeColor);
      }
      
      // Different theme colors for different page types
      const colors = {
        checkin: '#059669', // emerald-600
        register: '#2563eb', // blue-600
        insight: '#7c3aed', // violet-600
        home: '#3b82f6' // blue-500
      };
      
      const pageType = manifestConfig.startUrl.includes('/checkin/') ? 'checkin' :
                      manifestConfig.startUrl.includes('/register/') ? 'register' :
                      manifestConfig.startUrl.includes('/insight/') ? 'insight' : 'home';
      
      themeColor.setAttribute('content', colors[pageType as keyof typeof colors]);
    }

  }, [manifestConfig, isEventPage]);

  return <>{children}</>;
}
