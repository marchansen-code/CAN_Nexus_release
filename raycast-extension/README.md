# CANUSA Nexus – Raycast Extension

Durchsuche die CANUSA Nexus Wissensdatenbank direkt von deinem Mac mit Raycast.

## Features

- **Live-Suche**: Artikel und Dokumente durchsuchen, Ergebnisse erscheinen sofort
- **Artikel-Vorschau**: Artikelinhalt direkt in Raycast anzeigen (Markdown)
- **Schnelle Aktionen**: Im Browser öffnen, Titel kopieren, Dokument herunterladen
- **Metadaten**: Autor, Datum, Kategorie-Breadcrumbs, Tags, Dateigröße

## Installation

### 1. Raycast installieren
Falls noch nicht geschehen: [raycast.com](https://www.raycast.com/) herunterladen und installieren (kostenlos).

### 2. Extension importieren

```bash
# In diesen Ordner navigieren
cd canusa-nexus-raycast

# Abhängigkeiten installieren
npm install

# Extension im Entwicklungsmodus starten
npm run dev
```

Raycast öffnet sich automatisch und die Extension wird geladen.

### 3. API-URL konfigurieren

Beim ersten Start fragt Raycast nach der **API URL**:

- **Entwicklung**: `https://knowledge-hub-568.preview.emergentagent.com`
- **Produktion**: `https://nexus-knows.de`

Diese Einstellung kann jederzeit in den Raycast-Einstellungen geändert werden:
Raycast → Einstellungen → Extensions → CANUSA Nexus → API URL

## Nutzung

1. Raycast öffnen (`⌘ + Leertaste` oder das konfigurierte Kürzel)
2. "Nexus" eintippen → **"Nexus durchsuchen"** auswählen
3. Suchbegriff eingeben
4. **Enter** → Artikel-Vorschau in Raycast
5. **⌘ + Enter** → Im Browser öffnen

## Umstellung auf Live-Server

Nur die API-URL ändern:

**Raycast → Einstellungen → Extensions → CANUSA Nexus → API URL**

Von: `https://knowledge-hub-568.preview.emergentagent.com`
Auf: `https://nexus-knows.de`

Fertig. Alles andere funktioniert automatisch.
