/**
 * Tunn wrapper runt Plausible (integritetsvänlig statistik, ingen cookie, ingen
 * PII). Scriptet laddas i layout.tsx. Anropen köas av Plausibles egen stub tills
 * scriptet hunnit ladda, så det är säkert att anropa direkt.
 *
 * Egna händelser (konfigurera som "mål/goals" i Plausible med SAMMA namn):
 *  - "Starta flöde"   – går från start- till skapa-vyn (knappen "Skicka mig en ursäkt")
 *  - "Skicka sms"     – ett sms skickas. Props: avsändare, ursäkt, typ ("nu"/"schemalagt")
 *  - "Förhandsvisa"   – klick på "Förhandsvisa sms"
 *  - "IQ-logga"       – klick på IQ-loggan i sidfoten (→ iq.se)
 * Sidvisningar/besökare räknas automatiskt av Plausible.
 */
type Props = Record<string, string | number | boolean>;

export function track(event: string, props?: Props): void {
  if (typeof window === "undefined") return;
  const plausible = (window as unknown as { plausible?: (e: string, o?: { props: Props }) => void })
    .plausible;
  try {
    if (typeof plausible === "function") {
      plausible(event, props ? { props } : undefined);
    }
  } catch {
    // statistik får aldrig påverka appen
  }
}
