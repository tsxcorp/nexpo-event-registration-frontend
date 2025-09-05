import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Translation - Nexpo Event Registration',
  description: 'Test page for translation functionality.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestTranslationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
