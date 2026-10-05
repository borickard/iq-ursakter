import { COPY } from "@/lib/copy";

/**
 * Avsändar-val per ursäkt.
 *
 * Varje ursäkt har en kommaseparerad lista med avsändarnamn den passar ihop med
 * (`senders` i databasen), t.ex. "Mamma,Pappa,Gullet". Tom lista = passar alla
 * avsändare. Admin väljer detta per ursäkt.
 */
export const SENDER_PRESETS: readonly string[] = COPY.details.senderPresets;

/** Parsar en kommaseparerad avsändarsträng till en lista. */
export function parseSenders(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Serialiserar en lista till den kommaseparerade formen som lagras i DB. */
export function serializeSenders(list: string[]): string {
  return list.map((x) => x.trim()).filter(Boolean).join(",");
}

/**
 * Passar ursäkten den valda avsändaren? Tom lista (inga valda) = passar alla.
 */
export function excuseFitsSender(
  sendersStr: string | null | undefined,
  sender: string,
): boolean {
  const list = parseSenders(sendersStr);
  if (list.length === 0) return true;
  return list.includes(sender.trim());
}
