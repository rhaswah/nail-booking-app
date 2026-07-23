import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Baloo_2, Pacifico } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Friendly rounded display font for headings → `font-display`
const balooDisplay = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Pretty script — ONLY for the salon name / hero flourish → `font-script`
const pacificoScript = Pacifico({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Fairy Nail Spa — Book Your Sparkle",
  description:
    "Book manicures, pedicures, gel, and dreamy nail art at Fairy Nail Spa. Pick your service, fairy nail tech, and time in under a minute. ✨",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fairy Nail Spa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f24e97", // pink-500
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${balooDisplay.variable} ${pacificoScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink-800">
        {children}
      </body>
    </html>
  );
}
