# Terra Fiber GmbH — Redizajn v7 (DEMO)

Javno dostupna testna prezentacija: https://terrafiber.pages.dev/

Izvorni kod: https://github.com/emiretfde/terrafiber

## Fajlovi
- `index.html` — staticki web demo (HTML, CSS, JS)
- `_headers` — noindex i osnovna sigurnosna zaglavlja
- `IZVORI.md` — izvorni javni podaci i ogranicenja


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
