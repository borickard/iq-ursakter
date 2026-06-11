"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COPY, fill, formatSentCount } from "@/lib/copy";
import { downloadVCard } from "@/lib/vcard";
import { normalizeToE164 } from "@/lib/phone";
import { Button, Card, Chip } from "@/components/ui";

type Step = "landing" | "compose" | "result" | "suggest";
type Excuse = { id: string; text: string; sentCount: number };
type SendError = keyof typeof COPY.result.errors;
type SuggestError = keyof typeof COPY.suggest.errors;

const SENDER_NUMBER = process.env.NEXT_PUBLIC_SMS_FROM_NUMBER ?? "";

export default function Flow() {
  const [step, setStep] = useState<Step>("landing");
  const [phone, setPhone] = useState("");
  const [sender, setSender] = useState("");

  return (
    <main className="flex flex-1 flex-col py-6">
      {step === "landing" && <Landing onStart={() => setStep("compose")} />}

      {step === "compose" && (
        <Compose
          phone={phone}
          sender={sender}
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
      <div className="flex flex-1 flex-col justify-center gap-7">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-[#ef6a87] to-[#d83a5f] text-4xl shadow-float ring-[6px] ring-white/70">
            🤫
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-brand">
              {COPY.landing.eyebrow}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight">
              {COPY.landing.title}
            </h1>
            <p className="text-base leading-relaxed text-muted">
              {COPY.landing.subtitle}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {COPY.landing.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-muted">
              <span aria-hidden className="mt-0.5 text-brand">
                ✓
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button block onClick={onStart} className="mt-8">
        {COPY.landing.cta}
      </Button>
    </div>
  );
}

/* ── Steg: skapa ────────────────────────────────────────────────────────── */

function Compose({
  phone,
  sender,
  onPhone,
  onSender,
  onBack,
  onSuggest,
  onSent,
}: {
  phone: string;
  sender: string;
  onPhone: (v: string) => void;
  onSender: (v: string) => void;
  onBack: () => void;
  onSuggest: () => void;
  onSent: () => void;
}) {
  const [excuses, setExcuses] = useState<Excuse[] | null>(null);
  const [index, setIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SendError | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  const count = excuses?.length ?? 0;
  const current =
    excuses && count > 0 ? excuses[((index % count) + count) % count] : null;

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
        body: JSON.stringify({ phone, excuseId: current.id }),
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
        text={current?.text}
        sentCount={current?.sentCount}
        loading={excuses === null}
        empty={excuses !== null && count === 0}
        onNext={next}
        onPrev={prev}
      />

      {/* Bläddra (för den som inte sveper) */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={prev} disabled={!current}>
          {COPY.compose.prev}
        </Button>
        <Button variant="secondary" onClick={next} disabled={!current}>
          {COPY.compose.next}
        </Button>
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

      {/* Sändningsnummer + spara kontakt */}
      <div className="space-y-2 rounded-3xl border border-border bg-surface p-4 shadow-soft">
        <p className="text-xs text-muted">{COPY.compose.fromLabel}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="select-all font-mono text-sm font-semibold">
            {SENDER_NUMBER}
          </span>
          <Button
            variant="secondary"
            onClick={() => downloadVCard(contactName, SENDER_NUMBER)}
            disabled={!sender.trim()}
            className="px-4 py-2 text-sm"
          >
            ⬇ {COPY.compose.saveContact}
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted/80">
          {COPY.compose.fromHelp}
        </p>
      </div>

      <Button block variant="ghost" onClick={onSuggest} className="text-sm">
        {COPY.browse.suggestLink}
      </Button>
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

      <FramedField>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-full bg-white px-5 py-3.5 shadow-inset"
        >
          <span className={value ? "font-medium" : "text-muted"}>
            {value || COPY.compose.choose}
          </span>
          <span className="text-muted">{open ? "▴" : "▾"}</span>
        </button>
      </FramedField>

      {open && (
        <Card className="gap-3 p-4">
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
          <FramedField>
            <input
              type="text"
              placeholder={COPY.details.senderPlaceholder}
              value={isCustom ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-full bg-white px-5 py-3 shadow-inset outline-none ring-brand/30 transition focus:ring-2"
            />
          </FramedField>
        </Card>
      )}
    </div>
  );
}

/* ── iOS-liknande chatt-förhandsvisning med swipe ───────────────────────── */

function ChatPreview({
  name,
  text,
  sentCount,
  loading,
  empty,
  onNext,
  onPrev,
}: {
  name: string;
  text?: string;
  sentCount?: number;
  loading: boolean;
  empty: boolean;
  onNext: () => void;
  onPrev: () => void;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const countLabel = formatSentCount(sentCount ?? 0);
  const swipeable = !loading && !empty && !!text;

  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  function onDown(e: React.PointerEvent) {
    if (!swipeable) return;
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
    if (dx < -60) onNext();
    else if (dx > 60) onPrev();
    setDx(0);
    setDragging(false);
  }

  return (
    <div className="space-y-2">
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          transform: `translateX(${dx}px) rotate(${dx * 0.03}deg)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          touchAction: "pan-y",
        }}
        className={
          "select-none rounded-[2rem] bg-surface-2 p-1.5 shadow-raised " +
          (swipeable ? "cursor-grab active:cursor-grabbing" : "")
        }
      >
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
            ) : empty || !text ? (
              <div className="self-center text-sm text-black/40">
                {COPY.compose.empty}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#e9e9eb] px-4 py-2.5 text-[15px] leading-snug text-black">
                  {text}
                </div>
                {countLabel && (
                  <span className="pl-1 text-[11px] text-black/35">{countLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {swipeable && (
        <p className="text-center text-[11px] text-muted">{COPY.compose.swipeHint}</p>
      )}
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
        <div className="text-5xl">📱</div>
        <h1 className="text-2xl font-extrabold">{COPY.result.successTitle}</h1>
        <p className="max-w-xs text-muted">
          {fill(COPY.result.successBody, { name: sender })}
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
