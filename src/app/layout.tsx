import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SportStream — Multi-M3U Sports Streaming Platform",
  description:
    "A polished IPTV sports streaming platform that merges multiple M3U playlists into dedicated Football, Cricket, Wrestling and Other Sports sections with an intelligent auto-categorization engine.",
  keywords: [
    "IPTV", "Sports Streaming", "Football", "Cricket", "Wrestling",
    "M3U Player", "HLS", "Live Sports", "Premier League", "IPL", "WWE", "UFC",
  ],
  authors: [{ name: "SportStream" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
