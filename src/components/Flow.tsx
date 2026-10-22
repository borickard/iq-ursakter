"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { COPY, fill, formatSentCount } from "@/lib/copy";
import { clsx } from "@/lib/clsx";
import { track } from "@/lib/analytics";
import { normalizeToE164 } from "@/lib/phone";
import { excuseFitsSender } from "@/lib/senders";
import { Button, Chip } from "@/components/ui";
import { MessagePreview } from "@/components/MessagePreview";
import { detectPlatform, type Platform } from "@/lib/device";
import { Wordmark } from "@/components/Wordmark";
import { IqLogo } from "@/components/IqLogo";

type Step = "landing" | "compose" | "result" | "suggest";
type Excuse = {
  id: string;
  text: string;
  sentCount: number;
  senders: string;
};
type LeadIn = { them1: string; me: string; them2: string; senders: string };
type SendError = keyof typeof COPY.result.errors;
type SuggestError = keyof typeof COPY.suggest.errors;

/** Verifierings-token (enhet verifierad) – lever bara i användarens webbläsare. */
const VERIFY_KEY = "ursakt_verify";
function readVerifyToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(VERIFY_KEY) ?? "";
  } catch {
    return "";
  }
}
function storeVerifyToken(token: string): void {
  try {
    window.localStorage.setItem(VERIFY_KEY, token);
  } catch {
    // privat läge e.d. – strunta i det, man får verifiera igen
  }
}

/** "Idag HH:MM" för nu minus angivet antal minuter (mockup-tidsstämplar). */
function fakeTime(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Idag ${hh}:${mm}`;
}

/* ── Delade telefon-loopar (bor i Flow så de ÖVERLEVER vybyte) ──────────────
   Tidigare startade varje vy sin egen loop → förhandsvisningen "blinkade" och
   började om när man bytte landning↔skapa. Nu drivs båda looparna här uppe och
   skickas ner som props, så samma notis fortsätter där den var. */

type ThreadLoop = { shown: number; shineKey: number };
function useThreadLoop(): ThreadLoop {
  // Desktop-tråden: notiser in en i taget, håll 3 s, loopa. shineKey bumpas när
  // alla tre är inne (triggar CTA-skenet på landningen).
  const [shown, setShown] = useState(0);
  const [shineKey, setShineKey] = useState(0);
  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(3);
      return;
    }
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    (async () => {
      await sleep(1000);
      while (!cancelled) {
        setShown(0);
        await sleep(60);
        if (cancelled) return;
        setShown(1);
        await sleep(600);
        if (cancelled) return;
        setShown(2);
        await sleep(600);
        if (cancelled) return;
        setShown(3);
        setShineKey((k) => k + 1);
        await sleep(3000);
        if (cancelled) return;
        setShown(0);
        await sleep(1100);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return { shown, shineKey };
}

type SoloCarousel = { item: (typeof COPY.landing.carousel)[number]; visible: boolean };
function useSoloCarousel(): SoloCarousel {
  // Mobil-karusellen: EN notis som roterar genom olika ursäkter.
  const items = COPY.landing.carousel;
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let idx = 0;
    const id = window.setInterval(() => {
      setVisible(false); // tona ut
      window.setTimeout(() => {
        idx = (idx + 1) % items.length;
        setI(idx);
        setVisible(true); // tona in nästa
      }, 320);
    }, 3200);
    return () => window.clearInterval(id);
  }, [items]);
  return { item: items[i], visible };
}

export default function Flow() {
  const [step, setStep] = useState<Step>("landing");
  // Telefon-loopar som delas av landning + skapa (överlever vybyte, ingen blink).
  const thread = useThreadLoop();
  const solo = useSoloCarousel();
  const [phone, setPhone] = useState("");
  const [sender, setSender] = useState("");
  // ISO-tid om utskicket schemalagts (annars null = skickat direkt).
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const [excuses, setExcuses] = useState<Excuse[] | null>(null);
  const [leadIns, setLeadIns] = useState<LeadIn[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/excuses")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setExcuses(data.excuses ?? []);
        setLeadIns(data.leadIns ?? []);
      })
      .catch(() => {
        if (active) setExcuses([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      {/* Sticky logga högst upp – ligger kvar vid scroll, med halvtransparent
          vit yta i fullbredd bakom. */}
      <StickyHeader onHome={() => setStep("landing")} />

      <div className="flex flex-1 flex-col pb-6">
      {step === "landing" && (
        <Landing
          onStart={() => {
            // Går från start- till skapa-vyn (knappen "Skicka mig en ursäkt"
            // eller den klickbara "ursäkt"-länken).
            track("Starta flöde");
            setStep("compose");
          }}
          thread={thread}
          solo={solo}
        />
      )}

      {step === "compose" && (
        <Compose
          phone={phone}
          sender={sender}
          excuses={excuses}
          leadIns={leadIns}
          thread={thread}
          solo={solo}
          onPhone={setPhone}
          onSender={setSender}
          onSent={(iso) => {
            setScheduledAt(iso ?? null);
            setStep("result");
          }}
        />
      )}

      {step === "result" && (
        <Result
          sender={sender}
          scheduledAt={scheduledAt}
          onAgain={() => {
            setScheduledAt(null);
            setStep("compose");
          }}
          onRestart={() => {
            setPhone("");
            setSender("");
            setScheduledAt(null);
            setStep("landing");
          }}
        />
      )}

      {step === "suggest" && <Suggest onBack={() => setStep("compose")} />}

      <Footer showPrivacy={step !== "landing"} />
      </div>
    </main>
  );
}

/* ── Sticky logga-header (alla vyer) ──────────────────────────────────────── */

function StickyHeader({ onHome }: { onHome: () => void }) {
  return (
    <header className="sticky top-0 z-30">
      <div className="relative flex justify-center py-3 lg:py-4">
        {/* Halvtransparent vit yta i FULLBREDD bakom loggan (tonar ner innehåll
            som scrollar förbi). */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 bg-white/75 backdrop-blur-sm"
        />
        <Wordmark
          onClick={onHome}
          className="relative cursor-pointer text-[26px] lg:text-[44px]"
        />
      </div>
    </header>
  );
}

/* ── Steg: landning ─────────────────────────────────────────────────────── */

function Landing({
  onStart,
  thread,
  solo,
}: {
  onStart: () => void;
  thread: ThreadLoop;
  solo: SoloCarousel;
}) {
  // Notis-loopen + CTA-skenet drivs i Flow (överlever vybyte) och kommer in som
  // props → ingen omstart/blink när man byter till skapa-vyn.
  const { shown: notifShown, shineKey } = thread;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-none">
      {/* Mobil: luft ner till innehållet. Desktop: kolumnerna centreras vertikalt
          över hela höjden (grid-rows:1fr) så telefonen hamnar på exakt samma
          vertikala plats i båda vyerna (steg 1 & steg 2). */}
      <div className="mt-8 flex flex-1 flex-col lg:mt-0 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14 lg:[grid-template-rows:1fr]">
      {/* Innehåll (vänster på desktop, hela kolumnen på mobil) */}
      <div className="flex flex-1 flex-col lg:flex-none">
        {/* Mobil-hjälte: telefonens övre del (klocka + inkommande notis) syns,
            klippt så bara ~översta tredjedelen visas. Telefonen animeras in
            nerifrån och upp "ur linjen" (allt under linjen är avklippt, så den
            dyker upp) – ingen transparens. Samma crop/viloläge som i steg 2 så
            den inte hoppar vid vybyte. */}
        <div className="lg:hidden">
          <ClippedPhone maxH="clamp(274px, 40vh, 292px)">
            <div className="phone-rise-up">
              <LandingPhoneSolo compact item={solo.item} visible={solo.visible} />
            </div>
          </ClippedPhone>
        </div>

        {/* Text + knapp syns direkt (ingen intro). "ursäkt" får sitt highlight-svep
            och knappen sitt sken. */}
        <div className="mt-9 space-y-4 lg:mt-10">
          <h1 className="font-display text-[clamp(30px,8vw,38px)] font-normal leading-[1.2] lg:text-[46px]">
            {COPY.landing.headline2a}
            <LivlinaChip onStart={onStart} />
            {COPY.landing.headline2b}
          </h1>
          <p className="max-w-md text-[17px] leading-relaxed text-text lg:text-lg">
            {COPY.landing.subtitle}
          </p>
        </div>

        <Button
          block
          onClick={onStart}
          className="relative mt-auto overflow-hidden py-5 text-lg lg:mt-9 lg:w-auto lg:self-start lg:px-12"
        >
          {COPY.landing.cta}
          {shineKey > 0 && <span key={shineKey} aria-hidden className="cta-shine" />}
        </Button>
      </div>

      {/* Desktop-hjälte: telefon med flera notiser i rad från "Mamma", vertikalt
          centrerad. Animeras in från höger in i bild (ingen transparens). */}
      <div className="phone-slide-in hidden lg:flex lg:justify-center">
        <LandingPhone shown={notifShown} />
      </div>
      </div>
    </div>
  );
}

/* ── Lime-överstruket "livlina" i sloganen (klickbart, går till flödet) ────── */

function LivlinaChip({ onStart }: { onStart: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStart();
        }
      }}
      className="livlina-mark livlina-swipe cursor-pointer"
      style={{ animationDelay: "350ms" }}
    >
      {COPY.landing.headlineLink}
    </span>
  );
}

/* ── En notis (iOS Messages-stil) – delad av telefon-vyerna ───────────────── */

function Notif({
  sender,
  text,
  time,
}: {
  sender: string;
  text?: string;
  time: string;
}) {
  return (
    <div
      className="flex gap-2.5 rounded-[18px] bg-white/[0.86] p-3 text-[#111] backdrop-blur"
      style={{ boxShadow: "0 8px 20px rgba(0,0,0,.25)" }}
    >
      <div
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: "linear-gradient(180deg,#5df27a,#15cf41)" }}
      >
        <svg viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="#fff" aria-hidden>
          <path d="M12 3C6.5 3 2 6.6 2 11c0 2.5 1.3 4.7 3.4 6.2-.2 1.1-.8 2.4-1.7 3.4 1.7-.2 3.5-.9 4.8-1.8 1.1.3 2.3.5 3.5.5 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2 whitespace-nowrap text-[11px] font-semibold text-[#6b6b70]">
          <span>MEDDELANDEN</span>
          <span>{time}</span>
        </div>
        <div className="mt-px text-[15px] font-bold">{sender}</div>
        <div className="mt-px text-[14px] leading-snug text-[#1c1c1e]">{text}</div>
      </div>
    </div>
  );
}

/* ── Lås-skärms-ram med klocka + datum – delad av telefon-vyerna ───────────── */

function PhoneFrame({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "––:––";
  const dateLabel = now
    ? now.toLocaleDateString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";
  return (
    <div className="w-[300px] rounded-[46px] border border-border bg-black p-[11px]">
      <div
        className="relative flex aspect-[9/19.3] flex-col items-center overflow-hidden rounded-[36px] text-white"
        style={{ background: "var(--iq-marin)" }}
      >
        <div className="absolute left-1/2 top-[10px] z-10 h-[21px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex w-full justify-between px-[22px] pt-3 text-xs font-semibold">
          <span>{clock}</span>
          <span>100%</span>
        </div>
        <div
          className={
            "font-semibold leading-none tracking-tight " +
            (compact ? "mt-3 text-[44px]" : "mt-5 text-[62px]")
          }
        >
          {clock}
        </div>
        <div className="mt-0.5 text-[15px] opacity-90 first-letter:uppercase">
          {dateLabel}
        </div>
        <div
          className={
            (compact ? "mt-4" : "mt-6") +
            " flex w-[calc(100%-24px)] flex-col gap-2.5"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Landningens telefon (desktop): flera notiser i rad från samma person ──── */

function LandingPhone({ shown }: { shown: number }) {
  const thread = COPY.landing.phoneThread;
  const sender = COPY.landing.phoneSender;
  return (
    <PhoneFrame>
      {thread.map((text, i) => (
        <div
          key={i}
          className="transition-all duration-300 ease-out"
          style={{
            opacity: i < shown ? 1 : 0,
            transform: i < shown ? "none" : "translateY(-8px) scale(0.98)",
          }}
        >
          <Notif sender={sender} text={text} time="nu" />
        </div>
      ))}
    </PhoneFrame>
  );
}

/* ── Landningens telefon (mobil): EN notis som roterar genom olika ursäkter ── */

function LandingPhoneSolo({
  item,
  visible,
  compact = false,
}: {
  item: SoloCarousel["item"];
  visible: SoloCarousel["visible"];
  compact?: boolean;
}) {
  // Presentationskomponent: rotationen (item/visible) drivs i Flow via
  // useSoloCarousel så den fortsätter sömlöst mellan landning och skapa-vyn.
  return (
    <PhoneFrame compact={compact}>
      <div
        className="transition-opacity duration-300 ease-out"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <Notif sender={item.sender} text={item.text} time="nu" />
      </div>
    </PhoneFrame>
  );
}

/* ── Telefon-förhandsvisning (desktop) – lås-skärm med notis ──────────────── */

function PhonePreview({
  sender,
  message,
  delayMin,
  compact = false,
}: {
  sender: string;
  message?: string;
  delayMin: number;
  compact?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const clock = now ? fmt(now) : "––:––";
  const scheduled =
    now && delayMin > 0 ? fmt(new Date(now.getTime() + delayMin * 60000)) : null;
  const dateLabel = now
    ? now.toLocaleDateString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  return (
    <div className="w-[300px] rounded-[46px] border border-border bg-black p-[11px]">
      <div
        className="relative flex aspect-[9/19.3] flex-col items-center overflow-hidden rounded-[36px] text-white"
        style={{ background: "var(--iq-marin)" }}
      >
        <div className="absolute left-1/2 top-[10px] z-10 h-[21px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex w-full justify-between px-[22px] pt-3 text-xs font-semibold">
          <span>{clock}</span>
          <span>100%</span>
        </div>
        <div
          className={
            "font-semibold leading-none tracking-tight " +
            (compact ? "mt-3 text-[44px]" : "mt-5 text-[62px]")
          }
        >
          {clock}
        </div>
        <div className="mt-0.5 text-[15px] opacity-90 first-letter:uppercase">
          {dateLabel}
        </div>

        {/* Notis – ser ut som ett vanligt sms från kontakten. */}
        <div className={(compact ? "mt-4" : "mt-6") + " w-[calc(100%-24px)]"}>
          <Notif sender={sender} text={message} time={scheduled ?? "nu"} />
        </div>

        {scheduled && (
          <div className="mt-3.5 flex w-[calc(100%-24px)] items-center justify-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[12.5px] font-semibold">
            ⏱ Schemalagt · skickas {scheduled}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Klippt telefon (mobil): visar översta delen, glider in under en linje ──── */

function ClippedPhone({
  children,
  maxH = "clamp(230px, 40vh, 310px)",
}: {
  children: React.ReactNode;
  maxH?: string;
}) {
  return (
    <div className="relative mx-auto w-[300px]">
      {/* Telefonen klipps platt i botten (block → ingen ihoptryckning). */}
      <div className="overflow-hidden" style={{ maxHeight: maxH }}>
        {children}
      </div>
      {/* Horisontell linje – bredare än mobilen men inte hela vägen ut. */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 h-[2px] w-[min(340px,92vw)] -translate-x-1/2 bg-border"
      />
    </div>
  );
}

/* ── Steg: skapa ────────────────────────────────────────────────────────── */

function Compose({
  phone,
  sender,
  excuses,
  leadIns,
  thread,
  solo,
  onPhone,
  onSender,
  onSent,
}: {
  phone: string;
  sender: string;
  excuses: Excuse[] | null;
  leadIns: LeadIn[];
  thread: ThreadLoop;
  solo: SoloCarousel;
  onPhone: (v: string) => void;
  onSender: (v: string) => void;
  onSent: (scheduledAt?: string | null) => void;
}) {
  const [browse, setBrowse] = useState<{ hist: number[]; cur: number }>({
    hist: [0],
    cur: 0,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SendError | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showFake, setShowFake] = useState(false);
  const [fakeLeadIn, setFakeLeadIn] = useState<LeadIn | undefined>(undefined);
  // Engångskod-steg (verifiera nummer). "idle" = inget, "code" = ange koden.
  const [verifyStep, setVerifyStep] = useState<"idle" | "code">("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState<keyof typeof COPY.verify.errors | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  // Fördröjning (minuter): 0 = skicka nu, annars schemalägg.
  const [delayMin, setDelayMin] = useState(0);
  // Delay-väljaren visas bara när NEXT_PUBLIC_ENABLE_DELAY=true (kräver
  // ScheduledSend-tabellen + cron). Default av, så en deploy är ofarlig.
  const delayEnabled = process.env.NEXT_PUBLIC_ENABLE_DELAY === "true";
  // Vilken telefon-look den fejkade skärmen visar. Gissas från enheten men kan
  // bytas manuellt i förhandsvisningen (växel) så båda går att testa.
  const [platform, setPlatform] = useState<Platform>("ios");
  useEffect(() => setPlatform(detectPlatform()), []);

  const senderChosen = sender.trim() !== "";

  // Telefonen (desktop) visas från start. Innan en avsändare valts loopar den
  // exempel-notiserna – men loopen bor i Flow (thread) så den fortsätter från
  // där landningen var, utan att blinka/börja om. När man väljer avsändare byts
  // den mot den riktiga förhandsvisningen.

  // När en avsändare väljs växer kontroll-kolumnen och (på desktop) centreras om
  // → annars "hoppar" allt upp. FLIP: mät positionen före/efter och animera
  // skillnaden snabbt men mjukt. Avstängt vid reduced-motion.
  const controlsRef = useRef<HTMLDivElement>(null);
  const prevTopRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const newTop = el.getBoundingClientRect().top;
    if (!reduce && prevTopRef.current !== null) {
      const dy = prevTopRef.current - newTop;
      if (Math.abs(dy) > 1) {
        el.style.transition = "none";
        el.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 0.3s cubic-bezier(0.22, 0.8, 0.32, 1)";
          el.style.transform = "";
        });
      }
    }
    prevTopRef.current = newTop;
  }, [senderChosen]);

  // Ursäkter som passar den valda avsändaren (admin väljer per ursäkt vilka
  // avsändare den passar; tom lista = passar alla).
  const pool = useMemo(() => {
    if (!excuses || !senderChosen) return [];
    // Filtrera på avsändare och ta bort dubbletter (samma text) så att en
    // ursäkt aldrig kan dyka upp som "samma" två gånger pga dubbla rader i DB.
    const seen = new Set<string>();
    return excuses.filter((e) => {
      if (!excuseFitsSender(e.senders, sender)) return false;
      const key = e.text.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [excuses, sender, senderChosen]);

  const poolCount = pool.length;
  const current =
    poolCount > 0 ? pool[(browse.hist[browse.cur] ?? 0) % poolCount] : null;
  const canGoBack = browse.cur > 0;

  // När avsändaren ändras (nytt urval) → börja om med en slumpad ursäkt ur det.
  useEffect(() => {
    setBrowse({
      hist: [poolCount > 0 ? Math.floor(Math.random() * poolCount) : 0],
      cur: 0,
    });
  }, [sender, poolCount]);

  // Slumpa fram en ny ursäkt. Undviker de senast visade (hela poolen minus en)
  // så att en ursäkt aldrig dyker upp igen förrän alla andra visats – vilket
  // garanterat aldrig ger samma ursäkt två gånger på raken. Historiken låter
  // "Föregående" kliva tillbaka – och den visas först när man slumpat en gång.
  const shuffle = useCallback(() => {
    setBrowse(({ hist, cur }) => {
      if (poolCount === 0) return { hist, cur };
      if (poolCount === 1) return { hist: [...hist.slice(0, cur + 1), 0], cur: cur + 1 };
      // Undvik de senast visade (inkl. den nuvarande) – som mest poolCount-1 st,
      // så det alltid finns minst en kandidat kvar att slumpa bland.
      const avoid = Math.min(poolCount - 1, cur + 1);
      const recent = new Set(hist.slice(cur + 1 - avoid, cur + 1));
      const candidates: number[] = [];
      for (let i = 0; i < poolCount; i++) if (!recent.has(i)) candidates.push(i);
      const n = candidates[Math.floor(Math.random() * candidates.length)];
      return { hist: [...hist.slice(0, cur + 1), n], cur: cur + 1 };
    });
  }, [poolCount]);

  const goBack = useCallback(
    () => setBrowse(({ hist, cur }) => ({ hist, cur: Math.max(0, cur - 1) })),
    [],
  );

  const contactName = sender.trim() || COPY.compose.senderFallback;
  const countLabel = current ? formatSentCount(current.sentCount) : null;
  const phoneValid = !!normalizeToE164(phone);

  async function send() {
    if (!normalizeToE164(phone)) {
      setFormError(COPY.details.invalidPhone);
      return;
    }
    if (!sender.trim()) {
      setFormError(COPY.details.missingSender);
      return;
    }
    if (!current) return;
    setFormError(null);
    setError(null);
    setSending(true);
    try {
      const scheduled = delayMin > 0;
      const res = await fetch(scheduled ? "/api/schedule" : "/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          excuseId: current.id,
          sender,
          token: readVerifyToken(),
          ...(scheduled ? { delayMin } : {}),
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Statistik: antal skickade + populäraste avsändare/ursäkter (bryt ner
        // "Skicka sms"-målet på props i Plausible). typ = nu/schemalagt.
        track("Skicka sms", {
          avsändare: contactName,
          ursäkt: current.text,
          typ: scheduled ? "schemalagt" : "direkt",
        });
        onSent(scheduled ? (data.sendAt ?? null) : null);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const err = (data?.error ?? "unknown") as string;
      // Enheten är inte verifierad → starta engångskod-flödet.
      if (err === "verification_required") {
        await startVerify();
        return;
      }
      setError((err in COPY.result.errors ? err : "unknown") as SendError);
    } catch {
      setError("send_failed");
    } finally {
      setSending(false);
    }
  }

  // Begär en ny engångskod och visa kodfältet.
  async function startVerify() {
    setVerifyError(null);
    setVerifyCode("");
    setDevCode(null);
    setVerifyBusy(true);
    try {
      const res = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setVerifyStep("code");
        if (data.devCode) setDevCode(String(data.devCode));
      } else {
        const err = (data?.error ?? "unknown") as string;
        setFormError(
          COPY.verify.errors[
            (err in COPY.verify.errors ? err : "unknown") as keyof typeof COPY.verify.errors
          ],
        );
      }
    } catch {
      setFormError(COPY.verify.errors.unknown);
    } finally {
      setVerifyBusy(false);
    }
  }

  // Kontrollera koden; vid rätt kod sparas token och ursäkten skickas.
  async function confirmCode() {
    const code = verifyCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setVerifyError("invalid_code");
      return;
    }
    setVerifyError(null);
    setVerifyBusy(true);
    try {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        storeVerifyToken(String(data.token));
        setVerifyStep("idle");
        setVerifyCode("");
        setDevCode(null);
        await send();
      } else {
        const err = (data?.error ?? "unknown") as string;
        setVerifyError(
          (err in COPY.verify.errors ? err : "unknown") as keyof typeof COPY.verify.errors,
        );
      }
    } catch {
      setVerifyError("unknown");
    } finally {
      setVerifyBusy(false);
    }
  }

  function cancelVerify() {
    setVerifyStep("idle");
    setVerifyCode("");
    setVerifyError(null);
    setDevCode(null);
  }

  function showMessage() {
    if (!sender.trim()) {
      setFormError(COPY.details.missingSender);
      return;
    }
    if (!current) return;
    setFormError(null);
    track("Förhandsvisa", { avsändare: contactName });
    // Visa bara inledande konversationer som passar den valda avsändaren; faller
    // tillbaka på alla om ingen matchar, och på inbyggd standard om listan är tom.
    const fitting = leadIns.filter((l) => excuseFitsSender(l.senders, sender));
    const pickFrom = fitting.length > 0 ? fitting : leadIns;
    setFakeLeadIn(
      pickFrom.length > 0
        ? pickFrom[Math.floor(Math.random() * pickFrom.length)]
        : undefined,
    );
    setShowFake(true);
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excuseId: current.id }),
    }).catch(() => {});
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Samma rutnät som startsidan (grid-cols-2 + gap-14); kolumnerna centreras
          vertikalt på desktop över hela höjden (grid-rows:1fr) så telefonen hamnar
          på exakt samma vertikala plats som i steg 1. */}
      <div className="mt-8 flex flex-1 flex-col lg:mt-0 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14 lg:[grid-template-rows:1fr]">
      {/* Vänster: kontroller */}
      <div ref={controlsRef} className="flex flex-1 flex-col gap-4 lg:gap-5 lg:flex-none">
        {/* Mobil: klippt telefon HÖGST UPP (precis som startsidan) – roterande
            exempel tills en avsändare valts, sen vald avsändares preview. Valen
            ligger under. (Desktop: dold här, telefonen visas i högerkolumnen.) */}
        <div className="lg:hidden">
          <ClippedPhone maxH="clamp(274px, 40vh, 292px)">
            {senderChosen ? (
              <PhonePreview
                compact
                sender={contactName}
                message={current?.text}
                delayMin={delayMin}
              />
            ) : (
              <LandingPhoneSolo compact item={solo.item} visible={solo.visible} />
            )}
          </ClippedPhone>
        </div>

        <h1 className="font-display text-2xl font-normal">{COPY.compose.title}</h1>

        <SenderField value={sender} onChange={onSender} />

        {/* Avsändare-först: resten visas när en avsändare valts, och ursäkterna
            är filtrerade till dem som passar personen. */}
        {senderChosen && (
          <>
            {/* Slumpa fram / bakåt – i båda vyerna. */}
            <div
              className="reveal-step flex items-center justify-center gap-3 lg:justify-start"
              style={{ animationDelay: "120ms" }}
            >
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                aria-label={COPY.compose.prev}
                className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-border bg-transparent transition duration-100 hover:bg-surface-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={shuffle}
                disabled={!current}
                className="inline-flex items-center gap-2 rounded-none border border-border bg-transparent px-5 py-2.5 font-medium transition duration-100 hover:bg-surface-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M16 3h5v5" />
                  <path d="M4 20 21 3" />
                  <path d="M21 16v5h-5" />
                  <path d="M15 15l6 6" />
                  <path d="M4 4l5 5" />
                </svg>
                <span className="lg:hidden">{COPY.compose.shuffle}</span>
                <span className="hidden lg:inline">{COPY.compose.shuffleLong}</span>
              </button>
            </div>
            {/* Antal skickningar. */}
            {countLabel && (
              <p className="text-center text-xs text-muted lg:text-left">{countLabel}</p>
            )}

            <div
              className="reveal-step space-y-2"
              style={{ animationDelay: "180ms" }}
            >
              <label htmlFor="phone" className="block text-base font-medium">
                {COPY.details.phoneLabel}
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={COPY.details.phonePlaceholder}
                value={phone}
                onChange={(e) => onPhone(e.target.value)}
                className="w-full rounded-none border border-border bg-surface px-5 py-3.5 outline-none"
              />
            </div>

            {/* När ska det skickas? (Nu eller fördröjt – server-schemalagt.)
                Visas bara när delay-funktionen är påslagen. */}
            {delayEnabled && (
              <div
                className="reveal-step space-y-2"
                style={{ animationDelay: "210ms" }}
              >
                <label className="block text-base font-medium">
                  {COPY.compose.sendWhen}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COPY.compose.delayOptions.map((o) => (
                    <Chip
                      key={o.min}
                      active={delayMin === o.min}
                      onClick={() => {
                        setDelayMin(o.min);
                        // Spåra beteendet att välja en fördröjning (ej "Nu").
                        if (o.min > 0) track("Välj delay", { delay: o.label });
                      }}
                    >
                      {o.label}
                    </Chip>
                  ))}
                </div>
                {delayMin > 0 && (
                  <p className="text-xs leading-snug text-muted">
                    {COPY.compose.schedulePrivacy}
                  </p>
                )}
              </div>
            )}

            {(formError || error) && (
              <p className="text-center text-sm font-semibold text-danger lg:text-left">
                {formError ?? COPY.result.errors[error!]}
              </p>
            )}

            {/* Knapparna sida vid sida (lika breda halvor) så båda etiketterna
                ryms på en rad. Engångskoden (OTP) visas i en overlay ovanpå allt
                (se nedan) så man inte missar steget. */}
            <div
              className="reveal-step grid grid-cols-2 gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Button
                block
                onClick={send}
                disabled={sending || !current || !phoneValid}
                className="whitespace-nowrap px-2 text-[15px] lg:text-base"
              >
                {sending ? COPY.browse.sending : COPY.browse.send}
              </Button>
              <Button
                block
                variant="secondary"
                onClick={showMessage}
                disabled={!current}
                className="whitespace-nowrap px-2 text-[15px] lg:text-base"
              >
                {COPY.compose.showAsMessage}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Höger: telefon – exempel-notiser tills avsändare valts, sen live.
          Vertikalt centrerad (items-center på rutnätet). */}
      <div className="hidden lg:flex lg:justify-center">
        {senderChosen ? (
          <div className="reveal-step">
            <PhonePreview
              sender={contactName}
              message={current?.text}
              delayMin={delayMin}
            />
          </div>
        ) : (
          <LandingPhone shown={thread.shown} />
        )}
      </div>
      </div>

      {showFake &&
        current &&
        typeof document !== "undefined" &&
        createPortal(
          /* Via en portal till <body> → riktig helskärm över allt annat (inkl.
             sidfoten), så meddelandevyn ser ut som en äkta Meddelanden-app. */
          <div className="fixed inset-0 z-[100] bg-white">
            <div className="mx-auto h-full max-w-md">
              <MessagePreview
                platform={platform}
                contactName={contactName}
                message={current.text}
                leadIn={fakeLeadIn}
                dateLabel={fakeTime(0)}
                leadInLabel={fakeTime(47)}
                onBack={() => setShowFake(false)}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Engångskod (OTP) som overlay ovanpå allt – omöjlig att missa. Visas när
          en enhet behöver verifieras innan sms skickas. Portal till <body> så den
          ligger över sidfoten m.m. */}
      {verifyStep === "code" &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={COPY.verify.title}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5"
          >
            <div className="w-full max-w-sm space-y-4 rounded-none border border-border bg-surface p-6">
              <div>
                <p className="font-display text-xl font-normal">{COPY.verify.title}</p>
                <p className="mt-1 text-sm text-muted">{COPY.verify.intro}</p>
                {phone && (
                  <p className="mt-1 text-sm font-medium">
                    {fill(COPY.verify.sentTo, { phone })}
                  </p>
                )}
              </div>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={COPY.verify.placeholder}
                className="w-full rounded-none border border-border bg-surface px-5 py-3.5 text-center text-lg tracking-[0.4em] outline-none"
              />
              {devCode && (
                <p className="text-xs text-muted">
                  {fill(COPY.verify.devHint, { code: devCode })}
                </p>
              )}
              {verifyError && (
                <p className="text-sm font-semibold text-danger">
                  {COPY.verify.errors[verifyError]}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  block
                  variant="secondary"
                  onClick={cancelVerify}
                  disabled={verifyBusy}
                  className="px-3 text-center"
                >
                  {COPY.verify.cancel}
                </Button>
                <Button
                  block
                  onClick={confirmCode}
                  disabled={verifyBusy || verifyCode.length < 6}
                  className="px-3 text-center"
                >
                  {verifyBusy ? COPY.verify.confirming : COPY.verify.confirm}
                </Button>
              </div>
              <button
                type="button"
                onClick={startVerify}
                disabled={verifyBusy}
                className="text-xs text-muted underline underline-offset-2 disabled:opacity-50"
              >
                {COPY.verify.resend}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ── Avsändar-väljare (förval som chips) ────────────────────────────────── */

function SenderField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const presets: readonly string[] = COPY.details.senderPresets;

  return (
    <div className="space-y-2.5">
      <label className="block text-lg font-medium lg:text-xl">
        {COPY.compose.senderLabel}
      </label>

      <div className="flex flex-wrap gap-2">
        {presets.map((name) => (
          <Chip key={name} active={value === name} onClick={() => onChange(name)}>
            {name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/* ── Steg: resultat ─────────────────────────────────────────────────────── */

function Result({
  sender,
  scheduledAt,
  onAgain,
  onRestart,
}: {
  sender: string;
  scheduledAt: string | null;
  onAgain: () => void;
  onRestart: () => void;
}) {
  const scheduledTime = scheduledAt
    ? new Date(scheduledAt).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center border border-border bg-brand">
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9"
            fill="none"
            stroke="#000000"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {scheduledTime ? (
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l3 2" />
              </>
            ) : (
              <path d="M5 13l4 4L19 7" />
            )}
          </svg>
        </div>
        <h1 className="font-display text-3xl font-normal">
          {scheduledTime ? COPY.result.scheduledTitle : COPY.result.successTitle}
        </h1>
        <p className="max-w-xs text-[17px] text-text">
          {scheduledTime
            ? fill(COPY.result.scheduledBody, { time: scheduledTime, name: sender })
            : fill(COPY.result.successBodyName, { name: sender })}
        </p>
        {scheduledTime && (
          <p className="max-w-xs text-xs leading-snug text-muted">
            {COPY.result.scheduledNote}
          </p>
        )}
      </div>
      <div className="space-y-3 pt-4">
        <Button block onClick={onAgain}>
          {COPY.result.again}
        </Button>
        <Button block variant="ghost" onClick={onRestart}>
          {COPY.result.restart}
        </Button>
      </div>
    </div>
  );
}

/* ── Steg: föreslå egen ursäkt ──────────────────────────────────────────── */

function Suggest({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<SuggestError | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        const err = (data?.error ?? "unknown") as string;
        setError((err in COPY.suggest.errors ? err : "unknown") as SuggestError);
      }
    } catch {
      setError("unknown");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-display text-3xl font-normal">{COPY.suggest.successTitle}</h1>
          <p className="max-w-xs text-[17px] text-text">{COPY.suggest.successBody}</p>
        </div>
        <div className="space-y-3 pt-4">
          <Button
            block
            onClick={() => {
              setText("");
              setDone(false);
            }}
          >
            {COPY.suggest.another}
          </Button>
          <Button block variant="ghost" onClick={onBack}>
            {COPY.suggest.done}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6">
      <Header title={COPY.suggest.title} onBack={onBack} />

      <p className="text-[17px] leading-relaxed text-text">
        {COPY.suggest.intro}
      </p>

      <textarea
        rows={4}
        maxLength={200}
        placeholder={COPY.suggest.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-none border border-border bg-surface px-5 py-4 outline-none"
      />

      {error && <p className="text-sm text-danger">{COPY.suggest.errors[error]}</p>}

      <div className="mt-auto pt-4">
        <Button block onClick={submit} disabled={submitting || text.trim().length < 5}>
          {submitting ? COPY.suggest.submitting : COPY.suggest.submit}
        </Button>
      </div>
    </div>
  );
}

/* ── Delade smådelar ────────────────────────────────────────────────────── */

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Tillbaka"
        className="-ml-1 flex h-9 w-9 items-center justify-center text-text transition hover:opacity-60 active:translate-y-px"
      >
        {/* Tunn pil (IQ-grepp), ingen ram. */}
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="font-display text-2xl font-normal">{title}</h1>
    </div>
  );
}

function Footer({ showPrivacy }: { showPrivacy: boolean }) {
  return (
    <footer className="mt-12 border-t border-border pt-5">
      {/* Avsändarraden: ett ställe, tydligt men litet (som Fatta Fyllan). */}
      <div className="flex items-start gap-3">
        {/* Klickbar IQ-logga → iq.se (spåras som "IQ-logga" i Plausible). */}
        <a
          href={COPY.footer.iqHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("IQ-logga")}
          aria-label={COPY.footer.iqLink}
          className="shrink-0"
        >
          <IqLogo className="h-9 w-auto" />
        </a>
        <p className="text-[12px] leading-relaxed text-text">
          <span className="font-medium">{COPY.footer.iqLine}</span>
          {/* Desktop: tvinga "IQ finns…" till rad 2 (→ två rader). Mobil: ingen
              brytning, texten flödar och blir två rader ändå. */}
          <br className="hidden lg:block" />{" "}
          {COPY.footer.iqAbout}{" "}
          <a
            href={COPY.footer.iqHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {COPY.footer.iqLink} ↗
          </a>
        </p>
      </div>
      {/* Integritetstexten visas först i flödet (där numret anges), inte på
          startsidan. På desktop reserveras ändå raden (osynlig) på startsidan så
          att sidfotens höjd – och därmed telefonens vertikala centrering – är
          exakt densamma i båda vyerna (annars hoppar mobilen ~16 px vid vybyte).
          På mobil döljs den helt (ingen tom lucka). */}
      <p
        aria-hidden={!showPrivacy}
        className={clsx(
          "mt-4 text-[12px] leading-relaxed text-muted",
          !showPrivacy && "hidden lg:invisible lg:block",
        )}
      >
        {COPY.privacy.short}
      </p>
    </footer>
  );
}
