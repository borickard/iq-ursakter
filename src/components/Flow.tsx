"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COPY, fill, formatSentCount } from "@/lib/copy";
import { normalizeToE164 } from "@/lib/phone";
import { Button, Chip } from "@/components/ui";
import { IosMessages } from "@/components/IosMessages";
import { Wordmark } from "@/components/Wordmark";

type Step = "landing" | "compose" | "result" | "suggest";
type Excuse = { id: string; text: string; sentCount: number };
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
      <div className="flex flex-1 flex-col justify-center gap-7">
        <Wordmark className="text-[26px]" />

        <HeroCarousel />

        <div className="space-y-3">
          <h1
            className="font-display text-[26px] font-black leading-[1.14] tracking-tight"
            style={{ textWrap: "balance" }}
          >
            {COPY.landing.headline1}
            <br />
            {COPY.landing.headline2a}
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
              className="cursor-pointer rounded-lg border-2 border-border bg-brand px-1.5 text-brand-fg shadow-[3px_3px_0_#0b0b0b]"
            >
              {COPY.landing.headlineLink}
            </span>
            {COPY.landing.headline2b}
          </h1>
          <p className="max-w-sm text-sm font-medium leading-relaxed text-[#34312b]">
            {COPY.landing.subtitle}
          </p>
        </div>
      </div>

      <Button block onClick={onStart} className="py-5 text-lg">
        {COPY.landing.cta}
      </Button>
    </div>
  );
}

/* ── Landningens roterande pratbubbla ───────────────────────────────────── */

function HeroCarousel() {
  const items = COPY.landing.carousel;
  const exRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLParagraphElement>(null);
  const idx = useRef(0);

  useEffect(() => {
    const ex = exRef.current;
    const out = outRef.current;
    const meta = metaRef.current;
    if (!ex || !out) return;
    const exP = ex.querySelector("p");
    const outP = out.querySelector("p");
    if (!exP || !outP) return;
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const EASE = "cubic-bezier(.455,.03,.515,.955)";
    const DUR = "opacity .45s " + EASE + ", transform .45s " + EASE;
    const setMeta = (n: number) => {
      if (meta) meta.textContent = items[n].sender + " · nyss";
    };
    const id = window.setInterval(() => {
      const oldText = exP.textContent || "";
      idx.current = (idx.current + 1) % items.length;
      const n = idx.current;
      if (reduce) {
        exP.textContent = items[n].text;
        setMeta(n);
        return;
      }
      outP.textContent = oldText;
      out.style.transition = "none";
      out.style.opacity = "1";
      out.style.transform = "translateY(0)";
      exP.textContent = items[n].text;
      ex.style.transition = "none";
      ex.style.opacity = "0";
      ex.style.transform = "translateY(100%)";
      if (meta) meta.style.opacity = "0";
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          // Flyttar hela lagret en hel bubbelhöjd → texten lämnar helt och
          // klipps av konturen (overflow-hidden), oberoende av textens längd.
          out.style.transition = DUR;
          out.style.opacity = "0";
          out.style.transform = "translateY(-100%)";
          ex.style.transition = DUR;
          ex.style.opacity = "1";
          ex.style.transform = "translateY(0)";
          setMeta(n);
          if (meta) meta.style.opacity = "1";
        }),
      );
    }, 3000);
    return () => window.clearInterval(id);
  }, [items]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative w-full self-start">
        {/* Hård offset-skugga (bubbla + svans) som egna lager bakom – inte en
            filter, så den klipps aldrig när texten animeras. */}
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
        <div className="relative h-[72px] overflow-hidden rounded-2xl border-2 border-border bg-surface">
          <div
            ref={outRef}
            aria-hidden
            className="absolute inset-0 flex items-center px-4 opacity-0"
          >
            <p className="m-0 text-[15px] font-medium leading-snug" />
          </div>
          <div ref={exRef} className="absolute inset-0 flex items-center px-4">
            <p className="m-0 text-[15px] font-medium leading-snug">
              {items[0].text}
            </p>
          </div>
        </div>
        <span
          aria-hidden
          className="absolute left-[22px] h-4 w-4 rounded-br-[4px] border-b-2 border-r-2 border-border bg-surface"
          style={{ bottom: "-9px", transform: "rotate(45deg)" }}
        />
      </div>
      <p
        ref={metaRef}
        className="pl-[22px] font-mono text-[11px] text-muted transition-opacity duration-300"
      >
        {items[0].sender} · nyss
      </p>
    </div>
  );
}

/* ── Pratbubbla för ursäkten (statisk, på skapa-skärmen) ────────────────── */

function ExcuseBubble({
  text,
  sender,
  loading,
  empty,
}: {
  text?: string;
  sender: string;
  loading: boolean;
  empty: boolean;
}) {
  const showSender = !loading && !empty && !!text;
  const muted = loading || empty || !text;
  const body = loading ? "…" : empty || !text ? COPY.compose.empty : text;
  return (
    <div className="flex flex-col gap-3.5">
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
        <div className="relative flex h-[72px] items-center overflow-hidden rounded-2xl border-2 border-border bg-surface px-4">
          <p
            className={
              "m-0 text-[15px] leading-snug " +
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
      {showSender && (
        <p className="pl-[22px] font-mono text-[11px] text-muted">{sender} · nyss</p>
      )}
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
  const [index, setIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SendError | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showFake, setShowFake] = useState(false);
  const [fakeLeadIn, setFakeLeadIn] = useState<LeadIn | undefined>(undefined);

  const count = excuses?.length ?? 0;
  const at = (i: number) =>
    excuses && count > 0 ? excuses[((i % count) + count) % count] : null;
  const current = at(index);

  const next = useCallback(() => setIndex((i) => i + 1), []);
  const prev = useCallback(() => setIndex((i) => i - 1), []);

  const contactName = sender.trim() || COPY.compose.senderFallback;
  const countLabel = current ? formatSentCount(current.sentCount) : null;

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
      <Header title={COPY.compose.title} onBack={onBack} />

      <SenderField value={sender} onChange={onSender} />

      <ExcuseBubble
        text={current?.text}
        sender={contactName}
        loading={excuses === null}
        empty={excuses !== null && count === 0}
      />
      {countLabel && <p className="text-center text-xs text-muted">{countLabel}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={prev} disabled={!current}>
          {COPY.compose.prev}
        </Button>
        <Button variant="secondary" onClick={next} disabled={!current}>
          {COPY.compose.next}
        </Button>
      </div>

      <div className="space-y-2 pt-1">
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

      <Button block onClick={send} disabled={sending || !current}>
        {sending ? COPY.browse.sending : COPY.browse.send}
      </Button>

      <Button block variant="secondary" onClick={showMessage} disabled={!current}>
        {COPY.compose.showAsMessage}
      </Button>

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

      <div className="flex flex-col items-center gap-2 pt-3">
        <p className="text-base font-medium">{COPY.browse.suggestQuestion}</p>
        <Button
          variant="secondary"
          onClick={onSuggest}
          className="px-7 py-2.5 text-sm"
        >
          {COPY.browse.suggestCta}
        </Button>
      </div>
    </div>
  );
}

/* ── Avsändar-dropdown ──────────────────────────────────────────────────── */

function SenderField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const presets: readonly string[] = COPY.details.senderPresets;
  const isCustom = value.trim() !== "" && !presets.includes(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold">
        {COPY.compose.senderLabel}
      </label>

      <div className="overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-soft">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        >
          <span className={value ? "font-semibold" : "text-muted"}>
            {value || COPY.compose.choose}
          </span>
          <span className="text-sm text-muted">{open ? "▴" : "▾"}</span>
        </button>

        {open && (
          <div className="space-y-3 border-t-2 border-border px-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-2">
              {presets.map((name) => (
                <Chip
                  key={name}
                  active={value === name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  {name}
                </Chip>
              ))}
            </div>
            <input
              type="text"
              placeholder={COPY.details.senderPlaceholder}
              value={isCustom ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-surface px-4 py-2.5 outline-none ring-brand/50 transition focus:ring-2"
            />
          </div>
        )}
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
