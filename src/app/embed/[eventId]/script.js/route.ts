import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  // Get configuration from URL parameters
  const theme = url.searchParams.get('theme') || 'light';
  const language = url.searchParams.get('lang') || 'vi';
  const showHeader = url.searchParams.get('header') !== 'false';
  const showFooter = url.searchParams.get('footer') !== 'false';
  const showProgress = url.searchParams.get('progress') !== 'false';
  const autoResize = url.searchParams.get('autoResize') !== 'false';
  const width = url.searchParams.get('width') || '100%';
  const height = url.searchParams.get('height') || '600px';
  const containerId = url.searchParams.get('container') || `nexpo-registration-${eventId}`;
  
  // Generate the single-script embed code
  const scriptContent = `
(function() {
  'use strict';
  
  // Auto-create container if not exists
  let container = document.getElementById('${containerId}');
  if (!container) {
    container = document.createElement('div');
    container.id = '${containerId}';
    
    // Insert container at current script location
    const currentScript = document.currentScript || document.scripts[document.scripts.length - 1];
    if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }
  
  // Build iframe URL with parameters
  const params = new URLSearchParams({
    theme: '${theme}',
    lang: '${language}',
    header: '${showHeader}',
    footer: '${showFooter}',
    progress: '${showProgress}',
    autoResize: '${autoResize}'
  });
  
  const iframeUrl = '${baseUrl}/embed-form/${eventId}?' + params.toString();
  
  // Create and configure iframe
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.width = '${width}';
  iframe.height = '${height}';
  iframe.frameBorder = '0';
  iframe.scrolling = 'auto';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.display = 'block';
  iframe.title = 'Registration Form - ${eventId}';
  iframe.loading = 'lazy';
  
  // Auto-resize functionality
  ${autoResize ? `
  window.addEventListener('message', function(event) {
    if (event.data.type === 'resize' && 
        event.data.source === 'nexpo-embed' && 
        event.data.eventId === '${eventId}') {
      iframe.style.height = event.data.height + 'px';
    }
  });
  ` : ''}
  
  // Clear container and add iframe
  container.innerHTML = '';
  container.appendChild(iframe);
  
  console.log('Nexpo Registration: Auto-loaded form for event ${eventId}');
})();`;

  return new NextResponse(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
