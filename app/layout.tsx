import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Jwandini #18 · Software for the beautiful game',
  description: 'Interactive anime-style portfolio of Jwandini, software engineer for football clubs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
