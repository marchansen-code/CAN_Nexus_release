import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { toast } from "sonner";
import {
  Trash2,
  RefreshCw,
  Clock,
  FileText,
  File,
  Folder,
  AlertTriangle,
  RotateCcw,
  XCircle,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Trash = () => {
  const { user } = useContext(AuthContext);
  const [trash, setTrash] = useState({ articles: [], documents: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, title: null });
  const [restoreDialog, setRestoreDialog] = useState({ open: false, type: null, id: null, title: null });

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const res = await axios.get(`${API}/trash`);
      setTrash({
        articles: res.data.articles || [],
        documents: res.data.documents || [],
        categories: res.data.categories || []
      });
    } catch (error) {
      console.error("Failed to fetch trash:", error);
      toast.error("Papierkorb konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    const { type, id, title } = restoreDialog;
    try {
      await axios.post(`${API}/trash/restore/${type}/${id}`);
      toast.success(`"${title}" wurde wiederhergestellt`);
      fetchTrash();
    } catch (error) {
      toast.error("Wiederherstellen fehlgeschlagen");
    } finally {
      setRestoreDialog({ open: false, type: null, id: null, title: null });
    }
  };

  const handlePermanentDelete = async () => {
    const { type, id, title } = deleteDialog;
    try {
      await axios.delete(`${API}/trash/permanent/${type}/${id}`);
      toast.success(`"${title}" wurde endgültig gelöscht`);
      fetchTrash();
    } catch (error) {
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeleteDialog({ open: false, type: null, id: null, title: null });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getDaysLeftBadge = (days) => {
    if (days <= 3) {
      return <Badge variant="destructive" className="text-xs">{days} Tage</Badge>;
    } else if (days <= 10) {
      return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{days} Tage</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{days} Tage</Badge>;
  };

  // Item component with deleted_by info
  const TrashItem = ({ item, type, idField, titleField, icon: Icon, iconColor }) => {
    const id = item[idField];
    const title = item[titleField] || item.filename || "Unbenannt";
    
    return (
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{title}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Gelöscht am {formatDate(item.deleted_at)}
              </span>
              {item.deleted_by_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  von {item.deleted_by_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Verbleibend</p>
            {getDaysLeftBadge(item.days_until_permanent_deletion)}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRestoreDialog({ open: true, type, id, title })}
              title="Wiederherstellen"
            >
              <RotateCcw className="w-4 h-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialog({ open: true, type, id, title })}
              title="Endgültig löschen"
            >
              <XCircle className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (user?.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
        <p className="text-muted-foreground">Nur Administratoren können den Papierkorb einsehen.</p>
      </div>
    );
  }

  const totalItems = trash.articles.length + trash.documents.length + trash.categories.length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trash2 className="w-8 h-8 text-slate-500" />
          <div>
            <h1 className="text-2xl font-bold">Papierkorb</h1>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "Element" : "Elemente"} • Automatische Löschung nach 30 Tagen
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchTrash} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles" className="gap-2">
            <FileText className="w-4 h-4" />
            Artikel ({trash.articles.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <File className="w-4 h-4" />
            Dokumente ({trash.documents.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Folder className="w-4 h-4" />
            Ordner ({trash.categories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <CardTitle>Gelöschte Artikel</CardTitle>
              <CardDescription>
                Artikel können wiederhergestellt oder endgültig gelöscht werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {trash.articles.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Keine gelöschten Artikel</p>
              ) : (
                trash.articles.map((article) => (
                  <TrashItem
                    key={article.article_id}
                    item={article}
                    type="article"
                    idField="article_id"
                    titleField="title"
                    icon={FileText}
                    iconColor="text-blue-500"
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Gelöschte Dokumente</CardTitle>
              <CardDescription>
                Dokumente können wiederhergestellt oder endgültig gelöscht werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {trash.documents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Keine gelöschten Dokumente</p>
              ) : (
                trash.documents.map((doc) => (
                  <TrashItem
                    key={doc.document_id}
                    item={doc}
                    type="document"
                    idField="document_id"
                    titleField="title"
                    icon={File}
                    iconColor="text-amber-500"
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Gelöschte Ordner</CardTitle>
              <CardDescription>
                Ordner können wiederhergestellt oder endgültig gelöscht werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {trash.categories.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Keine gelöschten Ordner</p>
              ) : (
                trash.categories.map((cat) => (
                  <TrashItem
                    key={cat.category_id}
                    item={cat}
                    type="category"
                    idField="category_id"
                    titleField="name"
                    icon={Folder}
                    iconColor="text-emerald-500"
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialog.open} onOpenChange={(open) => !open && setRestoreDialog({ open: false, type: null, id: null, title: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Element wiederherstellen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie <strong>"{restoreDialog.title}"</strong> wiederherstellen?
              Das Element wird an seinen ursprünglichen Ort zurückverschoben.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
              Wiederherstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: null, title: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie <strong>"{deleteDialog.title}"</strong> endgültig löschen?
              <br /><br />
              <span className="text-red-500 font-medium">Diese Aktion kann nicht rückgängig gemacht werden!</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700">
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trash;
