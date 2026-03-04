# CANUSA Nexus - The Knowledge Hub - PRD

## Original Problem Statement
Wissensmanagement-Plattform für CANUSA Touristik GmbH & Co. KG und CU-Travel.

## Technology Stack
- **Frontend**: React 18, TailwindCSS, Shadcn/UI, TipTap Rich Editor
- **Backend**: FastAPI, Python 3.11, bcrypt, reportlab (PDF), python-docx (Word)
- **Database**: MongoDB
- **Auth**: E-Mail/Passwort mit Session-Cookies

## Implemented Features

### Core Features
- ✅ E-Mail/Passwort Login
- ✅ Dashboard mit Statistiken, Favoriten, Beliebteste Artikel
- ✅ Keyword-basierte Suche mit Live-Vorschau
- ✅ Artikel-CRUD mit Status-Workflow
- ✅ Kategorieverwaltung (Baumstruktur)
- ✅ Dark/Light/Auto Theme-Mode

### Admin Features
- ✅ Benutzer anlegen mit E-Mail/Passwort
- ✅ Benutzer-Passwörter ändern
- ✅ User sperren und löschen
- ✅ Dokumente löschen
- ✅ Rollenverwaltung (Admin/Editor/Viewer)

### PDF Features
- ✅ PDF-Upload mit Duplikat-Prüfung
- ✅ PDF-Einbettung als iFrame
- ✅ Text-Extraktion mit Layout-Erhaltung

### Iteration 10 (23.02.2026 - abgeschlossen)
**Backup & Export Features:**

1. **Backup & Restore (Admin only)**
   - `GET /api/backup/preview` - Datenbank-Statistiken
   - `GET /api/backup/export` - JSON-Backup herunterladen
   - `POST /api/backup/import` - Backup wiederherstellen
   - Export enthält: Artikel, Kategorien, Benutzer (ohne Passwörter)
   - Import-Optionen: Merge-Modus, selektiver Import
   - Neue Frontend-Seite: `/backup`

2. **Artikel-Export**
   - `GET /api/articles/{id}/export/pdf` - PDF-Export (reportlab)
   - `GET /api/articles/{id}/export/docx` - Word-Export (python-docx)
   - Export-Dropdown in Artikel-Ansicht

## API Endpoints

### Backup (Admin only)
- `GET /api/backup/preview` - Statistiken abrufen
- `GET /api/backup/export` - JSON-Backup herunterladen
- `POST /api/backup/import` - Backup importieren

### Artikel-Export (alle Benutzer)
- `GET /api/articles/{id}/export/pdf` - Als PDF
- `GET /api/articles/{id}/export/docx` - Als Word

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Aktueller Benutzer
- `POST /api/auth/logout` - Logout

### Users (Admin only)
- `GET /api/users` - Alle Benutzer
- `POST /api/users` - Neuer Benutzer
- `PUT /api/users/{id}/role` - Rolle ändern
- `PUT /api/users/{id}/password` - Passwort ändern
- `PUT /api/users/{id}/block` - Sperren/Entsperren
- `DELETE /api/users/{id}` - Löschen

### Search
- `POST /api/search` - Volltext-Suche
- `GET /api/search/quick` - Schnellsuche

## Default Admin
- **E-Mail**: marc.hansen@canusa.de
- **Passwort**: CanusaNexus2024!

## Deployment

### Docker
```bash
cd deployment
cp .env.example .env
docker-compose up -d
```

Siehe `/app/deployment/README.md` für vollständige Anleitung.

## Test Coverage
- Iteration 9: Backend 100% (28/28), Frontend 100%
- Iteration 10: Backend 100% (23/23), Frontend 100%
- Last tested: 23.02.2026

## Backlog

### P1 (High)
- [ ] Hierarchische Kategorie-Verwaltung UI
- [ ] Bild-Extraktion aus PDFs
- [ ] OCR für gescannte PDFs

### P2 (Medium)
- [ ] High-Fidelity PDF-Import (Tabellen → editierbares HTML)
- [ ] Artikel-Versionierung
- [ ] Schnellsuche (Strg+K)
- [ ] Backend Refactoring (server.py in Router aufteilen)

### P3 (Nice to Have)
- [ ] Mehrsprachige UI
- [ ] Analytics Dashboard
