import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import PWAInstaller from '@/components/common/PWAInstaller';
import '@/styles/globals.css';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nexpo Event Registration',
  description: 'Professional event registration and management platform for conferences, exhibitions, and business events',
  keywords: 'event registration, conference management, exhibition platform, business events, Nexpo',
  authors: [{ name: 'Nexpo Team' }],
  creator: 'Nexpo',
  publisher: 'Nexpo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nexpo-event-registration.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nexpo Event Registration',
    description: 'Professional event registration and management platform',
    url: 'https://nexpo-event-registration.com',
    siteName: 'Nexpo Event Registration',
    images: [
      {
        url: '/nexpo-logo.png',
        width: 1200,
        height: 630,
        alt: 'Nexpo Event Registration Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexpo Event Registration',
    description: 'Professional event registration and management platform',
    images: ['/nexpo-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nexpo',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Nexpo',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nexpo" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/x-icon" href="/nexpo-favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/nexpo-logo-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/nexpo-logo-16.png" />
        <link rel="apple-touch-icon" href="/nexpo-logo-192.png" />
        <link rel="mask-icon" href="/nexpo-logo.svg" color="#3b82f6" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PGPK8YGJ0V"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PGPK8YGJ0V');
          `}
        </Script>
        
        {/* Easy AI Chat Widget - Only for insight pages */}
        <Script
          src="https://widget.easyaichat.app/dist/widget/main.js"
          strategy="afterInteractive"
        />
        <Script id="easy-ai-chat-init" strategy="afterInteractive">
          {`
            console.log('🔍 Easy AI Chat script loaded, checking conditions...');
            console.log('Current pathname:', window.location.pathname);
            
            if (window.location.pathname.includes('/insight/')) {
              // Check if this is the specific event ID that should have Easy AI Chat
              const pathSegments = window.location.pathname.split('/');
              const eventIdIndex = pathSegments.indexOf('insight') + 1;
              const eventId = pathSegments[eventIdIndex];
              
              console.log('📋 Path segments:', pathSegments);
              console.log('🎯 Extracted event ID:', eventId);
              
              if (eventId === '4433256000013547003') {
                console.log('🚀 Initializing Easy AI Chat for specific event:', eventId);
                
                // Wait for EasyAIChat to be available
                const initWidget = () => {
                  if (window.EasyAIChat) {
                    console.log('✅ EasyAIChat object found, initializing...');
                    try {
                      window.EasyAIChat.init({"handle":"nexpovn"});
                      console.log('🎉 Easy AI Chat initialized successfully for event', eventId);
                      
                      // Check if widget elements are created
                      setTimeout(() => {
                        const widgetElements = document.querySelectorAll('[class*="chat"], [id*="chat"], [class*="widget"], [id*="widget"]');
                        console.log('🔍 Found potential widget elements:', widgetElements.length);
                        widgetElements.forEach((el, index) => {
                          console.log(\`Widget element \${index}:\`, el);
                        });
                      }, 2000);
                      
                    } catch (error) {
                      console.error('❌ Error initializing Easy AI Chat:', error);
                    }
                  } else {
                    console.warn('⚠️ EasyAIChat object not found, retrying in 100ms...');
                    setTimeout(initWidget, 100);
                  }
                };
                
                // Start initialization
                setTimeout(initWidget, 100);
                
              } else {
                console.log('ℹ️ Easy AI Chat not enabled for event:', eventId);
              }
            } else {
              console.log('ℹ️ Not an insight page, Easy AI Chat not needed');
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <PWAInstaller />
      </body>
    </html>
  );
} 