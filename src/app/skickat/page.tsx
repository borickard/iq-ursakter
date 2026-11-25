import type { Metadata } from "next";
import Flow from "@/components/Flow";

export const metadata: Metadata = {
  title: "Förhandsvisning – Skickat",
};

/**
 * Fejkad bekräftelsesida. Besök /skickat för att se hur "Skickat"-vyn ser ut
 * utan att skicka ett riktigt sms. Startar Flow direkt på result-steget med
 * exempeldata (ingenting skickas). Sidan är noindex (globalt i layout.tsx).
 */
export default function Page() {
  return (
    <Flow
      initialStep="result"
      previewSender="Mamma"
      previewMessage="Hunden har kräkts i hela sängen – kan du komma hem?"
    />
  );
}
