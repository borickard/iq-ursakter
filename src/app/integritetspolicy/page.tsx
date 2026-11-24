import type { Metadata } from "next";
import Link from "next/link";
import { COPY } from "@/lib/copy";

export const metadata: Metadata = {
  title: `Integritetspolicy – ${COPY.brand.name}`,
  description: "Så behandlar Ursäkten personuppgifter.",
};

/**
 * Integritetspolicy (GDPR). UTKAST – ska granskas av IQ:s jurist/dataskyddsombud
 * innan publik lansering. Fält inom [hakparentes] behöver fyllas i (org.nr,
 * kontakt-e-post, ev. dataskyddsombud). Texten speglar hur appen faktiskt
 * fungerar: numret lagras aldrig, cookie-fri statistik, biträden inom EU/EES.
 */
export default function IntegritetspolicyPage() {
  return (
    <main className="flex-1 py-10 lg:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="text-sm text-muted underline underline-offset-2 hover:text-text"
        >
          ← Till startsidan
        </Link>

        <h1 className="mt-6 font-display text-3xl font-normal lg:text-4xl">
          Integritetspolicy
        </h1>
        <p className="mt-2 text-sm text-muted">Senast uppdaterad: 24 november 2026</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-text">
          <section className="space-y-3">
            <p>
              {COPY.brand.name} är en tjänst från IQ. Din integritet är viktig för
              oss, och vi har byggt tjänsten för att samla in så lite som möjligt.
              Den här policyn beskriver hur vi behandlar personuppgifter när du
              använder ursäkten.se.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">
              Personuppgiftsansvarig
            </h2>
            <p>
              IQ-Initiativet AB, org.nr 556680-9892, med postadress Box 3653,
              103 59 Stockholm, är personuppgiftsansvarig för behandlingen av dina
              personuppgifter.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">
              Vilka uppgifter vi behandlar – och varför
            </h2>
            <p>
              <strong className="font-semibold">Ditt mobilnummer.</strong> När du
              ber oss skicka en ursäkt anger du ditt mobilnummer. Vi använder det{" "}
              <strong className="font-semibold">enbart</strong> för att skicka det
              sms du begärt.{" "}
              <strong className="font-semibold">Vi sparar aldrig ditt nummer</strong>{" "}
              – det tas emot, används för att skicka meddelandet och försvinner
              sedan.
            </p>
            <p>
              <strong className="font-semibold">Teknisk spärr mot missbruk.</strong>{" "}
              För att förhindra spam och överbelastning sparar vi under en kort tid
              en krypterad, oläsbar kod (en saltad hash) av numret och din
              IP-adress. Det går inte att läsa ut numret ur den, och den raderas
              automatiskt.
            </p>
            <p>
              <strong className="font-semibold">Anonym statistik.</strong> Vi mäter
              besök med cookie-fria verktyg (Plausible och Vercel Analytics) som
              inte sparar några personuppgifter och inte spårar dig mellan
              webbplatser.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">Laglig grund</h2>
            <p>
              Vi behandlar dina personuppgifter med stöd av att det är nödvändigt
              för att utföra en uppgift av allmänt intresse och för att fullgöra vår
              rättsliga förpliktelse enligt avtalet mellan Systembolaget Aktiebolag
              och staten (”avtalet med staten”). Det allmänna intresset utgörs av att
              lämna information till allmänheten om de risker som är förenade med
              konsumtion av alkoholdrycker. Ursäkten är en del av detta uppdrag.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">
              Vilka vi delar uppgifter med
            </h2>
            <p>
              För att leverera tjänsten använder vi följande leverantörer:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="font-semibold">Vercel</strong> – drift och
                hosting av webbplatsen (personuppgiftsbiträde).
              </li>
              <li>
                <strong className="font-semibold">Supabase</strong> – databas som
                lagrar ursäkterna och de tillfälliga spärr-koderna
                (personuppgiftsbiträde).
              </li>
              <li>
                <strong className="font-semibold">46elks</strong> – skickar själva
                sms:et. 46elks är en registrerad teleoperatör och är i den rollen
                självständigt personuppgiftsansvarig för förmedlingen av sms:et –
                inte vårt personuppgiftsbiträde. Vi dokumenterar 46elks som en
                mottagare i vår interna förteckning.
              </li>
            </ul>
            <p>
              Med våra personuppgiftsbiträden (Vercel och Supabase) har vi
              personuppgiftsbiträdesavtal som reglerar hur de får behandla
              uppgifterna. Vi och våra leverantörer behandlar som huvudregel endast
              dina personuppgifter inom EU/EES. I de fall personuppgifter behandlas
              utanför EU/EES föreligger antingen ett beslut från EU-kommissionen om
              adekvat skyddsnivå eller lämpliga skyddsåtgärder, i form av
              standardavtalsklausuler, som säkerställer att dina rättigheter skyddas.
              Vi säljer aldrig dina uppgifter vidare.
            </p>
            <p className="text-muted">
              Observera att din mobiloperatör och vår sms-leverantör enligt lag kan
              behöva spara trafikuppgifter, inklusive numret, i upp till 60 dagar.
              Det är en lagstadgad skyldighet som ligger utanför vår kontroll.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">Hur länge vi sparar</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Mobilnummer: sparas inte av oss.</li>
              <li>Spärr-kod (hash) och IP-adress: en kort stund, raderas automatiskt.</li>
              <li>Statistik: anonym och aggregerad, kan inte kopplas till dig.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">Cookies</h2>
            <p>
              Vi använder inga spårnings- eller marknadsföringscookies. Därför har
              vi heller ingen cookie-banner.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">Dina rättigheter</h2>
            <p>
              I enlighet med gällande dataskyddslagstiftning har du rätt att få
              tillgång till information om vilka personuppgifter vi behandlar om dig
              (registerutdrag) samt rätt att begära rättelse. Under vissa
              förutsättningar har du även rätt att begära radering eller begränsning,
              invända mot vår behandling, samt rätt till dataportabilitet. Eftersom
              vi inte sparar ditt nummer finns det normalt inget lagrat hos oss att
              lämna ut eller radera.
            </p>
            <p>
              Du har också rätt att lämna klagomål till tillsynsmyndigheten
              Integritetsskyddsmyndigheten (IMY),{" "}
              <a
                href="https://www.imy.se"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                imy.se
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">Kontakta oss</h2>
            <p>
              Vill du utöva dina rättigheter eller har du frågor om hur vi behandlar
              dina personuppgifter är du välkommen att kontakta oss på{" "}
              <a
                href="mailto:info@iq.se"
                className="underline underline-offset-2"
              >
                info@iq.se
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-normal">Ändringar</h2>
            <p>
              Vi kan uppdatera den här policyn. Den senaste versionen finns alltid
              på den här sidan, med datum för senaste ändring högst upp.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <Link
            href="/"
            className="text-sm text-muted underline underline-offset-2 hover:text-text"
          >
            ← Till startsidan
          </Link>
        </div>
      </div>
    </main>
  );
}
