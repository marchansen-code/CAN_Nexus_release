import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { 
  Trash2, 
  RotateCcw, 
  FileText, 
  File, 
  Clock, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";

const Trash = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, title: null });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/trash`);
      setArticles(response.data.articles || []);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Error fetching trash:", error);
      toast.error("Fehler beim Laden des Papierkorbs");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type, id) => {
    setActionLoading(`restore-${type}-${id}`);
    try {
      await axios.post(`${API}/trash/restore/${type}/${id}`);
      toast.success(type === "article" ? "Artikel wiederhergestellt" : "Dokument wiederhergestellt");
      fetchTrash();
    } catch (error) {
      toast.error("Fehler beim Wiederherstellen");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async () => {
    const { type, id } = deleteDialog;
    setActionLoading(`delete-${type}-${id}`);
    try {
      await axios.delete(`${API}/trash/permanent/${type}/${id}`);
      toast.success("Endgültig gelöscht");
      setDeleteDialog({ open: false, type: null, id: null, title: null });
      fetchTrash();
    } catch (error) {
      toast.error("Fehler beim Löschen");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanup = async () => {
    setActionLoading("cleanup");
    try {
      const response = await axios.post(`${API}/trash/cleanup`);
      toast.success(`Aufgeräumt: ${response.data.deleted_articles} Artikel, ${response.data.deleted_documents} Dokumente entfernt`);
      fetchTrash();
    } catch (error) {
      toast.error("Fehler beim Aufräumen");
    } finally {
      setActionLoading(null);
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

  const getDaysLeftBadge = (daysLeft) => {
    if (daysLeft <= 3) {
      return <Badge variant="destructive" className="ml-2">{daysLeft} Tage</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant="warning" className="ml-2 bg-amber-500">{daysLeft} Tage</Badge>;
    }
    return <Badge variant="secondary" className="ml-2">{daysLeft} Tage</Badge>;
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Zugriff verweigert</h2>
        <p className="text-muted-foreground">Nur Administratoren können den Papierkorb einsehen.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-red-500" />
            Papierkorb
          </h1>
          <p className="text-muted-foreground mt-1">
            Gelöschte Artikel und Dokumente werden nach 30 Tagen endgültig entfernt.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTrash} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCleanup}
            disabled={actionLoading === "cleanup"}
          >
            {actionLoading === "cleanup" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Alte Einträge löschen
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Artikel ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <File className="w-4 h-4" />
            Dokumente ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="mt-6">
          {articles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Keine gelöschten Artikel</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <Card key={article.article_id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{article.title}</h3>
                          {getDaysLeftBadge(article.days_until_permanent_deletion)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Gelöscht: {formatDate(article.deleted_at)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {article.status === "published" ? "Veröffentlicht" : "Entwurf"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleRestore("article", article.article_id)}
                          disabled={actionLoading === `restore-article-${article.article_id}`}
                        >
                          {actionLoading === `restore-article-${article.article_id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Wiederherstellen
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({
                            open: true,
                            type: "article",
                            id: article.article_id,
                            title: article.title
                          })}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Endgültig löschen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <File className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Keine gelöschten Dokumente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.document_id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{doc.filename}</h3>
                          {getDaysLeftBadge(doc.days_until_permanent_deletion)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Gelöscht: {formatDate(doc.deleted_at)}
                          </span>
                          {doc.file_size && (
                            <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleRestore("document", doc.document_id)}
                          disabled={actionLoading === `restore-document-${doc.document_id}`}
                        >
                          {actionLoading === `restore-document-${doc.document_id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Wiederherstellen
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({
                            open: true,
                            type: "document",
                            id: doc.document_id,
                            title: doc.filename
                          })}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Endgültig löschen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Endgültig löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteDialog.title}"</strong> wird unwiderruflich gelöscht. 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trash;
