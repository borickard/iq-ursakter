# Ursäkten

En mobil-först webbsajt där du snabbt genererar en trovärdig ursäkt och får den
skickad som **SMS till din egen telefon** – så den dyker upp som ett meddelande
från t.ex. _Mamma_ eller _Älskling_. En smidig social "exit"-knapp för när du
fått nog och inte orkar förklara dig.

> **Status: Proof of Concept (Fas 1 + Fas 2).** Fokus på ett fungerande, snyggt
> flöde – men med GDPR och missbruksskydd på allvar från start (se nedan).
> Fas 2 lägger till popularitetssortering, användarinskickade förslag och en
> lösenordsskyddad admin-vy för moderering.

## Hur det fungerar (kort)

1. Du anger ditt mobilnummer och väljer ett **avsändarnamn** (t.ex. "Älskling").
2. Du laddar ner ett **kontaktkort (.vcf)** och sparar det i telefonen. Det
   kopplar plattformens sändningsnummer till namnet du valt.
3. Du bläddrar bland ursäkter och skickar den du gillar till dig själv.
4. SMS:et kommer från plattformens nummer – men eftersom du sparat det som
   "Älskling" visar telefonen **det** namnet.

Det "spoofade" namnet visas alltså bara för dig som själv sparat kontakten.
Skickas SMS:et till någon annan ser de bara ett okänt nummer – det tar bort den
värsta missbruksvektorn (se [Risk & GDPR](#risk--gdpr)).

## Teknik

- **Next.js (App Router) + TypeScript** – frontend och server-routes i ett.
- **Tailwind CSS** – mobil-först, mörkt tema, tematiserbart via CSS-variabler.
- **Prisma + Postgres** (hostad, t.ex. Neon/Supabase) – samma databas lokalt och
  på Vercel, så det fungerar på serverless utan persistent filsystem.
- **SMS bakom ett internt interface** (`sms.send({ to, from, message })`) så att
  leverantören kan bytas utan att resten av appen påverkas. Inbyggda
  leverantörer: `dummy` (loggar bara) och `elks` (46elks).

### Projektstruktur

```
prisma/
  schema.prisma         # datamodell (Excuse)
  seed.ts               # seedar start-ursäkterna
src/
  middleware.ts         # Basic Auth-skydd framför /admin och /api/admin
  app/
    page.tsx            # renderar flödet
    layout.tsx
    admin/page.tsx      # hantera ursäkter: på/av, antal, lägg till/ta bort, moderera
    api/
      excuses/route.ts  # GET – godkända ursäkter, mest skickade först + sentCount
      send/route.ts     # POST – validerar, rate-limitar, skickar SMS
      suggest/route.ts  # POST – tar emot förslag (pending), skickar ALDRIG SMS
      admin/
        excuses/route.ts # GET alla | POST skapa | PATCH status | DELETE
  components/
    Flow.tsx            # klient-flöde: landning → skapa (live-förhandsvisning) → klart
    ui.tsx              # knappar/kort
  lib/
    sms/                # interface + dummy/46elks-leverantörer
    excuses.ts          # seed-listan
    copy.ts             # ALL text (ändra branding/ton här)
    phone.ts            # E.164-validering
    vcard.ts            # vCard-generering (klient)
    rateLimit.ts        # rate limiting (DB-backad, serverless-säker)
    db.ts               # Prisma-klient
```

## Kom igång lokalt

Kräver Node 18+ (testat på Node 22) och en Postgres-databas. Enklast: skapa en
gratis databas hos [Neon](https://neon.tech/) eller
[Supabase](https://supabase.com/) och använd den både lokalt och i produktion
(Neon har dessutom "branches" om du vill skilja dev/prod åt).

```bash
# 1. Installera beroenden
npm install

# 2. Skapa din lokala miljöfil och fyll i värden (bl.a. DATABASE_URL)
cp .env.example .env.local

# 3. Skapa tabellerna och seeda ursäkterna
npm run db:push      # skapar tabeller utifrån schema.prisma
npm run db:seed      # lägger in start-ursäkterna

# 4. Starta utvecklingsservern
npm run dev
```

Öppna http://localhost:3000.

Med `SMS_PROVIDER="dummy"` (default i `.env.example`) skickas **inga riktiga
SMS** – sändningen loggas bara i terminalen. Perfekt för utveckling så att ingen
SMS-budget bränns.

### Seeda om databasen

```bash
npm run db:reset     # nollställer och seedar om (force-reset + seed)
```

## Miljövariabler

Alla hemligheter ligger i `.env.local` (checkas aldrig in). Se `.env.example`
för fullständig lista med kommentarer. De viktigaste:

| Variabel | Beskrivning |
| --- | --- |
| `DATABASE_URL` | Postgres connection-string (Neon/Supabase). |
| `SMS_PROVIDER` | `dummy` (default, skickar inget) eller `elks`. |
| `SMS_FROM_NUMBER` | Plattformens fasta sändningsnummer i E.164. |
| `NEXT_PUBLIC_SMS_FROM_NUMBER` | Samma nummer, exponerat för vCard i klienten. |
| `ELKS_API_USERNAME` / `ELKS_API_PASSWORD` | 46elks-nycklar (krävs bara för `elks`). |
| `RATE_LIMIT_*` | Tak per IP/nummer/dygn + förslag-per-IP + fönsterlängd + hash-salt. |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Inloggning till admin-vyn (`/admin`). Saknas de är vyn låst. |

> **SMS-nyckeln får ALDRIG ligga i klienten.** All sändning sker i
> server-routen `/api/send`. `NEXT_PUBLIC_SMS_FROM_NUMBER` är avsiktligt publik
> (det är bara sändningsnumret, inte en hemlighet) eftersom vCard genereras i
> klienten.

### Skicka riktiga SMS via 46elks

1. Skaffa konto på [46elks](https://46elks.se/) och hämta API-username/password.
2. Sätt i `.env.local`:
   ```
   SMS_PROVIDER="elks"
   SMS_FROM_NUMBER="+46XXXXXXXXX"          # ditt 46elks-nummer
   NEXT_PUBLIC_SMS_FROM_NUMBER="+46XXXXXXXXX"
   ELKS_API_USERNAME="..."
   ELKS_API_PASSWORD="..."
   ```
3. Under utveckling: skicka till **`+4670000000`** – 46elks dummy-nummer som är
   gratis och inte skickar något riktigt SMS.

> ⚠️ Riktiga SMS kostar pengar per skickad del. Stäm av innan du skickar skarpt
> eller deployar publikt.

## Deploy (Vercel)

Eftersom du är van vid React/GitHub är Vercel enklast:

1. Pusha repot till GitHub och importera det i [Vercel](https://vercel.com/new).
2. **Databas:** skapa en gratis Postgres hos [Neon](https://neon.tech/) eller
   [Supabase](https://supabase.com/). Ingen schemaändring behövs – appen är redan
   inställd på Postgres.
3. Lägg in alla env-variabler från `.env.example` i Vercel (Project →
   Settings → Environment Variables), inkl. `DATABASE_URL`. Använd
   `SMS_PROVIDER="dummy"` tills du medvetet vill skicka skarpt.
4. Kör tabell-setup och seed mot databasen en gång (lokalt, mot prod-URL:en):
   ```bash
   DATABASE_URL="<din-postgres-url>" npx prisma db push
   DATABASE_URL="<din-postgres-url>" npx prisma db seed
   ```
5. Deploya. `npm run build` kör `prisma generate` automatiskt.

> Rate limiting är DB-backad (tabellen `RateBucket`) och fungerar därför över
> flera serverless-instanser. Utgångna buckets städas bort löpande, så
> nummer-hasharna auto-raderas efter fönstret. Inför hög trafik kan den flyttas
> till t.ex. Upstash Redis bakom samma interface.

## Risk & GDPR

Tas på allvar redan i Fas 1 (det går inte att bolta på efteråt):

- **Mottagarnumret lagras aldrig.** Det tas emot i `/api/send`, valideras till
  E.164, används för att skicka och försvinner när requesten är klar. Det skrivs
  aldrig till databasen och loggas aldrig i klartext.
- **Inga personuppgifter i URL:er** eller query-parametrar.
- **Rate limiting** redan i Fas 1: per IP, per nummer (via en kortlivad, saltad
  **hash** – numret lagras aldrig i klartext) samt ett globalt dygnstak som
  budget-skydd. Buckets ligger i databasen (serverless-säkert) och utgångna
  poster städas bort löpande, så hasharna auto-raderas efter fönstret.
- **Endast kurerad pool skickas (även i Fas 2):** bara godkända ursäkter kan
  skickas som SMS – ingen fri text lämnar systemet. Användarinskickad fri text
  hamnar enbart i modereringskön och visas/skickas aldrig förrän den godkänts.
- **Missbruk kraftigt reducerat:** det valda namnet visas bara för den som själv
  sparat kontakten, så ingen trovärdig imitation kan skapas mot ett offer.
- **OTP-verifiering** är medvetet uppskjutet (ej i POC). Eftersom fri text aldrig
  skickas som SMS (förslag går bara till modereringskön) finns ingen ny
  sänd-vektor i Fas 2 – OTP kan fortsatt vänta. Arkitekturen är ändå byggd så att
  det kan slås på senare.

## Datamodell

`Excuse`: `id`, `text`, `source` (`seed` | `user` | `admin`), `status`
(`approved` | `pending` | `rejected` | `disabled`), `sentCount`, `createdAt`.

`sentCount` räknas upp vid varje sändning och driver popularitetssorteringen och
räknaren i flödet. Statusfältet styr synligheten: bara `approved` visas/skickas.
`pending`/`rejected` är modereringskön, och `disabled` är en ursäkt som admin
slagit av (dold men inte borttagen).

## Fas 2 (byggt)

- **Popularitet.** `/api/excuses` returnerar `sentCount` och sorterar de mest
  skickade ursäkterna först. Flödet visar en räknare ("Skickad 1 248 gånger").
  "Slumpa"-knappen ger variation så att även mindre använda ursäkter dyker upp.
- **Eget förslag.** Användaren kan skriva ett förslag på en ursäkt. Det
  **skickas aldrig som SMS** – det sparas som `source="user"`, `status="pending"`
  och hamnar i modereringskön. Inskickade förslag visas aldrig för andra förrän
  de godkänts. (Avviker medvetet från brief avsnitt 4: fri text lämnar aldrig
  systemet som SMS, vilket stänger den värsta missbruks-/GDPR-vektorn och låter
  OTP fortsatt vara uppskjutet.)
- **Admin-vy (`/admin`).** Lösenordsskyddad (HTTP Basic Auth via
  `src/middleware.ts`, med `ADMIN_USER`/`ADMIN_PASSWORD`). En samlad
  hanteringsvy via `/api/admin/excuses` (GET alla | POST skapa | PATCH status |
  DELETE): moderera väntande förslag (Godkänn/Avslå), slå på/av valfri ursäkt
  (`approved`↔`disabled`), se hur många gånger varje ursäkt använts, lägga till
  nya och ta bort.

### Admin

Gå till `/admin` och logga in med `ADMIN_USER` / `ADMIN_PASSWORD`. Saknas de i
miljön är vyn helt låst (fail closed). Bygg om till riktig auth senare utan att
röra resten av appen – allt skydd sitter i middleware framför `/admin` och
`/api/admin`.
