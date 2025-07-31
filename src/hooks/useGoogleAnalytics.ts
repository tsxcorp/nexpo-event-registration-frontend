// Google Analytics custom events tracking
export const useGoogleAnalytics = () => {
  const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-PGPK8YGJ0V', {
        page_path: url,
      });
    }
  };

  const trackRegistration = (eventId: string, eventName: string) => {
    trackEvent('registration', 'engagement', `${eventName} (${eventId})`);
  };

  const trackCheckin = (eventId: string, eventName: string, visitorId: string) => {
    trackEvent('checkin', 'engagement', `${eventName} - ${visitorId}`, 1);
  };

  const trackBadgePrint = (eventId: string, eventName: string) => {
    trackEvent('badge_print', 'engagement', `${eventName} (${eventId})`);
  };

  const trackQRScan = (method: 'camera' | 'barcode' | 'manual') => {
    trackEvent('qr_scan', 'engagement', method);
  };

  return {
    trackEvent,
    trackPageView,
    trackRegistration,
    trackCheckin,
    trackBadgePrint,
    trackQRScan,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
} 