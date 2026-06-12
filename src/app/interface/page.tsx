"use client";

import { useEffect, useState } from "react";
import { IosMessages } from "@/components/IosMessages";
import { Button } from "@/components/ui";

type InstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
};

/**
 * Helskärms-testvy för SMS-mockupen. iOS först; Android kan läggas till senare.
 * Inställningar (namn/meddelande) ligger i ett blad som öppnas med knappen, så
 * att själva vyn kan visas helt ren.
 */
export default function InterfacePage() {
  const [name, setName] = useState("Mamma");
  const [message, setMessage] = useState(
    "Hunden har kräkts i hela sängen – kan du komma hem?",
  );
  const [dateLabel, setDateLabel] = useState("Idag 17:36");
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  // Android/Chrome: fånga install-prompten så vi kan erbjuda en knapp.
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <>
      {/* Helskärms-mockup */}
      <div className="fixed inset-0 z-30 bg-white">
        <div className="mx-auto h-full max-w-md">
          <IosMessages contactName={name} message={message} dateLabel={dateLabel} />
        </div>
      </div>

      {/* Diskret inställningsknapp */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-3 z-40 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
      >
        Inställningar
      </button>

      {/* Inställningsblad */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[88%] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-8 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <h2 className="mb-4 text-lg font-bold">Testinställningar</h2>

            <div className="space-y-4">
              <label className="block space-y-1 text-sm font-medium">
                <span>Avsändare (kontaktnamn)</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-full border border-border bg-surface px-4 py-2.5 shadow-inset outline-none ring-brand/30 transition focus:ring-2"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Meddelande</span>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-inset outline-none ring-brand/30 transition focus:ring-2"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Datum/tid-etikett</span>
                <input
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  className="w-full rounded-full border border-border bg-surface px-4 py-2.5 shadow-inset outline-none ring-brand/30 transition focus:ring-2"
                />
              </label>
            </div>

            {/* Helskärm / hemskärm */}
            <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-4 text-sm">
              <p className="font-semibold">Visa i helskärm</p>
              <p className="mt-1 text-muted">
                Lägg till sidan på hemskärmen, så försvinner webbläsarens
                adressfält och vyn fyller hela skärmen.
              </p>
              <p className="mt-2 text-muted">
                <span className="font-medium text-text">iPhone (Safari):</span>{" "}
                tryck på Dela-ikonen längst ner och välj ”Lägg till på
                hemskärmen”.
              </p>
              {installPrompt && (
                <Button onClick={install} className="mt-3 px-4 py-2 text-sm">
                  Lägg till på hemskärmen
                </Button>
              )}
            </div>

            <Button
              block
              variant="secondary"
              className="mt-5"
              onClick={() => setOpen(false)}
            >
              Stäng
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
