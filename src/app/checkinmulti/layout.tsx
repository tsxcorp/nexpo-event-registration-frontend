import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi Check-in - Nexpo Event Registration',
  description: 'Multi-event check-in system for event registration.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckinMultiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
