import { COPY } from "@/lib/copy";

/**
 * Ordmärket: tjänstens namn på en rad, i Syne (eget typsnitt – inte IQ:s). Utan
 * hjärta sedan namnbytet Livlinan → Ursäkten (extraliv-kopplingen försvann).
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center font-wordmark font-extrabold uppercase leading-none tracking-tight text-text " +
        className
      }
    >
      {COPY.brand.name}
    </span>
  );
}
