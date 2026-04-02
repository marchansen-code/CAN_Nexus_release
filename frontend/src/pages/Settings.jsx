import React, { useState, useContext } from "react";
import { AuthContext, API } from "@/App";
import { toast } from "sonner";
import {
  User,
  Code,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Bell,
  Palette,
  Download,
  Server,
  FileText,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import NotificationSettings from "@/components/NotificationSettings";
import ThemeSettings from "@/components/ThemeSettings";

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [copied, setCopied] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const widgetCode = `<!-- CANUSA Nexus Such-Widget -->
<div id="canusa-search"></div>
<script src="${backendUrl}/api/widget/embed.js"></script>`;

  const nginxConfig = `# Widget-Endpunkte (VOR dem /api/ Block!)
location /api/widget/ {
    proxy_pass http://canusa-backend:8001/api/widget/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_hide_header Access-Control-Allow-Origin;
    proxy_hide_header Access-Control-Allow-Methods;
    proxy_hide_header Access-Control-Allow-Headers;

    set $cors_origin "";
    if ($http_origin ~* "^https://(lil-explorer\\\\.com|powerd\\\\.canusa\\\\.de|cpv\\\\.canusa\\\\.de|nexus-knows\\\\.de)$") {
        set $cors_origin $http_origin;
    }

    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        add_header 'Access-Control-Max-Age' 1728000;
        return 204;
    }

    add_header 'Access-Control-Allow-Origin' $cors_origin always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
}`;

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast.success("In Zwischenablage kopiert");
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Administrator",
      editor: "Editor",
      viewer: "Betrachter"
    };
    return labels[role] || role;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-['Plus_Jakarta_Sans']">
          Einstellungen
        </h1>
        <p className="text-muted-foreground mt-1">
          Konfigurieren Sie Ihre Wissensdatenbank
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <Palette className="w-4 h-4" />
            Erscheinungsbild
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Code className="w-4 h-4" />
            API & Widget
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil-Informationen</CardTitle>
              <CardDescription>
                Ihre Kontodaten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user?.name}</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-2">
                    {getRoleLabel(user?.role)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Passwort ändern?</strong> Wenden Sie sich an einen Administrator, um Ihr Passwort zurücksetzen zu lassen.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-6">
          <ThemeSettings />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                REST-API Endpunkte
              </CardTitle>
              <CardDescription>
                Integrieren Sie die Wissensdatenbank in Ihre Systeme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Widget-Suche", method: "GET", path: "/api/widget/search?q=SUCHBEGRIFF", id: "search", desc: "Volltextsuche über Artikel und Dokumente" },
                { name: "Artikel abrufen", method: "GET", path: "/api/widget/article/ARTICLE_ID", id: "article", desc: "Artikel-Inhalt als HTML" },
                { name: "Dokument-Vorschau", method: "GET", path: "/api/widget/document/DOC_ID/preview", id: "doc-preview", desc: "PDF-Vorschau im Browser" },
                { name: "Dokument-Download", method: "GET", path: "/api/widget/document/DOC_ID/file", id: "doc-file", desc: "Originaldatei herunterladen" },
                { name: "Widget-Script", method: "GET", path: "/api/widget/embed.js", id: "embed", desc: "JavaScript-Widget zum Einbetten" },
                { name: "Raycast Extension", method: "GET", path: "/api/widget/raycast-extension", id: "raycast", desc: "Mac Raycast Extension als ZIP-Download" },
              ].map((endpoint) => (
                <div key={endpoint.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{endpoint.name}</p>
                    <code className="text-sm text-muted-foreground break-all">
                      {endpoint.method} {backendUrl}{endpoint.path}
                    </code>
                    <p className="text-xs text-muted-foreground mt-0.5">{endpoint.desc}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="shrink-0 ml-2"
                    onClick={() => copyToClipboard(`${backendUrl}${endpoint.path}`, endpoint.id)}
                  >
                    {copied === endpoint.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Widget Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Einbettbares Widget
              </CardTitle>
              <CardDescription>
                Fügen Sie diesen Code in Ihre Website ein, um das Such-Widget einzubetten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{widgetCode}</code>
                </pre>
                <Button 
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(widgetCode, 'widget')}
                >
                  {copied === 'widget' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Kopieren
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 p-3 rounded-r-lg text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-200">Live-Suche</p>
                <p className="text-blue-800 dark:text-blue-300 mt-1">
                  Das Widget sucht automatisch beim Tippen (nach 300ms Pause). Ergebnisse zeigen Artikel und Dokumente mit Popup-Vorschau.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Nginx CORS Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Nginx CORS-Konfiguration
              </CardTitle>
              <CardDescription>
                Damit das Widget auf externen Domains funktioniert, muss Nginx die CORS-Header korrekt setzen.
                Dieser Block muss <strong>vor</strong> dem allgemeinen <code>/api/</code> Block stehen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  <code>{nginxConfig}</code>
                </pre>
                <Button 
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(nginxConfig, 'nginx')}
                >
                  {copied === 'nginx' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Kopieren
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500 p-3 rounded-r-lg text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">Neue Domain hinzufügen?</p>
                <p className="text-amber-800 dark:text-amber-300 mt-1">
                  Erweitern Sie die Regex-Zeile um die neue Domain, z.B.: <code className="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">neue-domain\.de</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Raycast Extension Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Raycast Extension (Mac)
              </CardTitle>
              <CardDescription>
                Durchsuchen Sie den CANUSA Nexus direkt vom Mac-Desktop mit Raycast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Installieren Sie <a href="https://raycast.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Raycast</a> (kostenlos)</li>
                <li>Laden Sie die Extension herunter</li>
                <li>Entpacken Sie die ZIP-Datei</li>
                <li>Führen Sie im Ordner <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm install && npm run build</code> aus</li>
                <li>Importieren Sie die Extension in Raycast</li>
              </ol>
              <Button variant="outline" asChild>
                <a href={`${backendUrl}/api/widget/raycast-extension`} download>
                  <Download className="w-4 h-4 mr-2" />
                  Raycast Extension herunterladen
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* API Documentation Link */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">API-Dokumentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Vollständige Dokumentation aller verfügbaren Endpunkte (Swagger UI)
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a href={`${backendUrl}/docs`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Öffnen
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
