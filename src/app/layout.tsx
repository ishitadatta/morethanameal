import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "More Than a Meal",
  description: "Supabase-backed prototype for shared meal planning pods",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
