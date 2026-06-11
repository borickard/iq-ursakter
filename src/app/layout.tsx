import type { Metadata, Viewport } from "next";
import { COPY } from "@/lib/copy";
import "./globals.css";

export const metadata: Metadata = {
  title: COPY.landing.title,
  description: COPY.landing.subtitle,
  robots: { index: false, follow: false }, // POC – håll den ur sökmotorer.
};

export const viewport: Viewport = {
  themeColor: "#f8e2e4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body>
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5">
          {children}
        </div>
      </body>
    </html>
  );
}
