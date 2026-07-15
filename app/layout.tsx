import type { Metadata } from "next";
import { Sora, IBM_Plex_Sans_Thai, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const plexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "thai"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "International School Tracking · Dashboard",
  description: "Sales Performance & Customer Pipeline · CRM Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${plexSansThai.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
