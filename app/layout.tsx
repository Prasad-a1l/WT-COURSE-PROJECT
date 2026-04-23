import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/theme.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Word Migration Visualizer",
  description:
    "Historical linguistics explorer: AI-assisted etymology chains, narrative context, and D3 geographic visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#0c0c0e] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
