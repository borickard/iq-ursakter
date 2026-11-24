"use client";

import { useEffect, useState } from "react";
import { COPY } from "@/lib/copy";
import { Button } from "@/components/ui";
import {
  detectInstallPlatform,
  isStandalone,
  type InstallPlatform,
} from "@/lib/device";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Liten app-ikon (samma som hemskärms-ikonen). */
function AppIconMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect width="100" height="100" fill="#EFFE53" />
      <path
        d="M30 30 H70 a12 12 0 0 1 12 12 V58 a12 12 0 0 1 -12 12 H42 l-10 10 v-10 h-2 a12 12 0 0 1 -12 -12 V42 a12 12 0 0 1 12 -12 Z"
        fill="#242F55"
      />
      <g fill="#EFFE53">
        <circle cx="35" cy="50" r="5.5" />
        <circle cx="50" cy="50" r="5.5" />
        <circle cx="65" cy="50" r="5.5" />
      </g>
    </svg>
  );
}

/** iOS dela-ikon (för steg-instruktionen). */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  );
}

/**
 * Inline-tips på skickat-sidan: lägg till Ursäkten på hemskärmen. Visas bara på
 * iOS/Android (inte desktop) och inte om appen redan körs från hemskärmen. Klick
 * fäller ut detaljerade steg för rätt OS direkt på sidan (ingen popup). På Android
 * visas en inbyggd "Installera"-knapp om webbläsaren stöder det.
 */
export function AddToHome() {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const p = detectInstallPlatform();
    if ((p === "ios" || p === "android") && !isStandalone()) setPlatform(p);
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  async function nativeInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
  }

  if (!platform) return null;

  const copy = COPY.addToHome;
  const steps = platform === "ios" ? copy.ios : copy.android;

  return (
    <section className="mt-8 border border-border text-left">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <AppIconMini className="h-10 w-10 shrink-0 rounded-[8px]" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">
            {copy.tipTitle}
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-muted">
            {copy.tipText}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={
            "h-5 w-5 shrink-0 text-muted transition-transform duration-200 " +
            (expanded ? "rotate-180" : "")
          }
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 pt-3.5">
          {platform === "android" && deferred && (
            <Button block onClick={nativeInstall} className="mb-4">
              {copy.install}
            </Button>
          )}
          <p className="text-sm font-semibold">{steps.heading}</p>
          <ol className="mt-2.5 space-y-2.5">
            {steps.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-snug">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-border text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="flex items-center gap-1.5 pt-0.5">
                  {platform === "ios" && i === 0 && (
                    <ShareIcon className="inline-block h-[18px] w-[18px]" />
                  )}
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
