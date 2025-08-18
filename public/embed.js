(function() {
  'use strict';
  
  // Nexpo Registration Widget
  window.NexpoRegistration = window.NexpoRegistration || {
    baseUrl: '',
    
    // Initialize base URL from script tag
    init: function() {
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src.includes('/embed.js') || src.includes('/embed/')) {
          // Extract base URL from script source
          this.baseUrl = src.split('/embed')[0] || window.location.origin;
          break;
        }
      }
    },
    
    // Render form in container
    render: function(containerId, options) {
      options = options || {};
      
      if (!this.baseUrl) {
        this.init();
      }
      
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Nexpo Registration: Container not found:', containerId);
        return;
      }
      
      // Build iframe URL with parameters
      const params = new URLSearchParams({
        theme: options.theme || 'light',
        lang: options.language || 'vi',
        header: (options.showHeader !== false).toString(),
        footer: (options.showFooter !== false).toString(),
        progress: (options.showProgress !== false).toString(),
        autoResize: (options.autoResize !== false).toString()
      });
      
      const iframeUrl = `${this.baseUrl}/embed-form/${options.eventId}?${params.toString()}`;
      
      // Create and configure iframe
      const iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.width = options.width || '100%';
      iframe.height = options.height || '600px';
      iframe.frameBorder = '0';
      iframe.scrolling = 'auto';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.title = `Registration Form - ${options.eventId}`;
      iframe.loading = 'lazy';
      
      // Auto-resize functionality
      if (options.autoResize !== false) {
        window.addEventListener('message', function(event) {
          if (event.data.type === 'resize' && 
              event.data.source === 'nexpo-embed' && 
              event.data.eventId === options.eventId) {
            iframe.style.height = event.data.height + 'px';
          }
        });
      }
      
      // Clear container and add iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      
      console.log('Nexpo Registration: Form rendered successfully for event', options.eventId);
    }
  };
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.NexpoRegistration.init();
    });
  } else {
    window.NexpoRegistration.init();
  }
})();
