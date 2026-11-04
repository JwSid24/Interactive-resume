import type { ReactNode } from 'react';
import { Big_Shoulders, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
