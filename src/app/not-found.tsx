import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

/**
 * 404 – kort och gott att sidan inte finns, plus en chattbubbla där sidan
 * ursäktar att den gått vilse. Samma IQ-look som resten (Copernicus-rubrik,
 * inkommande sms-bubbla, hover-invert-knapp). Statisk serverkomponent.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <Wordmark className="text-[24px] lg:text-[30px]" />

      <h1 className="mt-10 font-display text-[clamp(72px,22vw,128px)] font-normal leading-none">
        404
      </h1>
      <p className="mt-2 text-lg text-muted">Sidan hittades inte.</p>

      {/* Inkommande sms-bubbla (iOS-grå) – sidan ber om ursäkt. */}
      <div className="mt-8 w-full max-w-sm text-left">
        <p className="mb-1 ml-1 text-xs font-semibold text-muted">Sidan</p>
        <div className="inline-block rounded-[20px] rounded-bl-[6px] bg-[#e9e9eb] px-4 py-3 text-[15px] leading-snug text-[#1c1c1e]">
          Sorry, jag har gått vilse och hittar inte rätt. 🙈
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
