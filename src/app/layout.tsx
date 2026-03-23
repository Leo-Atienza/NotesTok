import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export const metadata: Metadata = {
  title: "NotesTok — Upload Notes. Get Quizzed. Actually Remember.",
  description:
    "AI-powered study companion that transforms your notes into interactive micro-lessons with quizzes that adapt to how your brain works. Built on active recall + spaced retrieval research. Powered by Google Gemini.",
  keywords: [
    "AI study tool",
    "active recall",
    "micro-lessons",
    "quiz generator",
    "Google Gemini",
    "EdTech",
    "study companion",
    "NotesTok",
  ],
  authors: [{ name: "Leo Atienza" }],
  openGraph: {
    title: "NotesTok — Upload Notes. Get Quizzed. Actually Remember.",
    description:
      "AI transforms any study material into interactive micro-lessons with quizzes that adapt to how your brain works.",
    type: "website",
    siteName: "NotesTok",
  },
  twitter: {
    card: "summary_large_image",
    title: "NotesTok — Upload Notes. Get Quizzed. Actually Remember.",
    description:
      "AI transforms any study material into interactive micro-lessons with quizzes that adapt to how your brain works.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
