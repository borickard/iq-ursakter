import type { Metadata, Viewport } from "next";
import { Syne, Geist } from "next/font/google";
import { COPY } from "@/lib/copy";
import "./globals.css";

// Ordmärket behåller sitt eget typsnitt (Syne). Rubriker = Copernicus (självhostad
// i globals.css). Brödtext/etiketter/knappar = Geist – en ren, modern grotesk i
// samma familj som PP Neue Montreal men med tydligare medium/bold.
const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: COPY.brand.name,
  description: COPY.landing.subtitle,
  authors: [{ name: "IQ", url: "https://iq.se" }],
  robots: { index: false, follow: false }, // POC – håll den ur sökmotorer.
  appleWebApp: { capable: true, title: COPY.brand.name, statusBarStyle: "default" },
  openGraph: {
    title: COPY.brand.name,
    description: COPY.landing.subtitle,
    locale: "sv_SE",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: COPY.brand.name }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={`${syne.variable} ${geist.variable}`}>
      <body>
        {/* Smal kolumn på mobil; bredare på desktop så skapa-vyn får plats med
            två kolumner (kontroller + telefonförhandsvisning). Varje vy sätter
            sin egen maxbredd inuti. */}
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 lg:max-w-4xl lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
