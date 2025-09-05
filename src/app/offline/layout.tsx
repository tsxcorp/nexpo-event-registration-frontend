import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline - Nexpo Event Registration',
  description: 'You are currently offline. Some features may not be available.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
