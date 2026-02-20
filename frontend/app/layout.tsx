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
    icon: '/brand-logo.png',
    shortcut: '/brand-logo.png',
    apple: '/brand-logo.png',
  },
  openGraph: {
    title: 'Aivora – AI Customer Support',
    description: 'Build AI Customer Support in Minutes',
    images: ['/brand-logo.png'],
  },
};

const toastOptions = {
  className: 'aivora-toast',
  duration: 4000,
  style: {
    background: '#111827',
    color: '#E5E7EB',
    border: '1px solid #2A3446',
    borderRadius: '12px',
    padding: '14px 18px',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
  },
  success: {
    className: 'aivora-toast aivora-toast-success',
    iconTheme: { primary: '#22C55E', secondary: '#111827' },
    style: {
      background: '#111827',
      color: '#E5E7EB',
      border: '1px solid rgba(34, 197, 94, 0.35)',
      borderRadius: '12px',
      padding: '14px 18px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.4), 0 0 20px -5px rgba(34, 197, 94, 0.2)',
    },
  },
  error: {
    className: 'aivora-toast aivora-toast-error',
    iconTheme: { primary: '#FCA5A5', secondary: 'rgba(127, 29, 29, 0.95)' },
    style: {
      background: 'rgba(127, 29, 29, 0.95)',
      color: '#FEE2E2',
      border: '1px solid rgba(248, 113, 113, 0.5)',
      borderRadius: '12px',
      padding: '14px 18px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.4), 0 0 20px -5px rgba(239, 68, 68, 0.2)',
    },
  },
  loading: {
    className: 'aivora-toast',
    iconTheme: { primary: '#6366F1', secondary: '#111827' },
    style: {
      background: '#111827',
      color: '#E5E7EB',
      border: '1px solid #2A3446',
      borderRadius: '12px',
      padding: '14px 18px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.4)',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`min-h-screen antialiased font-sans ${inter.variable}`}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={toastOptions}
            gutter={12}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
