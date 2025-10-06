import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the current URL from query parameter
  const searchParams = request.nextUrl.searchParams;
  const startUrl = searchParams.get('start_url') || '/';
  const pageName = searchParams.get('page_name') || 'Nexpo Event Registration';
  
  // Parse start URL to determine scope and page type
  const isCheckinPage = startUrl.includes('/checkin/');
  const isRegisterPage = startUrl.includes('/register/');
  const isInsightPage = startUrl.includes('/insight/');
  
  // Extract event ID from URL if available
  let eventId = '';
  const eventIdMatch = startUrl.match(/\/(checkin|register|insight)\/([^\/]+)/);
  if (eventIdMatch) {
    eventId = eventIdMatch[2];
  }
  
  // Dynamic manifest based on page type
  const manifest = {
    name: pageName,
    short_name: isCheckinPage ? 'Check-in' : 
                isRegisterPage ? 'Register' : 
                isInsightPage ? 'Insight' : 'Nexpo',
    description: isCheckinPage ? `Event check-in kiosk for ${eventId}` :
                isRegisterPage ? `Event registration for ${eventId}` :
                isInsightPage ? `Event insights for ${eventId}` :
                'Professional event registration and management platform',
    start_url: startUrl,
    scope: isCheckinPage || isRegisterPage || isInsightPage ? startUrl : '/',
    display: 'standalone',
    background_color: '#1e40af',
    theme_color: '#3b82f6',
    orientation: isCheckinPage ? 'any' : 'portrait-primary', // Kiosk can be any orientation
    categories: ['business', 'productivity', 'events'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/nexpo-logo-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/nexpo-logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/nexpo-logo-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/nexpo-logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
  
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate', // No cache for dynamic manifest
    },
  });
}

