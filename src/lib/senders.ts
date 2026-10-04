import type { ExcuseCategory } from "@/lib/excuses";

/**
 * Vilken sorts ursäkter varje avsändare ska visa.
 *   "home" = privat (Mamma / Pappa / Älskling)
 *   "work" = jobb (Chefen)
 *
 * Flödet är avsändare-först: användaren väljer vem det ska se ut att komma från,
 * och får sedan ursäkter som passar den personen.
 */
export const SENDER_CATEGORY: Record<string, ExcuseCategory> = {
  Mamma: "home",
  Pappa: "home",
  Älskling: "home",
  Chefen: "work",
};

/**
 * Kategorin för en vald avsändare.
 *  - tom sträng  → null (ingen avsändare vald ännu)
 *  - okänt namn  → undefined (visa alla ursäkter, ingen filtrering)
 *  - känt namn   → "home" | "work"
 */
export function categoryForSender(
  sender: string,
): ExcuseCategory | null | undefined {
  const s = sender.trim();
  if (!s) return null;
  return SENDER_CATEGORY[s];
}
