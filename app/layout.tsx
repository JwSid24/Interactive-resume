import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Jwan Sidou #18 · Software for the beautiful game',
  description: 'Interactive football-anime portfolio of Jwan Sidou, software engineering student at the University of Southern Denmark.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
