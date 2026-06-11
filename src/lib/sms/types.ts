/**
 * Litet internt interface för SMS-sändning så att leverantören kan bytas utan
 * att resten av appen påverkas (brief avsnitt 6 & 11).
 */
export interface SendSmsInput {
  /** Mottagarnummer i E.164-format, t.ex. "+46701234567". */
  to: string;
  /** Plattformens fasta sändningsnummer i E.164-format. */
  from: string;
  /** Meddelandetexten. */
  message: string;
}

export interface SendSmsResult {
  ok: boolean;
  /** Leverantörens id för meddelandet, om det finns. */
  id?: string;
  /** Felinformation för loggning (visas aldrig rått för användaren). */
  error?: string;
}

export interface SmsProvider {
  readonly name: string;
  send(input: SendSmsInput): Promise<SendSmsResult>;
}
