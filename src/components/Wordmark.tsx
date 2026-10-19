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
  const cls =
    "inline-flex items-center font-wordmark font-extrabold uppercase leading-none tracking-tight text-text " +
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
