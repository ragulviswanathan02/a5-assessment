import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A5 Assessment & Student Evaluation Platform',
  description: 'Online examination, dynamic candidate registration, and real-time performance analytics.',
  icons: {
    icon: '/a5-company-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-full flex flex-col antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
