import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";

import { ClientProviders } from "@/providers/client-providers";
import { publicSiteUrl, vercelSiteOrigin } from "@/lib/services/shared/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

/** Figures & code — restrained mono (theme token name unchanged for CSS compatibility). */
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
});

function metadataBaseUrl(): URL {
  try {
    return new URL(publicSiteUrl());
  } catch {
    const vercel = vercelSiteOrigin();
    if (vercel) return new URL(vercel);
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: "MONEYSET — Market Structure Before Consensus",
    template: "%s · MONEYSET",
  },
  description:
    "Institutional market structure intelligence. Understand conditions, scenarios, and invalidation before consensus forms. Not signals — structural interpretation.",
  applicationName: "MONEYSET",
  keywords: ["MONEYSET", "market structure", "execution intelligence", "institutional", "scenarios", "invalidation"],
  authors: [{ name: "MONEYSET" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "MONEYSET",
    title: "MONEYSET — Market Structure Before Consensus",
    description: "Institutional market structure intelligence. Not signals — structural interpretation and execution discipline.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MONEYSET — Market Structure Before Consensus",
    description: "Institutional market structure intelligence. Understand conditions, scenarios, and invalidation before consensus forms.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#040406" },
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeInitScript = `
(function(){
  try {
    var raw = localStorage.getItem('moneyset_theme_v1');
    var pref = 'dark';
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.state.preference) pref = parsed.state.preference;
    }
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = pref === 'system' ? (dark ? 'dark' : 'light') : pref;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="ms-body ms-category-organism h-dvh max-h-dvh min-h-0 antialiased">
        <Script id="ms-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ClientProviders>
          <div className="flex h-dvh max-h-dvh min-h-0 flex-col">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
