import type { ReactNode } from 'react';
import { Big_Shoulders, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

// Vercel Web Analytics and Speed Insights: cookie-free, and only in builds made by Vercel (VERCEL=1 at build time).
// The GitHub Pages copy has no Vercel endpoint for them, so it leaves them out.
const onVercel = process.env.VERCEL === '1';

// Display: condensed sports lettering. Accent: editorial serif italic. Labels: monospace.
const display = Big_Shoulders({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--f-display', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--f-serif', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--f-mono', display: 'swap' });

export const metadata = {
  title: 'Jwan Sidou · Software engineering student',
  description: 'Portfolio of Jwan Sidou, software engineering student at the University of Southern Denmark. No. 18, CDM.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        {children}
        {onVercel && <><Analytics /><SpeedInsights /></>}
      </body>
    </html>
  );
}
