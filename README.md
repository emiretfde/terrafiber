# terraFIBER — Redesign-Studie · Konzept 09

## Zwei Homepage-Varianten: Konzept A / Konzept B (11.10.2026)

**Stabile Sicherung:** Git-Branch `stable-v9-de-nl-en` (unveränderter Ausgangszustand mit DE, EN und NL, WebP-Fotos und FTTH-Kartenhero).

**Konzept A — klassische FTTH-Karte (Standard):**
- DE: `/`
- EN: `/en/`
- NL: `/nl/`

**Konzept B — immersive Netzgrafik nach dem Prinzip der GeoExpert-Startseite:**
- DE: `/concept-b/`
- EN: `/concept-b/en/`
- NL: `/concept-b/nl/`

Eine kleine, dreisprachige **Konzept A / Konzept B**-Leiste oberhalb des Bürgerservice schaltet zwischen den Designs. Die Wahl bleibt bei Sprachwechsel erhalten; die darunter liegenden Leistungs-, Projekt-, Bürgerservice-, Kontakt- und Karrierebereiche sind in beiden Konzepten identisch.

Die neue Hero-Animation wurde unabhängig umgesetzt (Canvas2D-Punktfeld, ruhige Konturlinien, diskretes FTTH-Signal und leichte Mausreaktion). Keine GeoExpert-Assets oder fremden Skripte wurden übernommen. `assets/concept-b.css` / `assets/concept-b.js`; bei Reduced Motion bleibt eine statische Grafik sichtbar und außerhalb des Viewports bzw. im Hintergrund wird die Animation pausiert. `noindex` ist weiterhin aktiv.

Browser-Test: 1440px und 375px, alle drei Sprachen, A/B-Wechsel, Canvas sichtbar, keine horizontale Überbreite. Screenshots unter `docs/screenshots/terraFIBER-conceptB-{desktop,mobile}.png`.


Javno dostupna testna prezentacija: https://terrafiber.pages.dev/

Izvorni kod: https://github.com/emiretfde/terrafiber

## Fajlovi
- `index.html` — staticki web demo (HTML, CSS, JS)
- `_headers` — noindex i osnovna sigurnosna zaglavlja
- `IZVORI.md` — izvorni javni podaci i ogranicenja


## Fotoauswahl v9.1 (11.10.2026)

Die sieben bereits lokal vorhandenen terraFIBER-Fotos sind ohne Wiederholungen auf jeder Sprachversion platziert:
- Über terraFIBER: `AVA-00024-14` — zwei Mitarbeitende bei der Bauabstimmung
- Breites Baustellenmotiv: `AVA-00131-69` — Wiederherstellung von Pflasterflächen
- Galerie: `AVA-05532-215` (Radlader), `AVA-05573-235` (Netzverteiler), `AVA-05521-211` (Kabel-/Rohrtrommeln), `AVA-05398-164` (Pflasterarbeiten)
- Referenzbereich: `AVA-05497-198` — Erdarbeiten, nicht Aßlar-Berghausen zugeordnet
- Bildmotive, Alt-Texte, Zuschnitte und Bildunterschriften sind auf DE und EN synchronisiert.
- Hero-Animation, Formular und andere Abschnitte wurden nicht verändert.

## Nederlandse versie / Dutch version (11.10.2026)

- Nederlandse site: https://terrafiber.pages.dev/nl/ (`nl/index.html`).
- De taalkiezer schakelt tussen DE, NL en EN op alle drie pagina's.
- De volledige inhoud is vertaald: diensten, FTTH-projecten, bewonersservice, vacatures, FAQ en contactformulier.
- Het huidige ontwerp, de zeven lokale WebP-foto's, de SVG-animatie en de configuratie voor `noindex` zijn behouden.
- Gegevens, referenties en ontbrekende informatie blijven inhoudelijk gelijk aan de DE-/EN-versies.
- De formulierverzending blijft uitgeschakeld totdat een veilige backend beschikbaar is.
- Juridische links verwijzen vooralsnog naar de Duitstalige bedrijfswebsite; tekst en vertaling moeten vóór productie worden goedgekeurd.
- Desktop (1440 px) en mobiel (375 px) gecontroleerd in Chromium: geen horizontaal scrollen, alle foto's laden en geen JavaScript-fouten.
- Test-screenshots: `docs/screenshots/terraFIBER-nl-desktop.png` en `docs/screenshots/terraFIBER-nl-mobile.png`.

## English version (11.10.2026)

- German homepage: https://terrafiber.pages.dev/ (`index.html`).
- Full English version: https://terrafiber.pages.dev/en/ (`en/index.html`).
- The top language switch now links DE and EN; NL remains disabled until a Dutch translation is approved.
- All sections, project quantities, placeholders, job postings, resident-service contact details, form fields and consent notice are translated without changing facts.
- Same v9 design, IBM Plex Sans, hero SVG, `hero-map.js`, contact form guard and noindex; local font and script URLs use root-relative paths.
- Existing legal documents currently link to the German public site. Before publishing commercially, English legal information and company-approved English copy should be reviewed. Form submission is still disabled pending a proper backend.

## Konzept 09 (10.10.2026)

Visuelle Überarbeitung für einen sachlichen Bau- und Infrastrukturauftritt, angelehnt an klare Informationsarchitektur bei LEONHARD WEISS, Glaspoort und Circet — ohne deren Gestaltung zu kopieren.

- Hero-Siedlungskarte und deren `assets/hero-map.js` / `assets/hero-map.css` bleiben unangetastet; nur der linke Titel und Untertitel werden sachlicher und einfarbig.
- Direkt nach dem Hero führt eine zusätzliche helle Bürgerservice-Schnellleiste zu Termin, Problemmeldung und FAQ.
- Alle Bereiche unter dem Hero in Weiß bzw. #F3F5F8 mit dunkelblauem Text und einer sachlichen Akzentfarbe #0759a5; Footer unverändert dunkel.
- IBM Plex Sans (400/500/600) wird lokal aus `assets/fonts/` ausgeliefert; SIL OFL liegt bei.
- Leistungen als offene zweispaltige Liste mit einheitlichen Linienicons, statt vier dekorativer Kacheln.
- „Über terraFIBER“: großes Teamfoto links, präziser Text rechts; Foto-Band über die volle Breite nach den Leistungen.
- Galerie als horizontaler Streifen mit fünf Bildern und konkreten Arbeitsbezeichnungen.
- Aßlar-Berghausen als Referenzprojekt mit ausgewiesenen *Planwerten des Gesamtprojekts* und einem nicht dem Projekt zugeordneten Beispielfoto.
- Qualität als Text-/Nachweisliste und reservierter Bereich für Auftraggeber-/Zertifikatslogos.
- Bürgerservice, Stellenangebote, alle vorhandenen Daten und das noch nicht aktive Kontaktformular sind erhalten.
- Nur Bürgerservice-Aktionen und Jobangebote bleiben als flache gerahmte Karten.
- Alle JavaScript-Animationen außerhalb der SVG-Karte wurden entfernt bzw. per CSS ausgeschaltet.

**Fotostatus (11.10.2026):** Sieben Originalmotive der bestehenden Unternehmensgalerie wurden erfolgreich abgerufen, in 14 lokale WebP-Dateien (800/1600 px) umgewandelt und in **DE sowie EN** integriert. Die Beschriftungen wurden anhand der tatsächlichen Bildmotive korrigiert. Kontaktformular-Backend, Bildrechte-/Inhaltsfreigabe und unbekannte Kennzahlen/Nachweise sind weiterhin offen.

## Konzept 08 (10.10.2026)

- Bürgerservice-Leiste: +49 5973 8270070, Servicezeit Mo–Fr 08:00–17:00, DE / NL / EN (Übersetzungen fehlen noch).
- Bürgerservice-Sektion mit vier Aktionen, drei FAQ, Netzbetreiber-Hinweis.
- Fünf Ausbauschritte direkt nach dem Hero; vier Unternehmenskennzahlen inkl. [X] Hausanschlüsse.
- SVG-Animation aus v7 **unverändert**; nur mobile Overlay-Abstände und Länderzeile überarbeitet.
- Über-uns-Foto als `img` mit deutscher Alt-Beschreibung; Galerie 2+3 ohne leere Rasterspalte.
- Qualität: Präqualifikation, Arbeitsschutz, Dokumentation, eigene Technik; inseyet-Referenz.
- Karriere: beide vorhandenen Stellenanzeigen, Benefit-Platzhalter, 2-Minuten-Bewerbung-CTA.
- Echte HTML-Formularfelder statt `mailto`, aber **Versand deaktiviert bis zum sicheren Backend**. Keine personenbezogenen Formulardaten werden derzeit übermittelt.
- Footer mit Adresse, Telefon, Öffnungszeiten, Impressum/Datenschutz und Cookie-Einstellungen.
- **Historischer Stand v8:** Bilder waren damals noch extern eingebunden. Inzwischen (11.10.2026) lokal nach WebP (800/1600) migriert; siehe `BILDER_IMPORT_V8.md`.
- Weiter offene Freigaben: [X] Hausanschlüsse, [Nachweise], [Leistungsumfang bestätigen], [Anzahl Kolonnen, Maschinen], [Vorteil 1–3], Firmenprofil PDF, Hinweisgebersystem-URL, NL/EN und Formular-Backend mit Datenschutzerklärung.

## Promjene v7 (10.10.2026)

- Uklonjen veliki svjetlosni impuls iz v5; glavni kabl sada prenosi niz malih, umjereno osvijetljenih cestica.
- Na tri fiksna cvora tok se odvaja na tri stvarne SVG grane koje zavrsavaju u terminalima nacrtanih kuca.
- Prikljucci u kucama kratko zasvijetle **tek pri dolasku** signala (oko 0,36 s), pa se vrate u osnovno stanje.
- Za putanje se koristi izvorna SVG geometrija; sve kucice i cvorovi su nepomicni.
- Korisnicima s ukljucenim `prefers-reduced-motion` animacija se ne pokrece.
- Samo je demo; slike sa starog sajta jos se ucitavaju sa `terrafiber.de`.

## Promjene v5 (10.10.2026)

- Umjesto pulsiranja svih elemenata, **jedan svjetlosni impuls** stvarno prati SVG krivinu kabla (`getPointAtLength`).
- Tri fiksne tacke na kablu osvijetle se tacno kada ih impuls prode; njihove koordinate se ne animiraju.
- Period: 6,9 s putovanja + 1,2 s pauze.
- Uskladene izometrijske kuce i rasterecen natpis HAUSANSCHLUSS ostaju iz v4.
- `prefers-reduced-motion` iskljucuje pokretnu animaciju.
- Vanjske fotografije i dalje se privremeno ucitavaju sa starog `terrafiber.de`.

## Promjene v3
- Suptilno CSS/SVG svjetlucanje optickog vlakna i cvorova na naslovnoj ilustraciji
- Odrzava postavku `prefers-reduced-motion` za korisnike kojima animacija smeta
- Prikaz javno dostupnih fotografija iz postojece Terra Fiber galerije u odjeljcima Unternehmen, Einblicke, Projekte
- Fotografije se u ovoj fazi **ucitavaju sa terrafiber.de**; nijesu preuzete i smjestene u ovaj repozitorijum. Ako stari domen bude nedostupan, nece se prikazati; prije finalne verzije preuzeti originalne datoteke uz odobrenje firme, optimizovati i hostovati lokalno.
- Fotografije u sekciji projekata nijesu potvrdene kao prikaz konkretnog Aßlar-Berghausen projekta.

## Automatika
Promjena u `main` grani automatski pokrece novi Cloudflare Pages deployment. Za ovaj HTML demo ne treba build komanda; output directory je `.`.

## Vazno
- Demo, nije odobrena korporativna publikacija; pravni tekstovi i detalji o partnerima/projektima cekaju potvrdu.
- Repozitorijum je trenutno **javan (Public)**; nikad ovdje ne smjestati lozinke, privatne dokumente ili licne podatke zaposlenih.
- `noindex` nije kontrola pristupa. Cloudflare preview adresa je javna.
- Kontakt forma trenutno otvara korisnikovu e-mail aplikaciju (`mailto:`), nema backend-a.
- Ne mijenjati postojeci domen `terrafiber.de` niti njegov DNS.
