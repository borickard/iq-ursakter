"use client";

import { useCallback, useEffect, useState } from "react";
import { COPY, fill } from "@/lib/copy";
import { downloadVCard } from "@/lib/vcard";
import { normalizeToE164 } from "@/lib/phone";
import { Button, Card, Chip } from "@/components/ui";

type Step = "landing" | "details" | "vcard" | "browse" | "result";
type Excuse = { id: string; text: string };
type SendError = keyof typeof COPY.result.errors;

const SENDER_NUMBER = process.env.NEXT_PUBLIC_SMS_FROM_NUMBER ?? "";

export default function Flow() {
  const [step, setStep] = useState<Step>("landing");
  const [phone, setPhone] = useState("");
  const [sender, setSender] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function goDetails() {
    setStep("details");
  }

  function submitDetails() {
    if (!normalizeToE164(phone)) {
      setFormError(COPY.details.invalidPhone);
      return;
    }
    if (!sender.trim()) {
      setFormError(COPY.details.missingSender);
      return;
    }
    setFormError(null);
    setStep("vcard");
  }

  return (
    <main className="flex flex-1 flex-col py-6">
      {step === "landing" && <Landing onStart={goDetails} />}

      {step === "details" && (
        <Details
          phone={phone}
          sender={sender}
          error={formError}
          onPhone={setPhone}
          onSender={setSender}
          onBack={() => setStep("landing")}
          onNext={submitDetails}
        />
      )}

      {step === "vcard" && (
        <VCardStep
          sender={sender}
          onBack={() => setStep("details")}
          onContinue={() => setStep("browse")}
        />
      )}

      {(step === "browse" || step === "result") && (
        <Browse
          phone={phone}
          sender={sender}
          onBack={() => setStep("vcard")}
          onRestart={() => {
            setPhone("");
            setSender("");
            setStep("landing");
          }}
        />
      )}

      <Footer />
    </main>
  );
}

/* ── Steg: landning ─────────────────────────────────────────────────────── */

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center gap-6">
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

/* ── Steg: uppgifter ────────────────────────────────────────────────────── */

function Details({
  phone,
  sender,
  error,
  onPhone,
  onSender,
  onBack,
  onNext,
}: {
  phone: string;
  sender: string;
  error: string | null;
  onPhone: (v: string) => void;
  onSender: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const presets: readonly string[] = COPY.details.senderPresets;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Header title={COPY.details.title} onBack={onBack} />

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
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none ring-brand/40 focus:ring-2"
        />
        <p className="text-xs text-muted">{COPY.details.phoneHelp}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {COPY.details.senderLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((name) => (
            <Chip
              key={name}
              active={sender === name}
              onClick={() => onSender(name)}
            >
              {name}
            </Chip>
          ))}
        </div>
        <input
          type="text"
          placeholder={COPY.details.senderPlaceholder}
          value={presets.includes(sender) ? "" : sender}
          onChange={(e) => onSender(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none ring-brand/40 focus:ring-2"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="mt-auto pt-4">
        <Button block onClick={onNext}>
          {COPY.details.next}
        </Button>
      </div>
    </div>
  );
}

/* ── Steg: kontaktkort (vCard) ──────────────────────────────────────────── */

function VCardStep({
  sender,
  onBack,
  onContinue,
}: {
  sender: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <Header title={COPY.vcard.title} onBack={onBack} />

      <Card className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          {fill(COPY.vcard.explainer, { name: sender })}
        </p>

        <Button
          block
          variant="secondary"
          onClick={() => downloadVCard(sender, SENDER_NUMBER)}
        >
          ⬇ {COPY.vcard.download}
        </Button>

        <p className="text-xs text-muted">{COPY.vcard.micro}</p>
      </Card>

      <div className="mt-auto space-y-3 pt-4">
        <Button block onClick={onContinue}>
          {COPY.vcard.done}
        </Button>
        <Button block variant="ghost" onClick={onContinue}>
          {COPY.vcard.skip}
        </Button>
      </div>
    </div>
  );
}

/* ── Steg: bläddra + skicka + resultat ──────────────────────────────────── */

function Browse({
  phone,
  sender,
  onBack,
  onRestart,
}: {
  phone: string;
  sender: string;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [excuses, setExcuses] = useState<Excuse[] | null>(null);
  const [index, setIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"success" | SendError | null>(null);

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

  const current = excuses && excuses.length > 0 ? excuses[index % excuses.length] : null;

  const next = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  const shuffle = useCallback(() => {
    setIndex(() => Math.floor(Math.random() * 100000));
  }, []);

  async function send() {
    if (!current) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, excuseId: current.id }),
      });
      if (res.ok) {
        setResult("success");
      } else {
        const data = await res.json().catch(() => ({}));
        const err = (data?.error ?? "unknown") as string;
        setResult((err in COPY.result.errors ? err : "unknown") as SendError);
      }
    } catch {
      setResult("send_failed");
    } finally {
      setSending(false);
    }
  }

  if (result === "success") {
    return (
      <Result
        ok
        sender={sender}
        onAgain={() => {
          setResult(null);
          next();
        }}
        onRestart={onRestart}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Header title={COPY.browse.title} onBack={onBack} />

      <div className="flex flex-1 flex-col justify-center">
        {excuses === null ? (
          <Card className="text-center text-muted">…</Card>
        ) : current ? (
          <Card className="min-h-[9rem] items-center justify-center text-center">
            <p className="flex min-h-[7rem] items-center justify-center text-xl font-semibold leading-snug">
              “{current.text}”
            </p>
          </Card>
        ) : (
          <Card className="text-center text-muted">{COPY.browse.empty}</Card>
        )}

        {result && (
          <p className="mt-4 text-center text-sm text-danger">
            {COPY.result.errors[result]}
          </p>
        )}
      </div>

      {current && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={next}>
              {COPY.browse.next}
            </Button>
            <Button variant="secondary" onClick={shuffle}>
              🎲 {COPY.browse.shuffle}
            </Button>
          </div>
          <Button block onClick={send} disabled={sending}>
            {sending ? COPY.browse.sending : COPY.browse.send}
          </Button>
        </div>
      )}
    </div>
  );
}

function Result({
  ok,
  sender,
  onAgain,
  onRestart,
}: {
  ok: boolean;
  sender: string;
  onAgain: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">{ok ? "📱" : "⚠️"}</div>
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

/* ── Delade smådelar ────────────────────────────────────────────────────── */

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Tillbaka"
        className="rounded-full bg-surface-2 px-3 py-1.5 text-sm text-muted"
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
