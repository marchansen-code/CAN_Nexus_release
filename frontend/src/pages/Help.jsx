import React, { useState } from "react";
import {
  Home,
  Search,
  FileText,
  Upload,
  Users,
  UsersRound,
  Trash2,
  Database,
  Settings,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Shield,
  MessageSquare,
  Lock,
  History,
  HelpCircle,
  Keyboard,
  FolderTree,
  Star,
  CalendarClock,
  Bell,
  GripVertical,
  Eye,
  Edit,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  { id: "overview", label: "Übersicht & Erste Schritte", icon: BookOpen },
  { id: "tipps", label: "Tipps und Best Practices", icon: Lightbulb },
  { id: "backup", label: "Backup, Versionen & Papierkorb", icon: History },
  { id: "admin", label: "Benutzerverwaltung (Admin)", icon: Shield },
  { id: "comments", label: "Kommentare & Diskussionen", icon: MessageSquare },
  { id: "permissions", label: "Berechtigungen & Lesebestätigungen", icon: Lock },
];

const InfoBox = ({ type = "info", children }) => {
  const styles = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 text-blue-900 dark:text-blue-200",
    tip: "bg-emerald-50 dark:bg-emerald-900/20 border-l-emerald-500 text-emerald-900 dark:text-emerald-200",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-l-amber-500 text-amber-900 dark:text-amber-200",
    danger: "bg-red-50 dark:bg-red-900/20 border-l-red-500 text-red-900 dark:text-red-200",
  };
  return (
    <div className={`border-l-4 p-4 my-4 rounded-r-lg text-sm ${styles[type]}`}>
      {children}
    </div>
  );
};

const Kbd = ({ children }) => (
  <kbd className="bg-muted border px-1.5 py-0.5 rounded text-xs font-mono">{children}</kbd>
);

const SectionOverview = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Der CANUSA Nexus ist Ihre zentrale Wissensplattform für die Verwaltung und den Austausch von Unternehmenswissen.
    </p>

    <InfoBox type="tip">
      <strong>Tipp:</strong> Nutzen Sie <Kbd>Strg</Kbd>+<Kbd>K</Kbd> um jederzeit die Schnellsuche zu öffnen!
    </InfoBox>

    <h3 className="text-lg font-semibold mt-6">Die Hauptbereiche im Überblick</h3>
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium w-40">Bereich</th>
            <th className="text-left p-3 font-medium">Beschreibung</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <tr><td className="p-3 font-medium flex items-center gap-2"><Home className="w-4 h-4" /> Home</td><td className="p-3">Ihr Dashboard mit Pinnwand, ablaufenden Artikeln und zuletzt angesehenen Inhalten</td></tr>
          <tr><td className="p-3 font-medium"><div className="flex items-center gap-2"><Search className="w-4 h-4" /> Suche</div></td><td className="p-3">Erweiterte Suche mit Filtern nach Status, Kategorie und Datum</td></tr>
          <tr><td className="p-3 font-medium"><div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Artikel</div></td><td className="p-3">Alle Wissensartikel, organisiert in Kategorien</td></tr>
          <tr><td className="p-3 font-medium"><div className="flex items-center gap-2"><Upload className="w-4 h-4" /> Dokumente</div></td><td className="p-3">Hochgeladene Dateien (PDF, Word, Excel, etc.)</td></tr>
          <tr><td className="p-3 font-medium"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> Benutzer</div></td><td className="p-3">Benutzerverwaltung (nur für Admins)</td></tr>
          <tr><td className="p-3 font-medium"><div className="flex items-center gap-2"><UsersRound className="w-4 h-4" /> Gruppen</div></td><td className="p-3">Gruppen für Berechtigungen verwalten</td></tr>
          <tr><td className="p-3 font-medium"><div className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Papierkorb</div></td><td className="p-3">Gelöschte Artikel wiederherstellen</td></tr>
        </tbody>
      </table>
    </div>

    <h3 className="text-lg font-semibold mt-6">Die drei Benutzerrollen</h3>
    <div className="grid sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Eye className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <p className="font-semibold">Viewer</p>
          <p className="text-xs text-muted-foreground mt-1">Artikel lesen, Dokumente ansehen, Suchen, Kommentare schreiben</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Edit className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
          <p className="font-semibold">Editor</p>
          <p className="text-xs text-muted-foreground mt-1">Alles von Viewer + Artikel erstellen/bearbeiten, Dokumente hochladen, Kategorien verwalten</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Crown className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="font-semibold">Admin</p>
          <p className="text-xs text-muted-foreground mt-1">Alles von Editor + Benutzer verwalten, Gruppen erstellen, Systemeinstellungen</p>
        </CardContent>
      </Card>
    </div>

    <h3 className="text-lg font-semibold mt-6">In 4 Schritten starten</h3>
    <ol className="list-decimal list-inside space-y-2 text-sm">
      <li><strong>Anmelden</strong> — Geben Sie Ihre E-Mail und Ihr Passwort auf der Login-Seite ein</li>
      <li><strong>Dashboard ansehen</strong> — Nach dem Login sehen Sie sofort wichtige Neuigkeiten und die Pinnwand</li>
      <li><strong>Schnellsuche nutzen</strong> — Drücken Sie <Kbd>Strg</Kbd>+<Kbd>K</Kbd> und tippen Sie los</li>
      <li><strong>Artikel erkunden</strong> — Klicken Sie auf "Artikel" in der Seitenleiste und stöbern Sie in den Kategorien</li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Tastaturkürzel</h3>
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium w-48">Tastenkombination</th>
            <th className="text-left p-3 font-medium">Funktion</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <tr><td className="p-3"><Kbd>Strg</Kbd> + <Kbd>K</Kbd></td><td className="p-3">Schnellsuche öffnen (funktioniert von überall)</td></tr>
          <tr><td className="p-3"><Kbd>Esc</Kbd></td><td className="p-3">Dialog oder Popup schließen</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);

const SectionTipps = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Die 5 wichtigsten Tipps</h3>
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium w-12">#</th>
            <th className="text-left p-3 font-medium">Tipp</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <tr><td className="p-3 font-bold">1</td><td className="p-3"><Kbd>Strg</Kbd>+<Kbd>K</Kbd> ist Ihr bester Freund — Schnellsuche von überall!</td></tr>
          <tr><td className="p-3 font-bold">2</td><td className="p-3">"Aufklappen" zeigt alle Kategorien auf einmal</td></tr>
          <tr><td className="p-3 font-bold">3</td><td className="p-3">Dokumente per Drag & Drop direkt in den Editor ziehen</td></tr>
          <tr><td className="p-3 font-bold">4</td><td className="p-3">Breadcrumbs anklicken für schnelle Navigation</td></tr>
          <tr><td className="p-3 font-bold">5</td><td className="p-3">Ablaufdaten setzen für zeitlich begrenzte Informationen</td></tr>
        </tbody>
      </table>
    </div>

    <h3 className="text-lg font-semibold mt-6">Gute Artikel schreiben</h3>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li><strong>Klare Titel</strong> — Der Titel sollte den Inhalt beschreiben</li>
      <li><strong>Überschriften nutzen</strong> — Strukturieren Sie lange Artikel mit H2/H3</li>
      <li><strong>Kurze Absätze</strong> — Max. 3-4 Sätze pro Absatz</li>
      <li><strong>Listen statt Fließtext</strong> — Aufzählungen sind leichter zu scannen</li>
      <li><strong>Tabellen für Daten</strong> — Strukturierte Infos gehören in Tabellen</li>
    </ul>

    <h3 className="text-lg font-semibold mt-6">Kategorien sinnvoll nutzen</h3>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li><strong>Nicht zu tief verschachteln</strong> — Max. 3-4 Ebenen</li>
      <li><strong>Eindeutige Namen</strong> — "Mietwagen USA" statt nur "Infos"</li>
      <li><strong>Regelmäßig aufräumen</strong> — Leere Kategorien löschen</li>
    </ul>

    <h3 className="text-lg font-semibold mt-6">Dokumente organisieren</h3>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li><strong>Sprechende Dateinamen</strong> — <code className="bg-muted px-1 py-0.5 rounded text-xs">Reisevertrag_2024_Muster.pdf</code> statt <code className="bg-muted px-1 py-0.5 rounded text-xs">Dokument1.pdf</code></li>
      <li><strong>Tags vergeben</strong> — Erleichtert die Suche</li>
      <li><strong>Veraltetes archivieren</strong> — Halten Sie die Liste aktuell</li>
    </ul>

    <h3 className="text-lg font-semibold mt-6">Zusammenarbeit</h3>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li><strong>Ansprechpartner festlegen</strong> — So weiß jeder, wen er fragen kann</li>
      <li><strong>Kommentare nutzen</strong> — Feedback direkt am Artikel</li>
      <li><strong>Lesebestätigungen</strong> — Bei wichtigen Änderungen</li>
      <li><strong>Regelmäßig aktualisieren</strong> — Veraltete Infos sind schlimmer als keine</li>
    </ul>

    <h3 className="text-lg font-semibold mt-6">Ablaufdaten richtig nutzen</h3>
    <p className="text-sm">Für zeitlich begrenzt gültige Informationen:</p>
    <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
      <li>Setzen Sie ein <strong>Ablaufdatum</strong> im Editor</li>
      <li>Der Artikel erscheint rechtzeitig unter "Bald ablaufend"</li>
      <li>Aktualisieren oder archivieren Sie den Inhalt vor Ablauf</li>
    </ol>
    <InfoBox type="tip">
      <strong>Profi-Tipp:</strong> Setzen Sie das Ablaufdatum 1-2 Wochen VOR dem tatsächlichen Ablauf, damit Zeit zur Aktualisierung bleibt!
    </InfoBox>
  </div>
);

const SectionBackup = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Versionshistorie — Nichts geht verloren</h3>
    <p className="text-sm">Jede Änderung an einem Artikel wird gespeichert:</p>
    <InfoBox type="info">
      <strong>Wo finde ich das?</strong><br />
      Öffnen Sie einen Artikel und klicken Sie auf <strong>"Versionen"</strong> in der rechten Spalte.
    </InfoBox>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li>Sehen Sie alle bisherigen Versionen mit Datum und Autor</li>
      <li>Vergleichen Sie Änderungen</li>
      <li>Stellen Sie eine frühere Version wieder her</li>
    </ul>
    <InfoBox type="warning">
      <strong>Hinweis:</strong> Viewer sehen die Versionshistorie aus Datenschutzgründen nicht.
    </InfoBox>

    <h3 className="text-lg font-semibold mt-6">Der Papierkorb</h3>
    <p className="text-sm">Gelöschte Artikel sind nicht sofort weg:</p>
    <InfoBox type="info">
      <strong>Wo ist das?</strong><br />
      Klicken Sie auf <strong>"Papierkorb"</strong> in der Seitenleiste.
    </InfoBox>
    <p className="text-sm">Im Papierkorb können Sie:</p>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li><strong>Wiederherstellen</strong> — Der Artikel ist zurück</li>
      <li><strong>Endgültig löschen</strong> — Unwiderruflich entfernen</li>
    </ul>

    <h3 className="text-lg font-semibold mt-6">Artikel löschen — Sicherheitsabfrage</h3>
    <p className="text-sm">Das Löschen erfordert eine explizite Bestätigung:</p>
    <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
      <li>Klicken Sie auf das Löschen-Symbol beim Artikel</li>
      <li>Geben Sie <strong>DELETE</strong> in das Bestätigungsfeld ein</li>
      <li>Klicken Sie auf "Löschen"</li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Backup (Admin)</h3>
    <InfoBox type="info">
      <strong>Wo ist das?</strong><br />
      Klicken Sie auf <strong>"Backup"</strong> in der Seitenleiste (nur für Admins sichtbar).
    </InfoBox>
    <p className="text-sm">Administratoren können:</p>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li>Manuelle Backups erstellen</li>
      <li>Backup-Historie einsehen</li>
      <li>Daten bei Bedarf wiederherstellen</li>
    </ul>
  </div>
);

const SectionAdmin = () => (
  <div className="space-y-6">
    <InfoBox type="danger">
      <strong>Nur für Administratoren</strong><br />
      Diese Funktionen sind nur für Benutzer mit der Rolle "Admin" verfügbar.
    </InfoBox>

    <h3 className="text-lg font-semibold">Neuen Benutzer anlegen</h3>
    <InfoBox type="info">
      <strong>Wo finde ich das?</strong><br />
      Klicken Sie auf <strong>"Benutzer"</strong> in der Seitenleiste, dann auf <strong>"Neuer Benutzer"</strong>.
    </InfoBox>
    <ol className="list-decimal list-inside space-y-1 text-sm">
      <li><strong>Name</strong> eingeben — Wird überall im System angezeigt</li>
      <li><strong>E-Mail</strong> eingeben — Für Login und Benachrichtigungen</li>
      <li><strong>Passwort</strong> vergeben — Mindestens 6 Zeichen</li>
      <li><strong>Rolle</strong> auswählen:
        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
          <li><Eye className="w-3 h-3 inline" /> <strong>Viewer</strong> — Nur lesen</li>
          <li><Edit className="w-3 h-3 inline" /> <strong>Editor</strong> — Lesen und schreiben</li>
          <li><Crown className="w-3 h-3 inline" /> <strong>Admin</strong> — Vollzugriff</li>
        </ul>
      </li>
      <li>Auf <strong>"Erstellen"</strong> klicken</li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Benutzer bearbeiten</h3>
    <ol className="list-decimal list-inside space-y-1 text-sm">
      <li>Klicken Sie auf den Benutzer in der Liste</li>
      <li>Ändern Sie Name, E-Mail oder Rolle</li>
      <li>Klicken Sie auf <strong>"Speichern"</strong></li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Benutzer löschen</h3>
    <InfoBox type="warning">
      <strong>Wichtig:</strong> Beim Löschen werden Sie nach einem <strong>Nachfolger</strong> gefragt!
    </InfoBox>
    <ol className="list-decimal list-inside space-y-1 text-sm">
      <li>Klicken Sie auf das Löschen-Symbol</li>
      <li>Wählen Sie einen Benutzer, der die <strong>Artikel übernehmen</strong> soll</li>
      <li>Bestätigen Sie mit <strong>"Löschen und übertragen"</strong></li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Gruppen verwalten</h3>
    <InfoBox type="info">
      <strong>Wo ist das?</strong><br />
      Klicken Sie auf <strong>"Gruppen"</strong> in der Seitenleiste.
    </InfoBox>
    <p className="text-sm">Gruppen erleichtern die Rechtevergabe:</p>
    <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
      <li>Erstellen Sie eine Gruppe (z.B. "Marketing-Team")</li>
      <li>Fügen Sie Benutzer hinzu</li>
      <li>Nutzen Sie die Gruppe bei Bearbeitungsberechtigungen</li>
    </ol>
  </div>
);

const SectionComments = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Kommentar schreiben</h3>
    <InfoBox type="info">
      <strong>Wo finde ich das?</strong><br />
      Scrollen Sie im Artikel ganz nach unten. Der Kommentarbereich befindet sich unter dem Artikelinhalt.
    </InfoBox>
    <ol className="list-decimal list-inside space-y-1 text-sm">
      <li>Schreiben Sie Ihren Kommentar in das Textfeld</li>
      <li>Klicken Sie auf <strong>"Kommentar senden"</strong></li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Wer wird benachrichtigt?</h3>
    <p className="text-sm">Der <strong>Ansprechpartner</strong> des Artikels wird automatisch informiert:</p>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li>Im Benachrichtigungs-Center (Glocke oben rechts)</li>
      <li>Per E-Mail (wenn aktiviert)</li>
    </ul>

    <h3 className="text-lg font-semibold mt-6">Kommentare löschen</h3>
    <p className="text-sm text-muted-foreground">(Für Autoren, Editoren und Admins)</p>
    <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
      <li>Fahren Sie mit der Maus über den Kommentar</li>
      <li>Klicken Sie auf das Papierkorb-Symbol</li>
      <li>Bestätigen Sie die Löschung</li>
    </ol>
    <InfoBox type="danger">
      <strong>Wichtig:</strong> Der Kommentar-Ersteller wird per E-Mail benachrichtigt, dass sein Kommentar entfernt wurde.
    </InfoBox>

    <h3 className="text-lg font-semibold mt-6">Kommentare deaktivieren</h3>
    <p className="text-sm">Möchten Sie keine Kommentare zu einem Artikel?</p>
    <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
      <li>Öffnen Sie den Artikel im Editor</li>
      <li>Deaktivieren Sie <strong>"Kommentare erlauben"</strong></li>
      <li>Speichern Sie den Artikel</li>
    </ol>
  </div>
);

const SectionPermissions = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Bearbeitungsberechtigungen</h3>
    <p className="text-sm">Sie können festlegen, <strong>wer einen Artikel bearbeiten darf</strong>:</p>
    <InfoBox type="info">
      <strong>Wo finde ich das?</strong><br />
      Im Artikel-Editor, scrollen Sie nach unten zum Bereich <strong>"Bearbeitungsberechtigungen"</strong>
    </InfoBox>
    <ol className="list-decimal list-inside space-y-1 text-sm">
      <li>Klicken Sie auf das Dropdown <strong>"Benutzer hinzufügen"</strong></li>
      <li>Suchen Sie nach Namen oder E-Mail</li>
      <li>Wählen Sie die gewünschten Personen aus</li>
      <li>Wiederholen Sie dies für <strong>"Gruppen hinzufügen"</strong> falls gewünscht</li>
    </ol>
    <InfoBox type="warning">
      <strong>Wichtig:</strong> Admins können IMMER alle Artikel bearbeiten, unabhängig von dieser Einstellung.
    </InfoBox>

    <h3 className="text-lg font-semibold mt-6">Lesebestätigungen anfordern</h3>
    <p className="text-sm">Für wichtige Artikel können Sie eine <strong>Bestätigung</strong> anfordern, dass jemand den Artikel gelesen hat:</p>
    <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
      <li>Öffnen Sie den Artikel im Editor</li>
      <li>Scrollen Sie zu <strong>"Lesebestätigung anfordern"</strong></li>
      <li>Suchen Sie nach Mitarbeitern im Dropdown</li>
      <li>Optional: Aktivieren Sie <strong>"E-Mail senden"</strong> für sofortige Benachrichtigung</li>
      <li>Klicken Sie auf <strong>"Hinzufügen"</strong></li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Als Leser: Bestätigung abgeben</h3>
    <p className="text-sm">Wenn Sie zur Lesebestätigung aufgefordert wurden:</p>
    <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
      <li>Öffnen Sie den Artikel</li>
      <li>Lesen Sie den Inhalt</li>
      <li>Klicken Sie auf <strong>"Gelesen bestätigen"</strong> am Ende des Artikels</li>
    </ol>

    <h3 className="text-lg font-semibold mt-6">Das Benachrichtigungs-Center</h3>
    <InfoBox type="info">
      <strong>Wo ist das?</strong><br />
      Klicken Sie auf das Glocken-Symbol oben rechts neben Ihrem Namen.
    </InfoBox>
    <p className="text-sm">Hier sehen Sie:</p>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li>Neue Lesebestätigungsanfragen</li>
      <li>Kommentare zu Ihren Artikeln</li>
      <li>Erwähnungen</li>
    </ul>

    <h3 className="text-lg font-semibold mt-6">E-Mail-Benachrichtigungen</h3>
    <p className="text-sm">Bei aktivierter E-Mail-Benachrichtigung erhalten Sie E-Mails bei:</p>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li>Neuen Lesebestätigungsanfragen</li>
      <li>Neuen Kommentaren (wenn Sie Ansprechpartner sind)</li>
      <li>Gelöschten Kommentaren (wenn Ihr Kommentar entfernt wurde)</li>
    </ul>
  </div>
);

const sectionComponents = {
  overview: SectionOverview,
  tipps: SectionTipps,
  backup: SectionBackup,
  admin: SectionAdmin,
  comments: SectionComments,
  permissions: SectionPermissions,
};

const Help = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div className="animate-fadeIn" data-testid="help-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" />
          How to Nexus
        </h1>
        <p className="text-muted-foreground mt-1">
          Anleitungen und Hilfe zur Nutzung des CANUSA Nexus
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar - section navigation */}
        <div className="lg:w-72 shrink-0">
          <Card className="lg:sticky lg:top-20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-muted-foreground font-medium">Inhalte</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      data-testid={`help-nav-${section.id}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{section.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right content area */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const s = sections.find(s => s.id === activeSection);
                  const Icon = s?.icon || BookOpen;
                  return (
                    <>
                      <Icon className="w-5 h-5 text-primary" />
                      {s?.label}
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActiveComponent />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
