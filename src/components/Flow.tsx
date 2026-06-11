"use client";

import { useCallback, useEffect, useState } from "react";
import { COPY, fill, formatSentCount } from "@/lib/copy";
import { downloadVCard } from "@/lib/vcard";
import { normalizeToE164 } from "@/lib/phone";
import { Button, Chip } from "@/components/ui";

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
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-surface text-3xl shadow-raised">
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

/* ── Steg: skapa (uppgifter + live-förhandsvisning + skicka) ─────────────── */

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

  const current =
    excuses && excuses.length > 0 ? excuses[index % excuses.length] : null;

  const next = useCallback(() => setIndex((i) => i + 1), []);
  const shuffle = useCallback(() => setIndex(() => Math.floor(Math.random() * 100000)), []);

  const presets: readonly string[] = COPY.details.senderPresets;
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

      {/* Uppgifter */}
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-medium">
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
          className="w-full rounded-full border border-border bg-surface px-5 py-3.5 shadow-inset outline-none ring-brand/30 transition focus:border-brand/40 focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {COPY.details.senderLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((name) => (
            <Chip key={name} active={sender === name} onClick={() => onSender(name)}>
              {name}
            </Chip>
          ))}
        </div>
        <input
          type="text"
          placeholder={COPY.details.senderPlaceholder}
          value={presets.includes(sender) ? "" : sender}
          onChange={(e) => onSender(e.target.value)}
          className="mt-1 w-full rounded-full border border-border bg-surface px-5 py-3.5 shadow-inset outline-none ring-brand/30 transition focus:border-brand/40 focus:ring-2"
        />
      </div>

      {/* Live-förhandsvisning som iOS-meddelande */}
      <ChatPreview
        name={contactName}
        text={current?.text}
        sentCount={current?.sentCount}
        loading={excuses === null}
        empty={excuses !== null && excuses.length === 0}
      />

      {/* Bläddra */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={next} disabled={!current}>
          {COPY.browse.next}
        </Button>
        <Button variant="secondary" onClick={shuffle} disabled={!current}>
          🎲 {COPY.browse.shuffle}
        </Button>
      </div>

      {(formError || error) && (
        <p className="text-center text-sm text-danger">
          {formError ?? COPY.result.errors[error!]}
        </p>
      )}

      {/* Skicka */}
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

/* ── iOS-liknande chatt-förhandsvisning ─────────────────────────────────── */

function ChatPreview({
  name,
  text,
  sentCount,
  loading,
  empty,
}: {
  name: string;
  text?: string;
  sentCount?: number;
  loading: boolean;
  empty: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const countLabel = formatSentCount(sentCount ?? 0);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
      {/* Kontakt-header (som i Meddelanden) */}
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
          <div className="self-center text-sm text-black/40">{COPY.compose.empty}</div>
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

/* ── Steg: föreslå egen ursäkt (Fas 2) ──────────────────────────────────── */

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
