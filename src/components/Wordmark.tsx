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
      <span className="inline-flex items-center" style={{ marginLeft: "-0.11em" }}>
        <svg
          viewBox="0 0 43 24"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          className="h-[0.74em] w-auto"
          style={{ marginRight: "-0.04em" }}
        >
          <path
            d="M21.6 21C21.6 21 5.4 14.6 5.4 8.6C5.4 5.6 9.5 3.6 14.4 3.6C17.6 3.6 20.3 4.7 21.6 6.1C22.9 4.7 25.6 3.6 28.8 3.6C33.7 3.6 37.8 5.6 37.8 8.6C37.8 14.6 21.6 21 21.6 21Z"
            fill="#d7ff3e"
            stroke="#0b0b0b"
            strokeWidth={6}
            strokeLinejoin="round"
          />
        </svg>
        LIV
      </span>
      <span>LINAN</span>
    </span>
  );
}
