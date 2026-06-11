/** Liten klassnamns-hjälpare (utan extra beroende). */
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
