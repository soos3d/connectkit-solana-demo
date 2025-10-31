import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import the Connectkit configuration
import { ParticleConnectkit } from "../connectkit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Particle Solana Widget",
  description: "Solana Widget for Particle Wallets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ParticleConnectkit>{children}</ParticleConnectkit>
      </body>
    </html>
  );
}
