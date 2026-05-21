import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: [
    { path: "./fonts/Geist-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Geist-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Geist-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Geist-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans-en",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "./fonts/GeistMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/GeistMono-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/GeistMono-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

const ibmPlexKr = localFont({
  src: [
    { path: "./fonts/IBMPlexSansKR-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansKR-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSansKR-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/IBMPlexSansKR-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SQL Query Chatbot",
  description: "SQL search and execution chatbot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} ${geistMono.variable} ${ibmPlexKr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
