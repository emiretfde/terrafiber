# Terra Fiber GmbH — Redizajn v2 (DEMO)

Testna staticka web prezentacija. Kod se cuva u ovom privatnom GitHub repozitorijumu, a nakon povezivanja sa Cloudflare Pages svaka izmjena na `main` pokrece novi deployment.

## Fajlovi
- `index.html` — kompletna testna stranica (HTML, CSS, JS)
- `_headers` — bezbjednosna i noindex zaglavlja za Cloudflare Pages
- `IZVORI.md` — izvori i ogranicenja u vezi sa sadrzajem

## Postavljanje na Cloudflare Pages
1. Workers & Pages > Create > Pages > Connect to Git.
2. Autorizuj GitHub pristup repo-u `emiretfde/terrafiber`.
3. Production branch: `main`; Framework preset: `None`; Build command: ostavi prazno; Output directory: `/` (korijen projekta; ako UI zahtijeva build output folder, koristi `.`).
4. Deploy. Nakon povezivanja, izmjene na `main` izazivaju novi deploy.

## Napomene
- Ovo je DEMO, nije produkcioni sajt. Ne dirati `terrafiber.de` ili poslovni DNS.
- Repo je privatan; Cloudflare preview URL je bez dodatne kontrole pristupa javno dostupan. `noindex` nije autentikacija.
- Kontakt forma koristi `mailto:`; nema backend slanja.
- Logo i grafike su privremene, a podaci i reference zahtijevaju odobrenje firme.
- Za produkciju su potrebni stvarne fotografije, potvrde sadrzaja, zakonska revizija i funkcionalna forma.
