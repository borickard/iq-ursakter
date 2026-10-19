/**
 * IQ-logotyp (PLATSHÅLLARE). Kvadratisk box, orange "IQ" på IQ-lila, med en
 * flaska antydd i Q:et. Detta är en approximation – byt mot IQ:s officiella SVG
 * innan publik lansering (be IQ om filen). Originalfärger: orange (#FF5C00) på
 * lila (#5D3181); färgsätt inte om den för att smälta in.
 */
export function IqLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="IQ"
    >
      <rect width="48" height="48" fill="#5D3181" />
      {/* "I" */}
      <rect x="12.5" y="13" width="4.4" height="22" fill="#FF5C00" />
      {/* "Q" – ring + svans */}
      <circle
        cx="30.5"
        cy="24"
        r="8.6"
        fill="none"
        stroke="#FF5C00"
        strokeWidth="4.4"
      />
      <rect
        x="32.5"
        y="30"
        width="4.4"
        height="7.5"
        transform="rotate(-38 32.5 30)"
        fill="#FF5C00"
      />
      {/* Flaska antydd i Q:ets öga */}
      <rect x="29" y="19.5" width="3" height="9" rx="1.2" fill="#FF5C00" />
      <rect x="29.9" y="17.6" width="1.2" height="2.4" fill="#FF5C00" />
    </svg>
  );
}
