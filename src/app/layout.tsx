import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BotStatusProvider } from '@/contexts/BotStatusContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import BotStatusHeader from '@/components/BotStatusHeader';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solana Arbitrage Bot Controller",
  description: "Control panel for Solana arbitrage bot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <BotStatusProvider>
            <BotStatusHeader />
            <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              {children}
            </main>
          </BotStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
