import type { MetadataRoute } from "next";

/**
 * Web app-manifest. Gör sajten installerbar (Android/Chrome) och låter den
 * köras i helskärm (utan webbläsarchrome) när den lagts till på hemskärmen.
 * På iOS sköts helskärmsläget av apple-web-app-metan i layout.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Livlinan",
    short_name: "Livlinan",
    description: "En utväg, ett sms bort.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2efe6",
    theme_color: "#f2efe6",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
