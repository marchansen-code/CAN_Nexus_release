# CANUSA Nexus - The Knowledge Hub - PRD

## Original Problem Statement
Wissensmanagement-Plattform für CANUSA Touristik GmbH & Co. KG und CU-Travel.

## Technology Stack
- **Frontend**: React 18, TailwindCSS, Shadcn/UI, TipTap Rich Editor
- **Backend**: FastAPI, Python 3.11, bcrypt, reportlab (PDF), python-docx (Word)
- **Database**: MongoDB
- **Auth**: E-Mail/Passwort mit Session-Cookies, Google OAuth

## Implemented Features

### Core Features
- ✅ E-Mail/Passwort Login mit "Angemeldet bleiben"
- ✅ Dashboard mit Statistiken, Favoriten, Beliebteste Artikel
- ✅ Keyword-basierte Suche mit Live-Vorschau
- ✅ Artikel-CRUD mit Status-Workflow
- ✅ Kategorieverwaltung (Baumstruktur)
- ✅ Dark/Light/Auto Theme (Light als Default)

### Kategorien-Baumstruktur (Iteration 13) - 05.03.2026
- ✅ **Hierarchische Kategorien-Anzeige** auf der Wissensartikel-Seite mit klappbaren Eltern-Kind-Beziehungen
- ✅ **Baumstruktur im ArticleEditor** mit Multi-Auswahl-Checkboxen
- ✅ **"Neuer Artikel hier"-Button** erscheint bei Kategorie-Auswahl
- ✅ **Vorausgewählte Kategorie** beim Erstellen eines neuen Artikels via URL-Parameter

### Artikel-Verlinkung (Iteration 14) - 05.03.2026
- ✅ **@-Mention-Funktion** im Editor: Tippe "@" um andere Artikel zu suchen und zu verlinken
- ✅ **Artikel-Suche-API** (`/api/articles/search/linkable`) für Mention-Dropdown
- ✅ **Klickbare Mention-Links** mit rosa/rotem Styling in Editor und Artikelansicht
- ✅ **Zusammenfassung-Feld entfernt** aus der Artikelansicht (ArticleView.jsx)

### Erweiterte Tabellen-Funktionalität (Iteration 15) - 10.03.2026
- ✅ **Tabellen-Dialog** mit wählbarer Zeilen-/Spaltenanzahl (1-20 Zeilen, 1-10 Spalten)
- ✅ **Live-Vorschau** der Tabellengröße im Erstellungsdialog
- ✅ **Kopfzeile-Option** beim Erstellen aktivierbar
- ✅ **Erweiterte Bearbeitungsoptionen**: Zeilen/Spalten hinzufügen/löschen via Untermenüs
- ✅ **Zellen-Formatierung**: Hintergrundfarben (Gelb, Grün, Blau, Rosa, Grau)
- ✅ **Zellen verbinden/teilen**, Kopfzellen umschalten
- ✅ **Kopfzeile/Kopfspalte** umschalten für bestehende Tabellen
- ✅ **Spaltenbreite per Drag & Drop** anpassen (roter Resize-Handle am Spaltenrand)
- ✅ **Tabellenbreite** anpassbar (100%, 75%, 50%, 33%, Auto) - Tabelle zentriert sich automatisch
- ✅ **Zellenhöhe** anpassbar (Auto, Kompakt, Normal, Groß, Sehr groß)

### Gruppen-System (Iteration 12)
- ✅ Admins können Gruppen erstellen/bearbeiten/löschen
- ✅ Admins können User zu Gruppen hinzufügen/entfernen
- ✅ Artikel können für bestimmte Gruppen eingeschränkt werden
- ✅ Gruppen-Management Seite `/groups`

### Artikel-Features (Iteration 12)
- ✅ **Mehrere Kategorien** pro Artikel (Checkboxen)
- ✅ **Tag-Vorschläge** beim Eingeben
- ✅ **Artikel-Gültigkeit** (Ablaufdatum → automatisch Entwurf)
- ✅ **Wichtig-Markierung** mit optionalem Ablaufdatum
- ✅ **Entwurf-Sichtbarkeit** nur für Admin + Ersteller
- ✅ **Gruppen-Sichtbarkeit** für Artikel
- ✅ **Nach Speichern zurück navigieren**
- ✅ **Zusammenfassung entfernt** (nicht mehr im Model)

### Backup & Export
- ✅ JSON-Backup (Artikel, Kategorien, Benutzer)
- ✅ ZIP-Backup für Dokumente (PDFs)
- ✅ PDF-Export für Artikel
- ✅ Word-Export für Artikel

### Admin Features
- ✅ Benutzer anlegen mit E-Mail/Passwort
- ✅ Benutzer-Passwörter ändern
- ✅ User sperren und löschen
- ✅ Dokumente löschen
- ✅ Rollenverwaltung (Admin/Editor/Viewer)

### UI/UX Verbesserungen (Iteration 12)
- ✅ Dark Mode Schriftfarbe verbessert
- ✅ Light Mode als Default für neue User
- ✅ Kalender `fixedWeeks` (springt nicht mehr)
- ✅ Top 10 aus Wissensartikel entfernt

### Editor & Kategorien Erweiterungen (Iteration 16) - 13.03.2026
- ✅ **"Zurück zu Entwurf"-Button** - Veröffentlichte Artikel können wieder in Entwurf versetzt werden
- ✅ **Entwurf-Sichtbarkeit** - Entwürfe nur für Ersteller sichtbar (Backend bereits implementiert)
- ✅ **Bildgrößen-Anpassung** im Editor (25%, 50%, 75%, 100%, Auto, 300px)
- ✅ **Hierarchischer Baum-Selektor** für "Übergeordnete Kategorie" beim Erstellen/Bearbeiten
- ✅ **"+"-Button für Unterkategorien** - Schnelles Erstellen von Unterkategorien bei Hover

### Papierkorb / Lösch-Historie (Iteration 17) - 13.03.2026
- ✅ **Soft-Delete** für Artikel und Dokumente - Items werden nicht sofort gelöscht
- ✅ **30-Tage-Aufbewahrung** mit Countdown-Anzeige
- ✅ **Admin-only Papierkorb-Seite** unter /trash mit Tabs für Artikel und Dokumente
- ✅ **Wiederherstellen-Funktion** - Gelöschte Items können wiederhergestellt werden
- ✅ **Endgültig löschen** - Items können vor Ablauf der 30 Tage dauerhaft entfernt werden
- ✅ **Auto-Cleanup** - Button zum Entfernen aller Items älter als 30 Tage

### Sicherheit & Session-Management (Iteration 18) - 16.03.2026
- ✅ **Fail2Ban-kompatibles Logging** - Fehlgeschlagene Anmeldeversuche werden geloggt
- ✅ **Log-Format**: `YYYY-MM-DD HH:MM:SS WARNING [AUTH] Failed login from IP for user`
- ✅ **Log-Datei**: `/app/backend/logs/auth_failures.log`
- ✅ **Session-Redirect** - Bei aktiver Session automatische Weiterleitung zum Dashboard
- ✅ **Root-URL Handling** - `/` leitet eingeloggte User zum Dashboard weiter

### Kommentarsystem (Iteration 19) - 16.03.2026
- ✅ **Kommentare für Artikel** - Benutzer können Kommentare zu veröffentlichten Artikeln schreiben
- ✅ **Kommentare aktivieren/deaktivieren** - Toggle im Editor pro Artikel
- ✅ **Kommentar-Anzeige** - In der Artikelansicht werden Kommentare angezeigt
- ✅ **Kommentar-Löschung** - Nur Admins können Kommentare löschen

### Backend Refactoring (Iteration 20) - 16.03.2026
- ✅ **Modulare Architektur** - server.py von 2.293 Zeilen auf 142 Zeilen reduziert
- ✅ **Separate Route-Dateien** - 12 spezialisierte Router-Module in `/routes/`
- ✅ **Zentrale Modelle** - Alle Pydantic-Modelle in `models.py`
- ✅ **Database-Modul** - MongoDB-Verbindung in `database.py`
- ✅ **Dependencies** - Auth-Funktionen in `dependencies.py`

### Tag-Suche & Artikel-Analytics (Iteration 21) - 16.03.2026
- ✅ **Tag-Suche** - Artikel können nach Tags gefiltert werden
- ✅ **Tag-Filter Panel** - Klickbare Tags zum Ein-/Ausschalten der Filter
- ✅ **Tags in Suchergebnissen** - Zeigt Tags der gefundenen Artikel an
- ✅ **Artikel-Analytics** - Dialog mit Metriken (Aufrufe, Favoriten, Kommentare)
- ✅ **Engagement-Score** - Berechnet aus Aufrufen, Favoriten und Kommentaren (0-100)
- ✅ **Vergleich mit Durchschnitt** - Zeigt ob Artikel über/unter Durchschnitt liegt
- ✅ **Zugriffskontrolle** - Nur Autor und Admins können Analytics sehen

### Erweiterte Suchfilter (Iteration 22) - 16.03.2026
- ✅ **Tag-Dropdown mit Suche** - Tags können durchsucht und mehrfach ausgewählt werden
- ✅ **Autor-Filter** - Artikel nach Autor filtern (mit Suchfunktion)
- ✅ **Status-Filter** - Nach "Veröffentlicht" oder "Entwurf" filtern
- ✅ **Wichtig-Markierung Filter** - Nur wichtige oder nicht-wichtige Artikel
- ✅ **Zeitraum-Filter** - "Erstellt ab" und "Erstellt bis" mit Datepicker
- ✅ **HTML-Bereinigung** - Content-Snippets zeigen reinen Text ohne HTML-Tags
- ✅ **Aktive Filter Anzeige** - Zeigt aktive Filter als Badges an

### Dokument-Ordnerstruktur (Iteration 23) - 16.03.2026
- ✅ **Hierarchische Ordnerstruktur** - Ordner mit beliebiger Verschachtelungstiefe
- ✅ **Split-View Design** - Links Ordnerbaum, rechts Dokumentenliste (wie Artikel)
- ✅ **Ordner erstellen** - Admins und Editoren können neue Ordner anlegen
- ✅ **Unterordner erstellen** - Per "+" Button beim Überfahren eines Ordners
- ✅ **Ordner beim Upload wählen** - Dialog zum Auswählen/Erstellen eines Ordners
- ✅ **Dokumente verschieben** - Per Kontextmenü in anderen Ordner verschieben
- ✅ **Ordner bearbeiten/löschen** - Für Admins mit Fallback für Inhalte

### Dokument-Aktionen & Responsive Layout (Iteration 24) - 16.03.2026
- ✅ **Responsive Dokument-Aktionen** - Buttons für Ansehen, Verschieben, Löschen sind bei allen Bildschirmbreiten sichtbar
- ✅ **Mobile Ordner-Panel** - Kollabierbare Ordnerauswahl auf schmalen Bildschirmen
- ✅ **Aktionen-Dropdown** - Drei-Punkte-Menü mit "In Ordner verschieben" und "Löschen"

### PDF Import Feature (Iteration 24) - 16.03.2026
- ✅ **PDF-zu-HTML-Konvertierung** - Neue API `/api/documents/{id}/convert-to-html`
- ✅ **pymupdf4llm Integration** - Hochwertige PDF-Extraktion mit Layout-Erhaltung
- ✅ **Tabellen-Erkennung** - Tabellen werden als HTML-Tabellen konvertiert
- ✅ **"In Artikel umwandeln" Button** - Im Dokumenten-Vorschau-Dialog
- ✅ **Automatische Artikel-Erstellung** - Weiterleitung zum Editor mit vorausgefülltem Inhalt
- ✅ **TipTap-kompatibles HTML** - Formatierung für den Rich-Text-Editor optimiert

### Vollwertiger PDF-Viewer (Iteration 25) - 16.03.2026
- ✅ **React-PDF Integration** - Native PDF-Darstellung im Browser mit PDF.js
- ✅ **PDF-Ansicht Tab** - Zeigt das PDF wie es ist
- ✅ **Extrahierter Text Tab** - Zeigt den reinen Text aus dem PDF
- ✅ **Seitennavigation** - Vor-/Zurück-Buttons und Seiteneingabe
- ✅ **Zoom-Steuerung** - Vergrößern/Verkleinern (50%-300%)
- ✅ **Drehen-Funktion** - PDF um 90° drehen
- ✅ **Download-Button** - PDF herunterladen
- ✅ **PDF-Streaming API** - Neuer Endpunkt `/api/documents/{id}/file`

### Editor-Verbesserungen (Iteration 26) - 16.03.2026
- ✅ **Vollbild-Editor** - Editor kann in einem Pop-up-Fenster geöffnet werden
- ✅ **Vollbild über Card-Header** - Button "Vollbild" in der Inhalt-Card
- ✅ **Vollbild über Toolbar** - Button "Vollbild"/"Beenden" in der Editor-Toolbar
- ✅ **Escape zum Schließen** - Vollbild-Modus mit Esc beenden
- ✅ **FullscreenEditor-Komponente** - Separate React-Komponente für modulare Nutzung

### Benutzer-Mentions (Iteration 26) - 16.03.2026
- ✅ **@@ Trigger für Benutzer** - Unterscheidet von @ für Artikel
- ✅ **Benutzer-Dropdown** - Zeigt Name, E-Mail und Rolle
- ✅ **Rollen-Badges** - Admin (rot), Editor (blau)
- ✅ **Suchfilter** - Suche nach Name oder E-Mail
- ✅ **Backend-Endpunkt** - `GET /api/users/search/mention`

### Artikel-Versionierung (Iteration 26) - 16.03.2026
- ✅ **Automatische Versionierung** - Jede Änderung erstellt eine Version
- ✅ **Versionshistorie-Anzeige** - Timeline unterhalb des Artikels
- ✅ **Versionsnummern** - Fortlaufende Nummerierung mit Datum/Autor
- ✅ **Neue Kollektion** - `article_versions` in MongoDB

### Multi-Format-Dokumente (Iteration 27) - 16.03.2026
- ✅ **Erweiterte Dateiformate** - PDF, DOC/DOCX, TXT, CSV, XLS/XLSX
- ✅ **Format-spezifische Verarbeitung**:
  - PDF: `pdfplumber` für Text und Tabellen
  - DOCX: `python-docx` mit Heading-Erkennung
  - TXT: UTF-8/Latin-1 Encoding-Support
  - CSV/Excel: `pandas` + `openpyxl`/`xlrd`
- ✅ **Multi-Format-Viewer** - Dateityp-spezifische Anzeige
- ✅ **Dateityp-Icons** - Farbige Icons (PDF=rot, DOC=blau, CSV/XLS=grün)
- ✅ **Import-Dialog im Editor**:
  - Tab "Bestehende Dokumente" mit Suche
  - Tab "Neue Datei hochladen"
  - Polling für Upload-Completion
  - Quellenangabe beim Import
- ✅ **Neue Komponenten**:
  - `DocumentViewer.jsx` - Multi-Format-Viewer
  - `DocumentImportDialog.jsx` - Import-Dialog
- ✅ **Neue API-Endpunkte**:
  - `GET /api/documents/{id}/content` - HTML-Inhalt für Import

### Google OAuth Integration (Iteration 28) - 16.03.2026
- ✅ **"Mit Google anmelden" Button** - Auf der Login-Seite mit Google-Logo
- ✅ **OAuth-Endpunkt** - `GET /api/auth/google/login` leitet zu Google weiter
- ✅ **Callback-Verarbeitung** - `GET /api/auth/google/callback` erstellt/aktualisiert Benutzer
- ✅ **Session-Cookie** - Wird nach erfolgreicher Google-Anmeldung gesetzt
- ✅ **HTTPS-Redirect** - Automatische HTTPS-Korrektur für Redirect-URIs
- ✅ **Neue Benutzer-Erstellung** - Google-Benutzer werden mit Rolle "viewer" angelegt
- ✅ **Benutzer-Update** - Bestehende Benutzer bekommen Google-ID und Profilbild
- ✅ **Produktions-Domain** - Konfiguriert für `https://nexus-knows.de`

### Google Drive Integration (Iteration 29) - 16.03.2026
- ✅ **Drive-Verbindung** - OAuth-Flow mit `drive.file` Scope
- ✅ **Verbindungsstatus** - Button zeigt ob Drive verbunden ist
- ✅ **Datei-Import** - Dateien aus Google Drive in Dokumentenverwaltung importieren
  - PDF, DOCX, TXT, CSV, XLSX werden unterstützt
  - Google Docs werden automatisch zu DOCX konvertiert
  - Google Sheets werden automatisch zu XLSX konvertiert
- ✅ **Artikel-Export** - Artikel als PDF oder DOCX nach Google Drive exportieren
  - Zielordner kann ausgewählt werden
  - Link zum Öffnen in Drive wird angezeigt
- ✅ **Neue Dialoge**:
  - `GoogleDriveImportDialog.jsx` - Ordner durchsuchen und Dateien auswählen
  - `GoogleDriveExportDialog.jsx` - Format und Zielordner wählen
- ✅ **Neue API-Endpunkte**:
  - `GET /api/drive/connect` - OAuth-Flow starten
  - `GET /api/drive/callback` - OAuth-Callback verarbeiten
  - `GET /api/drive/status` - Verbindungsstatus prüfen
  - `POST /api/drive/disconnect` - Verbindung trennen
  - `GET /api/drive/files` - Dateien in Ordner auflisten
  - `GET /api/drive/folders` - Alle Ordner auflisten
  - `POST /api/drive/import/{file_id}` - Datei importieren
  - `POST /api/drive/export/article/{article_id}` - Artikel exportieren

## API Endpoints

### Groups (Admin only)
- `GET /api/groups` - Alle Gruppen
- `POST /api/groups` - Gruppe erstellen
- `PUT /api/groups/{id}` - Gruppe bearbeiten
- `DELETE /api/groups/{id}` - Gruppe löschen
- `GET /api/groups/{id}/members` - Mitglieder abrufen
- `PUT /api/users/{id}/groups` - User-Gruppen aktualisieren

### Tags
- `GET /api/tags` - Alle eindeutigen Tags

### Articles (erweitert)
- `POST /api/articles` mit:
  - `category_ids[]` - Mehrere Kategorien
  - `visible_to_groups[]` - Gruppen-Sichtbarkeit
  - `expiry_date` - Ablaufdatum
  - `is_important` - Wichtig-Markierung
  - `important_until` - Ablauf der Markierung

### Backup
- `GET /api/backup/preview` - Statistiken
- `GET /api/backup/export` - JSON-Backup
- `POST /api/backup/import` - JSON importieren
- `GET /api/backup/documents` - ZIP mit PDFs
- `POST /api/backup/documents/import` - ZIP importieren

### Article Export
- `GET /api/articles/{id}/export/pdf`
- `GET /api/articles/{id}/export/docx`

### Google OAuth
- `GET /api/auth/google/login` - Startet OAuth-Flow
- `GET /api/auth/google/callback` - Verarbeitet Google-Antwort

### Google Drive
- `GET /api/drive/connect` - Startet Drive OAuth-Flow
- `GET /api/drive/callback` - Verarbeitet Drive OAuth-Callback
- `GET /api/drive/status` - Prüft Verbindungsstatus
- `POST /api/drive/disconnect` - Trennt Drive-Verbindung
- `GET /api/drive/files` - Listet Dateien auf
- `GET /api/drive/folders` - Listet Ordner auf
- `POST /api/drive/import/{file_id}` - Importiert Datei aus Drive
- `POST /api/drive/export/article/{article_id}` - Exportiert Artikel nach Drive

## Default Admin
- **E-Mail**: marc.hansen@canusa.de
- **Passwort**: CanusaNexus2024!

## Test Coverage
- Iteration 27: Frontend 100% (8/8), Regression 100% (8/9) - YouTube & Link Dialog Features
- Iteration 26: Backend 100% (12/12), Frontend 100% (13/13), Regression 100% (25/25) - User Last Active & Folder Move
- Iteration 25: Backend 100% (13/13), Frontend 95% (20/21) - Article Move & Image Upload Tree
- Iteration 24: Backend 100% (13/13), Frontend 100% (15/15, 1 skipped) - Documents Page Features
- Iteration 23: Backend 100% (9/9), Frontend 100% (15/15) - Editor Improvements
- Iteration 22: Backend 100% (14/14), Frontend 100% (11/11) - Notification System
- Last tested: 19.03.2026

## Editor Improvements (Iteration 23) - 19.03.2026
- ✅ **Listen-Anzeige korrigiert** - Aufzählungen und nummerierte Listen werden jetzt korrekt in der Artikelansicht angezeigt
- ✅ **Vollbild-Editor Bug behoben** - Toolbar überlappt nicht mehr mit dem Editorbereich
- ✅ **Multi-Bilder-Upload** - Mehrere Bilder gleichzeitig hochladen, automatisch im Ordner "Bilder" speichern
- ✅ **HTML-Editor Modus** - Umschaltbar zwischen WYSIWYG und HTML-Code für erfahrene Benutzer
- ✅ **Ordnerauswahl beim Bild-Upload** - Benutzer können Zielordner auswählen oder neu erstellen
- ✅ **Bildvorschau in Dokumenten** - Bilder zeigen Thumbnails, Vorschau-Dialog mit Metadaten
- **Neue Komponenten**:
  - `MultiImageUploadDialog.jsx` - Dialog für Mehrfach-Bilder-Upload mit Ordnerauswahl
- **Neue API-Endpunkte**:
  - `POST /api/images/upload-multiple` - Mehrere Bilder hochladen mit optionaler Ordner-ID
- **Bugfixes**:
  - Google Drive Import Dialog Button-Overflow behoben
  - Multi-Image Upload fügt jetzt ALLE Bilder in den Artikel ein (nicht nur eines)

## UI/UX Improvements (Iteration 24) - 19.03.2026
- ✅ **Dashboard neu angeordnet** - "Neueste Artikel" jetzt oben auf der Seite
- ✅ **Galerieansicht für Bilder** - Grid-Ansicht mit großen Thumbnails wie Google Fotos
- ✅ **Bilder-Upload in Dokumenten** - Direkt Bilder hochladen über "Bilder"-Button
- ✅ **Auto-Save eingefügter Bilder** - Per Copy & Paste eingefügte Bilder werden automatisch im Bilder-Ordner gespeichert
- ✅ **Sortierung Artikel** - Nach Aktualisiert, Erstellt, Titel, Aufrufe (auf-/absteigend)
- ✅ **Sortierung Dokumente** - Nach Datum, Name, Größe (auf-/absteigend)
- ✅ **Ansichtsmodus-Toggle** - Umschaltbar zwischen Liste und Galerie für Dokumente

## Ordner-Navigation & Multi-Select (Iteration 25) - 19.03.2026
- ✅ **Ordner-Navigation Bug behoben** - Klick auf Ordner aktualisiert jetzt korrekt die Dokumentenliste
- ✅ **Multi-Select in Galerie-Ansicht** - Checkboxen erscheinen beim Hover über Bilder
- ✅ **Bulk-Aktionsleiste** - Zeigt Anzahl ausgewählter Elemente mit Download/Verschieben/Löschen-Buttons
- ✅ **Alle auswählen** - Button um alle Bilder in der Ansicht zu selektieren
- ✅ **Drag & Drop für Dokumente** - Dokumente können per Drag & Drop in Ordner verschoben werden
- ✅ **@dnd-kit Integration** - Moderne Drag & Drop Bibliothek für React
- ✅ **Drag-Handles** - GripVertical Icons in der Listenansicht zeigen Drag-Möglichkeit an
- ✅ **Droppable Ordner** - Ordner in der Baumansicht akzeptieren Drops und werden visuell hervorgehoben
- ✅ **DragOverlay** - Zeigt Dateinamen/Thumbnail während des Ziehens

## Artikel Verschieben & Bilder-Upload Verbesserung (Iteration 26) - 19.03.2026
- ✅ **Artikel Verschieben** - "Verschieben" Option im Dropdown-Menü jedes Artikels
- ✅ **Artikel Verschieben Dialog** - Hierarchische Kategorienauswahl im Dialog (wie bei neuen Kategorien)
- ✅ **Drag & Drop für Artikel** - Artikel können per Drag & Drop zu Kategorien in der Seitenleiste verschoben werden
- ✅ **Drag-Handles für Artikel** - GripVertical Icons zeigen Drag-Möglichkeit an
- ✅ **Droppable Kategorien** - Kategorien in der Baumansicht akzeptieren Drops und werden visuell hervorgehoben
- ✅ **Bilder-Upload Ordnerauswahl** - Hierarchische Baumstruktur statt flacher Dropdown-Liste
- ✅ **Expand/Collapse für Ordner** - Pfeile zum Auf-/Zuklappen von Ordnern mit Unterordnern
- ✅ **Auto-Auswahl "Bilder"** - "Bilder (automatisch)" ist als Standard vorausgewählt

## Benutzer & Sicherheit Verbesserungen (Iteration 27) - 19.03.2026
- ✅ **Zuletzt online für Admins** - Neue "Zuletzt online" Spalte in der Benutzerverwaltung
- ✅ **Online-Status Indikator** - Grüner pulsierender Punkt für Benutzer, die in den letzten 5 Minuten aktiv waren
- ✅ **Relative Zeitangaben** - "Gerade eben", "vor X Min.", "vor X Std.", "vor X Tagen", "Nie"
- ✅ **last_active Tracking** - Backend aktualisiert last_active bei Login und /me Endpoint-Aufrufen
- ✅ **Ordner verschieben per Drag & Drop** - Ordner können jetzt auch in andere Ordner gezogen werden
- ✅ **Ordner verschieben API** - Neuer PUT /api/document-folders/{id}/move Endpoint
- ✅ **Zirkuläre Referenz Schutz** - Backend verhindert das Verschieben eines Ordners in seinen eigenen Unterordner
- ✅ **Bestätigungs-Dialog vor Drag & Drop** - "Möchten Sie XYZ wirklich nach ZYX verschieben?"
- ✅ **Bestätigung für alle Drag & Drop Operationen** - Dokumente, Ordner und Artikel

## Editor Erweiterungen (Iteration 28) - 19.03.2026
- ✅ **YouTube-Link Dialog** - Beim Einfügen eines YouTube-Videos wird gefragt: "Vorschau einbetten" oder "Nur als Link anzeigen"
- ✅ **Erweiterte Link-Funktion** - Link-Dialog mit zwei Tabs: "URL" und "Dokument"
- ✅ **Dokument-Verlinkung** - Durchsuchbare Liste mit Thumbnails für Bilder
- ✅ **Darstellungs-Optionen** - Bei Dokumenten-Links ohne markierten Text: Vorschaubild, Eigener Link-Text, Gekürzter Dateiname
- ✅ **Dokument-Vorschau Popup** - Klick auf Dokument-Link öffnet Vollbild-Vorschau
- ✅ **Bilder-Vorschau** - Zeigt Bild zentriert im Dialog
- ✅ **PDF/Dokument-Vorschau** - Zeigt Dokument in iframe
- ✅ **"In neuem Tab öffnen" Button** - Ermöglicht direkten Download/Ansicht

## Backlog

### P2 (Medium)
- [x] ~~Benutzer-Suche in @-Mentions~~ (Erledigt in Iteration 26)
- [x] ~~Artikel-Versionierung~~ (Erledigt in Iteration 26)
- [x] ~~Multi-Format-Dokumente~~ (Erledigt in Iteration 27)
- [ ] Schnellsuche (Strg+K)

### P3 (Nice to Have)
- [ ] OCR für gescannte PDFs
- [x] ~~E-Mail-Benachrichtigungen~~ (Erledigt in Iteration 22 - 17.03.2026)
- [x] ~~Hochwertige PDF-zu-HTML-Konvertierung~~ (Erledigt in Iteration 24)
- [x] ~~Vollwertiger PDF-Viewer~~ (Erledigt in Iteration 25)

## Benachrichtigungssystem (Iteration 22) - 17.03.2026
- ✅ **@-Mentions Benachrichtigungen** - Benutzer werden per E-Mail benachrichtigt, wenn sie in einem Artikel erwähnt werden
- ✅ **Review-Anfragen** - Autoren können Reviewer für Entwürfe einladen, die per E-Mail benachrichtigt werden und temporäre Leseberechtigung erhalten
- ✅ **Favoriten-Updates** - Opt-in E-Mail-Benachrichtigungen bei Änderungen an favorisierten Artikeln
- ✅ **Statusänderungen** - E-Mail-Benachrichtigung wenn Benutzerrolle oder Kontostatus geändert wird
- ✅ **Kontaktperson-Änderung** - E-Mail-Benachrichtigung wenn Benutzer als Ansprechpartner für Artikel zugewiesen wird
- ✅ **Benachrichtigungs-Einstellungen** - Benutzer können ihre E-Mail-Benachrichtigungen in Einstellungen > Benachrichtigungen konfigurieren
- ✅ **Test-E-Mail Funktion** - Admins können Test-E-Mails senden um die SMTP-Konfiguration zu prüfen
- **Neue Komponenten**:
  - `ReviewRequestDialog.jsx` - Dialog zum Einladen von Reviewern
  - `NotificationSettings.jsx` - Einstellungsseite für E-Mail-Benachrichtigungen
- **Neue API-Endpunkte**:
  - `GET /api/notifications/preferences` - Benachrichtigungseinstellungen abrufen
  - `PUT /api/notifications/preferences` - Benachrichtigungseinstellungen aktualisieren
  - `POST /api/notifications/review-request` - Review-Anfrage senden
  - `GET /api/notifications/article/{id}/reviewers` - Reviewer eines Artikels abrufen
  - `DELETE /api/notifications/review-request/{article_id}/{reviewer_id}` - Reviewer entfernen
  - `POST /api/notifications/test-email` - Test-E-Mail senden (Admin only)
- **SMTP-Konfiguration**: Gmail erfordert App-spezifisches Passwort (nicht normales Passwort)

## Backend Architektur (nach Refactoring)

```
/app/backend/
├── server.py          # Hauptanwendung, Router-Einbindung
├── database.py        # MongoDB-Verbindung
├── dependencies.py    # Auth-Funktionen
├── models.py          # Pydantic-Modelle
├── services/
│   └── email_service.py # E-Mail-Versand für Benachrichtigungen
└── routes/
    ├── auth.py        # Login, Logout
    ├── users.py       # Benutzer-CRUD mit Status-Benachrichtigungen, Theme-Einstellungen
    ├── groups.py      # Gruppen-CRUD
    ├── categories.py  # Kategorien-CRUD
    ├── articles.py    # Artikel, Kommentare, Tags mit Benachrichtigungen
    ├── search.py      # Suche
    ├── documents.py   # Dokument-Upload
    ├── recycle_bin.py # Papierkorb
    ├── images.py      # Bilder-Upload
    ├── stats.py       # Statistiken, Widget
    ├── backup.py      # Backup/Export/Import
    ├── exports.py     # PDF/DOCX-Export, Favoriten
    ├── versions.py    # Artikel-Versionierung
    ├── google_auth.py # Google OAuth Integration
    ├── google_drive.py # Google Drive Import/Export
    └── notifications.py # E-Mail-Benachrichtigungssystem
```

## Dark Mode & Theme System (Iteration 29) - 19.03.2026
- ✅ **Dark Mode Fixes** - Umfassende CSS-Korrekturen für lesbare Texte im Dark Mode
  - Input-Felder, Textareas und Selects haben jetzt korrekten Kontrast
  - Tabellen-Texte sind lesbar (Header und Daten-Zeilen)
  - Überschriften (h1-h6) sind hell auf dunklem Hintergrund
  - ProseMirror/TipTap Editor-Inhalte sind lesbar
  - Formulare und Dialogboxen haben korrekte Farben
- ✅ **Theme-Einstellungen für alle Benutzer** - Neuer Tab "Erscheinungsbild" in Einstellungen
  - Theme-Modus auswählen: Hell, Dunkel, Automatisch
  - Farbschema-Vorlagen: CANUSA Standard, Ozean Blau, Wald Grün, Sonnenuntergang, Lavendel, Mitternacht
  - "Auf Standard zurücksetzen" Button
  - "Einstellungen speichern" Button
- ✅ **Dynamische Farbschema-Anwendung** - Primärfarben ändern sich überall in der UI:
  - Sidebar-Navigation aktiver Zustand
  - Alle primären Buttons (Neu, Speichern, etc.)
  - StatCard-Icons auf dem Dashboard
  - Login-Seite Branding und Buttons
  - Avatar-Fallback-Farben
  - Kategoriebaum Auswahl
- ✅ **Theme-Button aus Header entfernt** - Nur noch über Einstellungen erreichbar
- ✅ **Neues CANUSA Nexus Logo** integriert:
  - Sidebar Logo zentriert
  - Mobile Header Logo
  - Login-Seite Header und Hero-Bereich
  - Landing-Seite Header und Hero-Bereich
  - Favicon und Apple Touch Icon
- ✅ **Einstellungen für alle Rollen sichtbar** - Nicht nur Admins können auf Einstellungen zugreifen
- ✅ **Admin: Theme zurücksetzen** - Neuer "Theme" Button in der Benutzerverwaltung
  - Setzt das Theme eines Benutzers auf Standard (Light Mode) zurück
- **Neue API-Endpunkte**:
  - `GET /api/users/me/theme` - Theme-Einstellungen des aktuellen Benutzers abrufen
  - `PUT /api/users/me/theme` - Theme-Einstellungen speichern
  - `PUT /api/users/{id}/reset-theme` - Theme eines Benutzers zurücksetzen (Admin)
- **Neue/Aktualisierte Komponenten**:
  - `ThemeSettings.jsx` - Erscheinungsbild-Einstellungskomponente
  - `ThemeProvider.jsx` - Erweitert mit Farbschema-Support, CSS-Variablen und Server-Sync
- **Aktualisierte Seiten** (für dynamische Primärfarben und neues Logo):
  - `Layout.jsx` - Sidebar-Navigation, neues Logo
  - `Dashboard.jsx` - StatCards, Buttons, Avatars
  - `Articles.jsx` - Kategorie-Baum, Buttons
  - `ArticleEditor.jsx` - Kategorie-Checkboxen, Speichern-Button
  - `ArticleView.jsx` - Export-Button
  - `Login.jsx` - Neues Logo, Feature-Icons, Login-Button
  - `Landing.jsx` - Neues Logo, CTA-Buttons
  - `Groups.jsx` - Erstellen/Speichern-Buttons
  - `Backup.jsx` - Alle primären Buttons
- **Neue Assets**:
  - `/public/nexus-logo.png` - Das neue CANUSA Nexus Logo
- **Neue CSS-Utilities**:
  - `bg-theme-primary`, `text-theme-primary`, `border-theme-primary`
  - `bg-theme-primary-light`, `bg-theme-primary-lighter`

## Pinnwand & Dashboard-Umbau (Iteration 28) - 23.03.2026
- ✅ **Dashboard-Tabs** - Zwei Tabs: "Pinnwand" und "Dashboard"
- ✅ **Pinnwand-Ansicht** - Zeigt Artikel aus als Pinnwand markierten Kategorien mit Amber-Akzentfarbe
- ✅ **Dashboard-Reihenfolge** - Neuer Aufbau: Favoriten → Zuletzt angesehen → Neueste Artikel → Statistiken
- ✅ **Schnellzugriff entfernt** - Bereich wurde aus Dashboard entfernt wie angefordert
- ✅ **Pinnwand-Kategorien** - Kategorien können als "Pinnwand" markiert werden
- ✅ **Pinnwand-Badge** - Kategorien mit Pinnwand-Flag zeigen Badge in Baumansicht
- ✅ **Gruppen-@-Mentions** - `@@@Gruppenname` erwähnt alle Mitglieder einer Gruppe
- ✅ **Gruppen-E-Mail-Benachrichtigung** - Alle Gruppenmitglieder erhalten E-Mail bei Gruppen-Mention
- **Neue Komponenten**:
  - `GroupMentionList.jsx` - Autocomplete-Liste für Gruppen-Mentions im Editor (grünes Styling)
- **Neue API-Endpunkte**:
  - `GET /api/categories/pinnwand/articles` - Artikel aus Pinnwand-Kategorien abrufen
  - `GET /api/groups/search/mention` - Gruppen mit Mitgliederzahl für Mentions suchen
- **Modell-Änderungen**:
  - `Category.is_pinnwand: bool` - Flag für Pinnwand-Kategorien
- **Editor-Änderungen**:
  - Gruppen-Mention Extension mit `@@@` Trigger (User-Mentions bleiben `@@`)
  - Grüne Styling für Gruppen-Mentions, blaue für User-Mentions
- **CSS-Änderungen**:
  - `.group-mention` Klasse für grüne Gruppen-Mention-Darstellung

## Pinnwand-Layout & Editor Dokument-Einbetten (Iteration 30) - 23.03.2026
- ✅ **Pinnwand horizontal** - Container nebeneinander angeordnet (max. 3 pro Zeile)
- ✅ **20px Abstand** - `gap-5` zwischen allen Pinnwand-Containern
- ✅ **Icons für Titel** - Passende Icons basierend auf Kategorie-Namen:
  - NEWS → Zeitung-Icon (Newspaper)
  - SPECIALS → Sparkles-Icon
  - WICHTIG/ALERT → AlertCircle-Icon
  - INFO → Info-Icon
  - EVENT/TERMIN → Calendar-Icon
  - ANKÜNDIGUNG → Megaphone-Icon
  - Standard → Pin-Icon
- ✅ **Dokument-Einbetten im Editor** - Neuer "Einfügemodus" im Link-Dialog
- ✅ **Link einfügen** - Dokument als klickbaren Link einfügen
- ✅ **Einbetten (Viewer)** - Dokument als interaktiven Viewer direkt im Artikel einbetten
- ✅ **Info-Box** - Erklärt Einbetten-Funktion mit amber/gelber Hervorhebung
- **CSS-Änderungen**:
  - `.embedded-document` Klasse für eingebettete Dokument-Viewer
- **State-Änderungen in RichTextEditor**:
  - `documentInsertMode`: 'link' oder 'embed'

## Pinnwand-Verbesserungen & Backlog-Features (Iteration 29) - 23.03.2026
- ✅ **Pinnwand-Container pro Kategorie** - Jede Pinnwand-Kategorie hat eigenen Container
- ✅ **Container-Titel aus zweitem Wort** - "Pinnwand NEWS" → Container-Titel "NEWS"
- ✅ **Einzeilige Artikel-Darstellung** - Artikel in Pinnwand-Containern als einzelne Zeilen
- ✅ **Schnellsuche (Strg+K)** - Globale Suche nach Artikeln, Dokumenten, Kategorien
- ✅ **Schnellnavigation** - Dashboard, Artikel, Dokumente, Kategorien, Benutzer, Einstellungen
- ✅ **OCR für gescannte PDFs** - Tesseract OCR (kostenlos, open-source)
- ✅ **OCR-Button im Dokument-Viewer** - "Text per OCR extrahieren" für PDFs und Bilder
- ✅ **OCR-Ergebnis-Dialog** - Zeigt Seiten, Wörter, Zeichen, Konfidenz mit "Text kopieren"
- **Neue Komponenten**:
  - `QuickSearch.jsx` - Schnellsuche-Dialog mit CommandDialog
  - `PinnwandArticleRow` - Einzeilige Artikel-Darstellung in Pinnwand-Containern
- **Neue API-Endpunkte**:
  - `GET /api/articles/search` - Volltextsuche in Artikeln
  - `GET /api/ocr/status` - OCR-Dienststatus prüfen
  - `POST /api/ocr/extract-from-document/{id}` - Text aus gespeichertem Dokument extrahieren
- **Backend-Services**:
  - `services/ocr_service.py` - Tesseract OCR Service (Deutsch + Englisch)
- **System-Dependencies**:
  - Tesseract OCR (`tesseract-ocr`, `tesseract-ocr-deu`, `tesseract-ocr-eng`)
  - pytesseract, pdf2image

## Known Issues / Backlog

### P1 (Kritisch)
- [ ] Google Drive Import Dialog - "Meine Ablage" Tab reagiert nicht (wiederkehrendes Problem)
- [ ] Export zu Google Shared Drive funktioniert nicht
- [ ] Google Drive Dateiliste im Export-Dialog ist fehlerhaft

### P2 (Medium) - ERLEDIGT
- [x] ~~Schnellsuche (Strg+K)~~ Erledigt in Iteration 29
- [x] ~~Multi-Select in Galerie-Ansicht~~ Bereits im GitHub-Repo implementiert
- [x] ~~Drag & Drop für Ordner-Neuordnung~~ Bereits im GitHub-Repo implementiert
- [x] ~~OCR für gescannte PDFs~~ Erledigt in Iteration 29 mit Tesseract (kostenlos)
- [x] ~~Eingebetteter Dokument-Viewer fehlt in veröffentlichter Artikelansicht~~ Erledigt in Iteration 31
- [x] ~~Separater "Dokument einbetten"-Button im Editor~~ Erledigt in Iteration 31
- [x] ~~Pinnwand-Kategorien nur für Admins sichtbar~~ Erledigt in Iteration 31
- [x] ~~Pinnwand-Checkbox nur für Admins im Kategorie-Dialog~~ Erledigt in Iteration 31
- [x] ~~Ablauf-Datum Reminder auf Dashboard~~ Erledigt in Iteration 34
- [x] ~~"Dokument" Tab aus Link-Dialog entfernen~~ Erledigt in Iteration 35

### P3 (Nice to Have)
- [ ] Handschrift-OCR verbessern (Tesseract hat Limitationen)

### Iteration 33 - 25.03.2026
- **Feature**: Kategorie-Verwaltung direkt auf der Artikel-Seite
  - "Neue Kategorie" Button im Header (nur für Admins)
  - Kontextmenü (Hover "...") an jeder Kategorie: Bearbeiten, Unterkategorie erstellen, Löschen
  - Dialoge für Erstellen/Bearbeiten/Löschen mit Name, Beschreibung, Pinnwand-Checkbox
  - Container verbreitert (w-80) mit horizontalem Scrollen
  - Pinnwand-Filter für Nicht-Admins auch im Kategoriebaum der Artikel-Seite
- **Fix**: Kategorien expandieren per Klick auf gesamte Zeile (nicht nur Pfeil)
- **Fix**: Pinnwand-Kategorien überall ausgeblendet für Nicht-Admins (Dashboard-Tab, QuickSearch, ArticleEditor Kategorieauswahl)
- **Fix**: Zellenfarbe im Editor repariert (TableCell/TableHeader um backgroundColor-Attribut erweitert) + 15 Farben im Grid
- **Fix**: Gruppen-beschränkte Artikel aus Suchergebnissen ausgeblendet für Nicht-Gruppenmitglieder (search.py Visibility-Filter)
- **Bug Fix**: Eingebetteter Dokument-Viewer (iframe) wird jetzt in der veröffentlichten Artikelansicht korrekt angezeigt
  - `EmbeddedDocument.jsx`: `renderHTML()` gibt jetzt vollständiges HTML mit iframe aus, `addAttributes()` nutzt `data-*` Attribute
  - `ArticleView.jsx`: `useRef` + `useEffect` post-prozessiert `div[data-embedded-document]` Elemente und injiziert Viewer-HTML (handles alte + neue Formate)
- **Neues Feature**: Separater "Dokument einbetten"-Button (FileInput-Icon) in der Editor-Toolbar
  - Öffnet einen dedizierten Dialog zum Durchsuchen der Dokumentbibliothek
  - Bietet "Einbetten (Viewer)" und "Link einfügen" Modi
  - Unabhängig vom bestehenden Link-Dialog
- **Bug Fix**: Schnellsuche (Ctrl+K) gab keine Ergebnisse zurück
  - Ursache: `cmdk`-Bibliothek filterte client-seitig nach Item-Value (nur IDs), nicht nach Titel
  - Fix: `shouldFilter={false}` an `CommandDialog` übergeben, manuelle "Keine Ergebnisse" Logik

### Iteration 34 - 25.03.2026
- **Feature**: Drag & Drop Verbesserungen für Artikel
  - **Hover-Verzögerung bei Kategorie-Drop**: Wenn ein Artikel über eine Kategorie gezogen wird, erscheint ein Fortschrittsbalken. Der Artikel wird erst nach 600ms Hover-Zeit in die Kategorie verschoben (Bestätigungsdialog).
  - **Per-User Artikel-Sortierung**: Benutzer können Artikel per Drag & Drop innerhalb einer Kategorie umsortieren. Die Reihenfolge wird pro Benutzer in der Datenbank gespeichert.
  - GripVertical-Icons erscheinen links neben Artikeln, wenn eine Kategorie ausgewählt ist
  - "Eigene Sortierung" Badge und Reset-Button werden angezeigt, wenn eine benutzerdefinierte Reihenfolge aktiv ist
  - Toast-Benachrichtigungen: "Reihenfolge gespeichert" / "Sortierung zurückgesetzt"
- **Neue Backend-Routen**: `/app/backend/routes/sort_preferences.py`
  - `GET /api/sort-preferences` - Alle Sortierpreferenzen des Benutzers
  - `GET /api/sort-preferences/{category_id}` - Sortierpreferenz für eine Kategorie
  - `PUT /api/sort-preferences/{category_id}` - Sortierfolge speichern
  - `DELETE /api/sort-preferences/{category_id}` - Sortierung zurücksetzen
- **Neues Model**: `UserSortPreference` (user_id, category_id, article_order[])
- **Frontend-Änderungen**: `Articles.jsx`
  - `@dnd-kit/sortable` Integration für Artikel-Reordering
  - `SortableArticle` Komponente ersetzt `DraggableArticle`
  - `DroppableCategoryItem` erweitert um Hover-Delay-Logik mit Progress-Indikator
  - `SortableContext` für Artikelliste

- **Feature**: Ablauf-Datum Reminder auf dem Dashboard
  - Neue Sektion "Bald ablaufende Artikel" zeigt selbsterstellte Artikel mit Ablaufdatum <= 14 Tage
  - Farbcodierte Dringlichkeit:
    - **Rot**: <= 3 Tage verbleibend
    - **Orange**: <= 7 Tage verbleibend
    - **Amber**: <= 14 Tage verbleibend
  - Zeigt verbleibende Tage als Badge ("Noch X Tage", "Morgen", "Heute!")
  - Klick auf Artikel öffnet Editor zum Verlängern des Ablaufdatums
  - Info-Hinweis unter der Sektion
  - Backend: `expiring_articles` Array im `/api/stats` Endpunkt

- **Feature**: Leseaufgaben-System (Reading Assignments)
  - **Editor**: Neue "Leseaufgabe"-Karte mit Checkbox "Als Leseaufgabe zuweisen"
    - Bei Aktivierung erscheinen Benutzer- und Gruppen-Auswahllisten
    - Button "Leseaufgaben zuweisen & benachrichtigen" speichert und versendet E-Mails
  - **Dashboard**: Neuer Container "Leseaufgaben" für ungelesene, zugewiesene Artikel
    - Orange Styling mit "Ungelesen" Badge und pulsierender Animation
    - CheckCircle2-Button zum direkten Markieren als gelesen
    - Artikel verschwinden nach Markierung aus der Liste
  - **Artikel-Ansicht**: Orange Banner für zugewiesene Artikel
    - "Dieser Artikel wurde Ihnen als Leseaufgabe zugewiesen"
    - "Als gelesen markieren"-Button
    - Grüner Banner nach dem Markieren als gelesen
  - **Lesebestätigungs-Analyse** (nur für Autor/Admin sichtbar):
    - Neuer Bereich neben der Änderungshistorie in der Artikelansicht
    - Badge zeigt X/Y (bestätigt/gesamt) mit Farbcodierung (grün/orange)
    - **Ausstehende Bestätigungen**: Orange Box mit User-Avataren (Initialen), Namen und Zuweisungsdatum
    - **Bestätigt**: Grüne Box mit User-Avataren (Initialen), Namen und Lesedatum
    - **Erfolgsmeldung**: Grüne Box wenn alle bestätigt haben ("Alle Lesebestätigungen erhalten")
  - **Backend-API** (`/app/backend/routes/reading_assignments.py`):
    - `POST /api/reading-assignments` - Leseaufgaben erstellen
    - `GET /api/reading-assignments/my-assignments` - Eigene ungelesene Artikel
    - `POST /api/reading-assignments/mark-as-read` - Als gelesen markieren
    - `GET /api/reading-assignments/status/{article_id}` - Lesestatus prüfen
    - `GET /api/reading-assignments/article/{article_id}/all-status` - Alle Bestätigungen (nur Autor/Admin)
    - `DELETE /api/reading-assignments/{article_id}` - Zuweisungen entfernen
  - **E-Mail-Benachrichtigung**: `send_reading_assignment_notification` im Email-Service

- **Cleanup**: "Dokument" Tab aus Link-Dialog entfernt
  - Der Link-Dialog zeigt jetzt nur noch URL-Eingabe (kein Tab-Menü mehr)
  - Dokumente können über den separaten "Dokument einbetten"-Button eingefügt werden
  - Vereinfachte UI ohne redundante Funktionen

- **Bug Fix**: Kategorie-Verwaltung jetzt auch für Editoren sichtbar
  - Editoren sehen jetzt das Drei-Punkte-Menü beim Hover über Kategorien
  - Editoren können Kategorien erstellen, bearbeiten und löschen
  - "Neue Kategorie" Button ist für Editoren sichtbar
  - Pinnwand-Checkbox im Kategorie-Dialog bleibt nur für Admins sichtbar

- **Bug Fix**: Pinnwand-Tab jetzt für alle Benutzer sichtbar
  - Pinnwand- und Dashboard-Tabs sind für alle Rollen sichtbar (Admin, Editor, Viewer)
  - Pinnwand ist jetzt der Standard-Tab für alle Benutzer beim Öffnen der Home-Seite

### Phase 1: Große Feature-Erweiterungen (27.03.2026)

- **Dashboard-Neugestaltung**: 
  - Pinnwand ist jetzt als erste Sektion oben im Dashboard integriert (keine Tabs mehr)
  - Neue "Abgelaufene Artikel"-Sektion mit Ausblend-Funktion pro Artikel und "Alle ausblenden"-Button
  - Navigation zu Artikeln speichert jetzt den Ursprungsort für "Zurück"-Navigation

- **Ansprechpartner Mehrfachauswahl**:
  - Mehrere Ansprechpartner können jetzt pro Artikel ausgewählt werden
  - **Suchfunktion** zum schnellen Finden von Benutzern
  - Radio-Button bestimmt, welcher Ansprechpartner Mail-Benachrichtigungen erhält
  - Kommentar-Benachrichtigungen gehen nur an den ausgewählten Benachrichtigungsempfänger

- **Edit-Berechtigungen für Artikel**:
  - Neues Feld "Bearbeitungsrechte" im ArticleEditor
  - **Suchfunktion** zum schnellen Finden von Benutzern
  - Benutzer und Gruppen können spezifisch für die Bearbeitung freigegeben werden
  - Nur Berechtigte + Autor + Admins können den Artikel bearbeiten (wenn gesetzt)

- **Leseaufgaben mit Mail-Option**:
  - **Suchfunktion** zum schnellen Finden von Benutzern
  - **"Alle auswählen"/"Keine auswählen"** Buttons für Benutzer und Gruppen
  - Neue Checkbox "Benutzer per E-Mail benachrichtigen" bei Leseaufgaben
  - Emails werden nur versendet, wenn die Option aktiviert ist

- **Breadcrumbs überall**:
  - Vollständige Kategorie-Hierarchie als klickbare Breadcrumbs
  - Dashboard: Artikelkarten zeigen Breadcrumbs
  - Artikelübersicht: Artikelkarten zeigen Breadcrumbs (wenn keine Kategorie gewählt)
  - Suchergebnisse: Ergebnisse zeigen Breadcrumbs
  - Artikelansicht: Vollständiger Pfad über dem Artikel

- **Benachrichtigungs-Zentrale** (Header):
  - Glocken-Icon mit Badge zeigt Anzahl ungelesener Benachrichtigungen
  - Panel zeigt Leseaufgaben, bald ablaufende und abgelaufene Artikel
  - Direkte Aktionen: Als gelesen markieren, Ausblenden
  - Auto-Refresh alle 2 Minuten

- **Lösch-Bestätigung mit "DELETE"-Eingabe**:
  - Artikel, Kategorien und Benutzer erfordern jetzt die Eingabe von "DELETE" zur Bestätigung
  - Zusätzlicher Schutz vor versehentlichem Löschen

- **User-Löschung mit Artikelübertragung**:
  - Bei Löschung eines Users mit Artikeln wird nach einem Zielbenutzer gefragt
  - Alle Artikel werden automatisch auf den neuen Benutzer übertragen
  - DELETE-Bestätigung erforderlich

- **Pinnwand für Editoren freigeben**:
  - Editoren sehen jetzt Pinnwand-Kategorien im Editor und in der Artikelübersicht
  - Editoren können Artikel zu Pinnwand-Kategorien hinzufügen

- **Kategorien-Sidebar verbessert**:
  - Breitere Kategorien-Sidebar (w-96 statt w-80)
  - Horizontales Scrolling bei vielen Sub-Ordnern

- **Wiedervorlage entfernt**:
  - Das Wiedervorlage-Feld wurde aus dem Artikel-Editor entfernt

- **Änderungshistorie für Viewer ausblenden**:
  - Viewer-Rolle sieht die Versionshistorie nicht mehr in der Artikelansicht

- **Navigation zurück zum Ausgangsort**:
  - Nach Speichern/Veröffentlichen/Abbrechen navigiert der Editor zurück zum Ursprungsort
  - Session-basiertes Speichern der Herkunfts-URL

- **Kommentar-Benachrichtigungen**:
  - Ansprechpartner wird bei neuen Kommentaren automatisch per E-Mail benachrichtigt
  - Bei Kommentar-Löschung wird der Kommentarersteller benachrichtigt

### Dokument-Import im Artikel-Editor (27.03.2026)

- ✅ **Dokument-Import-Button** im Editor-Header ("Dokument importieren")
- ✅ **Import-Dialog** mit drei Tabs:
  - Bestehende Dokumente (aus der Dokumentenverwaltung)
  - Neue Datei hochladen (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX)
  - Google Drive (wenn verbunden)
- ✅ **Drei Import-Modi**:
  - **Als Text**: Dokumentinhalt wird direkt in den Editor eingefügt (inkl. Überschriften, Tabellen, Formatierungen)
  - **Einbetten**: Dokument wird als visueller Block mit "Dokument öffnen"-Link eingefügt
  - **Als Link**: Dokument wird als Hyperlink eingefügt (nur Verlinkung, kein Inhalt)
- ✅ **Vollständige Formaterhaltung**: Umlaute, Sonderzeichen, Tabellen werden korrekt übernommen
- ✅ **Neue UI-Komponente**: Mode-Auswahl-Buttons ("Als Text" / "Einbetten" / "Als Link") erscheinen nach Dokumentauswahl

### Schnellsuche Verbesserungen (27.03.2026)

- ✅ **Breadcrumbs in Suchergebnissen**: Artikel zeigen ihre Kategorie-Hierarchie (z.B. "Kanada > Westkanada")
- ✅ **Dokumenten-Volltextsuche**: Suche durchsucht auch den extrahierten Text von Dokumenten
- ✅ **Wortkombinationen**: Mehrere Suchbegriffe werden mit AND-Logik verknüpft (alle Wörter müssen vorkommen)
- ✅ **Kategorie-Breadcrumbs**: Auch Kategorien zeigen ihren Eltern-Pfad an

### Navigation nach Veröffentlichen (27.03.2026)

- ✅ **Artikelansicht nach Veröffentlichen**: Nach Klick auf "Veröffentlichen" wird der fertige Artikel angezeigt (nicht zurück zur Liste)
- ✅ **Speichern bleibt gleich**: "Speichern" navigiert weiterhin zurück zur Ursprungsseite

### Artikel-Übersicht Verbesserungen (27.03.2026)

- ✅ **Vollständige Breadcrumbs**: Kategorien werden mit vollständigem Pfad angezeigt (z.B. "Alle > Reiseart > Unterkünfte > Ranches" statt nur "Alle > Ranches")
- ✅ **Unterkategorie-Chips entfernt**: Die kleinen Ordner-Buttons unter der Breadcrumb-Zeile wurden entfernt
- ✅ **Klickbare Breadcrumbs**: Jeder Teil des Pfades ist anklickbar und führt zur entsprechenden Kategorie

### Drag & Drop für Dokumente (27.03.2026)

- ✅ **Drag & Drop Zone im Editor**: Dokumente können direkt in den Editor-Bereich gezogen werden
- ✅ **Unterstützte Formate**: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX
- ✅ **Automatisches Einbetten**: Dokumente werden automatisch als Viewer eingebettet
- ✅ **Visuelles Feedback**: Beim Ziehen erscheint ein Overlay mit Hinweis "Dokument hier ablegen"
- ✅ **Placeholder-Hinweis**: Editor-Placeholder zeigt "(oder Dokument hierher ziehen)"

### Migration für alte Dokument-Einbettungen (27.03.2026)

- ✅ **API-Endpoint**: `POST /api/articles/migrate-embedded-documents` (nur Admins)
- ✅ **Automatische Konvertierung**: Alte Formate werden auf das neue iframe-basierte Format aktualisiert

### Suchtreffer-Hervorhebung in Dokumenten (27.03.2026)

- ✅ **Highlight-Funktion**: Suchbegriffe werden in Dokumenten gelb hervorgehoben
- ✅ **Unterstützte Viewer**: HTML, Text, und Tabellen-Viewer
- ✅ **Such-Badge**: Anzeige der aktiven Suchbegriffe im Viewer-Header

### Alle Kategorien Aufklappen/Zuklappen (27.03.2026)

- ✅ **Toggle-Button**: "Aufklappen" / "Zuklappen" Button in der Kategorien-Sidebar
- ✅ **Schnelle Navigation**: Alle verschachtelten Kategorien mit einem Klick anzeigen
- ✅ **Visuelles Feedback**: Button-Text und Icon ändern sich je nach Zustand

### Erweiterter Link-Dialog im Artikel-Editor (27.03.2026)

- ✅ **Tabbed Link-Dialog**: Ketten-Icon in der Toolbar öffnet Dialog mit drei Tabs:
  - **URL**: Externe Links einfügen mit optionalem Anzeigetext
  - **Dokument**: Interne Dokumente suchen und als Link verknüpfen
  - **Artikel**: Veröffentlichte Artikel suchen und als Link verknüpfen
- ✅ **Textauswahl-Erkennung**: Bei ausgewähltem Text wird dieser automatisch als Link-Text verwendet
- ✅ **Dokument-Suche**: Live-Suche in der Dokumenten-Bibliothek
- ✅ **Artikel-Suche**: Live-Suche in veröffentlichten Artikeln mit Kategorie-Breadcrumbs
- ✅ **Bug-Fix**: Fehlende File-Icon-Import in lucide-react behoben

### Dokument-Import "Als Link" Fix (27.03.2026)

- ✅ **"Als Link"-Modus funktioniert**: Fügt einen klickbaren Link mit dem Dokumentnamen direkt in den Editor ein
- ✅ **EditorRef-Pattern**: RichTextEditor nutzt forwardRef, ArticleEditor fügt Links direkt über die TipTap-API ein

### Persistenter Dokumenten-Speicher (27.03.2026)

- ✅ **Speicherpfad geändert**: Von `/tmp/docs/` (ephemeral) auf `/app/data/docs/` (persistent)
- ✅ **Automatische Migration**: Bestehende Dateien werden beim Start automatisch kopiert
- ✅ **Pfad-Aktualisierung**: Datenbank-Einträge werden automatisch auf den neuen Pfad aktualisiert
- ✅ **Umgebungsvariable**: `DOCS_STORAGE_PATH` kann über .env konfiguriert werden

### Benutzer group_ids Migration (27.03.2026)

- ✅ **Startup-Migration**: Alle Benutzer ohne `group_ids`-Feld erhalten automatisch `[]`
- ✅ **Neue Benutzer**: Admin-Panel und Google-OAuth-Erstellung setzen jetzt `group_ids: []`
- ✅ **Gruppen-Zuordnung**: Alle Benutzer können jetzt problemlos zu Gruppen hinzugefügt werden

### Einbettbares Such-Widget (30.03.2026)

- ✅ **Widget-Backend**: `/api/widget/search`, `/api/widget/article/{id}`, `/api/widget/document/{id}/preview`
- ✅ **CORS-Konfiguration**: Spezifische Origins (`lil-explorer.com`, `powerd.canusa.de`, `cpv.canusa.de`) mit korrekten Headers (inkl. Preflight)
- ✅ **Embeddable Script**: `/api/widget/embed.js` – eigenständiges JS per `<script data-api="...">` einbettbar, mit `Access-Control-Allow-Origin: *` Header
- ✅ **Suche auf Enter**: Ergebnisse werden nach Drücken der Enter-Taste geladen
- ✅ **Suchfunktion**: Live-Suche über veröffentlichte Artikel und Dokumente mit Term-Highlighting
- ✅ **Artikel-Popup**: Klick öffnet Overlay mit vollständigem HTML-Inhalt, Autor, Datum, Breadcrumb
- ✅ **Dokument-Popup**: Klick öffnet Overlay mit Dokumentvorschau (HTML/Text), Dateityp, Größe
- ✅ **Demo-Seite**: `/api/widget/demo` mit Einbettungs-Code-Anleitung
- ✅ **Neutrales Design**: Scoped CSS mit `cnx-`-Prefix, kein Framework-Abhängigkeit

## Backlog / Verbleibende Aufgaben

- Google Drive Bugs beheben (Export zu Shared Drives, falsche Dateiliste) - **ON HOLD**: Benutzer muss zuerst Test-URLs in Google Console eintragen
- Handschrift-OCR verbessern (ON HOLD)
