import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { COPY } from "@/lib/copy";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  title: COPY.brand.name,
  description: COPY.landing.subtitle,
  robots: { index: false, follow: false }, // POC – håll den ur sökmotorer.
  // Gör att hemskärms-appen körs i helskärm utan webbläsarchrome på iOS.
  appleWebApp: { capable: true, title: COPY.brand.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f4f4f1",
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
    <html lang="sv" className={schibsted.variable}>
      <body>
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5">
          {children}
        </div>
      </body>
    </html>
  );
}
