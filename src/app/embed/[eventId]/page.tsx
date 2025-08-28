'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { EventData, eventApi } from '@/lib/api/events';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { i18n } from '@/lib/translation/i18n';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface EmbedConfig {
  type: 'iframe' | 'widget';
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'minimal';
  language: 'vi' | 'en';
  showHeader: boolean;
  showFooter: boolean;
  showProgress: boolean;
  autoResize: boolean;
  responsiveBreakpoint: string;
}

export default function EmbedGeneratorPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const [originalEventData, setOriginalEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi');
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Embed configuration state
  const [config, setConfig] = useState<EmbedConfig>({
    type: 'iframe',
    width: '100%',
    height: '800px',
    theme: 'light',
    language: 'vi',
    showHeader: true,
    showFooter: true,
    showProgress: true,
    autoResize: true,
    responsiveBreakpoint: '768px'
  });

  // Load event data
  useEffect(() => {
    if (!eventId) return;
    
    console.log('🔄 Loading event data for embed generator:', eventId);
    console.log('🔗 API URL:', process.env.NEXT_PUBLIC_BACKEND_API_URL);
    setLoading(true);
    setError(false);
    
    eventApi.getEventInfo(eventId)
      .then(res => {
        const event = res.event;
        console.log('📥 Event data loaded for embed:', { 
          name: event.name, 
          fieldsCount: event.formFields?.length 
        });
        setOriginalEventData(event);
        setError(false);
      })
      .catch(err => {
        console.error('❌ Failed to load event for embed:', {
          error: err.message,
          code: err.code,
          status: err.response?.status,
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          isNetworkError: err.code === 'NETWORK_ERROR' || err.message === 'Network Error'
        });
        
        // For development: Use mock data if backend is not available
        if (err.message === 'Network Error' && process.env.NODE_ENV === 'development') {
          console.log('🔧 Using mock data for embed generator development');
          const mockEvent: EventData = {
            id: eventId,
            name: 'Sample Technology Exhibition - Embed Generator Demo',
            description: '<p>This is a sample event for testing the embed generator functionality.</p>',
            start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Convention Center - Hall A',
            formFields: [
              {
                sort: 1,
                label: 'Họ và tên',
                type: 'Text',
                required: true,
                groupmember: false,
                helptext: '',
                placeholder: 'Nhập họ và tên của bạn',
                field_condition: '',
                section_name: 'THÔNG TIN ĐĂNG KÝ',
                section_sort: 1,
                section_condition: '',
                matching_field: false,
                field_id: 'full_name'
              },
              {
                sort: 2,
                label: 'Email',
                type: 'Email',
                required: true,
                groupmember: false,
                helptext: '',
                placeholder: 'example@email.com',
                field_condition: '',
                section_name: 'THÔNG TIN ĐĂNG KÝ',
                section_sort: 1,
                section_condition: '',
                matching_field: false,
                field_id: 'email'
              },
              {
                sort: 3,
                label: 'Số điện thoại',
                type: 'Text',
                required: true,
                groupmember: false,
                helptext: '',
                placeholder: '+84 123 456 789',
                field_condition: '',
                section_name: 'THÔNG TIN ĐĂNG KÝ',
                section_sort: 1,
                section_condition: '',
                matching_field: false,
                field_id: 'phone'
              }
            ]
          };
          setOriginalEventData(mockEvent);
          setError(false);
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  // Update preview when config changes
  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [config]);

  // Generate embed URL with config parameters
  const generateEmbedUrl = (baseConfig = config) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      theme: baseConfig.theme,
      lang: baseConfig.language,
      header: baseConfig.showHeader.toString(),
      footer: baseConfig.showFooter.toString(),
      progress: baseConfig.showProgress.toString(),
      autoResize: baseConfig.autoResize.toString()
    });
    
    return `${baseUrl}/embed-form/${eventId}?${params.toString()}`;
  };

  // Generate embed code
  const generateEmbedCode = () => {
    const embedUrl = generateEmbedUrl();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    if (config.type === 'iframe') {
      return `<iframe 
  src="${embedUrl}"
  width="${config.width}"
  height="${config.height}"
  frameborder="0"
  scrolling="auto"
  style="border: none; border-radius: 8px;"
  title="Registration Form - ${originalEventData?.name || 'Event'}"
  loading="lazy">
</iframe>

${config.autoResize ? `
<!-- Auto-resize script (optional) -->
<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'resize' && event.data.source === 'nexpo-embed') {
      const iframe = document.querySelector('iframe[src*="${eventId}"]');
      if (iframe && event.data.height) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>` : ''}`;
    } else {
      // JotForm-style single script
      const scriptParams = new URLSearchParams({
        theme: config.theme,
        lang: config.language,
        header: config.showHeader.toString(),
        footer: config.showFooter.toString(),
        progress: config.showProgress.toString(),
        autoResize: config.autoResize.toString(),
        width: config.width,
        height: config.height
      });
      
      return `<script src="${baseUrl}/embed/${eventId}/script.js?${scriptParams.toString()}"></script>`;
    }
  };

  // Copy to clipboard
  const handleCopyCode = async () => {
    const code = generateEmbedCode();
    setCopying(true);
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      console.log('📋 Embed code copied to clipboard');
    } catch (err) {
      console.error('❌ Failed to copy embed code:', err);
      // Fallback: create textarea and select
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } finally {
      setCopying(false);
    }
  };

  // Download HTML file
  const handleDownloadHTML = () => {
    const embedCode = generateEmbedCode();
    const htmlContent = `<!DOCTYPE html>
<html lang="${config.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Form - ${originalEventData?.name || 'Event'}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; }
        .embed-container { width: 100%; }
        @media (max-width: ${config.responsiveBreakpoint}) {
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="embed-container">
            ${embedCode}
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexpo-registration-${eventId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('⬇️ HTML file downloaded');
  };

  // Modern Icon Component
  const Icon = ({ name, className = "w-5 h-5", fill = "none", ...props }: { name: string; className?: string; fill?: string }) => {
    const iconPaths: { [key: string]: string } = {
      'DocumentDuplicateIcon': 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
      'DownloadIcon': 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      'ExternalLinkIcon': 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
      'AdjustmentsIcon': 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4',
      'EyeIcon': 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      'CodeIcon': 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      'CheckIcon': 'M5 13l4 4L19 7',
      'CogIcon': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    };

    return (
      <svg
        className={className}
        fill={fill}
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={iconPaths[name] || iconPaths['CogIcon']}
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          showLogo={true} 
          text={i18n[currentLanguage]?.loading || 'Đang tải dữ liệu sự kiện...'}
        />
      </div>
    );
  }

  if (error || !originalEventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            {i18n[currentLanguage]?.event_not_found || 'Không tìm thấy sự kiện.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Icon name="CodeIcon" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Registration Form Embed Generator
                </h1>
                <p className="text-sm text-gray-600">
                  {originalEventData.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as 'vi' | 'en')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
              
              <Button
                onClick={() => window.open(`/register/${eventId}`, '_blank')}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <Icon name="ExternalLinkIcon" className="w-4 h-4 mr-2" />
                View Original
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Icon name="AdjustmentsIcon" className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Embed Configuration
                </h2>
              </div>

              <div className="space-y-6">
                {/* Embed Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Embed Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="embedType"
                        value="iframe"
                        checked={config.type === 'iframe'}
                        onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as 'iframe' }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        iframe (Recommended)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="embedType"
                        value="widget"
                        checked={config.type === 'widget'}
                        onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as 'widget' }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        JavaScript Widget (Single Script)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dimensions
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <input
                        type="text"
                        value={config.width}
                        onChange={(e) => setConfig(prev => ({ ...prev, width: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="100%"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <input
                        type="text"
                        value={config.height}
                        onChange={(e) => setConfig(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="800px"
                      />
                    </div>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <select
                    value={config.theme}
                    onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Default Language
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value as 'vi' | 'en' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Features
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.showHeader}
                        onChange={(e) => setConfig(prev => ({ ...prev, showHeader: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Show Header</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.showFooter}
                        onChange={(e) => setConfig(prev => ({ ...prev, showFooter: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Show Footer</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.showProgress}
                        onChange={(e) => setConfig(prev => ({ ...prev, showProgress: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Show Progress Bar</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.autoResize}
                        onChange={(e) => setConfig(prev => ({ ...prev, autoResize: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Auto Resize</span>
                    </label>
                  </div>
                </div>

                {/* Responsive Breakpoint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mobile Breakpoint
                  </label>
                  <input
                    type="text"
                    value={config.responsiveBreakpoint}
                    onChange={(e) => setConfig(prev => ({ ...prev, responsiveBreakpoint: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="768px"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Preview and Code */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Preview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Icon name="EyeIcon" className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Live Preview
                  </h2>
                </div>
                <Button
                  onClick={() => window.open(generateEmbedUrl(), '_blank')}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <Icon name="ExternalLinkIcon" className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <iframe
                  key={previewKey}
                  src={generateEmbedUrl()}
                  width={config.width === '100%' ? '100%' : config.width}
                  height={config.height === 'auto' ? '600px' : config.height}
                  frameBorder="0"
                  className="w-full"
                  title="Live Preview"
                />
              </div>
            </Card>

            {/* Generated Code */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Icon name="CodeIcon" className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Generated Embed Code
                  </h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCopyCode}
                    disabled={copying}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {copying ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : copied ? (
                      <Icon name="CheckIcon" className="w-4 h-4 mr-2" />
                    ) : (
                      <Icon name="DocumentDuplicateIcon" className="w-4 h-4 mr-2" />
                    )}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  
                  <Button
                    onClick={handleDownloadHTML}
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    <Icon name="DownloadIcon" className="w-4 h-4 mr-2" />
                    Download HTML
                  </Button>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {generateEmbedCode()}
                </pre>
              </div>

              {/* Usage Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Usage Instructions:
                </h3>
                {config.type === 'iframe' ? (
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Copy the iframe code above and paste it into your website's HTML</li>
                    <li>• The embed will automatically load the registration form</li>
                    <li>• Form submissions will be processed normally</li>
                    <li>• Responsive design adapts to different screen sizes</li>
                    {config.autoResize && (
                      <li>• Auto-resize feature adjusts height dynamically</li>
                    )}
                  </ul>
                ) : (
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Copy the single script tag and paste it anywhere in your HTML</li>
                    <li>• <strong>No container div needed</strong> - the script creates it automatically</li>
                    <li>• Form appears exactly where you place the script tag</li>
                    <li>• All configuration is built into the script URL</li>
                    <li>• Works on any website, CMS, or platform that allows JavaScript</li>
                    {config.autoResize && (
                      <li>• Auto-resize feature adjusts height dynamically</li>
                    )}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
