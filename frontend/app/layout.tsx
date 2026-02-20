import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aivora – AI Customer Support',
  description: 'Build AI Customer Support in Minutes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
