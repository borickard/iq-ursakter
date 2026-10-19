/* eslint-disable @next/next/no-img-element */

/**
 * IQ-logotyp (officiell SVG från IQ, LOGOTYP A LILA-ORANGE = orange på lila –
 * brief:ens huvudkombination). Original­färger, färgsätt inte om den. Filen ligger
 * i public/iq-logo.svg (C2PA/Firefly-metadata bortstädad). Portrait-proportion,
 * så sätt höjd och låt bredden följa med.
 */
export function IqLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return <img src="/iq-logo.svg" alt="IQ" className={className} />;
}
