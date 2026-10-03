import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk, Space_Mono, Syne } from "next/font/google";
import { COPY } from "@/lib/copy";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: COPY.brand.name,
  description: COPY.landing.subtitle,
  robots: { index: false, follow: false }, // POC – håll den ur sökmotorer.
  appleWebApp: { capable: true, title: COPY.brand.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f2efe6",
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
    <html
      lang="sv"
      className={`${hanken.variable} ${archivo.variable} ${spaceMono.variable} ${syne.variable}`}
    >
      <body>
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5">
          {children}
        </div>
      </body>
    </html>
  );
}
