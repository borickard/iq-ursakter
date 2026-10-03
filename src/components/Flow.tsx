"use client";

import { useCallback, useEffect, useState } from "react";
import { COPY, fill, formatSentCount } from "@/lib/copy";
import { normalizeToE164 } from "@/lib/phone";
import { Button, Chip } from "@/components/ui";
import { IosMessages } from "@/components/IosMessages";

type Step = "landing" | "compose" | "result" | "suggest";
type Excuse = { id: string; text: string; sentCount: number };
type LeadIn = { them1: string; me: string; them2: string };
type SendError = keyof typeof COPY.result.errors;
type SuggestError = keyof typeof COPY.suggest.errors;

/** "Idag HH:MM" för nu minus angivet antal minuter (för mockup-tidsstämplar). */
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

  // Hämta ursäkterna redan när sidan laddas (på landningen), så de finns klara
  // när användaren går vidare – ingen fördröjning när man bläddrar.
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

      <Footer />
    </main>
  );
}

/* ── Steg: landning ─────────────────────────────────────────────────────── */

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center gap-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {COPY.brand.name}
        </p>

        {/* Förhandsvisning – ett riktigt meddelande gör konceptet tydligt direkt */}
        <div className="space-y-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c7c7cc] text-base font-semibold text-white">
            {COPY.landing.heroSender.charAt(0)}
          </div>
          <div className="max-w-[18rem] rounded-2xl rounded-bl-md bg-[#e9e9eb] px-4 py-3 text-[15px] leading-snug text-black">
            {COPY.landing.heroMessage}
          </div>
          <p className="pl-1 text-xs text-muted">
            {COPY.landing.heroSender} · {COPY.landing.heroMeta}
          </p>
        </div>

        <div className="space-y-3">
          <h1 className="text-[2.2rem] font-extrabold leading-[1.08] tracking-tight">
            {COPY.landing.title}
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-muted">
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
    // Räkna som en användning av ursäkten (samma räknare som SMS). Fire-and-forget.
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excuseId: current.id }),
    }).catch(() => {});
  }

  const countLabel = current ? formatSentCount(current.sentCount) : null;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Header title={COPY.compose.title} onBack={onBack} />

      {/* Avsändare (dropdown) – styr namnet i aviseringen */}
      <SenderField value={sender} onChange={onSender} />

      {/* Förhandsvisning: ursäkten som en avisering på låsskärmen */}
      <LockScreen
        name={contactName}
        excuse={current}
        loading={excuses === null}
        empty={excuses !== null && count === 0}
      />
      {countLabel && (
        <p className="text-center text-xs text-muted">{countLabel}</p>
      )}

      {/* Bläddra bland ursäkter */}
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
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={COPY.details.phonePlaceholder}
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface px-5 py-3.5 outline-none ring-brand/30 transition focus:border-brand/40 focus:ring-2"
        />
      </div>

      {(formError || error) && (
        <p className="text-center text-sm text-danger">
          {formError ?? COPY.result.errors[error!]}
        </p>
      )}

      <Button block onClick={send} disabled={sending || !current}>
        {sending ? COPY.browse.sending : COPY.browse.send}
      </Button>

      {/* Alternativ: visa som ett meddelande i helskärm (skickar inget SMS) */}
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

/* ── Låsskärms-förhandsvisning (ursäkten som en avisering) ───────────────── */

function LockScreen({
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
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  const rawDate = now.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="overflow-hidden rounded-[2rem] bg-[#11161d] px-5 pb-6 pt-8 text-white shadow-float">
      {/* Klocka */}
      <div className="text-center">
        <div className="text-[13px] font-medium text-white/70">{date}</div>
        <div className="text-6xl font-semibold tracking-tight">{time}</div>
      </div>

      {/* Avisering */}
      <div className="mt-9">
        {loading ? (
          <div className="rounded-2xl bg-white/90 px-4 py-4 text-black/40">…</div>
        ) : empty || !excuse ? (
          <div className="rounded-2xl bg-white/90 px-4 py-4 text-center text-sm text-black/50">
            {COPY.compose.empty}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/95 px-4 py-3 text-black">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-[18px] w-[18px] rounded-[5px] bg-[#34c759]" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-black/45">
                Meddelanden
              </span>
              <span className="ml-auto text-[11px] text-black/40">nu</span>
            </div>
            <div className="text-[15px] font-semibold leading-tight">{name}</div>
            <div className="mt-0.5 text-[15px] leading-snug text-black/80">
              {excuse.text}
            </div>
          </div>
        )}
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
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
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
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none ring-brand/30 transition focus:ring-2"
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand shadow-soft">
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
        className="w-full resize-none rounded-2xl border border-border bg-surface px-5 py-4 outline-none ring-brand/30 transition focus:border-brand/40 focus:ring-2"
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
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-lg text-muted transition hover:text-brand active:scale-95"
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
