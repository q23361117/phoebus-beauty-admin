import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "美容業後台",
  description: "Beauty Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}