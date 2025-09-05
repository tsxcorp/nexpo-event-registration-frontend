import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Debug Fields - Nexpo Event Registration',
  description: 'Debug page for testing field mappings and conditional display logic.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DebugFieldsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
