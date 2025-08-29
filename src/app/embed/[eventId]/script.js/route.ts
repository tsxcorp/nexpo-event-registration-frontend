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
  const borderRadius = url.searchParams.get('borderRadius') || '12px';
  const shadow = url.searchParams.get('shadow') || '0 4px 20px rgba(0, 0, 0, 0.1)';
  
  // Generate the enhanced embed script
  const scriptContent = `
(function() {
  'use strict';
  
  // Configuration
  const config = {
    eventId: '${eventId}',
    theme: '${theme}',
    language: '${language}',
    showHeader: ${showHeader},
    showFooter: ${showFooter},
    showProgress: ${showProgress},
    autoResize: ${autoResize},
    width: '${width}',
    height: '${height}',
    borderRadius: '${borderRadius}',
    shadow: '${shadow}',
    containerId: '${containerId}',
    baseUrl: '${baseUrl}'
  };
  
  // CSS Styles for better UI/UX
  const styles = \`
    .nexpo-embed-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 100%;
      margin: 0 auto;
      position: relative;
    }
    
    .nexpo-embed-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: \${config.borderRadius};
      box-shadow: \${config.shadow};
      position: relative;
      overflow: hidden;
    }
    
    .nexpo-embed-loading::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: loading-shimmer 1.5s infinite;
    }
    
    @keyframes loading-shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    .nexpo-embed-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e3e3e3;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      z-index: 1;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .nexpo-embed-loading-text {
      margin-top: 16px;
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      z-index: 1;
    }
    
    .nexpo-embed-iframe {
      width: 100%;
      border: none;
      border-radius: \${config.borderRadius};
      box-shadow: \${config.shadow};
      background: white;
      transition: all 0.3s ease;
    }
    
    .nexpo-embed-iframe:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .nexpo-embed-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: \${config.borderRadius};
      padding: 24px;
      text-align: center;
    }
    
    .nexpo-embed-error-icon {
      width: 48px;
      height: 48px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      color: white;
      font-size: 24px;
    }
    
    .nexpo-embed-error-title {
      font-size: 18px;
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 8px;
    }
    
    .nexpo-embed-error-message {
      font-size: 14px;
      color: #7f1d1d;
      margin-bottom: 16px;
    }
    
    .nexpo-embed-retry-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .nexpo-embed-retry-btn:hover {
      background: #2563eb;
    }
    
    .nexpo-embed-powered-by {
      text-align: center;
      margin-top: 12px;
      font-size: 12px;
      color: #9ca3af;
    }
    
    .nexpo-embed-powered-by a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }
    
    .nexpo-embed-powered-by a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      .nexpo-embed-container {
        margin: 0;
      }
      
      .nexpo-embed-iframe {
        border-radius: 8px;
      }
    }
  \`;
  
  // Inject styles
  if (!document.getElementById('nexpo-embed-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'nexpo-embed-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
  
  // Auto-create container if not exists
  let container = document.getElementById(config.containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = config.containerId;
    container.className = 'nexpo-embed-container';
    
    // Insert container at current script location
    const currentScript = document.currentScript || document.scripts[document.scripts.length - 1];
    if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }
  
  // Show loading state
  function showLoading() {
    container.innerHTML = \`
      <div class="nexpo-embed-loading">
        <div style="text-align: center; z-index: 1;">
          <div class="nexpo-embed-spinner"></div>
          <div class="nexpo-embed-loading-text">Đang tải form đăng ký...</div>
        </div>
      </div>
    \`;
  }
  
  // Show error state
  function showError(message = 'Không thể tải form đăng ký') {
    container.innerHTML = \`
      <div class="nexpo-embed-error">
        <div class="nexpo-embed-error-icon">⚠️</div>
        <div class="nexpo-embed-error-title">Lỗi tải form</div>
        <div class="nexpo-embed-error-message">\${message}</div>
        <button class="nexpo-embed-retry-btn" onclick="window.nexpoEmbedRetry && window.nexpoEmbedRetry()">Thử lại</button>
      </div>
    \`;
  }
  
  // Build iframe URL with parameters
  function buildIframeUrl() {
    const params = new URLSearchParams({
      theme: config.theme,
      lang: config.language,
      header: config.showHeader.toString(),
      footer: config.showFooter.toString(),
      progress: config.showProgress.toString(),
      autoResize: config.autoResize.toString()
    });
    
    return \`\${config.baseUrl}/embed-form/\${config.eventId}?\${params.toString()}\`;
  }
  
  // Create and configure iframe
  function createIframe() {
    const iframe = document.createElement('iframe');
    iframe.src = buildIframeUrl();
    iframe.className = 'nexpo-embed-iframe';
    iframe.style.height = config.height;
    iframe.title = 'Registration Form - ' + config.eventId;
    iframe.loading = 'lazy';
    
    // Handle iframe load events
    iframe.onload = function() {
      console.log('Nexpo Registration: Form loaded successfully for event ' + config.eventId);
    };
    
    iframe.onerror = function() {
      showError('Không thể tải form đăng ký. Vui lòng thử lại.');
    };
    
    return iframe;
  }
  
  // Auto-resize functionality
  if (config.autoResize) {
    window.addEventListener('message', function(event) {
      if (event.data.type === 'resize' && 
          event.data.source === 'nexpo-embed' && 
          event.data.eventId === config.eventId) {
        const iframe = container.querySelector('.nexpo-embed-iframe');
        if (iframe) {
          iframe.style.height = event.data.height + 'px';
        }
      }
    });
  }
  
  // Main initialization function
  function init() {
    try {
      showLoading();
      
      const iframe = createIframe();
      
      // Clear container and add iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      
      // Add powered by footer if enabled
      if (config.showFooter) {
        const poweredBy = document.createElement('div');
        poweredBy.className = 'nexpo-embed-powered-by';
        poweredBy.innerHTML = 'Powered by <a href="https://nexpo.vn" target="_blank" rel="noopener">Nexpo</a>';
        container.appendChild(poweredBy);
      }
      
    } catch (error) {
      console.error('Nexpo Registration: Error initializing embed form:', error);
      showError('Lỗi khởi tạo form đăng ký');
    }
  }
  
  // Retry function
  window.nexpoEmbedRetry = function() {
    init();
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  console.log('Nexpo Registration: Enhanced embed script loaded for event ' + config.eventId);
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
