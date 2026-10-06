# Sommerløpet 2027

Mobilprioritert React + Vite + JavaScript-kampanjeside for **Sparebanken Norge Sommerløpet**, 5. juni 2027 i Kristiansand.

Besøksreisen er Snapchat → landingsside → **Meld deg på** → [OnReg 7837](https://secure.onreg.com/onreg2/front/step1.php?id=7837). Praktisk informasjon ligger på hovednettsiden; registrering skjer hos OnReg. Ingen analytics, cookies, pixels, eksterne fonter eller tredjepartsskript.

## Kjør lokalt

Node.js 22.12 eller nyere og npm.

```sh
npm install
npm run dev
```

Åpne adressen Vite viser, normalt http://127.0.0.1:5173.

```sh
npm run lint
npm run build
npm run preview
```

`build` genererer WebP-bilder, bygger applikasjonen, forhåndsrendrer komplett HTML og skriver størrelsesrapporten. Hele `dist/` kan leveres fra et statisk webhotell ved domenets rot. CSS, tekst, første bilde og påmeldingslenker fungerer uten JavaScript. Publisering er ikke utført.

## Struktur og design

- `src/App.jsx`: semantiske seksjoner, innhold, enkel header og avsluttende CTA.
- `src/styles.css`: tokens for farger, fluid typografi, spacing, bredder, radius, skygger og motion.
- `src/config/event.js`: arrangementsfakta, distanser, lenker og valgfri offisiell logo.
- `src/config/hero-images.js`: seks bilder, individuelle fokuspunkter og byttetider.
- `src/hooks/`: bildebytte og ett felles IntersectionObserver for scroll-reveals.
- `src/lib/shuffle.js`: ren, testbar shuffle-kø.
- `scripts/`: bildebehandling, forhåndsrendring, rapportering og QA-verktøy.
- `tests/`: shuffle-, prerender-, tilgjengelighets-, motion-, zoom- og responsivitetstester.

Én responsiv applikasjon med begrenset innholdsbredde, flytende typografi og innholdsstyrt hero-høyde. Distansekomponenten reagerer på sin egen bredde: én kolonne, 2+2+1 med fullbredde siste element, 3+2, eller fem på rad. Grensene bruker `em`, slik at større tekst også gir en romsligere komposisjon. Ingen global skjuling av horisontal overflow, sticky overlegg eller hamburger-meny.

## Bilder og shuffle

Alle seks leverte PNG-originaler ligger urørt i `src/images/`. `scripts/hero-sources.mjs` kobler filnavn til stabile ID-er. `npm run images` genererer 24 WebP-varianter i `public/images/hero/` og et manifest i `src/generated/`. Ingen fil oppskaleres. Generering kjøres også automatisk før `dev` og `build`.

Endre `focalPoints` i `src/config/hero-images.js` for mobil, desktop og landscape. Alle bildene støtter budskapet dekorativt og har tom alt-tekst; viktig informasjon finnes i HTML. Valgfri `mobileSrcSet` støttes når et eget mobilutsnitt blir tilgjengelig.

Første bilde er alltid `open` både i HTML og ved første klientrender. Etter hydrering shuffles resten av første runde. Hver senere runde inneholder alle seks én gang, og første bilde i en ny runde kan ikke være det siste fra forrige runde. Pause og skjult fane forbruker ikke køen.

Normalt bildebytte: 6 sekunder, 800 ms crossfade. Første bilde prioriteres. Etter at siden er lastet og gjeldende bilde er dekodet, lastes bare neste nødvendige bilde. Neste bilde vises først etter vellykket dekoding. Feilende bilder utelukkes for resten av økten; når ingen andre fungerende bilder gjenstår, stoppes byttingen. Null bilder gir mørk bakgrunn med samme innhold; ett bilde gir statisk hero.

Autoplay trenger en stoppmulighet etter [WCAG 2.2, 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). Derfor er kontrollen beholdt som en diskret 44 × 44 px ikonknapp med tilgjengelig navn, synlig fokus og tastaturstøtte. `prefers-reduced-motion` gir statisk hero uten pausekontroll eller scroll-animasjoner, også når innstillingen endres mens siden er åpen.

## Motion

Overskrifter bruker subtil fade, 12 px vertikal bevegelse og scale .99. Brødtekst er roligere. Distanser har 100 ms stagger; CTA har en kort reveal og små hover/active-bevegelser. Bare opacity og transform animeres. Innhold er synlig som standard, også uten JavaScript eller IntersectionObserver. Allerede synlig innhold animeres ikke ved oppstart. Reveals skjer én gang, og tastaturfokus stopper eventuell reveal umiddelbart.

## Tester og rapporter

```sh
npx playwright install chromium firefox webkit
npm run build
npm test
node scripts/verify-development.mjs
```

Nettlesertestene starter egen preview-server på port 4173. Stopp eventuell manuell preview på denne porten først.

Testmatrisen dekker 23 viewport-størrelser fra 320 til 2560 px, portrait/landscape, 200 % tekst, DPR 1/2/3, alle seks bilder, pause/play, redusert motion, bildenedlastinger, bildefeil, keyboard og axe A/AA. Chromium kontrollerer også bredder 320–1920 i steg på 4 px begge veier ved to høyder, containergrenser ±1 px og ekte nettleserzoom på 200/400 %. Windows-versjonen av Playwright WebKit har begrenset Tab-navigasjon til lenker; full Tab-rekkefølge testes i Chromium/Firefox, mens WebKit også testes med eksplisitt fokus og tastaturaktivering.

- [Størrelse på hver produksjonsfil og hvert bilde](reports/assets.md), også som [JSON](reports/assets.json).
- [QA-resultater og begrensninger](reports/qa.md).
- [Målte nettverksforespørsler](reports/network.json).

For å gjenta visuell QA, start preview i én terminal og kjør verktøyene i en annen:

```sh
npm run preview -- --port 4174 --strictPort
```

```sh
npm run qa:capture
node scripts/verify-network.mjs
```

Skjermbilder av hele siden og alle seks hero-varianter ved hver teststørrelse lagres i `artifacts/qa/` (ignorert av Git). `QA_URL` kan angi en annen lokal testadresse. Størrelsesrapporten kan oppdateres separat med `npm run report:assets` etter et build.

## TODO før publisering

- Offisiell logo: legg lokal fil i `public/` og sett `event.logoSrc`. Tekstidentitet brukes foreløpig.
- Bytt generisk favicon, og legg inn faktisk canonical URL, `og:url` og godkjent delingsbilde i `index.html`.
- Skaff større originaler hvis skarpere desktop-bilder ønskes: målbildene er bare 600 px brede. Åpningsbildet er 1024 px og barnebildet 768 px. De brukes uten kunstig oppskalering i bildegenereringen.
- Gjennomfør fysisk enhetstest i Snapchats innebygde nettleser og med skjermleser før annonsering. Automatiserte kontroller er ikke en full WCAG-sertifisering.

Bekreftede innholdskilder: [sommerlopet.no](https://sommerlopet.no/) og [OnReg 2027](https://secure.onreg.com/onreg2/front/step1.php?id=7837), kontrollert 6. oktober 2026. Pris, starttider, kapasitet og påmeldingsfrister er utelatt.
