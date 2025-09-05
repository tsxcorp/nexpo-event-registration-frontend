import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ticket - Nexpo Event Registration',
  description: 'Ticket purchase and member check system.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TicketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
