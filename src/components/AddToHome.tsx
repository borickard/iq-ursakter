"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { COPY } from "@/lib/copy";
import { Button } from "@/components/ui";
import {
  detectInstallPlatform,
  isStandalone,
  type InstallPlatform,
} from "@/lib/device";

const STORAGE_KEY = "ursakt_a2hs";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Liten app-ikon (samma som hemskärms-ikonen) för tipsrutan. */
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
 * Hemskärms-tips. Visas som en diskret ruta längst ner (bara på iOS/Android, och
 * bara om appen inte redan körs som hemskärms-app och inte redan stängts bort).
 * Klick på rutan öppnar en popup med detaljerade steg för rätt operativsystem.
 * På Android visas även en inbyggd "Installera"-knapp om webbläsaren stöder det.
 */
export function AddToHome() {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const p = detectInstallPlatform();
    if ((p === "ios" || p === "android") && !isStandalone()) {
      let done = false;
      try {
        done = localStorage.getItem(STORAGE_KEY) === "done";
      } catch {}
      if (!done) {
        setPlatform(p);
        setVisible(true);
      }
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function markDone() {
    try {
      localStorage.setItem(STORAGE_KEY, "done");
    } catch {}
  }

  function dismiss() {
    setVisible(false);
    setOpen(false);
    markDone();
  }

  async function nativeInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    setDeferred(null);
    if (choice?.outcome === "accepted") dismiss();
  }

  if (!platform || (!visible && !open)) return null;

  const copy = COPY.addToHome;
  const steps = platform === "ios" ? copy.ios : copy.android;

  return (
    <>
      {/* Diskret tipsruta längst ner. */}
      {visible && (
        <div
          className="fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))]"
          role="region"
          aria-label={copy.tipAria}
        >
          <div className="flex w-full max-w-md items-center gap-3 rounded-none border border-border bg-surface px-3.5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.14)]">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <AppIconMini className="h-9 w-9 shrink-0 rounded-[7px]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">
                  {copy.tipTitle}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {copy.tipText}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label={copy.dismiss}
              className="shrink-0 p-1.5 text-muted transition hover:text-text"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Detaljerad popup. */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={copy.modalTitle}
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 sm:items-center sm:p-5"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-none border border-border bg-surface p-6 pb-[max(24px,env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AppIconMini className="h-10 w-10 shrink-0 rounded-[8px]" />
                  <h2 className="font-display text-xl font-normal">
                    {copy.modalTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={copy.close}
                  className="shrink-0 p-1 text-muted transition hover:text-text"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-muted">
                {copy.modalIntro}
              </p>

              {platform === "android" && deferred && (
                <Button block onClick={nativeInstall} className="mt-4">
                  {copy.install}
                </Button>
              )}

              <div className="mt-5">
                <p className="text-sm font-semibold">{steps.heading}</p>
                <ol className="mt-2 space-y-2.5">
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

              <button
                type="button"
                onClick={dismiss}
                className="mt-6 w-full text-center text-sm text-muted underline underline-offset-2 hover:text-text"
              >
                {copy.close}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
