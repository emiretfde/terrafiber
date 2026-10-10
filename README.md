# Terra Fiber GmbH — Redizajn v3 (DEMO)

Javno dostupna testna prezentacija: https://terrafiber.pages.dev/

Izvorni kod: https://github.com/emiretfde/terrafiber

## Fajlovi
- `index.html` — staticki web demo (HTML, CSS, JS)
- `_headers` — noindex i osnovna sigurnosna zaglavlja
- `IZVORI.md` — izvorni javni podaci i ogranicenja

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
