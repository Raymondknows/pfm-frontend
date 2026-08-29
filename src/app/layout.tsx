import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.peoplesfirstmovement.com"),
  applicationName: "People's First Movement",
  title: "PFM | People's First Movement",
  description: "The operating workspace for People's First Movement.",
  manifest: "/manifest.webmanifest",
  themeColor: "#183b35",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "People's First Movement",
    description: "The operating workspace for People's First Movement.",
    url: "https://www.peoplesfirstmovement.com",
    siteName: "People's First Movement",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "People's First Movement",
    description: "The operating workspace for People's First Movement.",
  },
  appleWebApp: {
    capable: true,
    title: "PFM",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="site-body">
        {children}
        <footer className="site-footer">
          Powered by <a href="https://clickbasegroup.com" target="_blank" rel="noreferrer">ClickBase Technologies Ltd</a>
        </footer>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
