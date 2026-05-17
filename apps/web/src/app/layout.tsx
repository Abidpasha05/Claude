import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arkan — From kitchen to customer, all in one',
  description: 'The all-in-one platform for restaurants: orders, bookings, party catering, meal subscriptions, and live operations.',
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
