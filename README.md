# Ursäkten

En mobil-först webbsajt där du snabbt genererar en trovärdig ursäkt och får den
skickad som **SMS till din egen telefon** – så den dyker upp som ett meddelande
från t.ex. _Mamma_ eller _Älskling_. En smidig social "exit"-knapp för när du
fått nog och inte orkar förklara dig.

> **Status: Proof of Concept (Fas 1).** Fokus på ett fungerande, snyggt flöde –
> men med GDPR och missbruksskydd på allvar från start (se nedan).

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
- **Prisma + SQLite** – räcker gott för POC (byt till Postgres vid serverless
  hosting, se nedan).
- **SMS bakom ett internt interface** (`sms.send({ to, from, message })`) så att
  leverantören kan bytas utan att resten av appen påverkas. Inbyggda
  leverantörer: `dummy` (loggar bara) och `elks` (46elks).

### Projektstruktur

```
prisma/
  schema.prisma         # datamodell (Excuse)
  seed.ts               # seedar start-ursäkterna
src/
  app/
    page.tsx            # renderar flödet
    layout.tsx
    api/
      excuses/route.ts  # GET – godkända ursäkter, slumpad ordning
      send/route.ts     # POST – validerar, rate-limitar, skickar SMS
  components/
    Flow.tsx            # hela klient-flödet (steg för steg)
    ui.tsx              # knappar/kort
  lib/
    sms/                # interface + dummy/46elks-leverantörer
    excuses.ts          # seed-listan
    copy.ts             # ALL text (ändra branding/ton här)
    phone.ts            # E.164-validering
    vcard.ts            # vCard-generering (klient)
    rateLimit.ts        # rate limiting (in-memory)
    db.ts               # Prisma-klient
```

## Kom igång lokalt

Kräver Node 18+ (testat på Node 22).

```bash
# 1. Installera beroenden
npm install

# 2. Skapa din lokala miljöfil och fyll i värden
cp .env.example .env.local

# 3. Skapa databasen och seeda ursäkterna
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
| `DATABASE_URL` | SQLite-sökväg (`file:./dev.db`) eller Postgres-URL. |
| `SMS_PROVIDER` | `dummy` (default, skickar inget) eller `elks`. |
| `SMS_FROM_NUMBER` | Plattformens fasta sändningsnummer i E.164. |
| `NEXT_PUBLIC_SMS_FROM_NUMBER` | Samma nummer, exponerat för vCard i klienten. |
| `ELKS_API_USERNAME` / `ELKS_API_PASSWORD` | 46elks-nycklar (krävs bara för `elks`). |
| `RATE_LIMIT_*` | Tak per IP/nummer/dygn + fönsterlängd + hash-salt. |

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
2. **Databas:** Vercels filsystem är inte persistent, så SQLite fungerar inte i
   produktion där. Skapa en gratis Postgres hos
   [Neon](https://neon.tech/) eller [Supabase](https://supabase.com/) och:
   - i `prisma/schema.prisma`, byt `provider = "sqlite"` → `"postgresql"`,
   - sätt `DATABASE_URL` till Postgres-connection-stringen i Vercels env-vars.
3. Lägg in alla env-variabler från `.env.example` i Vercel (Project →
   Settings → Environment Variables). Använd `SMS_PROVIDER="dummy"` tills du
   medvetet vill skicka skarpt.
4. Kör seed mot produktionsdatabasen en gång:
   ```bash
   DATABASE_URL="<din-postgres-url>" npm run db:push
   DATABASE_URL="<din-postgres-url>" npm run db:seed
   ```
5. Deploya. `npm run build` kör `prisma generate` automatiskt.

> Rate limiting är in-memory i POC och delas inte mellan serverless-instanser
> och nollställs vid omstart. Det räcker för POC; inför produktion flyttas det
> till en delad store (t.ex. Upstash Redis) bakom samma interface.

## Risk & GDPR

Tas på allvar redan i Fas 1 (det går inte att bolta på efteråt):

- **Mottagarnumret lagras aldrig.** Det tas emot i `/api/send`, valideras till
  E.164, används för att skicka och försvinner när requesten är klar. Det skrivs
  aldrig till databasen och loggas aldrig i klartext.
- **Inga personuppgifter i URL:er** eller query-parametrar.
- **Rate limiting** redan i Fas 1: per IP, per nummer (via en kortlivad, saltad
  **hash** som bara lever i minnet) samt ett globalt dygnstak som budget-skydd.
- **Endast kurerad pool i Fas 1:** bara godkända ursäkter kan skickas – ingen
  fri text till godtyckligt nummer.
- **Missbruk kraftigt reducerat:** det valda namnet visas bara för den som själv
  sparat kontakten, så ingen trovärdig imitation kan skapas mot ett offer.
- **OTP-verifiering** är medvetet uppskjutet (ej i POC), men arkitekturen är
  byggd så att det kan slås på senare – särskilt inför Fas 2:s fria text.

## Datamodell

`Excuse`: `id`, `text`, `source` (`seed` | `user`), `status`
(`approved` | `pending` | `rejected`), `sentCount`, `createdAt`.

`sentCount` räknas upp vid varje sändning – förbereder Fas 2:s
popularitetssortering (visas inte i Fas 1). Statusfältet förbereder Fas 2:s
modereringskö (`pending`/`rejected` visas aldrig för andra).

## Fas 2 (ej byggt än)

- Popularitetssortering med räknare ("Skickad 1 248 gånger").
- Eget förslag: smsas direkt till användaren själv och hamnar i en
  modereringskö (`pending`).
- Lösenordsskyddad admin-vy för `approve`/`reject`.

Arkitekturen (status-fält, sentCount, SMS-interface, rate limiting) är byggd så
att Fas 2 kan läggas på utan ombyggnad.
