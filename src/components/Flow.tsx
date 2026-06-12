"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COPY, fill, formatSentCount } from "@/lib/copy";
import { normalizeToE164 } from "@/lib/phone";
import { Button, Card, Chip } from "@/components/ui";

type Step = "landing" | "compose" | "result" | "suggest";
type Excuse = { id: string; text: string; sentCount: number };
type SendError = keyof typeof COPY.result.errors;
type SuggestError = keyof typeof COPY.suggest.errors;

export default function Flow() {
  const [step, setStep] = useState<Step>("landing");
  const [phone, setPhone] = useState("");
  const [sender, setSender] = useState("");

  // Hämta ursäkterna redan när sidan laddas (på landningen), så de finns klara
  // när användaren går vidare – ingen fördröjning när man sveper/bläddrar.
  const [excuses, setExcuses] = useState<Excuse[] | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/excuses")
      .then((r) => r.json())
      .then((data) => {
        if (active) setExcuses(data.excuses ?? []);
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

      <Footer />
    </main>
  );
}

/* ── Steg: landning ─────────────────────────────────────────────────────── */

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero – ett dominant ordmärke + en kort stödrad */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          {COPY.landing.eyebrow}
        </p>
        <h1 className="text-6xl font-extrabold tracking-tight">{COPY.landing.title}</h1>
        <p className="max-w-sm text-base leading-relaxed text-muted">
          {COPY.landing.subtitle}
        </p>
      </div>

      {/* Primär åtgärd – tydligt mest framträdande */}
      <div className="space-y-3">
        <Button block onClick={onStart} className="py-5 text-lg shadow-float">
          {COPY.landing.cta}
        </Button>
        <p className="text-center text-xs text-muted/80">
          {COPY.landing.points.join(" · ")}
        </p>
      </div>

      {/* Sekundärt: varför Ursäkten finns */}
      <div className="mt-8 rounded-3xl border border-border bg-surface/60 p-5">
        <p className="text-sm leading-relaxed text-muted">{COPY.landing.grounding}</p>
        {COPY.landing.groundingBy && (
          <p className="mt-3 text-xs font-medium text-muted/80">
            {COPY.landing.groundingBy}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Steg: skapa ────────────────────────────────────────────────────────── */

function Compose({
  phone,
  sender,
  excuses,
  onPhone,
  onSender,
  onBack,
  onSuggest,
  onSent,
}: {
  phone: string;
  sender: string;
  excuses: Excuse[] | null;
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

  const count = excuses?.length ?? 0;
  const at = (i: number) =>
    excuses && count > 0 ? excuses[((i % count) + count) % count] : null;
  const current = at(index);
  const nextExcuse = at(index + 1);
  const prevExcuse = at(index - 1);

  const next = useCallback(() => setIndex((i) => i + 1), []);
  const prev = useCallback(() => setIndex((i) => i - 1), []);

  const contactName = sender.trim() || COPY.compose.senderFallback;

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

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Header title={COPY.compose.title} onBack={onBack} />

      {/* Avsändare (dropdown) – styr förhandsvisningens namn */}
      <SenderField value={sender} onChange={onSender} />

      {/* Live-förhandsvisning som iOS-meddelande, swipe-bar */}
      <ChatPreview
        name={contactName}
        current={current}
        next={nextExcuse}
        prev={prevExcuse}
        loading={excuses === null}
        empty={excuses !== null && count === 0}
        onNext={next}
        onPrev={prev}
      />

      {/* Liten hint + diskreta pilar (för den som inte sveper) */}
      <div className="flex items-center justify-center gap-3 text-muted">
        <button
          type="button"
          onClick={prev}
          disabled={!current}
          aria-label="Förra ursäkten"
          className="text-xl leading-none transition hover:text-brand disabled:opacity-40"
        >
          ‹
        </button>
        <span className="text-[11px]">{COPY.compose.swipeHint}</span>
        <button
          type="button"
          onClick={next}
          disabled={!current}
          aria-label="Nästa ursäkt"
          className="text-xl leading-none transition hover:text-brand disabled:opacity-40"
        >
          ›
        </button>
      </div>

      {/* Mobilnummer – precis före skicka */}
      <div className="space-y-2 pt-1">
        <label htmlFor="phone" className="block text-sm font-medium">
          {COPY.details.phoneLabel}
        </label>
        <FramedField>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={COPY.details.phonePlaceholder}
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            className="w-full rounded-full bg-white px-5 py-3.5 shadow-inset outline-none ring-brand/30 transition focus:ring-2"
          />
        </FramedField>
      </div>

      {(formError || error) && (
        <p className="text-center text-sm text-danger">
          {formError ?? COPY.result.errors[error!]}
        </p>
      )}

      <Button block onClick={send} disabled={sending || !current}>
        {sending ? COPY.browse.sending : COPY.browse.send}
      </Button>

      {/* Sekundär åtgärd – föreslå en egen ursäkt */}
      <div className="flex flex-col items-center gap-2 pt-3">
        <p className="text-base text-muted">{COPY.browse.suggestQuestion}</p>
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
      <label className="block text-sm font-medium">
        {COPY.compose.senderLabel}
      </label>

      {/* Trigger + alternativ i EN sammanhängande behållare (ingen lös panel). */}
      <div className="rounded-3xl bg-surface-2 p-1.5 shadow-raised">
        <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-inset">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left"
          >
            <span className={value ? "font-medium" : "text-muted"}>
              {value || COPY.compose.choose}
            </span>
            <span className="text-sm text-muted">{open ? "▴" : "▾"}</span>
          </button>

          {open && (
            <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
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
                className="w-full rounded-full border border-border bg-surface px-4 py-2.5 shadow-inset outline-none ring-brand/30 transition focus:ring-2"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── iOS-liknande chatt-förhandsvisning med kort-swipe ──────────────────── */

function ChatPreview({
  name,
  current,
  next,
  prev,
  loading,
  empty,
  onNext,
  onPrev,
}: {
  name: string;
  current: Excuse | null;
  next: Excuse | null;
  prev: Excuse | null;
  loading: boolean;
  empty: boolean;
  onNext: () => void;
  onPrev: () => void;
}) {
  const swipeable = !loading && !empty && !!current;

  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<null | "left" | "right">(null);
  const [instant, setInstant] = useState(false);
  const startX = useRef(0);

  // Kortet som skymtar bakom beror på svep-riktningen (annars nästa).
  const back = dx > 0 ? prev : next;

  function onDown(e: React.PointerEvent) {
    if (!swipeable || flying) return;
    setDragging(true);
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDx(e.clientX - startX.current);
  }
  function onUp() {
    if (!dragging) return;
    setDragging(false);
    if (dx < -60) flyOff("left", onNext);
    else if (dx > 60) flyOff("right", onPrev);
    else setDx(0);
  }

  function flyOff(dir: "left" | "right", advance: () => void) {
    setFlying(dir);
    window.setTimeout(() => {
      // Byt ursäkt och nollställ kortet UTAN animation (kortet bakom är redan
      // det nya, så det blir ingen blink).
      setInstant(true);
      advance();
      setFlying(null);
      setDx(0);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setInstant(false)),
      );
    }, 230);
  }

  const frontTransform = flying
    ? `translateX(${flying === "left" ? -700 : 700}px) rotate(${
        flying === "left" ? -16 : 16
      }deg)`
    : `translateX(${dx}px) rotate(${dx * 0.03}deg)`;

  return (
    <div className="relative">
      {/* Kortet bakom (nästa/förra) – skymtar och tas fram när toppkortet sveps bort */}
      <div aria-hidden className="pointer-events-none absolute inset-0 scale-[0.97]">
        <CardFace name={name} excuse={back ?? current} loading={loading} empty={empty} />
      </div>

      {/* Toppkortet – dragbart */}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          transform: frontTransform,
          transition: dragging || instant ? "none" : "transform 0.24s ease, opacity 0.24s ease",
          opacity: flying ? 0 : 1,
          touchAction: "pan-y",
        }}
        className={
          "relative select-none " +
          (swipeable ? "cursor-grab active:cursor-grabbing" : "")
        }
      >
        <CardFace name={name} excuse={current} loading={loading} empty={empty} />
      </div>
    </div>
  );
}

function CardFace({
  name,
  excuse,
  loading,
  empty,
}: {
  name: string;
  excuse: Excuse | null;
  loading: boolean;
  empty: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const countLabel = excuse ? formatSentCount(excuse.sentCount) : null;

  return (
    <div className="rounded-[2rem] bg-surface-2 p-1.5 shadow-raised">
      <div className="overflow-hidden rounded-[1.65rem] bg-white shadow-inset">
        {/* Kontakt-header */}
        <div className="flex flex-col items-center gap-1.5 border-b border-black/5 bg-[#f7f7f8] px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c7c7cc] text-base font-semibold text-white">
            {initial}
          </div>
          <span className="text-[13px] font-semibold text-black/80">{name}</span>
        </div>

        {/* Meddelanden */}
        <div className="flex min-h-[8.5rem] flex-col justify-end gap-1 bg-white px-4 py-4">
          {loading ? (
            <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md bg-[#e9e9eb] px-4 py-2.5 text-[15px] text-black/40">
              …
            </div>
          ) : empty || !excuse ? (
            <div className="self-center text-sm text-black/40">{COPY.compose.empty}</div>
          ) : (
            <div className="flex flex-col items-start gap-1">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#e9e9eb] px-4 py-2.5 text-[15px] leading-snug text-black">
                {excuse.text}
              </div>
              {countLabel && (
                <span className="pl-1 text-[11px] text-black/35">{countLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inramat fält (höjd ram, insänkt innehåll) ──────────────────────────── */

function FramedField({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full bg-surface-2 p-1.5 shadow-raised">{children}</div>
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#ef6a87] to-[#d83a5f] shadow-float ring-[6px] ring-white/70">
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold">{COPY.result.successTitle}</h1>
        <p className="max-w-xs text-muted">
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
          <h1 className="text-2xl font-extrabold">{COPY.suggest.successTitle}</h1>
          <p className="max-w-xs text-muted">{COPY.suggest.successBody}</p>
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

      <p className="text-sm leading-relaxed text-muted">{COPY.suggest.intro}</p>

      <textarea
        rows={4}
        maxLength={200}
        placeholder={COPY.suggest.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-3xl border border-border bg-surface px-5 py-4 shadow-inset outline-none ring-brand/30 transition focus:border-brand/40 focus:ring-2"
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
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-lg text-muted shadow-soft transition hover:text-brand active:scale-95"
      >
        ←
      </button>
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
}

function Footer() {
  return (
    <footer className="pt-8 text-center">
      <p className="text-[11px] leading-relaxed text-muted/80">
        {COPY.privacy.short}
      </p>
      {COPY.brand.byline && (
        <p className="mt-2 text-[11px] text-muted/60">
          {COPY.brand.name} · {COPY.brand.byline}
        </p>
      )}
    </footer>
  );
}
