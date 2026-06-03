import type { Metadata } from 'next';
import './globals.css';
import { WadiGate } from '@/components/WadiGate';

export const metadata: Metadata = {
  title: 'BrandVista AI',
  description: 'See your brand come to life — AI-generated branded product mockups.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WadiGate>{children}</WadiGate>
      </body>
    </html>
  );
}
