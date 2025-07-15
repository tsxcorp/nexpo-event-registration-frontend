/**
 * Sanitize HTML content for safe rendering
 * Removes dangerous tags and attributes while preserving basic formatting
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Basic HTML sanitization - remove dangerous tags and attributes
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: urls
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular spaces
    .trim();
}

/**
 * Get CSS classes for HTML content rendering
 * Provides consistent styling for rendered HTML across the app
 */
export function getHtmlContentClasses(additionalClasses: string = ''): string {
  const baseClasses = [
    'leading-relaxed',
    '[&>p]:mb-2',
    '[&>b]:font-semibold',
    '[&>strong]:font-semibold',
    '[&>br]:block',
    '[&>div]:mb-2',
    '[&>span]:inline',
    '[&>p]:text-gray-700',
    '[&>div]:text-gray-700',
    '[&>h1]:text-xl',
    '[&>h1]:font-bold',
    '[&>h1]:mb-3',
    '[&>h2]:text-lg',
    '[&>h2]:font-semibold',
    '[&>h2]:mb-2',
    '[&>h3]:font-medium',
    '[&>h3]:mb-2',
    '[&>ul]:list-disc',
    '[&>ul]:ml-4',
    '[&>ol]:list-decimal',
    '[&>ol]:ml-4',
    '[&>li]:mb-1'
  ];

  return [
    ...baseClasses,
    ...(additionalClasses.split(' ').filter(Boolean))
  ].join(' ');
}

/**
 * Render HTML content safely with consistent styling
 */
export function renderHtmlContent(html: string, className: string = ''): {
  dangerouslySetInnerHTML: { __html: string };
  className: string;
} {
  return {
    dangerouslySetInnerHTML: { __html: sanitizeHtml(html) },
    className: getHtmlContentClasses(className)
  };
} 