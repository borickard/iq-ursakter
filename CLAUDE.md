# CLAUDE.md — Ursäkten (working context)

Read this first when resuming. It captures the stack, what's done, what's
pending, the key decisions, design direction, and how the user wants to work.

---

## 1. What this is

**Ursäkten** — a Proof of Concept for **IQ** (owned by Systembolaget). A
mobile-first web app: the user generates a believable excuse and has it sent as
an **SMS to their own phone**, so it shows up looking like it came from a saved
contact (e.g. "Mamma", "Älskling", "Chefen"). A friction-free social "exit
button" — a harm-reduction tool for getting out of a situation without having
to explain yourself.

How the "spoofed sender" works (important, and abuse-safe): the SMS is sent from
the platform's single real number. The user first saves that number as a
contact (e.g. "Älskling") using a **vCard (.vcf)** the site generates. Their
phone then shows that contact name. The trick only works for the person who
saved the contact — sending to someone else just shows an unknown number, which
closes the worst harassment vector.

Full original brief: see the project brief (Swedish). Key sections referenced
below as "brief §N".

---

## 2. The user (how to work with them)

- The user is **Rickard** (rickard@iq.se). **He is NOT a developer.**
- **Explain in plain, simple terms. Minimal detail. Focus on the concrete
  actions HE needs to take.** Avoid jargon; when unavoidable, explain it once.
- He is comfortable with React/GitHub at a high level but wants clear, explicit
  deploy/env steps.
- **Confirm before anything that costs money or deploys publicly.** Keep SMS in
  `dummy` mode until he explicitly says to switch to real SMS (46elks costs per
  message).
- He cares about cost: chose Supabase because he already pays for it (avoids a
  second DB bill).

---

## 3. Tech stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS** — theming via CSS variables (see `src/app/globals.css`)
- **Prisma 6** + **PostgreSQL** (hosted on **Supabase**)
- **SMS behind a small interface** (`sms.send({ to, from, message })`) so the
  provider is swappable. Implementations: `dummy` (logs only, default) and
  `elks` (46elks). Selected via `SMS_PROVIDER`.
- **Hosting: Vercel.** Node 22.

### Project structure
```
prisma/schema.prisma      # data model (Excuse, RateBucket)
prisma/seed.ts            # seeds the starter excuses (idempotent by text)
src/middleware.ts         # HTTP Basic Auth in front of /admin + /api/admin
src/app/page.tsx          # renders <Flow/>
src/app/layout.tsx        # html shell, themeColor, metadata
src/app/globals.css       # THEME (CSS variables) + body gradient
src/app/admin/page.tsx    # admin UI: manage all excuses + moderate suggestions
src/app/api/excuses/route.ts   # GET approved excuses, most-sent first + sentCount
src/app/api/send/route.ts      # POST validate -> rate-limit -> send SMS -> bump sentCount
src/app/api/suggest/route.ts   # POST user suggestion -> pending (NEVER sends SMS)
src/app/api/admin/excuses/route.ts   # GET all | POST create | PATCH status | DELETE
src/components/Flow.tsx    # client flow: landing -> compose (live iMessage preview) -> result
src/components/ui.tsx      # Button / Card / Chip (the design primitives)
src/lib/sms/{index,types,dummy,elks}.ts  # provider interface + impls
src/lib/excuses.ts         # SEED_EXCUSES source list
src/lib/copy.ts            # ALL user-facing text (branding/tone live here)
src/lib/phone.ts           # E.164 validation/normalisation
src/lib/vcard.ts           # vCard generation (client)
src/lib/rateLimit.ts       # DB-backed rate limiting (serverless-safe)
src/lib/db.ts              # Prisma client singleton
src/lib/clsx.ts            # tiny className helper
```

### Data model (`prisma/schema.prisma`)
- **Excuse**: `id`, `text`, `source` (`seed`|`user`|`admin`), `status`
  (`approved`|`pending`|`rejected`|`disabled`), `sentCount`, `createdAt`.
  Index on `[status, source]`. Only `approved` is public; `disabled` = an
  admin-hidden excuse (toggled off, not deleted).
- **RateBucket**: `key` (`ip:<ip>` | `num:<hash>` | `suggest:<ip>` |
  `global:<YYYY-MM-DD>`), `count`, `resetAt`.
- **The recipient phone number is NEVER stored.** It is received, validated to
  E.164, used to send, and discarded. Rate limiting per number uses only a
  short-lived **salted hash** that is swept after the window.

---

## 4. What's DONE (built, tested locally, pushed)

### Fas 1 (MVP) — complete
Landing → details (phone + sender name, with presets) → vCard download →
browse excuses (next / shuffle) → send → confirmation + error handling.
DB-backed rate limiting (per IP, per hashed number, global daily cap as a budget
guard). GDPR: number never stored, no PII in URLs.

### Fas 2 — complete
1. **Popularity.** `/api/excuses` returns `sentCount` and orders most-sent
   first. The browse card shows "Skickad X gånger" (Swedish number format;
   hidden at 0). Shuffle button keeps variety.
2. **User suggestions.** A "Föreslå en ursäkt" screen. The text is saved as
   `source="user"`, `status="pending"` via `/api/suggest`. **It is NEVER sent
   as an SMS** (see decision #1 below). Length cap 5–200 chars + per-IP rate
   limit (`RATE_LIMIT_SUGGEST_PER_IP`).
3. **Admin management.** `/admin`, protected by HTTP Basic Auth in
   `src/middleware.ts` (`ADMIN_USER`/`ADMIN_PASSWORD`, fail-closed if unset).
   One unified API: `src/app/api/admin/excuses/route.ts`
   (GET all | POST create | PATCH status | DELETE). The page lets the admin:
   moderate pending suggestions (Godkänn/Avslå), toggle any excuse On/Off
   (approved↔disabled), see each excuse's usage count, add new ones, and delete.
   (Replaced the older `pending` + `moderate` routes.)

### Flow redesign — complete (this session)
The step-by-step flow was collapsed: landing → **one compose screen** that has
the phone + sender inputs, a **live iOS-Messages-style preview** (grey incoming
bubble from the chosen sender, updates in real time as you change sender /
next / shuffle), the send button, and — next to it — the sending number plus a
"Spara kontakt" (vCard) button. Then a result screen. `ChatPreview` in
`Flow.tsx` is the iMessage card (white bg, `#e9e9eb` bubble — deliberately
iOS-looking regardless of the pink theme).

### Design overhaul — complete
Reworked from the old dark theme to a soft pink, rounded, depth-shadowed look
(see §6).

### Excuse perspective fix — complete in code (DB needs the update script, §7)
Excuses rewritten from the **sender's** point of view (see decision #2).

---

## 5. KEY DECISIONS & deviations from the brief

1. **Free-text suggestions are NEVER sent as SMS.** The brief §4 said a user's
   own excuse would be texted to them directly *and* queued for moderation.
   **The user overrode this:** suggestions go ONLY to the moderation queue,
   never out as SMS. This is safer (no arbitrary user text ever leaves the
   system) and keeps OTP comfortably deferred.
2. **Excuse perspective = sender → receiver.** The SMS is the *contact* giving
   the user a reason to leave/come, e.g. "Kan du komma hem?", "Du behöver komma
   in tidigt imorgon bitti" — NOT the user's own voice ("Jag måste hem"). The
   seed list in `src/lib/excuses.ts` reflects this; the live DB must be updated
   with the script in §7.
3. **Admin auth = single shared user/password** via HTTP Basic Auth in
   middleware. Fine for an internal POC. Swappable for real auth later without
   touching the rest of the app.
4. **Popularity display = raw counts, most-popular-first** (straight from brief
   §4 "Skickad 1 248 gånger"), with a shuffle button for variety.
5. **Database = Supabase Postgres** (user already pays for it). Neon was the
   other free option.
6. **OTP deferred** (brief §8, "ej i POC"). Architecture allows turning it on
   later.
7. **All user-facing text lives in `src/lib/copy.ts`** (brief §9) so
   branding/tone (incl. how visible the IQ connection is) can change without
   touching components. `brand.name` is currently "Ursäkten", `brand.byline`
   "En social exit-knapp." IQ visibility is still an open question — keep it
   neutral/themeable.

---

## 6. Design direction

- **Reference:** soft pastel **pink**, **rounded pill** shapes, **soft depth
  shadows** (a light neumorphic feel), a floating **circular badge**, minimal /
  sleek / modern. (User supplied a reference image of a pink pill-shaped search
  bar with a circular logo badge.)
- **Theme is driven by CSS variables** in `src/app/globals.css`. Current
  palette (RGB triplets): bg pink gradient, surface near-white warm, brand rose
  `224 78 110` (#e04e6e), border soft rose, danger deeper red. `layout.tsx`
  `themeColor` is pink (#f8e2e4).
- **Custom Tailwind tokens** (`tailwind.config.ts`): box-shadows `soft`,
  `raised`, `inset`; radius `3xl`; pills use `rounded-full`.
- **Components** (`src/components/ui.tsx`): primary Button = brand pill with
  `shadow-raised`; secondary = white pill + border + `shadow-soft`; Card =
  `rounded-3xl` + border + `shadow-soft`; inputs = pill-shaped with
  `shadow-inset` (recessed). Landing has a 🤫 circular badge.
- Mobile-first, dark-room-friendly readability, large tap targets.

---

## 7. Deploy & environment (Vercel + Supabase)

### Branch model
- **`main` is the production/live branch.** Pushing to `main` = pushing live.
  (Created this session.) User needs to set `main` as the **GitHub default
  branch** (Repo → Settings → General → Default branch) so Vercel deploys it.
- Old default branch: `claude/ursakten-excuse-sms-poc-kd5eru`. This session's
  feature branch: `claude/busy-gates-i6279l`.
- No PR workflow set up yet (offered to the user; awaiting preference).

### Supabase
- Project ref: **`bqunakmdnzosodrcabob`**, region **eu-west-1**.
- **CRITICAL — IPv6 gotcha:** the *direct* connection
  (`db.<ref>.supabase.co:5432`) is **IPv6-only** and does NOT work from
  IPv4-only networks (including Vercel and this Claude cloud env). **Use the
  Transaction pooler** for Vercel.
- **Vercel `DATABASE_URL` format** (Transaction pooler, port 6543, + the Prisma
  flag):
  ```
  postgresql://postgres.bqunakmdnzosodrcabob:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
  The **password is stored in Vercel env vars, NOT in this repo.** Ask the user
  for it if a session needs it (he reset it once via Supabase → Settings →
  Database → Reset database password).

### Vercel environment variables (set for Production)
Required (deploy + demo safely in dummy SMS mode — costs nothing):
| Name | Value |
|---|---|
| `DATABASE_URL` | the pooler string above (with real password) |
| `SMS_PROVIDER` | `dummy` |
| `SMS_FROM_NUMBER` | `+46700000000` (placeholder is fine in dummy mode) |
| `NEXT_PUBLIC_SMS_FROM_NUMBER` | same as `SMS_FROM_NUMBER` (must match) |
| `RATE_LIMIT_HASH_SALT` | a long random string |
| `ADMIN_USER` | e.g. `admin` |
| `ADMIN_PASSWORD` | a strong password (unlocks `/admin`) |

Only for REAL SMS (when the user confirms): `SMS_PROVIDER=elks`,
`ELKS_API_USERNAME`, `ELKS_API_PASSWORD`, and a rented `SMS_FROM_NUMBER`.

Optional overrides (defaults baked in): `RATE_LIMIT_PER_IP` (5),
`RATE_LIMIT_PER_NUMBER` (3), `RATE_LIMIT_SUGGEST_PER_IP` (5),
`RATE_LIMIT_WINDOW_SECONDS` (3600), `RATE_LIMIT_GLOBAL_DAILY` (500).

### Database setup — done via the Supabase SQL Editor, NOT prisma CLI
This Claude cloud env **cannot reach the DB** (outbound DB ports 5432/6543 are
blocked; only an HTTP proxy is allowed). So `prisma db push` / `db seed` fail
from here. The user runs SQL by hand in **Supabase → SQL Editor**.

- Tables + first seed: **DONE** (user ran the create-tables + insert script).
- **PENDING — excuse-perspective update.** The live DB still has the OLD
  excuses. The user must run this to replace them (matches `src/lib/excuses.ts`):
  ```sql
  DELETE FROM "Excuse" WHERE "source" = 'seed';
  INSERT INTO "Excuse" ("id", "text") VALUES
  ('seed-01', 'Hunden har kräkts i hela sängen – kan du komma hem?'),
  ('seed-02', 'Jag har feber och mår uselt, kan du komma hem?'),
  ('seed-03', 'Jag har låst mig ute, kan du komma och låsa upp?'),
  ('seed-04', 'Grannen ringde – det läcker vatten hos oss, du måste komma hem.'),
  ('seed-05', 'Du behöver komma in tidigt imorgon bitti, något har dykt upp på jobbet.'),
  ('seed-06', 'Jag mår inte bra, kan du komma hit?'),
  ('seed-07', 'Billarmet har gått igång på gatan, kan du komma och kolla?'),
  ('seed-08', 'Barnvakten måste gå nu, du behöver komma hem.'),
  ('seed-09', 'Jag tror spisen står på – kan du komma hem och kolla?'),
  ('seed-10', 'Jag har blivit av med plånboken, kan du komma och hjälpa mig?'),
  ('seed-11', 'Jag är jättedålig i magen, kan du komma hem?'),
  ('seed-12', 'Det har hänt något hemma – du behöver komma hem nu.'),
  ('seed-13', 'Vi behöver dig på jobbet nu, kan du rycka in?'),
  ('seed-14', 'Larmet hemma har gått, du måste komma och kolla.'),
  ('seed-15', 'Kan du komma hem? Jag vill inte vara ensam ikväll.');
  ```
  Note: the app expects the table/column names exactly as quoted above
  (PascalCase `"Excuse"`, camelCase columns) because that's what Prisma queries.
  `createdAt` has a DB default; `id` is provided by the app (cuid) for runtime
  inserts, so the manual tables work fine with Prisma at runtime.

---

## 8. Working in THIS remote env (operational notes)

- **No DB access** from here (see §7). Use Supabase SQL Editor for DB changes,
  and give the user copy-paste SQL.
- **For local testing**, a local Postgres 16 is available at
  `/usr/lib/postgresql/16/bin`. It must run as the **`postgres`** user (not
  root). Pattern used: `initdb` to a /tmp dir → `pg_ctl start` on a spare port →
  `prisma db push` + `db seed` against `127.0.0.1` → `next start` → curl the
  endpoints. Tear it down after.
- **No browser / screenshots:** chromium downloads are blocked, so visual checks
  are done via `next build` + curling rendered HTML. Cannot send screenshots.
- npm registry IS reachable; arbitrary outbound TCP is not.
- Verify changes with: `npm run lint` and
  `DATABASE_URL="postgresql://u:p@localhost:5432/db" npx next build` (build only
  needs a syntactically valid URL, not a live DB).
- Commit messages end with the session URL line (harness requirement). Do NOT
  put the model identifier in commits/PRs/code.

---

## 9. Current state & what's next

### Pushed and ready (on `main`)
All Fas 1 + Fas 2 code, the pink redesign, and the corrected seed excuses.

### Waiting on the user (the go-live checklist)
1. ✅ GitHub **default branch** = `main`; Vercel **Production env Branch Tracking**
   set to `main` (was pinned to the old branch — that was why deploys stayed on
   the old dark theme). NOTE: Vercel "Redeploy" reuses the *original commit*, so
   forcing pink to Production required a fresh push to `main` (or "Promote to
   Production" on a `main` preview deployment).
2. ✅ Ran the **excuse-update SQL** (§7) in Supabase — live DB now has the
   sender-perspective excuses.
3. ✅ Added the **Vercel env vars** (§7), including the pooler `DATABASE_URL`.
   The DB password was reset (twice) before it took; current working password is
   stored only in Vercel. The pooler region is **eu-west-1**.
4. ✅ Deployed on Vercel from `main`. App is **LIVE** at `ursakter.vercel.app`
   (pink design, DB connected, excuses loading). SMS still in `dummy` mode.

### Planned / possible future work
- **Real SMS via 46elks** — only after the user explicitly confirms (costs
  money). Switch `SMS_PROVIDER=elks` + add 46elks creds + rent a number.
- **IQ branding decision** (brief §9) — how visible the IQ connection should be.
- **PR-based workflow** — offered; user hasn't decided vs. pushing straight to
  `main`.
- **Multiple sender personas** would require multiple sending numbers (brief
  §6) — out of scope for POC.
- **OTP** for the future if free-text-to-others is ever introduced (currently
  not, by decision #1).
