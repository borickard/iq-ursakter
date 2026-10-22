import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

/**
 * 404 – i linje med konceptet: sidan som saknas "hör av sig med en ursäkt".
 * Statisk serverkomponent, samma IQ-look som resten (Copernicus-rubrik,
 * gul highlight, inkommande sms-bubbla, hover-invert-knapp).
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <Wordmark className="text-[24px] lg:text-[30px]" />

      <p className="mt-10 font-mono text-xs uppercase tracking-[0.25em] text-muted">
        Fel 404
      </p>
      <h1 className="mt-3 font-display text-[clamp(32px,9vw,52px)] font-normal leading-[1.1]">
        Sidan har en <span className="livlina-mark">ursäkt</span>.
      </h1>
      <p className="mt-5 max-w-md text-[17px] leading-relaxed text-text">
        Sidan du letade efter kunde inte komma just nu. Men den hann skicka ett
        meddelande:
      </p>

      {/* Inkommande sms-bubbla (iOS-grå) – sidan ger sin ursäkt. */}
      <div className="mt-7 w-full max-w-sm text-left">
        <p className="mb-1 ml-1 text-xs font-semibold text-muted">Sidan</p>
        <div className="inline-block rounded-[20px] rounded-bl-[6px] bg-[#e9e9eb] px-4 py-3 text-[15px] leading-snug text-[#1c1c1e]">
          Sorry! Jag kan inte komma just nu – jag har antingen flyttat eller
          aldrig funnits. Kan vi ses på startsidan istället? 🙈
        </div>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex items-center justify-center gap-2 rounded-none border border-border bg-brand px-8 py-3.5 font-medium text-brand-fg transition duration-100 hover:bg-white hover:text-black active:translate-y-px"
      >
        Tillbaka till start
      </Link>
    </main>
  );
}
