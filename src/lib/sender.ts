import { getSenderNumber } from "@/lib/sms";

/**
 * Gör om ett valt namn till ett giltigt alfanumeriskt 46elks-avsändar-ID:
 * å/ä→a, ö→o m.fl. translittereras, övriga icke-bokstäver/siffror tas bort,
 * inledande siffror tas bort, längd 3–11. null om inget giltigt återstår.
 */
export function toAlphanumericSenderId(raw: string): string | null {
  const stripped = raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // ta bort diakritiska tecken (å ä ö é …)
    .replace(/[^A-Za-z0-9]/g, "")
    .replace(/^[0-9]+/, "");
  if (stripped.length < 3) return null;
  return stripped.slice(0, 11);
}

/**
 * Avsändare (SMS "from"). Två lägen via SMS_SENDER_MODE (NEXT_PUBLIC_* som reserv):
 *  - "number" (default): plattformens fasta sändningsnummer.
 *  - "name": det valda namnet som alfanumeriskt avsändar-ID (reserv: numret).
 */
export function resolveFrom(senderName: string): string {
  let from = getSenderNumber();
  const mode =
    process.env.SMS_SENDER_MODE ??
    process.env.NEXT_PUBLIC_SMS_SENDER_MODE ??
    "number";
  if (mode === "name") {
    const id = toAlphanumericSenderId(senderName);
    if (id) from = id;
  }
  return from;
}
