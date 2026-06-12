"use client";

import { useEffect, useState } from "react";

/**
 * iOS Messages-mockup. Återanvändbar – används på testsidan /interface och kan
 * senare driva den "falska" meddelandevyn. Bubblornas svansar görs via CSS i
 * globals.css (.ios-bubble / .ios-in / .ios-out).
 */
export type IosMessagesProps = {
  /** Kontaktnamnet som visas i headern. */
  contactName: string;
  /** Inkommande meddelandetext (ursäkten). */
  message: string;
  /** Datum/tid-separator ovanför ursäkten. */
  dateLabel?: string;
  /** Datum/tid-separator ovanför den inledande konversationen. */
  leadInLabel?: string;
  /** Klockan i statusfältet. */
  statusTime?: string;
};

export function IosMessages({
  contactName,
  message,
  dateLabel = "Idag 17:36",
  leadInLabel = "Idag 16:48",
  statusTime = "9:41",
}: IosMessagesProps) {
  const initial = contactName.trim().charAt(0).toUpperCase() || "?";

  // När appen körs som hemskärms-app (standalone) visar iOS sitt ÄKTA statusfält
  // – då döljer vi vårt egna så att det inte blir dubbelt.
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const mm = window.matchMedia?.("(display-mode: standalone)").matches;
    const iosStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(Boolean(mm || iosStandalone));
  }, []);

  return (
    <div className="ios-screen flex h-full flex-col bg-white text-black">
      {/* Statusfält (döljs i helskärms-/hemskärmsläge) */}
      {!standalone && (
        <div className="relative flex items-center justify-between px-7 pb-1 pt-3">
          <span className="text-[15px] font-semibold tracking-tight">{statusTime}</span>
          <div className="absolute left-1/2 top-2.5 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
          <div className="flex items-center gap-1.5">
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 bg-[#f7f7f7]/90 px-3 py-1.5">
        <div className="flex w-14 items-center text-[#0a7cff]">
          <span className="text-2xl leading-none">‹</span>
          <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0a7cff] px-1 text-[11px] font-semibold text-white">
            2
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#b9b9c0] to-[#8a8a92] text-sm font-semibold text-white">
            {initial}
          </div>
          <div className="flex items-center gap-0.5 text-[12px] font-semibold leading-none">
            {contactName}
            <span className="text-[10px] text-black/40">›</span>
          </div>
        </div>
        <div className="flex w-14 justify-end text-[#0a7cff]">
          <VideoIcon />
        </div>
      </div>

      {/* Konversation */}
      <div className="ios-thread flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4">
        <p className="pb-1 pt-1 text-center text-[11px] text-black/45">{leadInLabel}</p>
        <div className="ios-bubble ios-in">Kan du ringa mig när du har tid?</div>
        <div className="ios-bubble ios-out">Om en stund</div>
        <div className="ios-bubble ios-in">Ok, vi hörs sen</div>
        <p className="pb-1 pt-3 text-center text-[11px] text-black/45">{dateLabel}</p>
        {message.trim() ? (
          <div className="ios-bubble ios-in">{message}</div>
        ) : null}
      </div>

      {/* Inmatningsfält */}
      <div className="flex items-center gap-2 border-t border-black/10 bg-[#f7f7f7] px-3 pb-5 pt-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06] text-2xl leading-none text-black/50">
          +
        </div>
        <div className="flex flex-1 items-center justify-between rounded-full border border-black/15 bg-white px-4 py-1.5 text-[15px] text-black/35">
          <span>Meddelande</span>
          <MicIcon />
        </div>
      </div>
    </div>
  );
}

/* ── Små ikoner ─────────────────────────────────────────────────────────── */

function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <path d="M8 2.2c2.6 0 5 1 6.8 2.7l-1.4 1.5A7.6 7.6 0 0 0 8 4.3 7.6 7.6 0 0 0 2.6 6.4L1.2 4.9A9.7 9.7 0 0 1 8 2.2Z" />
      <path d="M8 6c1.4 0 2.7.5 3.7 1.5l-1.5 1.5A3 3 0 0 0 8 8.1c-.8 0-1.6.3-2.2.9L4.3 7.5A5.2 5.2 0 0 1 8 6Z" />
      <circle cx="8" cy="10.4" r="1.4" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.35" />
      <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
      <rect x="24" y="4" width="1.5" height="5" rx="0.75" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" fill="currentColor" aria-hidden>
      <rect x="0.5" y="2.5" width="17" height="13" rx="4" />
      <path d="M19 7.5l6-3.5v10l-6-3.5v-3Z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="13" height="18" viewBox="0 0 13 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="4" y="1" width="5" height="9" rx="2.5" fill="currentColor" stroke="none" />
      <path d="M1.5 8a5 5 0 0 0 10 0M6.5 13v3" strokeLinecap="round" />
    </svg>
  );
}
