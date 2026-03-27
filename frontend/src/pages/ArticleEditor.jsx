import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Clock,
  Tag,
  Loader2,
  FolderTree,
  User,
  AlertTriangle,
  X,
  CalendarIcon,
  Users,
  Check,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileEdit,
  MessageSquare,
  Maximize2,
  FileUp,
  Mail,
  BookOpen,
  UserCheck,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "@/components/RichTextEditor";
import FullscreenEditor from "@/components/FullscreenEditor";
import DocumentImportDialog from "@/components/DocumentImportDialog";
import ReviewRequestDialog from "@/components/dialogs/ReviewRequestDialog";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Category Tree Item for Selection
const CategoryTreeItem = ({ category, categories, selectedIds, onToggle, expandedIds, onToggleExpand, level = 0, canEdit }) => {
  const childCategories = categories.filter(c => c.parent_id === category.category_id).filter(c => canEdit || !c.is_pinnwand);
  const hasChildren = childCategories.length > 0;
  const isExpanded = expandedIds.has(category.category_id);
  const isSelected = selectedIds.includes(category.category_id);

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
          isSelected && "bg-primary/10 dark:bg-primary/20"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(category.category_id); }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          )
        ) : (
          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
        )}
        
        <Checkbox
          id={`cat-tree-${category.category_id}`}
          checked={isSelected}
          onCheckedChange={() => onToggle(category.category_id)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <label 
          htmlFor={`cat-tree-${category.category_id}`} 
          className="text-sm cursor-pointer flex-1 truncate"
        >
          {category.name}
        </label>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="border-l border-slate-200 dark:border-slate-700 ml-4">
          {childCategories.map(child => (
            <CategoryTreeItem
              key={child.category_id}
              category={child}
              categories={categories}
              selectedIds={selectedIds}
              onToggle={onToggle}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id: articleId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const isNew = !articleId || articleId === "new";
  
  // Get pre-selected category from URL
  const preSelectedCategory = searchParams.get("category");
  const fromPdf = searchParams.get("from_pdf") === "true";

  // Article state
  const [article, setArticle] = useState({
    title: "",
    content: "",
    category_ids: preSelectedCategory ? [preSelectedCategory] : [],
    status: "draft",
    tags: [],
    contact_person_id: null,
    contact_person_ids: [],
    contact_person_notify_id: null,
    visible_to_groups: [],
    expiry_date: null,
    is_important: false,
    important_until: null,
    comments_enabled: true,
    edit_permission_user_ids: [],
    edit_permission_group_ids: [],
    reading_assignment_enabled: false,
    reading_assignment_user_ids: [],
    reading_assignment_group_ids: [],
    reading_assignment_send_email: true
  });

  // UI state
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());
  const [pdfImported, setPdfImported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [savingReadingAssignment, setSavingReadingAssignment] = useState(false);
  const [returnUrl, setReturnUrl] = useState("/articles");
  
  // Search terms for user selection fields
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [editPermissionSearchTerm, setEditPermissionSearchTerm] = useState("");
  const [readingAssignmentSearchTerm, setReadingAssignmentSearchTerm] = useState("");

  // Store the origin URL on mount
  useEffect(() => {
    // Get the referring URL or use sessionStorage
    const referrer = sessionStorage.getItem('article_origin_url');
    if (referrer) {
      setReturnUrl(referrer);
    } else {
      // If no stored URL, use the current URL before navigation (from document.referrer)
      // or default to articles
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/articles/new') && !currentPath.includes('/edit')) {
        sessionStorage.setItem('article_origin_url', currentPath);
      }
    }
    
    // Cleanup on unmount
    return () => {
      // Don't clear immediately, let the navigation complete
    };
  }, []);

  // Helper function for navigation back to origin
  const navigateToOrigin = () => {
    const storedUrl = sessionStorage.getItem('article_origin_url');
    sessionStorage.removeItem('article_origin_url');
    
    if (storedUrl) {
      navigate(storedUrl);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/articles");
    }
  };

  // Check for PDF import data on mount
  useEffect(() => {
    if (fromPdf && isNew && !pdfImported) {
      const pdfData = sessionStorage.getItem('pdf_import_data');
      if (pdfData) {
        try {
          const { title, content, source_document_id } = JSON.parse(pdfData);
          setArticle(prev => ({
            ...prev,
            title: title || prev.title,
            content: content || prev.content,
          }));
          setPdfImported(true);
          // Clear the session storage after import
          sessionStorage.removeItem('pdf_import_data');
          toast.success(`PDF "${title}" wurde importiert. Bearbeiten Sie den Artikel nach Bedarf.`);
        } catch (e) {
          console.error("Failed to parse PDF import data:", e);
        }
      }
    }
  }, [fromPdf, isNew, pdfImported]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, userRes, groupRes, tagsRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/users`),
          axios.get(`${API}/groups`),
          axios.get(`${API}/tags`)
        ]);
        setCategories(catRes.data);
        setUsers(userRes.data);
        setGroups(groupRes.data);
        setAllTags(tagsRes.data.tags || []);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  // Load article if editing
  useEffect(() => {
    if (!isNew) {
      const loadArticle = async () => {
        try {
          const response = await axios.get(`${API}/articles/${articleId}`);
          const data = response.data;
          setArticle({
            ...data,
            category_ids: data.category_ids || (data.category_id ? [data.category_id] : []),
            visible_to_groups: data.visible_to_groups || [],
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
            important_until: data.important_until ? new Date(data.important_until) : null,
            comments_enabled: data.comments_enabled !== false,  // Default to true if not set
            contact_person_ids: data.contact_person_ids || (data.contact_person_id ? [data.contact_person_id] : []),
            contact_person_notify_id: data.contact_person_notify_id || data.contact_person_id || null,
            edit_permission_user_ids: data.edit_permission_user_ids || [],
            edit_permission_group_ids: data.edit_permission_group_ids || [],
            reading_assignment_enabled: data.reading_assignment_enabled || false,
            reading_assignment_user_ids: data.reading_assignment_user_ids || [],
            reading_assignment_group_ids: data.reading_assignment_group_ids || [],
            reading_assignment_send_email: data.reading_assignment_send_email !== false
          });
        } catch (error) {
          console.error("Failed to load article:", error);
          toast.error("Artikel konnte nicht geladen werden");
          navigate("/articles");
        } finally {
          setLoading(false);
        }
      };
      loadArticle();
    }
  }, [articleId, isNew, navigate]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(`${API}/images/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Bild hochgeladen");
      return `${API}/images/${response.data.image_id}`;
    } catch (error) {
      toast.error("Bild-Upload fehlgeschlagen");
      return null;
    }
  }, []);

  // Save handler
  const handleSave = async (newStatus) => {
    if (!article.title.trim()) {
      toast.error("Bitte geben Sie einen Titel ein");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...article,
        status: newStatus || article.status,
        expiry_date: article.expiry_date?.toISOString() || null,
        important_until: article.important_until?.toISOString() || null
      };

      let savedArticleId = articleId;
      
      if (isNew) {
        const response = await axios.post(`${API}/articles`, payload);
        savedArticleId = response.data.article_id;
        toast.success("Artikel erstellt");
      } else {
        await axios.put(`${API}/articles/${articleId}`, payload);
        toast.success("Artikel gespeichert");
      }
      
      // If publishing, navigate to the article view
      if (newStatus === "published" && savedArticleId) {
        sessionStorage.removeItem('article_origin_url');
        navigate(`/articles/${savedArticleId}`);
      } else {
        // Navigate back to origin for drafts/saves
        navigateToOrigin();
      }
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Artikel konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  };

  // Tag handling
  const handleAddTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !article.tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setArticle(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tag) => {
    setArticle(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  // Document import handler
  const handleDocumentImport = (importData) => {
    if (importData.mode === 'embed') {
      // Embed mode: Insert an embedded document viewer
      // Use data-embedded-document attribute for ArticleView to detect and render iframe
      const previewUrl = `${API}/documents/${importData.documentId}/preview`;
      const fileUrl = `${API}/documents/${importData.documentId}/file`;
      const embedHtml = `
        <div data-embedded-document="true" data-document-id="${importData.documentId}" data-filename="${importData.filename}" data-file-type="${importData.fileType || '.pdf'}" data-preview-url="${previewUrl}" data-file-url="${fileUrl}" style="margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
            <span style="font-weight: 500; font-size: 14px; color: #334155;">${importData.filename}</span>
            <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #2563eb; text-decoration: none;">Öffnen ↗</a>
          </div>
          <div style="height: 500px; position: relative;">
            <iframe src="${previewUrl}" style="width: 100%; height: 100%; border: 0;" title="${importData.filename}"></iframe>
          </div>
        </div>
      `;
      const separator = article.content ? '<hr class="my-6 border-slate-300" />' : '';
      const newContent = article.content + separator + embedHtml;
      setArticle(prev => ({ ...prev, content: newContent }));
    } else {
      // Text mode: Append imported content to existing content
      const separator = article.content ? '<hr class="my-6 border-slate-300" />' : '';
      const importHeader = `<p class="text-sm text-muted-foreground mb-2"><em>Importiert aus: ${importData.filename}</em></p>`;
      const newContent = article.content + separator + importHeader + importData.html;
      setArticle(prev => ({ ...prev, content: newContent }));
    }
    setShowImportDialog(false);
  };

  const filteredTags = allTags.filter(
    t => t.toLowerCase().includes(tagInput.toLowerCase()) && !article.tags.includes(t)
  );

  // Category toggle
  const toggleCategory = (categoryId) => {
    setArticle(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  // Toggle category expansion in tree
  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategoryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Get root categories (those without parent), filter pinnwand for viewers only
  const isAdmin = user?.role === "admin";
  const canEdit = user?.role === "admin" || user?.role === "editor";
  const rootCategories = categories.filter(c => !c.parent_id).filter(c => canEdit || !c.is_pinnwand);

  // Group toggle
  const toggleGroup = (groupId) => {
    setArticle(prev => ({
      ...prev,
      visible_to_groups: prev.visible_to_groups.includes(groupId)
        ? prev.visible_to_groups.filter(id => id !== groupId)
        : [...prev.visible_to_groups, groupId]
    }));
  };

  // Toggle reading assignment user
  const toggleReadingAssignmentUser = (userId) => {
    setArticle(prev => ({
      ...prev,
      reading_assignment_user_ids: prev.reading_assignment_user_ids.includes(userId)
        ? prev.reading_assignment_user_ids.filter(id => id !== userId)
        : [...prev.reading_assignment_user_ids, userId]
    }));
  };

  // Toggle reading assignment group
  const toggleReadingAssignmentGroup = (groupId) => {
    setArticle(prev => ({
      ...prev,
      reading_assignment_group_ids: prev.reading_assignment_group_ids.includes(groupId)
        ? prev.reading_assignment_group_ids.filter(id => id !== groupId)
        : [...prev.reading_assignment_group_ids, groupId]
    }));
  };

  // Save reading assignments
  const saveReadingAssignments = async () => {
    if (!articleId || isNew) return;
    
    setSavingReadingAssignment(true);
    try {
      if (article.reading_assignment_enabled && 
          (article.reading_assignment_user_ids.length > 0 || article.reading_assignment_group_ids.length > 0)) {
        await axios.post(`${API}/reading-assignments`, {
          article_id: articleId,
          user_ids: article.reading_assignment_user_ids,
          group_ids: article.reading_assignment_group_ids,
          send_email: article.reading_assignment_send_email !== false
        });
        toast.success(article.reading_assignment_send_email !== false 
          ? "Leseaufgaben zugewiesen - E-Mail-Benachrichtigungen werden versendet" 
          : "Leseaufgaben zugewiesen (ohne E-Mail)"
        );
      } else if (!article.reading_assignment_enabled) {
        // Remove assignments
        await axios.delete(`${API}/reading-assignments/${articleId}`);
        toast.success("Leseaufgaben entfernt");
      }
    } catch (error) {
      console.error("Failed to save reading assignments:", error);
      toast.error("Leseaufgaben konnten nicht gespeichert werden");
    } finally {
      setSavingReadingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn" data-testid="article-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={navigateToOrigin} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? "Neuer Artikel" : "Artikel bearbeiten"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {article.status === "draft" ? "Entwurf" : article.status === "published" ? "Veröffentlicht" : "Review"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Review Request Button - nur für bestehende Entwürfe */}
          {!isNew && article.status === "draft" && (
            <Button 
              variant="outline" 
              onClick={() => setShowReviewDialog(true)} 
              disabled={saving}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
              data-testid="review-request-btn"
            >
              <Mail className="w-4 h-4 mr-2" />
              Review anfordern
            </Button>
          )}
          {/* Zurück zu Entwurf Button - nur für veröffentlichte Artikel */}
          {!isNew && article.status === "published" && (
            <Button 
              variant="outline" 
              onClick={() => handleSave("draft")} 
              disabled={saving}
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
              data-testid="revert-to-draft-btn"
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Zurück zu Entwurf
            </Button>
          )}
          <Button variant="outline" onClick={() => handleSave(article.status)} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
          <Button onClick={() => handleSave("published")} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Veröffentlichen
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={article.title}
                onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Artikeltitel eingeben..."
                className="text-lg font-medium mt-2"
                data-testid="article-title"
              />
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inhalt</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportDialog(true)}
                  data-testid="import-document-btn"
                  title="PDF oder Office-Dokument importieren"
                >
                  <FileUp className="w-4 h-4 mr-1" />
                  Dokument importieren
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  data-testid="fullscreen-editor-btn"
                >
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Vollbild
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={article.content}
                onChange={(html) => setArticle(prev => ({ ...prev, content: html }))}
                placeholder="Artikelinhalt eingeben..."
                onImageUpload={handleImageUpload}
                onToggleFullscreen={() => setIsFullscreen(true)}
                data-testid="article-content-editor"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                Kategorien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Kategorien vorhanden</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {rootCategories.map(cat => (
                    <CategoryTreeItem
                      key={cat.category_id}
                      category={cat}
                      categories={categories}
                      selectedIds={article.category_ids}
                      onToggle={toggleCategory}
                      expandedIds={expandedCategoryIds}
                      onToggleExpand={toggleCategoryExpand}
                      canEdit={canEdit}
                    />
                  ))}
                  {rootCategories.length === 0 && categories.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Kategorien ohne Hierarchie erkannt. Bitte Kategorien mit Eltern-Kind-Beziehungen anlegen.
                    </p>
                  )}
                </div>
              )}
              {article.category_ids.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {article.category_ids.length} Kategorie(n) ausgewählt
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <Input
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Tag hinzufügen..."
                  className="pr-10"
                />
                {showTagSuggestions && filteredTags.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredTags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Important Marking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Wichtig-Markierung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-important">Als wichtig markieren</Label>
                <Switch
                  id="is-important"
                  checked={article.is_important}
                  onCheckedChange={(checked) => setArticle(prev => ({ ...prev, is_important: checked }))}
                />
              </div>
              {article.is_important && (
                <div className="space-y-2">
                  <Label>Markierung läuft ab am</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {article.important_until ? format(article.important_until, "PPP", { locale: de }) : "Kein Ablaufdatum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={article.important_until}
                        onSelect={(date) => setArticle(prev => ({ ...prev, important_until: date }))}
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiry Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Gültigkeit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Artikel läuft ab am</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {article.expiry_date ? format(article.expiry_date, "PPP", { locale: de }) : "Kein Ablaufdatum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={article.expiry_date}
                      onSelect={(date) => setArticle(prev => ({ ...prev, expiry_date: date }))}
                      locale={de}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Nach Ablauf wird der Artikel automatisch zum Entwurf
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Group Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sichtbarkeit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {article.visible_to_groups.length === 0 
                  ? "Sichtbar für alle Benutzer" 
                  : `Nur für ${article.visible_to_groups.length} Gruppe(n) sichtbar`}
              </p>
              {groups.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {groups.map(group => (
                    <div key={group.group_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`grp-${group.group_id}`}
                        checked={article.visible_to_groups.includes(group.group_id)}
                        onCheckedChange={() => toggleGroup(group.group_id)}
                      />
                      <label htmlFor={`grp-${group.group_id}`} className="text-sm cursor-pointer">
                        {group.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {groups.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Keine Gruppen vorhanden. Admins können Gruppen erstellen.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Kommentare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comments-enabled"
                  checked={article.comments_enabled}
                  onCheckedChange={(checked) => setArticle(prev => ({ ...prev, comments_enabled: checked }))}
                />
                <label htmlFor="comments-enabled" className="text-sm cursor-pointer">
                  Kommentare erlauben
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {article.comments_enabled 
                  ? "Benutzer können diesen Artikel kommentieren" 
                  : "Kommentarfunktion ist deaktiviert"}
              </p>
            </CardContent>
          </Card>

          {/* Contact Person - Multiple Selection with Notify Radio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Ansprechpartner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Wählen Sie einen oder mehrere Ansprechpartner. Der mit dem Radio-Button markierte Benutzer wird über Änderungen und Kommentare benachrichtigt.
              </p>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Benutzer suchen..."
                  value={contactSearchTerm}
                  onChange={(e) => setContactSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                  data-testid="contact-search"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {users
                  .filter(u => u.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || 
                              u.email?.toLowerCase().includes(contactSearchTerm.toLowerCase()))
                  .map(u => {
                  const isSelected = article.contact_person_ids?.includes(u.user_id) || article.contact_person_id === u.user_id;
                  const isNotifyPerson = article.contact_person_notify_id === u.user_id || (!article.contact_person_notify_id && article.contact_person_id === u.user_id);
                  
                  return (
                    <div key={u.user_id} className={cn(
                      "flex items-center justify-between p-2 rounded",
                      isSelected && "bg-primary/5"
                    )}>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`contact-${u.user_id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Add to contact persons
                              const newIds = [...(article.contact_person_ids || []), u.user_id];
                              setArticle(prev => ({ 
                                ...prev, 
                                contact_person_ids: newIds,
                                contact_person_id: newIds[0], // Legacy field
                                // If no notify person set, make this one the notify person
                                contact_person_notify_id: prev.contact_person_notify_id || u.user_id
                              }));
                            } else {
                              // Remove from contact persons
                              const newIds = (article.contact_person_ids || []).filter(id => id !== u.user_id);
                              setArticle(prev => ({ 
                                ...prev, 
                                contact_person_ids: newIds,
                                contact_person_id: newIds[0] || null, // Legacy field
                                // If this was the notify person, clear it or set to first remaining
                                contact_person_notify_id: prev.contact_person_notify_id === u.user_id 
                                  ? (newIds[0] || null) 
                                  : prev.contact_person_notify_id
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`contact-${u.user_id}`} className="text-sm cursor-pointer">
                          {u.name}
                        </label>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <input
                            type="radio"
                            id={`notify-${u.user_id}`}
                            name="notify-contact"
                            checked={isNotifyPerson}
                            onChange={() => setArticle(prev => ({ ...prev, contact_person_notify_id: u.user_id }))}
                            className="w-4 h-4 text-primary"
                          />
                          <label htmlFor={`notify-${u.user_id}`} className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
                {users.filter(u => u.name.toLowerCase().includes(contactSearchTerm.toLowerCase())).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Keine Benutzer gefunden</p>
                )}
              </div>
              {(article.contact_person_ids?.length > 0 || article.contact_person_id) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>Benachrichtigung an: {users.find(u => u.user_id === (article.contact_person_notify_id || article.contact_person_id))?.name || "Niemand"}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Edit Permissions */}
          <Card className={((article.edit_permission_user_ids?.length > 0) || (article.edit_permission_group_ids?.length > 0)) ? "border-blue-300 dark:border-blue-700" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="w-4 h-4" />
                Bearbeitungsrechte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Nur diese Benutzer/Gruppen (+ Autor + Admins) können diesen Artikel bearbeiten. Leer = Jeder Editor darf bearbeiten.
              </p>
              
              {/* User Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  <User className="w-3 h-3" /> Benutzer
                </Label>
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Benutzer suchen..."
                    value={editPermissionSearchTerm}
                    onChange={(e) => setEditPermissionSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                    data-testid="edit-permission-search"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                  {users
                    .filter(u => u.role !== "viewer" && u.user_id !== user?.user_id)
                    .filter(u => u.name.toLowerCase().includes(editPermissionSearchTerm.toLowerCase()) || 
                                u.email?.toLowerCase().includes(editPermissionSearchTerm.toLowerCase()))
                    .map(u => (
                    <div key={u.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-user-${u.user_id}`}
                        checked={article.edit_permission_user_ids?.includes(u.user_id) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setArticle(prev => ({ 
                              ...prev, 
                              edit_permission_user_ids: [...(prev.edit_permission_user_ids || []), u.user_id]
                            }));
                          } else {
                            setArticle(prev => ({ 
                              ...prev, 
                              edit_permission_user_ids: (prev.edit_permission_user_ids || []).filter(id => id !== u.user_id)
                            }));
                          }
                        }}
                      />
                      <label htmlFor={`edit-user-${u.user_id}`} className="text-sm cursor-pointer flex items-center gap-1">
                        {u.name}
                        {u.role === "admin" && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                        {u.role === "editor" && <Badge variant="outline" className="text-xs">Editor</Badge>}
                      </label>
                    </div>
                  ))}
                  {users.filter(u => u.role !== "viewer" && u.user_id !== user?.user_id)
                    .filter(u => u.name.toLowerCase().includes(editPermissionSearchTerm.toLowerCase())).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Keine Benutzer gefunden</p>
                  )}
                </div>
              </div>

              {/* Group Selection */}
              {groups.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm">
                    <Users className="w-3 h-3" /> Gruppen
                  </Label>
                  <div className="max-h-24 overflow-y-auto space-y-1 border rounded-md p-2">
                    {groups.map(g => (
                      <div key={g.group_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-group-${g.group_id}`}
                          checked={article.edit_permission_group_ids?.includes(g.group_id) || false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setArticle(prev => ({ 
                                ...prev, 
                                edit_permission_group_ids: [...(prev.edit_permission_group_ids || []), g.group_id]
                              }));
                            } else {
                              setArticle(prev => ({ 
                                ...prev, 
                                edit_permission_group_ids: (prev.edit_permission_group_ids || []).filter(id => id !== g.group_id)
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`edit-group-${g.group_id}`} className="text-sm cursor-pointer">
                          {g.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((article.edit_permission_user_ids?.length > 0) || (article.edit_permission_group_ids?.length > 0)) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <FileEdit className="w-4 h-4 text-blue-500" />
                  <span>
                    {article.edit_permission_user_ids?.length || 0} Benutzer und {article.edit_permission_group_ids?.length || 0} Gruppen haben Bearbeitungsrechte
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reading Assignment */}
          <Card className={article.reading_assignment_enabled ? "border-orange-300 dark:border-orange-700" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Leseaufgabe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reading-assignment-enabled"
                  checked={article.reading_assignment_enabled}
                  onCheckedChange={(checked) => setArticle(prev => ({ 
                    ...prev, 
                    reading_assignment_enabled: checked,
                    reading_assignment_user_ids: checked ? prev.reading_assignment_user_ids : [],
                    reading_assignment_group_ids: checked ? prev.reading_assignment_group_ids : [],
                    reading_assignment_send_email: checked ? (prev.reading_assignment_send_email !== false) : false
                  }))}
                  data-testid="reading-assignment-checkbox"
                />
                <label htmlFor="reading-assignment-enabled" className="text-sm cursor-pointer">
                  Als Leseaufgabe zuweisen
                </label>
              </div>
              
              {article.reading_assignment_enabled && (
                <div className="space-y-4 pt-2 border-t">
                  {/* Email notification option */}
                  <div className="flex items-center space-x-2 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                    <Checkbox
                      id="reading-assignment-email"
                      checked={article.reading_assignment_send_email !== false}
                      onCheckedChange={(checked) => setArticle(prev => ({ 
                        ...prev, 
                        reading_assignment_send_email: checked
                      }))}
                    />
                    <label htmlFor="reading-assignment-email" className="text-sm cursor-pointer flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Benutzer per E-Mail benachrichtigen
                    </label>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Ausgewählte Benutzer/Gruppen sehen den Artikel als "Ungelesen" auf ihrem Dashboard.
                  </p>
                  
                  {/* User Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1">
                        <User className="w-3 h-3" /> Benutzer
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          const allUserIds = users.filter(u => u.user_id !== user?.user_id).map(u => u.user_id);
                          const allSelected = allUserIds.every(id => article.reading_assignment_user_ids.includes(id));
                          if (allSelected) {
                            setArticle(prev => ({ ...prev, reading_assignment_user_ids: [] }));
                          } else {
                            setArticle(prev => ({ ...prev, reading_assignment_user_ids: allUserIds }));
                          }
                        }}
                        data-testid="select-all-reading-users"
                      >
                        {users.filter(u => u.user_id !== user?.user_id).every(u => article.reading_assignment_user_ids.includes(u.user_id)) 
                          ? "Keine auswählen" 
                          : "Alle auswählen"}
                      </Button>
                    </div>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Benutzer suchen..."
                        value={readingAssignmentSearchTerm}
                        onChange={(e) => setReadingAssignmentSearchTerm(e.target.value)}
                        className="pl-8 h-9"
                        data-testid="reading-assignment-search"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                      {users
                        .filter(u => u.user_id !== user?.user_id)
                        .filter(u => u.name.toLowerCase().includes(readingAssignmentSearchTerm.toLowerCase()) || 
                                    u.email?.toLowerCase().includes(readingAssignmentSearchTerm.toLowerCase()))
                        .map(u => (
                        <div key={u.user_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ra-user-${u.user_id}`}
                            checked={article.reading_assignment_user_ids.includes(u.user_id)}
                            onCheckedChange={() => toggleReadingAssignmentUser(u.user_id)}
                          />
                          <label htmlFor={`ra-user-${u.user_id}`} className="text-sm cursor-pointer flex items-center gap-1">
                            {u.name}
                            {u.role === "admin" && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                          </label>
                        </div>
                      ))}
                      {users.filter(u => u.user_id !== user?.user_id)
                        .filter(u => u.name.toLowerCase().includes(readingAssignmentSearchTerm.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">Keine Benutzer gefunden</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Group Selection */}
                  {groups.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> Gruppen
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            const allGroupIds = groups.map(g => g.group_id);
                            const allSelected = allGroupIds.every(id => article.reading_assignment_group_ids.includes(id));
                            if (allSelected) {
                              setArticle(prev => ({ ...prev, reading_assignment_group_ids: [] }));
                            } else {
                              setArticle(prev => ({ ...prev, reading_assignment_group_ids: allGroupIds }));
                            }
                          }}
                        >
                          {groups.every(g => article.reading_assignment_group_ids.includes(g.group_id)) 
                            ? "Keine auswählen" 
                            : "Alle auswählen"}
                        </Button>
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 border rounded-md p-2">
                        {groups.map(g => (
                          <div key={g.group_id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ra-group-${g.group_id}`}
                              checked={article.reading_assignment_group_ids.includes(g.group_id)}
                              onCheckedChange={() => toggleReadingAssignmentGroup(g.group_id)}
                            />
                            <label htmlFor={`ra-group-${g.group_id}`} className="text-sm cursor-pointer">
                              {g.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected count */}
                  {(article.reading_assignment_user_ids.length > 0 || article.reading_assignment_group_ids.length > 0) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      <UserCheck className="w-4 h-4 text-orange-500" />
                      <span>
                        {article.reading_assignment_user_ids.length} Benutzer und {article.reading_assignment_group_ids.length} Gruppen ausgewählt
                      </span>
                    </div>
                  )}
                  
                  {/* Save Button - Only show when editing existing article */}
                  {!isNew && (
                    <Button
                      onClick={saveReadingAssignments}
                      disabled={savingReadingAssignment || (article.reading_assignment_user_ids.length === 0 && article.reading_assignment_group_ids.length === 0)}
                      className="w-full"
                      variant="secondary"
                      data-testid="save-reading-assignment-btn"
                    >
                      {savingReadingAssignment ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Leseaufgaben zuweisen {article.reading_assignment_send_email !== false && "& benachrichtigen"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Editor */}
      <FullscreenEditor
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        content={article.content}
        onChange={(html) => setArticle(prev => ({ ...prev, content: html }))}
        onImageUpload={handleImageUpload}
        title={article.title || "Neuer Artikel"}
      />

      {/* Document Import Dialog */}
      <DocumentImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleDocumentImport}
      />

      {/* Review Request Dialog */}
      {!isNew && (
        <ReviewRequestDialog
          open={showReviewDialog}
          onClose={() => setShowReviewDialog(false)}
          articleId={articleId}
          articleTitle={article.title}
        />
      )}
    </div>
  );
};

export default ArticleEditor;
