import type { MetadataRoute } from "next";

/**
 * Web app-manifest. Gör sajten installerbar (Android/Chrome) och låter den
 * köras i helskärm (utan webbläsarchrome) när den lagts till på hemskärmen.
 * På iOS sköts helskärmsläget av apple-web-app-metan i layout.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ursäkten",
    short_name: "Ursäkten",
    description: "En utväg, ett sms bort.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Full-bleed → fungerar som maskable (Android klipper själv till rätt form).
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
