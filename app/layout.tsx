import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GistCheck · Micro-Learning Comprehension Assessor',
  description:
    'A micro-learning comprehension assessor: read technical articles under time, write an active-recall synthesis in your own words, and receive instant 1-10 rubric feedback. Problem statement: PRAYAS-INFO-26-S-007, SDG 4 Quality Education.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                localStorage.removeItem('gistcheck_theme');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 transition-colors duration-200">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              GistCheck · Problem Statement{' '}
              <span className="font-semibold text-indigo-600">
                PRAYAS-INFO-26-S-007
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span>UN Sustainable Development Goal 4: Quality Education</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
