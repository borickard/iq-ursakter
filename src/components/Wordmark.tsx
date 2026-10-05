/**
 * Ordmärket: ett hjärta (extraliv) + LIV på första raden, LINAN under. Syne.
 * Hjärtat är fyllt med lime och har en tjock ink-kontur.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex flex-col items-start font-wordmark font-extrabold uppercase leading-[0.92] tracking-tight text-text " +
        className
      }
    >
      <span className="inline-flex items-center">
        {/* "Normalt" hjärta (samma form som faviconen), tjock ink-kontur. */}
        <svg
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          className="h-[0.86em] w-auto"
          style={{ marginRight: "0.04em" }}
        >
          <path
            d="M12 21C12 21 3 14.6 3 8.6C3 5.6 5.3 3.6 8 3.6C9.8 3.6 11.3 4.7 12 6.1C12.7 4.7 14.2 3.6 16 3.6C18.7 3.6 21 5.6 21 8.6C21 14.6 12 21 12 21Z"
            fill="#d7ff3e"
            stroke="#0b0b0b"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </svg>
        LIV
      </span>
      <span>LINAN</span>
    </span>
  );
}
