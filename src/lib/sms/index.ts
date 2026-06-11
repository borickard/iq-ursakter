import type { SmsProvider } from "./types";
import { DummySmsProvider } from "./dummy";
import { ElksSmsProvider } from "./elks";

export type { SmsProvider, SendSmsInput, SendSmsResult } from "./types";

let cached: SmsProvider | null = null;

/**
 * Returnerar den konfigurerade SMS-leverantören (singleton).
 * Väljs via miljövariabeln SMS_PROVIDER ("elks" | "dummy").
 * Default är "dummy" så att vi aldrig råkar bränna SMS-budget av misstag.
 */
export function getSmsProvider(): SmsProvider {
  if (cached) return cached;

  const provider = (process.env.SMS_PROVIDER ?? "dummy").toLowerCase();

  switch (provider) {
    case "elks":
      cached = new ElksSmsProvider(
        process.env.ELKS_API_USERNAME ?? "",
        process.env.ELKS_API_PASSWORD ?? "",
      );
      break;
    case "dummy":
    default:
      cached = new DummySmsProvider();
      break;
  }

  return cached;
}

/** Plattformens fasta sändningsnummer (E.164). */
export function getSenderNumber(): string {
  return process.env.SMS_FROM_NUMBER ?? "";
}
