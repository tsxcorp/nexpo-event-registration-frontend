/**
 * Build image URL from API response data
 * Handles both full URLs and relative paths
 * Consistent with EventInfo.tsx pattern
 */
export function buildImageUrl(imageUrl?: string): string | null {
  // If no URL provided, return null
  if (!imageUrl) {
    return null;
  }
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If it contains a full hostname (like railway.app), make it a full URL
  if (imageUrl.includes('.railway.app') || imageUrl.includes('.com') || imageUrl.includes('.net')) {
    return `https://${imageUrl}`;
  }
  
  // If it's a backend proxy-image URL, convert to frontend proxy
  if (imageUrl.includes('/api/proxy-image') && (imageUrl.startsWith('http://localhost:3000') || imageUrl.startsWith('http://localhost:3001'))) {
    const url = new URL(imageUrl);
    const params = new URLSearchParams(url.search);
    return `/api/proxy-image?${params.toString()}`;
  }
  
  // If it's a relative path, prepend the API base URL
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';
  
  // Debug logging
  console.log('🖼️ buildImageUrl debug:', {
    originalImageUrl: imageUrl,
    baseURL: baseURL,
    envVar: process.env.NEXT_PUBLIC_BACKEND_API_URL
  });
  
  // Handle different types of relative paths
  if (imageUrl.includes('/api/proxy-image')) {
    // If it's already a proxy-image path, just prepend the base URL
    const result = `${baseURL}/${imageUrl}`;
    return result;
  } else {
    // For other relative paths, prepend /uploads/
    const result = `${baseURL}/uploads/${imageUrl}`;
    return result;
  }
}

/**
 * Build banner URL from event data
 * Handles both banner and header fields as fallback
 */
export function buildBannerUrl(eventData: { banner?: string; header?: string }): string | null {
  const bannerUrl = eventData.banner || eventData.header;
  const result = buildImageUrl(bannerUrl);
  return result;
}

/**
 * Build logo URL from event data
 */
export function buildLogoUrl(eventData: { logo?: string }): string | null {
  return buildImageUrl(eventData.logo);
}

/**
 * Build footer image URL from event data
 */
export function buildFooterUrl(eventData: { footer?: string }): string | null {
  return buildImageUrl(eventData.footer);
} 