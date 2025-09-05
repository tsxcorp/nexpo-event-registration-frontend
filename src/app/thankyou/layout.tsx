import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You - Nexpo Event Registration',
  description: 'Thank you page after successful event registration.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
