import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: '日本語文字化け再現ツール',
    description: 'Next.jsで実装された日本語文字化け再現ツール',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
        <body className={inter.className}>
        {children}
        </body>
        </html>
    );
}
