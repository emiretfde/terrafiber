# Bilder: lokale WebP-Migration (Konzept 08)

**Status:** Die sieben Original-JPGs waren beim Aufbau dieser Studie nicht abrufbar. Das Demo lädt die Bilder daher vorläufig noch von `terrafiber.de`. Bitte nicht behaupten, sie seien bereits lokal optimiert.

## Noch benötigte Originaldateien

Bitte als ZIP oder einzeln bereitstellen und mit exakt diesen Dateinamen in `source_images/` ablegen:

- AVA-05573-235-scaled.jpg (Hauptfoto im Abschnitt „Über terraFIBER“)
- AVA-05532-215-scaled.jpg
- AVA-05521-211-scaled.jpg
- AVA-00131-69-scaled.jpg
- AVA-00024-14-scaled.jpg
- AVA-05398-164-scaled.jpg
- AVA-05497-198-scaled.jpg (Projektillustration)

## Automatische Optimierung

1. Originalfotos aus der bestehenden Unternehmensgalerie herunterladen bzw. vom Unternehmen als ZIP anfordern.
2. `python -m pip install Pillow` ausführen.
3. `python scripts/prepare_images.py` ausführen.
4. Die neuen Dateien in `assets/images/` und die geänderte `index.html` gemeinsam committen. 
5. Bildmotive kontrollieren und die vorläufigen deutschen Alt-Texte sachlich präzisieren.
6. Rechte und Zustimmung zur Veröffentlichung bestätigen.

Das Skript stoppt vor der Umstellung bei fehlenden oder zu kleinen Originalen. Je Bild erzeugt es 800/1600px WebP, aktualisiert `src`, `srcset`, `sizes` und originale `width`/`height`-Werte.

## Weitere Freigaben

- [X] Hausanschlüsse, [Nachweise], [Anzahl Kolonnen, Maschinen], drei Karriere-Vorteile.
- Firmenprofil als freigegebenes PDF.
- URL des vertraulichen Hinweisgebersystems.
- Freigabe der NL-/EN-Übersetzungen (nur DE ist aktuell aktiv).
- DSGVO-konformer Backend-Endpunkt `POST /api/contact` samt Datenschutzprüfung, Spam-Schutz und Speicherung/Löschung.
- Fotos und Jobangebote vor Veröffentlichung gegen den aktuellen Stand prüfen.
