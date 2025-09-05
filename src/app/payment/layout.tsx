import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment - Nexpo Event Registration',
  description: 'Payment processing for event registration.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
