# terraFIBER Bilder — WebP-Integration (Stand 11.10.2026)

## Erledigt

Die sieben Originalmotive aus der bestehenden terraFIBER-Galerie wurden automatisiert vom Firmensite heruntergeladen und verarbeitet.

- 7 Motive × 2 WebP-Größen (800 und 1600 px) = **14 lokale Dateien**.
- Ablage: `assets/images/` im GitHub-Repository.
- **Sowohl `index.html` (DE) als auch `en/index.html` (EN)** verwenden `src`, `srcset`, `sizes`, `width` und `height`.
- Keine externen WordPress-Bild-URLs mehr in den beiden Seiten.
- Bildinhalte wurden visuell geprüft und die Bildunterschriften/Alt-Texte auf Deutsch und Englisch berichtigt.
- Die importierten Original-JPGs wurden nicht mit in das öffentliche Repository übertragen.

## Motive

- AVA-05573-235: terraFIBER-Mitarbeiter am geöffneten Verteilerschrank
- AVA-05532-215: Radlader / Maschinen auf der Baustelle
- AVA-05521-211: Kabel- und Rohrmaterial auf großen Trommeln
- AVA-00131-69: Wiederherstellung einer Pflasterfläche
- AVA-00024-14: Besprechung der Bauunterlagen durch Mitarbeiter
- AVA-05398-164: Pflasterarbeiten nach Tiefbau
- AVA-05497-198: Erdarbeiten mit einem Werkzeug (nicht dem genannten Referenzprojekt zugeordnet)

## Erneutes Erstellen

Der Workflow `.github/workflows/migrate-photos.yml` kann bei Bedarf manuell gestartet werden.

Alternativ: `python -m pip install Pillow` und `python scripts/prepare_images.py --download`.

Das Skript validiert alle sieben JPG-Dateien und aktualisiert **beide** Sprachvarianten nur nach erfolgreicher Vorprüfung.

## Weiter offen vor Produktion

- Zustimmung des Unternehmens zu Bildauswahl, Nutzung und Bildrechten
- Freigabe aller Projektdaten, Firmenangaben, Qualifikationsnachweise und Stellenanzeigen
- Firmenprofil-PDF und Hinweisgebersystem-Link
- DSGVO-konformes Backend für das Kontaktformular
- Prüfung von Impressum und Datenschutzerklärung, insbesondere für EN
