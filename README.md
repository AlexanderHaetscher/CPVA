# DA40 Startstreckenrechner

Ein browserbasierter, installierbarer Startstreckenrechner fÃ¼r die Diamond DA40. Die Anwendung ist als Progressive Web App (PWA) umgesetzt und kann auf iPhone, iPad, Android-GerÃ¤ten und Desktop-Browsern verwendet werden.

> **Hinweis zur Verwendung:** Dieses Projekt ist ein technischer Prototyp. Vor einem Einsatz im Flugbetrieb mÃ¼ssen sÃ¤mtliche Tabellenwerte, Annahmen und Ergebnisse gegen das aktuell freigegebene AFM/POH der konkreten DA40-Version geprÃ¼ft und freigegeben werden.

## Funktionen

- responsive BedienoberflÃ¤che fÃ¼r Smartphones
- Auswahl von vier Flugzeugtypen: DA40, Panthera, VL3 und Gyro; zunÃ¤chst sind nur die DA40-Tabellen hinterlegt
- ICAO-Startplatz mit PlatzhÃ¶he aus [mborsetti/airportsdata](https://github.com/mborsetti/airportsdata)
- QNH manuell oder automatisch Ã¼ber den aktuellen METAR-Dienst
- automatische DruckhÃ¶henberechnung aus PlatzhÃ¶he und QNH
- Startmasse aus Leergewicht, Besatzung, RÃ¼ckbank, GepÃ¤ck und Treibstoff (US gal oder Liter)
- Treibstoffumrechnung mit 1 US gal = 3,785 l und einer Dichte von 0,72 kg/l
- Optionaler Windy-Point-Forecast-Fallback: lokalen Key nur in pwa/app.js bei WINDY_API_KEY eintragen und nicht veröffentlichen
- Installation auf dem Startbildschirm wie eine App
- Offline-Betrieb nach dem ersten Laden
- Berechnung der Startstrecke in mehreren Stufen:
  1. DruckhÃ¶he und AuÃŸentemperatur
  2. Masse
  3. Windkomponente
  4. HindernishÃ¶he
  5. Korrekturen fÃ¼r Gras, NÃ¤sse und Steigung
- lineare Interpolation zwischen den hinterlegten Tabellenwerten
- Warnung, wenn eine Eingabe auÃŸerhalb des verfÃ¼gbaren Tabellenbereichs liegt
- Anzeige der Zwischenschritte zur Nachvollziehbarkeit

## Projektstruktur

```text
â”œâ”€â”€ pwa/
â”‚   â”œâ”€â”€ index.html             BenutzeroberflÃ¤che
â”‚   â”œâ”€â”€ styles.css             Layout und mobile Darstellung
â”‚   â”œâ”€â”€ app.js                 Tabellenwerte und Berechnungslogik
â”‚   â”œâ”€â”€ manifest.webmanifest   PWA-Konfiguration
â”‚   â”œâ”€â”€ sw.js                  Offline-Cache (Service Worker)
â”‚   â””â”€â”€ icon.svg               App-Symbol
â””â”€â”€ README.md
```

Die Excel-Datei dient als Referenz fÃ¼r die Tabellenstruktur und Tabellenwerte. Die PWA verwendet derzeit dieselben Werte direkt in `pwa/app.js`.

## Lokal starten

Da Service Worker aus SicherheitsgrÃ¼nden nicht Ã¼ber `file://` funktionieren, muss die Anwendung Ã¼ber einen lokalen Webserver gestartet werden.

Mit Python:

```bash
python -m http.server 8765
```

Danach im Browser Ã¶ffnen:

```text
http://localhost:8765/pwa/
```

Alternativ kann jeder andere einfache statische Webserver verwendet werden.

## Auf dem iPhone installieren

1. Die Anwendung Ã¼ber eine Ã¶ffentliche HTTPS-Adresse Ã¶ffnen.
2. Die Adresse in Safari aufrufen.
3. Auf das Teilen-Symbol tippen.
4. **Zum Home-Bildschirm** auswÃ¤hlen.
5. Falls vorhanden, **Als Web-App Ã¶ffnen** aktivieren.
6. **HinzufÃ¼gen** auswÃ¤hlen.

AnschlieÃŸend kann die Anwendung Ã¼ber das neue Symbol auf dem Home-Bildschirm gestartet werden.

## Auf Android installieren

1. Die Anwendung Ã¼ber eine Ã¶ffentliche HTTPS-Adresse in Chrome oder Samsung Internet Ã¶ffnen.
2. Das BrowsermenÃ¼ Ã¶ffnen.
3. **App installieren** oder **Zum Startbildschirm hinzufÃ¼gen** auswÃ¤hlen.
4. Die Installation bestÃ¤tigen.

## VerÃ¶ffentlichung mit GitHub Pages

Die Anwendung besteht ausschlieÃŸlich aus statischen Dateien und eignet sich daher fÃ¼r GitHub Pages.

1. Das Repository auf GitHub Ã¶ffnen.
2. Zu **Settings â†’ Pages** gehen.
3. Als Quelle den gewÃ¼nschten Branch auswÃ¤hlen.
4. Als Ordner `/ (root)` auswÃ¤hlen, wenn der Ordner `pwa/` im Repository liegt.
5. Speichern und die von GitHub angezeigte HTTPS-Adresse Ã¶ffnen.
6. Die Anwendung Ã¼ber `/pwa/` aufrufen.

Beispiel:

```text
https://<benutzername>.github.io/<repository>/pwa/
```

## Tabellenwerte Ã¤ndern

Die Tabellenwerte und Korrekturfaktoren befinden sich in `pwa/app.js` im Objekt `DATA` beziehungsweise in `FACTORS`.

Bei Ã„nderungen sollten anschlieÃŸend mindestens diese FÃ¤lle geprÃ¼ft werden:

- Standardwerte
- niedrigste und hÃ¶chste zulÃ¤ssige DruckhÃ¶he
- niedrigste und hÃ¶chste zulÃ¤ssige Temperatur
- alle Massen- und Windgrenzen
- 0 ft und 50 ft HindernishÃ¶he
- alle Gras-, NÃ¤sse- und Steigungsoptionen
- Eingaben auÃŸerhalb des Tabellenbereichs

## Versionshinweise

Die PWA und die Excel-Referenz mÃ¼ssen bei Ã„nderungen an den Tabellenwerten gemeinsam aktualisiert und anschlieÃŸend gegeneinander geprÃ¼ft werden. Der Service Worker verwendet eine Cache-Version in `pwa/sw.js`; bei einer neuen VerÃ¶ffentlichung sollte diese Versionskennung erhÃ¶ht werden, damit GerÃ¤te die neue Version laden.

## Lizenz und Datenquelle

Eine Lizenz ist derzeit noch nicht festgelegt. Die Berechnungsdaten stammen aus der zugehÃ¶rigen Excel-Referenz und mÃ¼ssen vor einer VerÃ¶ffentlichung mit der autorisierten Flughandbuchquelle abgeglichen werden.
