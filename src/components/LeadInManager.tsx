"use client";

import { useEffect, useState } from "react";
import { COPY } from "@/lib/copy";
import { Button, Card } from "@/components/ui";

type LeadIn = { id: string; them1: string; me: string; them2: string };
type Draft = { them1: string; me: string; them2: string };

const EMPTY: Draft = { them1: "", me: "", them2: "" };
const valid = (d: Draft) =>
  d.them1.trim() !== "" && d.me.trim() !== "" && d.them2.trim() !== "";

/** Admin-hantering av inledande konversationer (LeadIn). */
export function LeadInManager() {
  const [items, setItems] = useState<LeadIn[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY);

  async function load() {
    try {
      const res = await fetch("/api/admin/leadins");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.leadins ?? []);
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    if (!valid(newDraft)) return;
    setBusy("new");
    try {
      const res = await fetch("/api/admin/leadins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDraft),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.leadin) setItems((c) => (c ? [...c, data.leadin] : [data.leadin]));
        setNewDraft(EMPTY);
      }
    } finally {
      setBusy(null);
    }
  }

  async function save(id: string) {
    if (!valid(draft)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/leadins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft }),
      });
      if (res.ok) {
        setItems((c) => (c ? c.map((x) => (x.id === id ? { id, ...draft } : x)) : c));
        setEditingId(null);
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(COPY.admin.confirmDelete)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/leadins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setItems((c) => (c ? c.filter((x) => x.id !== id) : c));
    } finally {
      setBusy(null);
    }
  }

  const c = COPY.admin.leadins;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
          {c.title}
        </h2>
        <p className="text-xs text-muted">{c.help}</p>
      </div>

      {error && <Card className="text-center text-danger">{COPY.admin.loadError}</Card>}

      {/* Lägg till ny */}
      <Card className="gap-3">
        <Fields draft={newDraft} onChange={setNewDraft} />
        <Button
          onClick={add}
          disabled={busy === "new" || !valid(newDraft)}
          className="self-start"
        >
          {c.add}
        </Button>
      </Card>

      {/* Befintliga */}
      {items !== null && items.length === 0 && (
        <p className="text-sm text-muted">{c.empty}</p>
      )}
      {(items ?? []).map((it) => (
        <Card key={it.id} className="gap-3">
          {editingId === it.id ? (
            <>
              <Fields draft={draft} onChange={setDraft} />
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  disabled={busy === it.id}
                  onClick={() => setEditingId(null)}
                >
                  {COPY.admin.cancel}
                </Button>
                <Button
                  disabled={busy === it.id || !valid(draft)}
                  onClick={() => save(it.id)}
                >
                  {COPY.admin.save}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1 text-sm leading-snug">
                <p>
                  <span className="text-muted">De: </span>
                  {it.them1}
                </p>
                <p>
                  <span className="text-muted">Du: </span>
                  {it.me}
                </p>
                <p>
                  <span className="text-muted">De: </span>
                  {it.them2}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  aria-label={COPY.admin.edit}
                  disabled={busy === it.id}
                  onClick={() => {
                    setEditingId(it.id);
                    setDraft({ them1: it.them1, me: it.me, them2: it.them2 });
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-soft transition hover:text-brand active:scale-95 disabled:opacity-50"
                >
                  ✎
                </button>
                <button
                  type="button"
                  aria-label={COPY.admin.delete}
                  disabled={busy === it.id}
                  onClick={() => remove(it.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-soft transition hover:text-danger active:scale-95 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </>
          )}
        </Card>
      ))}
    </section>
  );
}

function Fields({
  draft,
  onChange,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
}) {
  const cls =
    "w-full rounded-full border border-border bg-surface px-4 py-2.5 shadow-inset outline-none ring-brand/30 transition focus:ring-2";
  return (
    <div className="space-y-2">
      <input
        value={draft.them1}
        maxLength={200}
        placeholder={COPY.admin.leadins.them}
        onChange={(e) => onChange({ ...draft, them1: e.target.value })}
        className={cls}
      />
      <input
        value={draft.me}
        maxLength={200}
        placeholder={COPY.admin.leadins.me}
        onChange={(e) => onChange({ ...draft, me: e.target.value })}
        className={cls}
      />
      <input
        value={draft.them2}
        maxLength={200}
        placeholder={COPY.admin.leadins.them}
        onChange={(e) => onChange({ ...draft, them2: e.target.value })}
        className={cls}
      />
    </div>
  );
}
