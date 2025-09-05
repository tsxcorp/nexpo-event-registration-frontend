import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-in Go Global 2025 - Nexpo Event Registration',
  description: 'Xác nhận tham dự HỘI NGHỊ CHIẾN LƯỢC CẤP CAO dành cho cộng đồng doanh nhân Việt Nam',
  keywords: 'check-in, go global 2025, hội nghị chiến lược, doanh nhân việt nam, nexpo',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Check-in Go Global 2025',
    description: 'Xác nhận tham dự HỘI NGHỊ CHIẾN LƯỢC CẤP CAO',
    url: 'https://nexpo-event-registration.com/go-global-2025/check-in',
    siteName: 'Nexpo Event Registration',
    images: [
      {
        url: '/nexpo-logo.png',
        width: 1200,
        height: 630,
        alt: 'Go Global 2025 Check-in',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Check-in Go Global 2025',
    description: 'Xác nhận tham dự HỘI NGHỊ CHIẾN LƯỢC CẤP CAO',
    images: ['/nexpo-logo.png'],
  },
};

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

