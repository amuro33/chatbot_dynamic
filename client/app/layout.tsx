import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQL Query Chatbot",
  description: "SQL search and execution chatbot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

