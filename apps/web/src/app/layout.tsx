import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TableBite — Restaurant SaaS',
  description: 'Order, book, and discover from your favourite restaurants.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-neutral-50 text-neutral-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
