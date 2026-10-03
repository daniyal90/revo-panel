import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from '@/components/Providers';
import dynamic from 'next/dynamic';

const WelcomeSplash = dynamic(() => import('@/components/WelcomeSplash'), { ssr: false });

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "Revo Panel - SMS Traffic Monetization Platform",
  description: "Monetize your SMS traffic with real-time tracking, 69+ destinations, and weekly payouts.",
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icons/ios/AppIcon-1024.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <WelcomeSplash />
          {children}
        </Providers>
      </body>
    </html>
  );
}
