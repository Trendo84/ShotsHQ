import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Archivo_Black, Geist, JetBrains_Mono, EB_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://shotshq.com"),
  title: {
    default: "ShotsHQ — App Store screenshots, engineered",
    template: "%s · ShotsHQ",
  },
  description:
    "AI-powered App Store screenshot generation for indie iOS developers. Polished, localized, conversion-optimized listing images in minutes.",
  applicationName: "ShotsHQ",
  authors: [{ name: "ShotsHQ" }],
  creator: "ShotsHQ",
  publisher: "ShotsHQ",
  keywords: [
    "App Store screenshots",
    "iOS marketing",
    "app preview generator",
    "App Store Connect",
    "ASO tools",
    "indie iOS developers",
    "screenshot generator",
    "iPhone screenshot mockup",
    "App Store optimization",
    "iOS launch toolkit",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ShotsHQ — App Store screenshots, engineered",
    description:
      "Upload raw shots. Get polished, localized, conversion-optimized App Store listing images.",
    type: "website",
    url: "/",
    siteName: "ShotsHQ",
    locale: "en_US",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "ShotsHQ — App Store screenshots, engineered",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@shotshq",
    title: "ShotsHQ — App Store screenshots, engineered",
    description:
      "Upload raw shots. Get polished, localized, conversion-optimized App Store listing images.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#F4F4F0" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tree = (
    <html lang="en" data-theme="tactical" className={`${display.variable} ${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );

  if (!HAS_CLERK) return tree;

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#FF2A2A",
          colorBackground: "#0A0A0A",
          colorText: "#EAEAEA",
          colorInputBackground: "#121212",
          colorInputText: "#EAEAEA",
          fontFamily: "var(--font-mono)",
          borderRadius: "0px",
        },
      }}
    >
      {tree}
    </ClerkProvider>
  );
}
