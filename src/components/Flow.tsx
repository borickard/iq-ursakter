"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COPY, fill, formatSentCount } from "@/lib/copy";
import { normalizeToE164 } from "@/lib/phone";
import { categoryForSender } from "@/lib/senders";
import { Button, Chip } from "@/components/ui";
import { IosMessages } from "@/components/IosMessages";
import { Wordmark } from "@/components/Wordmark";

type Step = "landing" | "compose" | "result" | "suggest";
type Excuse = {
  id: string;
  text: string;
  sentCount: number;
  category: string;
};
type LeadIn = { them1: string; me: string; them2: string };
type SendError = keyof typeof COPY.result.errors;
type SuggestError = keyof typeof COPY.suggest.errors;

/** "Idag HH:MM" för nu minus angivet antal minuter (mockup-tidsstämplar). */
function fakeTime(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Idag ${hh}:${mm}`;
}

export default function Flow() {
  const [step, setStep] = useState<Step>("landing");
  const [phone, setPhone] = useState("");
  const [sender, setSender] = useState("");

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
    <main className="flex flex-1 flex-col py-6">
      {step === "landing" && <Landing onStart={() => setStep("compose")} />}

      {step === "compose" && (
        <Compose
          phone={phone}
          sender={sender}
          excuses={excuses}
          leadIns={leadIns}
          onPhone={setPhone}
          onSender={setSender}
          onBack={() => setStep("landing")}
          onSuggest={() => setStep("suggest")}
          onSent={() => setStep("result")}
        />
      )}

      {step === "result" && (
        <Result
          sender={sender}
          onAgain={() => setStep("compose")}
          onRestart={() => {
            setPhone("");
            setSender("");
            setStep("landing");
          }}
        />
      )}

      {step === "suggest" && <Suggest onBack={() => setStep("compose")} />}

      {step !== "landing" && <Footer />}
    </main>
  );
}

/* ── Steg: landning ─────────────────────────────────────────────────────── */

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <Wordmark className="text-[26px]" />

      <div className="mt-9 flex flex-col gap-8">
        <HeroCarousel />

        <div className="space-y-3.5">
          <h1 className="font-display text-[clamp(24px,7.2vw,28px)] font-black leading-[1.1] tracking-tight">
            {COPY.landing.headline1}
            <br />
            {COPY.landing.headline2a}
            <LivlinaChip onStart={onStart} />
            {COPY.landing.headline2b}
            <br />
            {COPY.landing.headline3}
          </h1>
          <p className="max-w-sm text-sm font-medium leading-relaxed text-[#34312b]">
            {COPY.landing.subtitle}
          </p>
        </div>
      </div>

      <Button
        block
        onClick={onStart}
        className="mt-auto !rounded-full py-6 text-xl"
      >
        {COPY.landing.cta}
      </Button>
    </div>
  );
}

/* ── Lime-chippet "livlina" som "skrivs in" en gång vid sidladdning ───────── */

function LivlinaChip({ onStart }: { onStart: () => void }) {
  const [typed, setTyped] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setTyped(true), 2000);
    return () => window.clearTimeout(t);
  }, []);
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
      className="relative inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-border bg-brand px-1.5 text-brand-fg shadow-[3px_3px_0_#0b0b0b]"
    >
      {/* Ordet håller alltid bredden; prickarna ligger ovanpå tills det "skrivits". */}
      <span className={typed ? "" : "invisible"}>{COPY.landing.headlineLink}</span>
      {!typed && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex gap-[3px]">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-fg [animation:livlinaTyping_1s_infinite]" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-fg [animation:livlinaTyping_1s_infinite] [animation-delay:.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-fg [animation:livlinaTyping_1s_infinite] [animation-delay:.4s]" />
          </span>
        </span>
      )}
    </span>
  );
}

/* ── Landningens roterande pratbubbla ───────────────────────────────────── */

function HeroCarousel() {
  const items = COPY.landing.carousel;
  const exRef = useRef<HTMLParagraphElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLParagraphElement>(null);
  const idx = useRef(0);

  useEffect(() => {
    const exP = exRef.current;
    const typing = typingRef.current;
    const meta = metaRef.current;
    if (!exP) return;
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const EASE = "cubic-bezier(.455,.03,.515,.955)";
    let t1 = 0;
    let t2 = 0;
    const id = window.setInterval(() => {
      idx.current = (idx.current + 1) % items.length;
      const it = items[idx.current];
      if (reduce) {
        exP.textContent = it.text;
        if (meta) meta.textContent = it.sender + " · nyss";
        return;
      }
      // Tona ut texten → visa skrivindikator en stund → "skriv in" nästa ursäkt.
      // Ett enda textlager, vertikalt centrerat, så varje byte ser likadant ut.
      exP.style.transition = "opacity .2s ease";
      exP.style.opacity = "0";
      if (meta) meta.style.opacity = "0";
      t1 = window.setTimeout(() => {
        if (typing) typing.style.display = "flex";
      }, 220);
      t2 = window.setTimeout(() => {
        if (typing) typing.style.display = "none";
        exP.textContent = it.text;
        exP.style.transition = "none";
        exP.style.opacity = "0";
        exP.style.transform = "translateY(6px)";
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            exP.style.transition =
              "opacity .3s " + EASE + ", transform .3s " + EASE;
            exP.style.opacity = "1";
            exP.style.transform = "translateY(0)";
          }),
        );
        if (meta) {
          meta.textContent = it.sender + " · nyss";
          meta.style.opacity = "1";
        }
      }, 900);
    }, 3000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [items]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Fast storlek: bredd satt så texten radbryts över ~tre rader, och fast
          trehöjd – bubblan byter aldrig storlek mellan meddelandena. */}
      <div className="relative w-[272px] max-w-full self-start">
        {/* Hård offset-skugga (bubbla + svans) som egna lager bakom. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-border"
          style={{ transform: "translate(5px, 5px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-[26px] h-4 w-4 bg-border"
          style={{ bottom: "-6px", transform: "translate(5px, 5px) rotate(45deg)" }}
        />
        {/* Texten vertikalt centrerad; pb ger luft så svansen aldrig täcker den. */}
        <div className="relative flex h-[108px] items-center overflow-hidden rounded-2xl border-2 border-border bg-surface px-4 pb-5 pt-3">
          <p ref={exRef} className="m-0 w-full text-[17px] font-medium leading-snug">
            {items[0].text}
          </p>
          {/* Skrivindikator – centrerad i bubblan, visas mellan ursäkterna. */}
          <div
            ref={typingRef}
            aria-hidden
            className="absolute inset-0 hidden items-center justify-center"
          >
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#c3c3c9] [animation:livlinaTyping_1s_infinite]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#c3c3c9] [animation:livlinaTyping_1s_infinite] [animation-delay:.2s]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#c3c3c9] [animation:livlinaTyping_1s_infinite] [animation-delay:.4s]" />
            </span>
          </div>
        </div>
        {/* Svansen överlappar bubblans underkant → vit fyllning döljer bubblans
            nederkantslinje så spetsen sitter ihop med bubblan. */}
        <span
          aria-hidden
          className="absolute left-[26px] h-4 w-4 rounded-br-[4px] border-b-2 border-r-2 border-border bg-surface"
          style={{ bottom: "-6px", transform: "rotate(45deg)" }}
        />
      </div>
      <p
        ref={metaRef}
        className="pl-[26px] font-mono text-[11px] text-muted transition-opacity duration-300"
      >
        {items[0].sender} · nyss
      </p>
    </div>
  );
}

/* ── Pratbubbla för ursäkten (statisk, på skapa-skärmen) ────────────────── */

function ExcuseBubble({
  text,
  loading,
  empty,
}: {
  text?: string;
  loading: boolean;
  empty: boolean;
}) {
  const muted = loading || empty || !text;
  const body = loading ? "…" : empty || !text ? COPY.compose.empty : text;
  return (
    <div className="relative w-full self-start">
      {/* Hård offset-skugga (bubbla + svans) som egna lager bakom. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-border"
        style={{ transform: "translate(5px, 5px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[22px] h-4 w-4 bg-border"
        style={{ bottom: "-9px", transform: "translate(5px, 5px) rotate(45deg)" }}
      />
      {/* Fast höjd → sidan hoppar inte beroende på ursäktens längd. */}
      <div className="relative flex h-[72px] items-center overflow-hidden rounded-2xl border-2 border-border bg-surface px-4">
        <p
          className={
            "m-0 line-clamp-3 text-[15px] leading-snug " +
            (muted ? "text-muted" : "font-medium")
          }
        >
          {body}
        </p>
      </div>
      <span
        aria-hidden
        className="absolute left-[22px] h-4 w-4 rounded-br-[4px] border-b-2 border-r-2 border-border bg-surface"
        style={{ bottom: "-9px", transform: "rotate(45deg)" }}
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
  onPhone,
  onSender,
  onBack,
  onSuggest,
  onSent,
}: {
  phone: string;
  sender: string;
  excuses: Excuse[] | null;
  leadIns: LeadIn[];
  onPhone: (v: string) => void;
  onSender: (v: string) => void;
  onBack: () => void;
  onSuggest: () => void;
  onSent: () => void;
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

  const senderChosen = sender.trim() !== "";
  const senderCat = categoryForSender(sender);

  // Ursäkter som passar den valda avsändaren (jobb → Chefen, privat → övriga).
  // Okänd avsändare (senderCat === undefined) → visa alla.
  const pool = useMemo(() => {
    if (!excuses || senderCat === null) return [];
    if (senderCat === undefined) return excuses;
    // Tom kategori (före DB-migreringen) matchar alla avsändare.
    return excuses.filter((e) => !e.category || e.category === senderCat);
  }, [excuses, senderCat]);

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
  }, [senderCat, poolCount]);

  // Slumpa fram en ny ursäkt (aldrig samma som den nuvarande). Historiken låter
  // "Föregående" kliva tillbaka – och den visas först när man slumpat en gång.
  const shuffle = useCallback(() => {
    setBrowse(({ hist, cur }) => {
      if (poolCount === 0) return { hist, cur };
      const curIdx = hist[cur] ?? 0;
      let n = curIdx;
      if (poolCount > 1) {
        while (n === curIdx) n = Math.floor(Math.random() * poolCount);
      } else {
        n = 0;
      }
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
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, excuseId: current.id, sender }),
      });
      if (res.ok) {
        onSent();
      } else {
        const data = await res.json().catch(() => ({}));
        const err = (data?.error ?? "unknown") as string;
        setError((err in COPY.result.errors ? err : "unknown") as SendError);
      }
    } catch {
      setError("send_failed");
    } finally {
      setSending(false);
    }
  }

  function showMessage() {
    if (!sender.trim()) {
      setFormError(COPY.details.missingSender);
      return;
    }
    if (!current) return;
    setFormError(null);
    setFakeLeadIn(
      leadIns.length > 0
        ? leadIns[Math.floor(Math.random() * leadIns.length)]
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
    <div className="flex flex-1 flex-col gap-5">
      <Wordmark className="text-[20px]" />
      <Header title={COPY.compose.title} onBack={onBack} />

      <SenderField value={sender} onChange={onSender} />

      {/* Avsändare-först: allt nedan visas när en avsändare valts, och ursäkterna
          är filtrerade till dem som passar personen. */}
      {senderChosen && (
        <>
          <div className="flex flex-col gap-3.5">
            <ExcuseBubble
              text={current?.text}
              loading={excuses === null}
              empty={excuses !== null && poolCount === 0}
            />
        {/* Bildtext under bubblan: avsändare till vänster, antal skickningar
            till höger. Alltid monterad (fast höjd) så sidan inte hoppar. */}
        <div className="flex h-4 items-baseline justify-between gap-3 pl-[22px] pr-1 font-mono text-[11px] text-muted">
          <span className="truncate">{current ? contactName : ""}</span>
          <span className="shrink-0">{countLabel ?? ""}</span>
        </div>
      </div>

      {/* Kompakt rad: slumpa fram en ny ursäkt. Bakåtknappen finns alltid men
          är avstängd tills man slumpat minst en gång. */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={!canGoBack}
          aria-label={COPY.compose.prev}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-surface shadow-soft transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
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
          className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-surface px-5 py-2.5 font-bold shadow-raised transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
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
          {COPY.compose.shuffle}
        </button>
      </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-semibold">
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
              className="w-full rounded-2xl border-2 border-border bg-surface px-5 py-3.5 outline-none ring-brand/50 transition focus:ring-2"
            />
          </div>

          {(formError || error) && (
            <p className="text-center text-sm font-medium text-danger">
              {formError ?? COPY.result.errors[error!]}
            </p>
          )}

          <Button
            block
            onClick={send}
            disabled={sending || !current || !phoneValid}
          >
            {sending ? COPY.browse.sending : COPY.browse.send}
          </Button>

          <Button block variant="secondary" onClick={showMessage} disabled={!current}>
            {COPY.compose.showAsMessage}
          </Button>
        </>
      )}

      {showFake && current && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="mx-auto h-full max-w-md">
            <IosMessages
              contactName={contactName}
              message={current.text}
              leadIn={fakeLeadIn}
              dateLabel={fakeTime(0)}
              leadInLabel={fakeTime(47)}
              onBack={() => setShowFake(false)}
            />
          </div>
        </div>
      )}

      <Button variant="ghost" block onClick={onSuggest} className="text-sm">
        {COPY.browse.suggestQuestion} {COPY.browse.suggestCta}
      </Button>
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
      <label className="block text-sm font-semibold">
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
  onAgain,
  onRestart,
}: {
  sender: string;
  onAgain: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-brand shadow-raised">
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9"
            fill="none"
            stroke="#0b0b0b"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-black">{COPY.result.successTitle}</h1>
        <p className="max-w-xs font-medium text-[#34312b]">
          {fill(COPY.result.successBodyName, { name: sender })}
        </p>
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
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-display text-2xl font-black">{COPY.suggest.successTitle}</h1>
          <p className="max-w-xs font-medium text-[#34312b]">{COPY.suggest.successBody}</p>
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
    <div className="flex flex-1 flex-col gap-6">
      <Header title={COPY.suggest.title} onBack={onBack} />

      <p className="text-sm font-medium leading-relaxed text-[#34312b]">
        {COPY.suggest.intro}
      </p>

      <textarea
        rows={4}
        maxLength={200}
        placeholder={COPY.suggest.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-2xl border-2 border-border bg-surface px-5 py-4 outline-none ring-brand/50 transition focus:ring-2"
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
        className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-surface text-lg shadow-soft transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        ←
      </button>
      <h1 className="font-display text-xl font-black">{title}</h1>
    </div>
  );
}

function Footer() {
  return (
    <footer className="pt-8 text-center">
      <p className="text-[11px] leading-relaxed text-muted">{COPY.privacy.short}</p>
      {COPY.brand.byline && (
        <p className="mt-2 font-mono text-[11px] text-muted">
          {COPY.brand.name} · {COPY.brand.byline}
        </p>
      )}
    </footer>
  );
}
