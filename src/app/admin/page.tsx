"use client";

import { useEffect, useMemo, useState } from "react";
import { COPY, fill } from "@/lib/copy";
import { Button, Card, Chip } from "@/components/ui";
import { LeadInManager } from "@/components/LeadInManager";

type Excuse = {
  id: string;
  text: string;
  source: string;
  status: string;
  sentCount: number;
  createdAt: string;
};

export default function AdminPage() {
  const [excuses, setExcuses] = useState<Excuse[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/excuses");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExcuses(data.excuses ?? []);
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const pending = useMemo(
    () => (excuses ?? []).filter((e) => e.status === "pending"),
    [excuses],
  );
  const pool = useMemo(
    () =>
      (excuses ?? [])
        .filter((e) => e.status === "approved" || e.status === "disabled")
        .sort((a, b) => b.sentCount - a.sentCount),
    [excuses],
  );

  async function patchStatus(id: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/excuses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setExcuses((cur) =>
          cur ? cur.map((e) => (e.id === id ? { ...e, status } : e)) : cur,
        );
      }
    } finally {
      setBusy(null);
    }
  }

  function startEdit(id: string, text: string) {
    setEditingId(id);
    setEditText(text);
  }

  async function saveEdit(id: string) {
    const text = editText.trim();
    if (text.length < 5) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/excuses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text }),
      });
      if (res.ok) {
        setExcuses((cur) =>
          cur ? cur.map((e) => (e.id === id ? { ...e, text } : e)) : cur,
        );
        setEditingId(null);
        setEditText("");
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(COPY.admin.confirmDelete)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/excuses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setExcuses((cur) => (cur ? cur.filter((e) => e.id !== id) : cur));
      }
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    const text = newText.trim();
    if (text.length < 5) return;
    setBusy("new");
    try {
      const res = await fetch("/api/admin/excuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.excuse) setExcuses((cur) => (cur ? [data.excuse, ...cur] : [data.excuse]));
        setNewText("");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold">{COPY.admin.title}</h1>
        <p className="text-sm text-muted">{COPY.admin.subtitle}</p>
      </div>

      {error && (
        <Card className="mt-6 text-center text-danger">{COPY.admin.loadError}</Card>
      )}

      {excuses === null && !error && (
        <Card className="mt-6 text-center text-muted">…</Card>
      )}

      {excuses !== null && (
        <div className="mt-6 space-y-8">
          {/* Add new */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
              {COPY.admin.addTitle}
            </h2>
            <textarea
              rows={2}
              maxLength={200}
              placeholder={COPY.admin.addPlaceholder}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full resize-none rounded-3xl border border-border bg-surface px-5 py-3.5 shadow-inset outline-none ring-brand/30 transition focus:border-brand/40 focus:ring-2"
            />
            <Button
              onClick={add}
              disabled={busy === "new" || newText.trim().length < 5}
            >
              {COPY.admin.add}
            </Button>
          </section>

          {/* Pending suggestions */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
              {COPY.admin.pendingTitle}
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted">{COPY.admin.pendingEmpty}</p>
            ) : (
              pending.map((e) => (
                <Card key={e.id} className="gap-3">
                  <p className="text-base font-semibold leading-snug">“{e.text}”</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="secondary"
                      disabled={busy === e.id}
                      onClick={() => patchStatus(e.id, "rejected")}
                    >
                      {COPY.admin.reject}
                    </Button>
                    <Button
                      disabled={busy === e.id}
                      onClick={() => patchStatus(e.id, "approved")}
                    >
                      {COPY.admin.approve}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </section>

          {/* All excuses */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
              {COPY.admin.poolTitle}
            </h2>
            {pool.map((e) => (
              <Card key={e.id} className="gap-3">
                {editingId === e.id ? (
                  <>
                    <textarea
                      rows={2}
                      maxLength={200}
                      value={editText}
                      onChange={(ev) => setEditText(ev.target.value)}
                      className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 shadow-inset outline-none ring-brand/30 transition focus:border-brand/40 focus:ring-2"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        disabled={busy === e.id}
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                      >
                        {COPY.admin.cancel}
                      </Button>
                      <Button
                        disabled={busy === e.id || editText.trim().length < 5}
                        onClick={() => saveEdit(e.id)}
                      >
                        {COPY.admin.save}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      className={
                        "text-base font-medium leading-snug " +
                        (e.status === "disabled" ? "text-muted line-through" : "")
                      }
                    >
                      {e.text}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">
                        {fill(COPY.admin.used, {
                          count: e.sentCount.toLocaleString("sv-SE"),
                        })}{" "}
                        · {sourceLabel(e.source)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Chip
                          active={e.status === "approved"}
                          disabled={busy === e.id}
                          onClick={() =>
                            patchStatus(
                              e.id,
                              e.status === "approved" ? "disabled" : "approved",
                            )
                          }
                        >
                          {e.status === "approved" ? COPY.admin.on : COPY.admin.off}
                        </Chip>
                        <button
                          type="button"
                          aria-label={COPY.admin.edit}
                          disabled={busy === e.id}
                          onClick={() => startEdit(e.id, e.text)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-soft transition hover:text-brand active:scale-95 disabled:opacity-50"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          aria-label={COPY.admin.delete}
                          disabled={busy === e.id}
                          onClick={() => remove(e.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-soft transition hover:text-danger active:scale-95 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </section>

          <LeadInManager />
        </div>
      )}
    </main>
  );
}

function sourceLabel(source: string): string {
  if (source === "user") return COPY.admin.sourceUser;
  if (source === "admin") return COPY.admin.sourceAdmin;
  return COPY.admin.sourceSeed;
}
