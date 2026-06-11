import type { SmsProvider, SendSmsInput, SendSmsResult } from "./types";

/**
 * 46elks-leverantör (svensk, enkelt REST-API).
 *
 * Anrop: POST https://api.46elks.com/a1/sms med Basic Auth (API username +
 * password) och form-encoded body { from, to, message }.
 *
 * Nycklarna läses från miljövariabler på servern och får ALDRIG nå klienten.
 *
 * Tips under utveckling: skicka till +4670000000 (46elks dummy-nummer) – det
 * är gratis och skickar inget riktigt SMS.
 */
export class ElksSmsProvider implements SmsProvider {
  readonly name = "elks";

  private readonly endpoint = "https://api.46elks.com/a1/sms";

  constructor(
    private readonly username: string,
    private readonly password: string,
  ) {
    if (!username || !password) {
      throw new Error(
        "ELKS_API_USERNAME / ELKS_API_PASSWORD saknas. Sätt dem i .env.local eller använd SMS_PROVIDER=dummy.",
      );
    }
  }

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");

    const body = new URLSearchParams({
      from: input.from,
      to: input.to,
      message: input.message,
    });

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const text = await res.text();

      if (!res.ok) {
        return { ok: false, error: `46elks svarade ${res.status}: ${text}` };
      }

      // 46elks svarar med JSON innehållande bl.a. "id" och "status".
      let id: string | undefined;
      try {
        id = JSON.parse(text)?.id;
      } catch {
        // ignorera parse-fel, svaret räknas ändå som ok
      }
      return { ok: true, id };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
