"use client";

import { useEffect, useState } from "react";
import { COPY } from "@/lib/copy";
import { Button, Card } from "@/components/ui";

type Pending = { id: string; text: string; createdAt: string };

export default function AdminPage() {
  const [pending, setPending] = useState<Pending[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/pending");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPending(data.pending ?? []);
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function moderate(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        // Ta bort posten lokalt direkt – den är inte längre pending.
        setPending((cur) => (cur ? cur.filter((p) => p.id !== id) : cur));
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

      <div className="mt-6 flex-1 space-y-4">
        {error ? (
          <Card className="text-center text-danger">{COPY.admin.loadError}</Card>
        ) : pending === null ? (
          <Card className="text-center text-muted">…</Card>
        ) : pending.length === 0 ? (
          <Card className="text-center text-muted">{COPY.admin.empty}</Card>
        ) : (
          pending.map((p) => (
            <Card key={p.id} className="space-y-4">
              <p className="text-lg font-semibold leading-snug">“{p.text}”</p>
              <p className="text-xs text-muted">
                {new Date(p.createdAt).toLocaleString("sv-SE")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  disabled={busy === p.id}
                  onClick={() => moderate(p.id, "reject")}
                >
                  {COPY.admin.reject}
                </Button>
                <Button
                  disabled={busy === p.id}
                  onClick={() => moderate(p.id, "approve")}
                >
                  {COPY.admin.approve}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
