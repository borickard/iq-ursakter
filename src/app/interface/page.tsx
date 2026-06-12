"use client";

import { useState } from "react";
import { IosMessages } from "@/components/IosMessages";

/**
 * Testsida för SMS-mockupen. Börjar med iOS; Android kan läggas till senare.
 * Justera avsändare/meddelande live för att se hur det ser ut.
 */
export default function InterfacePage() {
  const [name, setName] = useState("Mamma");
  const [message, setMessage] = useState(
    "Hunden har kräkts i hela sängen – kan du komma hem?",
  );
  const [dateLabel, setDateLabel] = useState("Idag 17:36");

  return (
    <main className="flex flex-1 flex-col gap-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold">SMS-förhandsvisning</h1>
        <p className="text-sm text-muted">
          Testvy för meddelande-mockupen (iOS). Android läggs till senare.
        </p>
      </div>

      {/* Telefonram */}
      <div className="mx-auto w-full max-w-[370px]">
        <div className="overflow-hidden rounded-[2.75rem] border-[7px] border-black bg-black shadow-float">
          <div className="aspect-[9/19.5] overflow-hidden rounded-[2.2rem] bg-white">
            <IosMessages
              contactName={name}
              message={message}
              dateLabel={dateLabel}
            />
          </div>
        </div>
      </div>

      {/* Kontroller */}
      <div className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm font-semibold text-brand">Testinställningar</p>
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
    </main>
  );
}
