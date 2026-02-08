import './globals.css';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Carche - Home Services Platform',
  description: 'Connect with verified service providers for all your home needs',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
