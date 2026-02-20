import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './QueryProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Aivora – AI Customer Support',
  description: 'Build AI Customer Support in Minutes',
  icons: {
    icon: '/aivora.png',
    shortcut: '/aivora.png',
    apple: '/aivora.png',
  },
  openGraph: {
    title: 'Aivora – AI Customer Support',
    description: 'Build AI Customer Support in Minutes',
    images: ['/aivora.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`min-h-screen antialiased font-sans ${inter.variable}`}>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
