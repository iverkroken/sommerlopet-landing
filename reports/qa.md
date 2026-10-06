# QA – Sommerløpet 2027

Gjennomført 6. oktober 2026 mot lokalt produksjonsbuild. Én React-applikasjon; ingen enhetsspesifikke versjoner.

## Automatisert kontroll

- `npm run lint` og `npm run build`: bestått.
- `npm run test:unit`: fem tester bestått. Shuffle kontrolleres med 100 seeds × 100 runder, uten gjentakelser innen runden eller ved rundeskifte. Null/ett/seks bilder gir deterministisk forhåndsrendring.
- `npm run test:e2e`: 140 bestått, fire tilsiktet utelatt. Full bredde-sweep og native zoom kjøres kun i Chromium; øvrig matrise kjøres i Chromium, Firefox og WebKit.
- `node scripts/verify-development.mjs`: React StrictMode, seks ulike bilder i første runde, deterministisk første bilde og ingen hydrerings-/konsollfeil.
- `node scripts/verify-network.mjs`: kald cache ved 390 px/DPR 2 og 1440 px/DPR 1. Første bilde og bare ett kommende bilde lastes. Pause starter ingen nye bildenedlastinger. Se [målingene](network.json).

Viewport-matrisen:

```text
320×568    360×800    375×667    390×844    393×852    412×915
430×932    600×960    768×1024   820×1180   1024×768   1024×1366
1280×720   1366×768   1440×900   1536×864   1920×1080  2560×1440
568×320    800×360    844×390    960×600    1180×820
```

Hver størrelse kontrolleres med normal og 200 % tekst: dokumentbredde, tekstgrenser, hero-innhold, header-overlapp, like distansehøyder og fullstendig fylte gridrader. Chromium testes dessuten fra 320 til 1920 px i steg på 4 px, begge veier, ved 360 og 900 px høyde (1604 resize-steg). Faktiske containergrenser kontrolleres ved −1/0/+1 px. DPR 1/2/3 testes i alle motorer.

Native Chromium-zoom på 200 % og 400 % gir henholdsvis 640 og 320 CSS px fra 1280 px. Testen verifiserer faktisk `innerWidth`, DPR og at visual viewport scale fortsatt er 1; dette er nettleserzoom, ikke CSS-forstørrelse eller pinch-emulering. Alle tre CTA-er kan nås og beholder riktig destinasjon.

## Visuell gjennomgang og brukerreise

`npm run qa:capture` lagrer en helside og seks hero-utsnitt ved hver av de 23 størrelsene i `artifacts/qa/`. Bildene dekodes før opptak; autoplay pauses for å kontrollere det fullt synlige bildet. Hero-kontaktark og helsider er gjennomgått visuelt.

1. **Ankomst / hero – god:** Arrangement, år, dato, sted og tydelig påmelding vises tidlig. Headerens mindre, omrissede CTA konkurrerer ikke visuelt med hero-knappen. Tekst og handling står stabilt gjennom alle seks bilder. [Mobil](../artifacts/qa/390x844-page.png), [desktop](../artifacts/qa/1440x900-page.png).
2. **Interesse / distanser – god:** Korte avsnitt og tydelig typografihierarki. Én kolonne ved den minste bredden, bevisst 2+2+1 på mobil, 3+2 på nettbrett og fem på brede flater. Ingen tilfeldige tomme rader eller ulik elementhøyde. [Nettbrett](../artifacts/qa/768x1024-page.png).
3. **Påmelding – god:** Samme handling i header, hero og avslutning; lenkene går direkte til OnReg 7837. Destinasjonen forklares ved hovedknappene. Tastatur og JS-fri navigasjon er testet med en avgrenset testrespons ved destinasjonen; ingen ekte påmelding er sendt.

Rettet under kontrollen: overskriftsbredde ved 320 px med 200 % tekst, distansetypografi i en smal container på bred skjerm, grid-kantlinjer ved overgang til 3+2 og vertikale fokuspunkter som beskar personer for høyt på brede heroer. Kodegjennomgangen avdekket også at resize etter forhåndslasting kunne godkjenne feil bildekilde. Resize/DPR-endring validerer nå kandidaten på nytt før bytte; feil på den større varianten er regresjonstestet i alle tre motorer. [Alle seks ved 320 px](../artifacts/qa/320x568-heroes.png), [alle seks ved 2560 px](../artifacts/qa/2560x1440-heroes.png).

## Tilgjengelighet og motion

- axe-kontroller mot WCAG A/AA i alle tre motorer, også pausekontroll på mobil med helt hvitt testbilde bak overlayen: ingen rapporterte brudd.
- Kontrollert overlay gir kontrast uavhengig av foto. Hvit hero-tekst har minst ca. 9,9:1 over den lyseste tillatte tekstbakgrunnen; peach-tittelen ca. 6,1:1. Primær CTA-tekst har minst ca. 5,3:1 gjennom normal/hover/active.
- Semantiske seksjoner, én h1, skip-lenke, native lenker/knapp og synlig fokus. Ingen sticky elementer skjuler fokus. CTA-er minst 48 px høye; pauseknappen 44 × 44 px.
- Full Tab-rekkefølge verifisert i Chromium/Firefox. Denne Windows-utgaven av Playwright WebKit hopper over lenker ved Tab; der kontrolleres eksplisitt fokus og Enter/Space. Dette er en begrensning ved testmiljøet, ikke dokumentasjon av full tastaturnavigasjon i Safari. Se også [Playwrights omtale av WebKit Tab-innstillinger](https://github.com/microsoft/playwright/issues/2114).
- Scroll-reveals er engangs-animasjoner med 100 ms stagger; tastaturfokus gjør CTA synlig umiddelbart. Uten IntersectionObserver er innholdet synlig. `prefers-reduced-motion` gir statisk foto, ingen kontroll og ingen reveals; endringer av preferansen under bruk er testet.
- [WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) begrunner at autoplay har en diskret pause/start-kontroll. Ingen live-region annonserer dekorative bildeskift.

## Ytelse og avgrensninger

[Produksjonsrapporten](assets.md) oppgir alle filer, alle 24 WebP-varianter og initial sidestørrelse. Omtrent 247 KiB ved 390 px/DPR 2 og 270 KiB ved 1440 px/DPR 1 med gzip, inkludert første bilde. Neste bilde rapporteres separat. Originale PNG-filer sendes ikke til nettleseren.

De tre målbildene er 600 px brede og blir synlig mykere på desktop/ultrawide. Genereringen oppskalerer dem ikke; større originaler er nødvendig for bedre skarphet. Bildene er dekorative og ingen nødvendig informasjon ligger bare i dem.

Ikke utført: fysisk iOS-/Android-/foldable-test, Snapchats innebygde nettleser, manuell skjermlesertest eller full WCAG-sertifisering. Det er ikke mulig å teste bokstavelig alle bredder; kombinasjonen av fluid arkitektur, tett resize-sweep, zoom, tre motorer og visuell matrise dekker de spesifiserte representative forholdene. Offisiell logo, favicon og publiseringsmetadata er fortsatt TODO i README/config.
