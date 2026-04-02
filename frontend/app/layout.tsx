import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavShell } from "./components/nav-shell";
import { DotGridProvider } from "./components/dot-grid-context";
import { DotGridCanvas } from "./components/dot-grid-canvas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PROBE - Web3 Intelligence Swarm",
  description:
    "Multi-agent Web3 research intelligence powered by ElizaOS and Nosana decentralized GPU network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-screen bg-[var(--background)]">
        <DotGridProvider>
          <DotGridCanvas />
          <NavShell>{children}</NavShell>
        </DotGridProvider>
      </body>
    </html>
  );
}
