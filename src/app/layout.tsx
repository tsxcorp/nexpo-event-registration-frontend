import type { Metadata } from 'next';
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#3b82f6',
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