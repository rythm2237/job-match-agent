import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Match Agent",
  description: "Daily AI-powered job matching from trusted job sources."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
