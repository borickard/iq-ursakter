import type { SmsProvider, SendSmsInput, SendSmsResult } from "./types";

/**
 * Dummy-leverantör för utveckling. Skickar inga riktiga SMS – loggar bara till
 * servern. Bränner ingen SMS-budget. Används när SMS_PROVIDER="dummy".
 */
export class DummySmsProvider implements SmsProvider {
  readonly name = "dummy";

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    // Maska numret i loggen så vi inte råkar logga personuppgifter i klartext.
    const masked = input.to.replace(/\d(?=\d{2})/g, "•");
    console.log(
      `[sms:dummy] (skickar inget) to=${masked} from=${input.from} message="${input.message}"`,
    );
    return { ok: true, id: `dummy-${Date.now()}` };
  }
}
