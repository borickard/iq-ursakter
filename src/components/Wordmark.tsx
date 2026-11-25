import { COPY } from "@/lib/copy";

/**
 * Ordmärket: tjänstens namn på en rad, i Syne (eget typsnitt – inte IQ:s). Utan
 * hjärta sedan namnbytet Livlinan → Ursäkten. Om `onClick` skickas in blir det
 * klickbart (t.ex. tillbaka till start) och renderas som en knapp.
 */
export function Wordmark({
  className = "",
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  // p-0/m-0/appearance-none: nollställ knappens standard-padding så ordmärket får
  // EXAKT samma storlek vare sig det renderas som <span> (hjälten) eller <button>
  // (headern). Annars blir header-varianten några px större → view transition
  // skalar upp "URSÄKTEN" en aning precis innan den glider upp.
  const cls =
    "inline-flex items-center appearance-none border-0 bg-transparent p-0 m-0 font-wordmark font-extrabold uppercase leading-none tracking-tight text-text " +
    className;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={COPY.brand.name} className={cls}>
        {COPY.brand.name}
      </button>
    );
  }
  return <span className={cls}>{COPY.brand.name}</span>;
}
