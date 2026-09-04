import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { GlobalStateProvider } from '@/lib/GlobalStateContext';

export const metadata: Metadata = {
  title: 'VERTEX | Thermal Intelligence',
  description: 'AI-Based Detection and Classification of Industrial Fires',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface font-body-md h-screen w-screen overflow-hidden flex flex-col">
        <GlobalStateProvider>
          <Header />
          {children}
        </GlobalStateProvider>
      </body>
    </html>
  );
}
