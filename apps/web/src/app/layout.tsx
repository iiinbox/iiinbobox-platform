import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { Header } from "@/components/header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "iiiiiBOX", template: "%s | iiiiiBOX" },
  description: "Multi-vendor marketplace — discover products from independent sellers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get("host") ?? "";
  const isAdmin = host.startsWith("admin.");

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {!isAdmin && <Header />}
        <main>{children}</main>
      </body>
    </html>
  );
}
