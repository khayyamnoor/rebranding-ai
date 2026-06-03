import type { Metadata } from 'next';
import './wadi-tokens.css';
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
        {/* Wadi chrome fonts (Fraunces / Archivo / Spline Sans Mono) +
            Playfair Display & DM Sans which the generated brand deck still uses. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Spline+Sans+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WadiGate>{children}</WadiGate>
      </body>
    </html>
  );
}
