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
  
  // If it's a relative path, prepend the API base URL
  const result = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${imageUrl}`;
  return result;
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