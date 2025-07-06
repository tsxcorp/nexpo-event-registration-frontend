import { useEffect } from 'react';
import { EventData } from '@/lib/api/events';

interface UseEventMetadataProps {
  event: EventData | null;
  currentLanguage?: string;
}

export const useEventMetadata = ({ event, currentLanguage = 'vi' }: UseEventMetadataProps) => {
  useEffect(() => {
    if (!event) return;

    // Update page title
    const eventName = event.name || 'Event Registration';
    const title = currentLanguage === 'en' 
      ? `${eventName} - Registration` 
      : `${eventName} - Đăng ký tham dự`;
    document.title = title;

    // Update favicon
    const updateFavicon = (iconUrl: string) => {
      // Remove existing favicons
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = iconUrl;
      document.head.appendChild(link);

      // Also add apple-touch-icon for better mobile support
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = iconUrl;
      document.head.appendChild(appleTouchIcon);
    };

    // Use favicon if available, otherwise use logo, otherwise use default
    const faviconUrl = event.favicon || event.logo || '/nexpo-favicon.ico';
    updateFavicon(faviconUrl);

    // Update meta tags for social sharing
    const updateMetaTags = () => {
      const description = event.description || (currentLanguage === 'en' 
        ? 'Register for this exciting event' 
        : 'Đăng ký tham dự sự kiện');
      
      const imageUrl = event.banner || event.logo || '/nexpo-logo.png';
      const currentUrl = window.location.href;

      // Helper function to update or create meta tag
      const updateMetaTag = (property: string, content: string, isProperty = true) => {
        const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
        let metaTag = document.querySelector(selector) as HTMLMetaElement;
        
        if (!metaTag) {
          metaTag = document.createElement('meta');
          if (isProperty) {
            metaTag.setAttribute('property', property);
          } else {
            metaTag.setAttribute('name', property);
          }
          document.head.appendChild(metaTag);
        }
        metaTag.content = content;
      };

      // Standard meta tags
      updateMetaTag('description', description, false);
      updateMetaTag('keywords', `event, registration, ${event.name}`, false);

      // Open Graph tags
      updateMetaTag('og:title', title);
      updateMetaTag('og:description', description);
      updateMetaTag('og:image', imageUrl);
      updateMetaTag('og:url', currentUrl);
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:site_name', 'NEXPO Events');

      // Twitter Card tags
      updateMetaTag('twitter:card', 'summary_large_image', false);
      updateMetaTag('twitter:title', title, false);
      updateMetaTag('twitter:description', description, false);
      updateMetaTag('twitter:image', imageUrl, false);

      // Additional meta tags for better SEO
      updateMetaTag('author', 'NEXPO Events', false);
      updateMetaTag('viewport', 'width=device-width, initial-scale=1.0', false);
    };

    updateMetaTags();

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = 'NEXPO Events';
      
      // Reset favicon to default
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());
      
      const defaultFavicon = document.createElement('link');
      defaultFavicon.rel = 'icon';
      defaultFavicon.type = 'image/x-icon';
      defaultFavicon.href = '/nexpo-favicon.ico';
      document.head.appendChild(defaultFavicon);
    };
  }, [event, currentLanguage]);

  // Function to generate social share URLs
  const generateShareUrls = () => {
    if (!event) return {};

    const currentUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(event.name || 'Event Registration');
    const description = encodeURIComponent(event.description || 'Join this exciting event!');

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${currentUrl}&text=${title}&hashtags=nexpo,event`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`,
      email: `mailto:?subject=${title}&body=${description}%0A%0A${currentUrl}`,
      whatsapp: `https://wa.me/?text=${title}%20${currentUrl}`,
      telegram: `https://t.me/share/url?url=${currentUrl}&text=${title}`,
    };
  };

  return {
    generateShareUrls,
  };
}; 