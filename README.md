# DA40 Startstreckenrechner

Ein browserbasierter, installierbarer Startstreckenrechner für die Diamond DA40. Die Anwendung ist als Progressive Web App (PWA) umgesetzt und kann auf iPhone, iPad, Android-Geräten und Desktop-Browsern verwendet werden.

> **Hinweis zur Verwendung:** Dieses Projekt ist ein technischer Prototyp. Vor einem Einsatz im Flugbetrieb müssen sämtliche Tabellenwerte, Annahmen und Ergebnisse gegen das aktuell freigegebene AFM/POH der konkreten DA40-Version geprüft und freigegeben werden.

## Funktionen

- responsive Bedienoberfläche für Smartphones
- Auswahl von vier Flugzeugtypen: DA40, Panthera, VL3 und Gyro; zunächst sind nur die DA40-Tabellen hinterlegt
- ICAO-Startplatz mit Platzhöhe aus [mborsetti/airportsdata](https://github.com/mborsetti/airportsdata)
- QNH manuell oder automatisch über den aktuellen METAR-Dienst
- automatische Druckhöhenberechnung aus Platzhöhe und QNH
- Startmasse aus Leergewicht, Besatzung, Rückbank, Gepäck und Treibstoff (US gal oder Liter)
- Treibstoffumrechnung mit 1 US gal = 3,785 l und einer Dichte von 0,72 kg/l
- Installation auf dem Startbildschirm wie eine App
- Offline-Betrieb nach dem ersten Laden
- Berechnung der Startstrecke in mehreren Stufen:
  1. Druckhöhe und Außentemperatur
  2. Masse
  3. Windkomponente
  4. Hindernishöhe
  5. Korrekturen für Gras, Nässe und Steigung
- lineare Interpolation zwischen den hinterlegten Tabellenwerten
- Warnung, wenn eine Eingabe außerhalb des verfügbaren Tabellenbereichs liegt
- Anzeige der Zwischenschritte zur Nachvollziehbarkeit

## Projektstruktur

```text
├── pwa/
│   ├── index.html             Benutzeroberfläche
│   ├── styles.css             Layout und mobile Darstellung
│   ├── app.js                 Tabellenwerte und Berechnungslogik
│   ├── manifest.webmanifest   PWA-Konfiguration
│   ├── sw.js                  Offline-Cache (Service Worker)
│   └── icon.svg               App-Symbol
└── README.md
```

Die Excel-Datei dient als Referenz für die Tabellenstruktur und Tabellenwerte. Die PWA verwendet derzeit dieselben Werte direkt in `pwa/app.js`.

## Lokal starten

Da Service Worker aus Sicherheitsgründen nicht über `file://` funktionieren, muss die Anwendung über einen lokalen Webserver gestartet werden.

Mit Python:

```bash
python -m http.server 8765
```

Danach im Browser öffnen:

```text
http://localhost:8765/pwa/
```

Alternativ kann jeder andere einfache statische Webserver verwendet werden.

## Auf dem iPhone installieren

1. Die Anwendung über eine öffentliche HTTPS-Adresse öffnen.
2. Die Adresse in Safari aufrufen.
3. Auf das Teilen-Symbol tippen.
4. **Zum Home-Bildschirm** auswählen.
5. Falls vorhanden, **Als Web-App öffnen** aktivieren.
6. **Hinzufügen** auswählen.

Anschließend kann die Anwendung über das neue Symbol auf dem Home-Bildschirm gestartet werden.

## Auf Android installieren

1. Die Anwendung über eine öffentliche HTTPS-Adresse in Chrome oder Samsung Internet öffnen.
2. Das Browsermenü öffnen.
3. **App installieren** oder **Zum Startbildschirm hinzufügen** auswählen.
4. Die Installation bestätigen.

## Veröffentlichung mit GitHub Pages

Die Anwendung besteht ausschließlich aus statischen Dateien und eignet sich daher für GitHub Pages.

1. Das Repository auf GitHub öffnen.
2. Zu **Settings → Pages** gehen.
3. Als Quelle den gewünschten Branch auswählen.
4. Als Ordner `/ (root)` auswählen, wenn der Ordner `pwa/` im Repository liegt.
5. Speichern und die von GitHub angezeigte HTTPS-Adresse öffnen.
6. Die Anwendung über `/pwa/` aufrufen.

Beispiel:

```text
https://<benutzername>.github.io/<repository>/pwa/
```

## Tabellenwerte ändern

Die Tabellenwerte und Korrekturfaktoren befinden sich in `pwa/app.js` im Objekt `DATA` beziehungsweise in `FACTORS`.

Bei Änderungen sollten anschließend mindestens diese Fälle geprüft werden:

- Standardwerte
- niedrigste und höchste zulässige Druckhöhe
- niedrigste und höchste zulässige Temperatur
- alle Massen- und Windgrenzen
- 0 ft und 50 ft Hindernishöhe
- alle Gras-, Nässe- und Steigungsoptionen
- Eingaben außerhalb des Tabellenbereichs

## Versionshinweise

Die PWA und die Excel-Referenz müssen bei Änderungen an den Tabellenwerten gemeinsam aktualisiert und anschließend gegeneinander geprüft werden. Der Service Worker verwendet eine Cache-Version in `pwa/sw.js`; bei einer neuen Veröffentlichung sollte diese Versionskennung erhöht werden, damit Geräte die neue Version laden.

## Lizenz und Datenquelle

Eine Lizenz ist derzeit noch nicht festgelegt. Die Berechnungsdaten stammen aus der zugehörigen Excel-Referenz und müssen vor einer Veröffentlichung mit der autorisierten Flughandbuchquelle abgeglichen werden.
