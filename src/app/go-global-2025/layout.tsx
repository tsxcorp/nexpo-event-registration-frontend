import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Go Global 2025 - Đăng ký tham gia | Nexpo',
  description: 'Đăng ký tham gia sự kiện Go Global 2025 - Cơ hội kết nối và mở rộng kinh doanh toàn cầu',
  keywords: ['Go Global 2025', 'sự kiện', 'đăng ký', 'kinh doanh', 'toàn cầu', 'Nexpo'],
  openGraph: {
    title: 'Go Global 2025 - Đăng ký tham gia',
    description: 'Đăng ký tham gia sự kiện Go Global 2025 - Cơ hội kết nối và mở rộng kinh doanh toàn cầu',
    type: 'website',
    url: 'https://nexpo.vn/go-global-2025',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Go Global 2025 - Đăng ký tham gia',
    description: 'Đăng ký tham gia sự kiện Go Global 2025 - Cơ hội kết nối và mở rộng kinh doanh toàn cầu',
  },
};

export default function GoGlobal2025Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
