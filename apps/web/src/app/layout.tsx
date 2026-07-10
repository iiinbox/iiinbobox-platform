import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getPublishedFonts, fontFaceCss } from "@/lib/fonts";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "iiinbox", template: "%s | iiinbox" },
  description: "Multi-vendor marketplace — discover products from independent sellers.",
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: "/icon",
    apple: "/icon",
  },
};

// Custom fonts (Text component's font-upload system, see lib/fonts.ts) load
// here rather than per-page — this is the one layout every route (live site
// AND /admin editor) shares, so a single @font-face injection covers both the
// published pages and the editor's own canvas/dropdown previews.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const fonts = await getPublishedFonts();
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {fonts.length > 0 && <style dangerouslySetInnerHTML={{ __html: fontFaceCss(fonts) }} />}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
