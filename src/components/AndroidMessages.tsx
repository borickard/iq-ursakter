"use client";

import { useHideFakeStatusBar } from "@/lib/device";
import type { IosMessagesProps } from "@/components/IosMessages";

/**
 * Android-mockup i Google Messages-stil (Material): ljus app-bar med bakåtpil,
 * rund avatar och kontaktnamn, mottagna bubblor till vänster (grå) och skickade
 * till höger (blå), samt ett "SMS-meddelande"-fält längst ner. Inga svansar –
 * Material använder rundade hörn, inte pratbubble-svansar.
 *
 * Delar props med IosMessages så de är utbytbara i MessagePreview.
 */
const DEFAULT_LEADIN = {
  them1: "Kan du ringa mig när du har tid?",
  me: "Om en stund",
  them2: "Ok, vi hörs sen",
};

export function AndroidMessages({
  contactName,
  message,
  dateLabel = "Idag 17:36",
  leadInLabel = "Idag 16:48",
  leadIn = DEFAULT_LEADIN,
  statusTime = "9:41",
  onBack,
}: IosMessagesProps) {
  const initial = contactName.trim().charAt(0).toUpperCase() || "?";
  const hideStatus = useHideFakeStatusBar();

  return (
    <div
      className="flex h-full flex-col bg-white text-black"
      style={{
        fontFamily: "Roboto, 'Google Sans', system-ui, sans-serif",
        ...(hideStatus ? { paddingTop: "env(safe-area-inset-top)" } : {}),
      }}
    >
      {/* Statusfält – döljs när enheten redan visar ett äkta. */}
      {!hideStatus && (
        <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[13px] font-medium">
          <span>{statusTime}</span>
          <div className="flex items-center gap-1.5">
            <WifiIcon />
            <SignalIcon />
            <BatteryIcon />
          </div>
        </div>
      )}

      {/* App-bar */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tillbaka"
          className="flex h-10 w-10 items-center justify-center rounded-full text-black/70 active:bg-black/5"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5b8def] text-sm font-medium text-white">
          {initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px] font-medium leading-tight">{contactName}</span>
          <span className="text-[12px] leading-tight text-black/50">Mobil</span>
        </div>
        <div className="flex items-center gap-1 text-black/70">
          <button type="button" aria-label="Videosamtal" className="flex h-10 w-10 items-center justify-center rounded-full active:bg-black/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4Z" />
            </svg>
          </button>
          <button type="button" aria-label="Ring" className="flex h-10 w-10 items-center justify-center rounded-full active:bg-black/5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.5-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Konversation */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto bg-white px-3 py-3">
        <p className="py-2 text-center text-[12px] font-medium text-black/45">{leadInLabel}</p>
        <Received text={leadIn.them1} />
        <Sent text={leadIn.me} />
        <Received text={leadIn.them2} />
        <p className="py-2 pt-4 text-center text-[12px] font-medium text-black/45">{dateLabel}</p>
        {message.trim() ? <Received text={message} /> : null}
      </div>

      {/* Inmatningsfält */}
      <div className="flex items-center gap-2 px-3 pb-5 pt-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-black/[0.055] px-3 py-2.5">
          <span className="text-[15px] text-black/45">SMS-meddelande</span>
        </div>
        <button type="button" aria-label="Skicka" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0b57d0] text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2 0 6.5Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* En mottagen bubbla (grå, vänster). */
function Received({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="max-w-[78%] self-start rounded-[18px] rounded-bl-[6px] bg-[#e4e4ea] px-3.5 py-2 text-[15px] leading-snug text-black">
      {text}
    </div>
  );
}

/* En skickad bubbla (blå, höger). */
function Sent({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="max-w-[78%] self-end rounded-[18px] rounded-br-[6px] bg-[#0b57d0] px-3.5 py-2 text-[15px] leading-snug text-white">
      {text}
    </div>
  );
}

/* ── Statusfält-ikoner (Android-stil) ───────────────────────────────────── */

function SignalIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <path d="M15 1a1 1 0 0 0-1-1 1 1 0 0 0-1 1v10a1 1 0 0 0 2 0V1ZM11 4a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0V4ZM7 6.5a1 1 0 0 0-2 0V11a1 1 0 0 0 2 0V6.5ZM3 8.5a1 1 0 0 0-2 0V11a1 1 0 0 0 2 0V8.5Z" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <path d="M8 2.2c2.6 0 5 1 6.8 2.7l-1.4 1.5A7.6 7.6 0 0 0 8 4.3 7.6 7.6 0 0 0 2.6 6.4L1.2 4.9A9.7 9.7 0 0 1 8 2.2Zm0 3.8c1.4 0 2.7.5 3.7 1.5l-1.5 1.5A3 3 0 0 0 8 8.1c-.8 0-1.6.3-2.2.9L4.3 7.5A5.2 5.2 0 0 1 8 6Z" />
      <circle cx="8" cy="10.4" r="1.4" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 24 13" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" stroke="currentColor" opacity="0.5" />
      <rect x="2" y="2" width="16" height="9" rx="2" fill="currentColor" />
      <rect x="23" y="4" width="1.5" height="5" rx="0.75" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
