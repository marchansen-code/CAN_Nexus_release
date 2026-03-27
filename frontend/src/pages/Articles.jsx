import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Search,
  FileText,
  Clock,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FolderTree,
  TrendingUp,
  Folder,
  FolderOpen,
  ArrowUpDown,
  MoveRight,
  GripVertical,
  Check,
  FolderPlus,
  Pin,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const StatusBadge = ({ status }) => {
  const styles = {
    draft: "status-draft",
    review: "status-review",
    published: "status-published"
  };
  
  const labels = {
    draft: "Entwurf",
    review: "Review",
    published: "Veröffentlicht"
  };

  return (
    <Badge variant="outline" className={`${styles[status]} border`}>
      {labels[status]}
    </Badge>
  );
};

// Droppable Category Component for Drag & Drop with Hover Delay
const DroppableCategoryItem = ({ 
  category, 
  categories, 
  selectedCategoryId, 
  onSelect, 
  expandedCategories, 
  toggleExpand, 
  canEdit,
  canManageCategories, 
  onEdit, 
  onDelete, 
  onAddChild,
  onHoverDrop,
  activeDragArticle
}) => {
  const childCategories = categories.filter(c => c.parent_id === category.category_id).filter(c => canEdit || !c.is_pinnwand);
  const hasChildren = childCategories.length > 0;
  const isExpanded = expandedCategories.has(category.category_id);
  const isSelected = selectedCategoryId === category.category_id;
  
  // Hover delay state
  const hoverTimeoutRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const progressIntervalRef = useRef(null);
  const HOVER_DELAY = 600; // 600ms delay before drop triggers

  const { setNodeRef, isOver } = useDroppable({
    id: `category-${category.category_id}`,
    data: { type: 'category', categoryId: category.category_id }
  });

  // Handle hover delay for drag & drop
  useEffect(() => {
    if (isOver && activeDragArticle) {
      // Start hover timer
      setIsHovering(true);
      setHoverProgress(0);
      
      // Progress animation
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / HOVER_DELAY) * 100, 100);
        setHoverProgress(progress);
      }, 16);
      
      hoverTimeoutRef.current = setTimeout(() => {
        // Trigger drop after delay
        onHoverDrop(activeDragArticle, category.category_id, category.name);
        setIsHovering(false);
        setHoverProgress(0);
      }, HOVER_DELAY);
    } else {
      // Clear timer when not hovering
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsHovering(false);
      setHoverProgress(0);
    }
    
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOver, activeDragArticle, category.category_id, category.name, onHoverDrop]);

  return (
    <div ref={setNodeRef}>
      <div className="flex items-center group relative">
        <button
          onClick={() => {
            onSelect(category.category_id);
            if (hasChildren) toggleExpand(category.category_id);
          }}
          className={cn(
            "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left min-w-0 relative overflow-hidden",
            isSelected 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'hover:bg-muted text-foreground',
            isHovering && 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
          )}
        >
          {/* Hover progress indicator */}
          {isHovering && (
            <div 
              className="absolute inset-0 bg-indigo-200 dark:bg-indigo-700/50 transition-all"
              style={{ width: `${hoverProgress}%`, opacity: 0.5 }}
            />
          )}
          <span className="relative flex items-center gap-2 z-10">
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <span className="w-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 shrink-0 text-amber-500" />
            ) : (
              <Folder className="w-4 h-4 shrink-0 text-amber-500" />
            )}
            <span className="truncate flex-1">{category.name}</span>
            {category.is_pinnwand && <Pin className="w-3 h-3 shrink-0 text-amber-500" />}
          </span>
        </button>
        {canManageCategories && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity shrink-0" data-testid={`cat-menu-${category.category_id}`}>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="w-4 h-4 mr-2" /> Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(category)}>
                <FolderPlus className="w-4 h-4 mr-2" /> Unterkategorie
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(category)}>
                <Trash2 className="w-4 h-4 mr-2" /> Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-4 mt-1 border-l border-slate-200 pl-2">
          {childCategories.map(child => (
            <DroppableCategoryItem
              key={child.category_id}
              category={child}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              expandedCategories={expandedCategories}
              toggleExpand={toggleExpand}
              canEdit={canEdit}
              canManageCategories={canManageCategories}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onHoverDrop={onHoverDrop}
              activeDragArticle={activeDragArticle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Sortable Article Component for reordering within a category
const SortableArticle = ({ article, children, isDragDisabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: article.article_id,
    data: { type: 'article', article },
    disabled: isDragDisabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} className={isDragDisabled ? "" : "cursor-grab active:cursor-grabbing"}>
        {children}
      </div>
    </div>
  );
};

// Move Dialog Category Tree Item
const MoveCategoryItem = ({ category, categories, selectedCategoryId, onSelect, expandedCategories, toggleExpand, level = 0 }) => {
  const childCategories = categories.filter(c => c.parent_id === category.category_id);
  const hasChildren = childCategories.length > 0;
  const isExpanded = expandedCategories.has(category.category_id);
  const isSelected = selectedCategoryId === category.category_id;

  return (
    <div style={{ marginLeft: level > 0 ? `${level * 16}px` : 0 }}>
      <button
        onClick={() => {
          onSelect(category.category_id);
          if (hasChildren && !isExpanded) toggleExpand(category.category_id);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
          isSelected 
            ? 'bg-indigo-50 text-indigo-700 font-medium' 
            : 'hover:bg-muted text-foreground'
        )}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(category.category_id); }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-amber-500" />
        )}
        <span className="truncate flex-1">{category.name}</span>
        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
      </button>
      
      {isExpanded && hasChildren && (
        <div className="mt-1 border-l border-slate-200 ml-2 pl-1">
          {childCategories.map(child => (
            <MoveCategoryItem
              key={child.category_id}
              category={child}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              expandedCategories={expandedCategories}
              toggleExpand={toggleExpand}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Articles = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topArticles, setTopArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [deleteDialog, setDeleteDialog] = useState({ open: false, article: null });
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Move article dialog state
  const [moveDialog, setMoveDialog] = useState({ open: false, article: null });
  const [moveTargetCategoryId, setMoveTargetCategoryId] = useState(null);
  const [movingArticle, setMovingArticle] = useState(false);
  const [moveExpandedCategories, setMoveExpandedCategories] = useState(new Set());
  
  // Drag & Drop state
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [pendingDrop, setPendingDrop] = useState(null);
  const [confirmDropDialog, setConfirmDropDialog] = useState(false);
  
  // User sort preferences state
  const [userSortPreferences, setUserSortPreferences] = useState({});
  const [hasCustomSort, setHasCustomSort] = useState(false);
  
  // DnD sensors - with keyboard support for sortable
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const canEdit = user?.role === "admin" || user?.role === "editor";
  const isAdmin = user?.role === "admin";
  const canManageCategories = canEdit; // Both admins and editors can manage categories

  // Helper function to navigate to an article while storing origin
  const navigateToArticle = (path) => {
    sessionStorage.setItem('article_origin_url', window.location.pathname + window.location.search);
    navigate(path);
  };

  // Build category breadcrumb path
  const buildCategoryPath = (categoryId) => {
    if (!categoryId || categories.length === 0) return [];
    
    const path = [];
    let currentCat = categories.find(c => c.category_id === categoryId);
    
    while (currentCat) {
      path.unshift(currentCat);
      currentCat = categories.find(c => c.category_id === currentCat.parent_id);
    }
    
    return path;
  };

  // Category management state
  const [catDialog, setCatDialog] = useState({ open: false, mode: 'create', category: null, parentId: null });
  const [catFormData, setCatFormData] = useState({ name: '', description: '', is_pinnwand: false });
  const [catDeleteDialog, setCatDeleteDialog] = useState({ open: false, category: null });
  const [catSaving, setCatSaving] = useState(false);
  
  // Delete confirmation states
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [catDeleteConfirmText, setCatDeleteConfirmText] = useState("");
  
  // All categories expanded state
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSortPreferences();
  }, []);

  // Load sort preferences when category changes
  useEffect(() => {
    if (selectedCategoryId && userSortPreferences[selectedCategoryId]) {
      setHasCustomSort(true);
    } else {
      setHasCustomSort(false);
    }
  }, [selectedCategoryId, userSortPreferences]);

  const fetchSortPreferences = async () => {
    try {
      const res = await axios.get(`${API}/sort-preferences`);
      setUserSortPreferences(res.data.preferences || {});
    } catch (error) {
      console.error("Failed to fetch sort preferences:", error);
    }
  };

  const fetchData = async () => {
    try {
      const [articlesRes, categoriesRes, topRes] = await Promise.all([
        axios.get(`${API}/articles`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/articles/top-viewed?limit=10`)
      ]);
      setArticles(articlesRes.data);
      setCategories(categoriesRes.data);
      setTopArticles(topRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Daten konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  // Toggle all categories expanded/collapsed
  const toggleAllExpanded = () => {
    if (allExpanded) {
      // Collapse all
      setExpandedCategories(new Set());
      setAllExpanded(false);
    } else {
      // Expand all - get all category IDs that have children
      const allCategoryIds = new Set(
        categories
          .filter(cat => categories.some(c => c.parent_id === cat.category_id))
          .map(cat => cat.category_id)
      );
      setExpandedCategories(allCategoryIds);
      setAllExpanded(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.article) return;
    if (deleteConfirmText !== "DELETE") {
      toast.error("Bitte geben Sie 'DELETE' ein, um die Löschung zu bestätigen");
      return;
    }
    
    try {
      await axios.delete(`${API}/articles/${deleteDialog.article.article_id}`);
      toast.success("Artikel gelöscht");
      setArticles(articles.filter(a => a.article_id !== deleteDialog.article.article_id));
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Artikel konnte nicht gelöscht werden");
    } finally {
      setDeleteDialog({ open: false, article: null });
      setDeleteConfirmText("");
    }
  };

  // Move article to category
  const handleMoveArticle = async (articleId, categoryId) => {
    setMovingArticle(true);
    try {
      await axios.put(`${API}/articles/${articleId}`, {
        category_ids: categoryId ? [categoryId] : []
      });
      toast.success("Artikel verschoben");
      fetchData();
      setMoveDialog({ open: false, article: null });
      setMoveTargetCategoryId(null);
    } catch (error) {
      console.error("Failed to move article:", error);
      toast.error("Artikel konnte nicht verschoben werden");
    } finally {
      setMovingArticle(false);
    }
  };

  // Handler for hover-delayed drop on category (called from DroppableCategoryItem)
  const handleHoverDrop = useCallback((article, targetCategoryId, targetCategoryName) => {
    if (!canEdit) return;
    
    const currentCategoryIds = article.category_ids || (article.category_id ? [article.category_id] : []);
    
    // Don't move if already in this category
    if (currentCategoryIds.includes(targetCategoryId)) {
      return;
    }
    
    // Show confirmation dialog
    setPendingDrop({
      article,
      articleTitle: article.title,
      targetCategoryId,
      targetCategoryName
    });
    setConfirmDropDialog(true);
  }, [canEdit]);

  // Drag & Drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'article') {
      setActiveDragItem(active.data.current.article);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!canEdit) {
      setActiveDragItem(null);
      return;
    }
    
    // Handle reordering within the article list (sortable)
    if (over && active.id !== over.id && selectedCategoryId) {
      // Check if both are articles (reordering)
      const activeArticle = active.data.current?.article;
      const overArticle = over.data.current?.article;
      
      if (activeArticle && overArticle) {
        // Get current sorted articles
        const currentOrder = sortedArticles.map(a => a.article_id);
        const oldIndex = currentOrder.indexOf(active.id);
        const newIndex = currentOrder.indexOf(over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
          
          // Update local state immediately for smooth UX
          setUserSortPreferences(prev => ({
            ...prev,
            [selectedCategoryId]: newOrder
          }));
          setHasCustomSort(true);
          
          // Save to backend
          try {
            await axios.put(`${API}/sort-preferences/${selectedCategoryId}`, {
              article_order: newOrder
            });
            toast.success("Reihenfolge gespeichert");
          } catch (error) {
            console.error("Failed to save sort order:", error);
            toast.error("Reihenfolge konnte nicht gespeichert werden");
            // Revert on error
            fetchSortPreferences();
          }
        }
      }
    }
    
    setActiveDragItem(null);
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

  // Reset custom sort order for current category
  const resetSortOrder = async () => {
    if (!selectedCategoryId) return;
    
    try {
      await axios.delete(`${API}/sort-preferences/${selectedCategoryId}`);
      setUserSortPreferences(prev => {
        const newPrefs = { ...prev };
        delete newPrefs[selectedCategoryId];
        return newPrefs;
      });
      setHasCustomSort(false);
      toast.success("Sortierung zurückgesetzt");
    } catch (error) {
      console.error("Failed to reset sort order:", error);
      toast.error("Sortierung konnte nicht zurückgesetzt werden");
    }
  };

  // Confirm and execute the drop
  const confirmDrop = async () => {
    if (!pendingDrop) return;
    
    const { article, targetCategoryId } = pendingDrop;
    await handleMoveArticle(article.article_id, targetCategoryId);
    setPendingDrop(null);
    setConfirmDropDialog(false);
  };

  const cancelDrop = () => {
    setPendingDrop(null);
    setConfirmDropDialog(false);
  };

  // Category CRUD
  const openCreateCat = (parentId = null) => {
    setCatFormData({ name: '', description: '', is_pinnwand: false });
    setCatDialog({ open: true, mode: 'create', category: null, parentId });
  };

  const openEditCat = (category) => {
    setCatFormData({ name: category.name, description: category.description || '', is_pinnwand: category.is_pinnwand || false });
    setCatDialog({ open: true, mode: 'edit', category, parentId: category.parent_id });
  };

  const handleSaveCat = async () => {
    if (!catFormData.name.trim()) return;
    setCatSaving(true);
    try {
      if (catDialog.mode === 'create') {
        await axios.post(`${API}/categories`, {
          name: catFormData.name.trim(),
          description: catFormData.description.trim(),
          parent_id: catDialog.parentId || null,
          is_pinnwand: catFormData.is_pinnwand
        });
        toast.success("Kategorie erstellt");
      } else {
        await axios.put(`${API}/categories/${catDialog.category.category_id}`, {
          name: catFormData.name.trim(),
          description: catFormData.description.trim(),
          is_pinnwand: catFormData.is_pinnwand
        });
        toast.success("Kategorie aktualisiert");
      }
      fetchData();
      setCatDialog({ open: false, mode: 'create', category: null, parentId: null });
    } catch (error) {
      toast.error("Fehler beim Speichern");
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!catDeleteDialog.category) return;
    if (catDeleteConfirmText !== "DELETE") {
      toast.error("Bitte geben Sie 'DELETE' ein, um die Löschung zu bestätigen");
      return;
    }
    try {
      await axios.delete(`${API}/categories/${catDeleteDialog.category.category_id}`);
      toast.success("Kategorie gelöscht");
      if (selectedCategoryId === catDeleteDialog.category.category_id) setSelectedCategoryId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Fehler beim Löschen");
    } finally {
      setCatDeleteDialog({ open: false, category: null });
      setCatDeleteConfirmText("");
    }
  };

  const toggleMoveExpand = (categoryId) => {
    const newExpanded = new Set(moveExpandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setMoveExpandedCategories(newExpanded);
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Get filtered articles based on selection
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase());
    // Support both old category_id and new category_ids
    const articleCategoryIds = article.category_ids || (article.category_id ? [article.category_id] : []);
    const matchesCategory = !selectedCategoryId || 
      articleCategoryIds.includes(selectedCategoryId);
    return matchesSearch && matchesCategory;
  });

  // Sort articles (with user's custom order if available)
  const sortedArticles = React.useMemo(() => {
    // If we have a custom sort order for this category, use it
    const customOrder = selectedCategoryId ? userSortPreferences[selectedCategoryId] : null;
    
    if (customOrder && customOrder.length > 0) {
      // Sort by custom order
      const orderMap = new Map(customOrder.map((id, index) => [id, index]));
      const sorted = [...filteredArticles].sort((a, b) => {
        const aIndex = orderMap.has(a.article_id) ? orderMap.get(a.article_id) : Infinity;
        const bIndex = orderMap.has(b.article_id) ? orderMap.get(b.article_id) : Infinity;
        
        // If both have custom positions, use those
        if (aIndex !== Infinity && bIndex !== Infinity) {
          return aIndex - bIndex;
        }
        // If only one has a custom position, it comes first
        if (aIndex !== Infinity) return -1;
        if (bIndex !== Infinity) return 1;
        
        // Fall back to default sort for articles not in custom order
        const aVal = new Date(a.updated_at || a.created_at || 0);
        const bVal = new Date(b.updated_at || b.created_at || 0);
        return bVal - aVal;
      });
      return sorted;
    }
    
    // Default sorting by selected criteria
    const sorted = [...filteredArticles].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "title":
          aVal = (a.title || "").toLowerCase();
          bVal = (b.title || "").toLowerCase();
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case "view_count":
          aVal = a.view_count || 0;
          bVal = b.view_count || 0;
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        case "created_at":
          aVal = new Date(a.created_at || 0);
          bVal = new Date(b.created_at || 0);
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        case "updated_at":
        default:
          aVal = new Date(a.updated_at || a.created_at || 0);
          bVal = new Date(b.updated_at || b.created_at || 0);
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
    });
    return sorted;
  }, [filteredArticles, sortBy, sortOrder, selectedCategoryId, userSortPreferences]);

  // Get subcategories for selected category
  const childCategories = selectedCategoryId 
    ? categories.filter(c => c.parent_id === selectedCategoryId)
    : [];

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.category_id === categoryId);
    return category?.name || "Ohne Kategorie";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const rootCategories = categories.filter(c => !c.parent_id).filter(c => canEdit || !c.is_pinnwand);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <div className="space-y-4 animate-fadeIn h-full max-w-full overflow-hidden" data-testid="articles-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wissensartikel</h1>
          <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Wissensbasis</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {canManageCategories && (
              <Button 
                variant="outline"
                onClick={() => openCreateCat(null)}
                data-testid="create-category-btn"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Neue Kategorie
              </Button>
            )}
            <Button 
              onClick={() => navigate("/articles/new")} 
              className="bg-primary hover:bg-primary/90"
              data-testid="create-article-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neuer Artikel
            </Button>
          </div>
        )}
      </div>

      {/* Split Layout */}
      <div className="flex gap-6 h-[calc(100vh-14rem)]">
        {/* Left: Categories Tree */}
        <Card className="w-96 shrink-0 flex flex-col overflow-hidden">
          <CardHeader className="py-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-amber-500" />
                Kategorien
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllExpanded}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                title={allExpanded ? "Alle zuklappen" : "Alle aufklappen"}
                data-testid="toggle-all-categories-btn"
              >
                {allExpanded ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    Zuklappen
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 mr-1" />
                    Aufklappen
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1" style={{ minWidth: "360px" }}>
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  selectedCategoryId === null 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <FileText className="w-4 h-4" />
                Alle Artikel
              </button>
              <Separator className="my-2" />
              {rootCategories.map(cat => (
                <DroppableCategoryItem
                  key={cat.category_id}
                  category={cat}
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                  expandedCategories={expandedCategories}
                  toggleExpand={toggleExpand}
                  canEdit={canEdit}
                  canManageCategories={canManageCategories}
                  onEdit={openEditCat}
                  onDelete={(cat) => setCatDeleteDialog({ open: true, category: cat })}
                  onAddChild={(cat) => openCreateCat(cat.category_id)}
                  onHoverDrop={handleHoverDrop}
                  activeDragArticle={activeDragItem}
                />
              ))}
              {rootCategories.length === 0 && (
                <p className="text-sm text-muted-foreground px-3">Keine Kategorien</p>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>

        {/* Right: Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search and Sort */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-articles-input"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {hasCustomSort && selectedCategoryId ? (
                <>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <GripVertical className="w-3 h-3" />
                    Eigene Sortierung
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetSortOrder}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    title="Sortierung zurücksetzen"
                    data-testid="reset-sort-btn"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Sortieren:</span>
                  <Select value={sortBy} onValueChange={setSortBy} disabled={hasCustomSort}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated_at">Aktualisiert</SelectItem>
                      <SelectItem value="created_at">Erstellt</SelectItem>
                      <SelectItem value="title">Titel</SelectItem>
                      <SelectItem value="view_count">Aufrufe</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="h-9 px-2"
                    disabled={hasCustomSort}
                  >
                    {sortOrder === "asc" ? "↑ Aufst." : "↓ Abst."}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Current Location - Full Breadcrumb Path */}
          {selectedCategoryId && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm flex-wrap">
                <button 
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  Alle
                </button>
                {buildCategoryPath(selectedCategoryId).map((cat, index) => (
                  <React.Fragment key={cat.category_id}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    {cat.category_id === selectedCategoryId ? (
                      <span className="font-medium">{cat.name}</span>
                    ) : (
                      <button
                        onClick={() => setSelectedCategoryId(cat.category_id)}
                        className="text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {cat.name}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {canEdit && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/articles/new?category=${selectedCategoryId}`)}
                  className="text-xs"
                  data-testid="create-article-in-category-btn"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Neuer Artikel hier
                </Button>
              )}
            </div>
          )}

          {/* Articles List - No subcategory chips */}

          {/* Articles List */}
          <ScrollArea className="flex-1">
            {sortedArticles.length > 0 ? (
              <SortableContext
                items={sortedArticles.map(a => a.article_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 pr-2">
                  {sortedArticles.map((article) => (
                    <SortableArticle 
                      key={article.article_id} 
                      article={article}
                      isDragDisabled={!canEdit || !selectedCategoryId}
                    >
                    <Card
                      className="hover:shadow-md transition-all duration-200"
                      data-testid={`article-card-${article.article_id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          {canEdit && selectedCategoryId && (
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
                          )}
                          <div 
                            className="flex-1 cursor-pointer min-w-0"
                            onClick={() => navigateToArticle(`/articles/${article.article_id}`)}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                              <h3 className="font-semibold truncate">{article.title}</h3>
                              <StatusBadge status={article.status} />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(article.updated_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {article.view_count || 0}
                              </span>
                            </div>
                            {/* Breadcrumb - show full path when no category is selected */}
                            {!selectedCategoryId && (article.category_ids?.[0] || article.category_id) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
                                <FolderTree className="w-3 h-3 shrink-0" />
                                {buildCategoryPath(article.category_ids?.[0] || article.category_id).map((cat, index, arr) => (
                                  <React.Fragment key={cat.category_id}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategoryId(cat.category_id);
                                      }}
                                      className="hover:text-foreground transition-colors hover:underline"
                                    >
                                      {cat.name}
                                    </button>
                                    {index < arr.length - 1 && (
                                      <ChevronRight className="w-3 h-3 shrink-0" />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            )}
                          </div>
                          {canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`article-menu-${article.article_id}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigateToArticle(`/articles/${article.article_id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Anzeigen
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigateToArticle(`/articles/${article.article_id}/edit`)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setMoveDialog({ open: true, article });
                                  setMoveTargetCategoryId(article.category_id || null);
                                }}>
                                  <MoveRight className="w-4 h-4 mr-2" />
                                  Verschieben
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => setDeleteDialog({ open: true, article })}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    </SortableArticle>
                  ))}
                </div>
              </SortableContext>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Artikel gefunden</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || selectedCategoryId
                      ? "Versuchen Sie andere Suchkriterien"
                      : "Erstellen Sie Ihren ersten Wissensartikel"}
                  </p>
                  {canEdit && (
                    <Button onClick={() => navigate("/articles/new")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Artikel erstellen
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialog({ open: false, article: null });
          setDeleteConfirmText("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Artikel löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Möchten Sie den Artikel <strong>"{deleteDialog.article?.title}"</strong> wirklich löschen?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <p className="text-red-700 text-sm mb-2">
                  Um fortzufahren, geben Sie <strong>DELETE</strong> ein:
                </p>
                <Input
                  placeholder="DELETE eingeben"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="bg-white"
                  data-testid="article-delete-confirm-input"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirmText !== "DELETE"}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Article Dialog */}
      <Dialog open={moveDialog.open} onOpenChange={(open) => !open && setMoveDialog({ open: false, article: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MoveRight className="w-5 h-5" />
              Artikel verschieben
            </DialogTitle>
            <DialogDescription>
              Wählen Sie die Zielkategorie für "{moveDialog.article?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg p-3 max-h-[300px] overflow-y-auto">
            {/* Option for no category */}
            <button
              onClick={() => setMoveTargetCategoryId(null)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left mb-1",
                moveTargetCategoryId === null
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'hover:bg-muted text-foreground'
              )}
            >
              {moveTargetCategoryId === null && <Check className="w-4 h-4" />}
              <span className={moveTargetCategoryId !== null ? "ml-6" : ""}>Keine (Root-Kategorie)</span>
            </button>
            
            <Separator className="my-2" />
            
            {/* Category tree for move dialog */}
            {rootCategories.map(cat => (
              <MoveCategoryItem
                key={cat.category_id}
                category={cat}
                categories={categories}
                selectedCategoryId={moveTargetCategoryId}
                onSelect={setMoveTargetCategoryId}
                expandedCategories={moveExpandedCategories}
                toggleExpand={toggleMoveExpand}
              />
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog({ open: false, article: null })}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => handleMoveArticle(moveDialog.article?.article_id, moveTargetCategoryId)}
              disabled={movingArticle}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {movingArticle ? "Verschiebe..." : "Verschieben"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drag & Drop Confirmation Dialog */}
      <AlertDialog open={confirmDropDialog} onOpenChange={(open) => !open && cancelDrop()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MoveRight className="w-5 h-5 text-indigo-500" />
              Verschieben bestätigen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie <strong>"{pendingDrop?.articleTitle}"</strong> wirklich nach{' '}
              <strong>"{pendingDrop?.targetCategoryName}"</strong> verschieben?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDrop}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDrop} className="bg-indigo-600 hover:bg-indigo-700">
              Verschieben
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Create/Edit Dialog */}
      <Dialog open={catDialog.open} onOpenChange={(open) => !open && setCatDialog({ open: false, mode: 'create', category: null, parentId: null })}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-500" />
              {catDialog.mode === 'create' ? 'Neue Kategorie' : 'Kategorie bearbeiten'}
            </DialogTitle>
            <DialogDescription>
              {catDialog.mode === 'create' 
                ? (catDialog.parentId 
                    ? `Unterkategorie von "${categories.find(c => c.category_id === catDialog.parentId)?.name}"` 
                    : 'Erstellen Sie eine neue Kategorie für Ihre Wissensbasis')
                : `Bearbeiten Sie die Kategorie "${catDialog.category?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={catFormData.name}
                onChange={(e) => setCatFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Kategoriename..."
                data-testid="cat-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Beschreibung</Label>
              <Textarea
                id="cat-desc"
                value={catFormData.description}
                onChange={(e) => setCatFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optionale Beschreibung..."
                rows={3}
              />
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="cat-pinnwand"
                  checked={catFormData.is_pinnwand}
                  onCheckedChange={(checked) => setCatFormData(prev => ({ ...prev, is_pinnwand: checked }))}
                />
                <Label htmlFor="cat-pinnwand" className="cursor-pointer flex items-center gap-1.5 text-sm">
                  <Pin className="w-4 h-4 text-amber-500" />
                  Pinnwand-Kategorie
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog({ open: false, mode: 'create', category: null, parentId: null })}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCat} disabled={!catFormData.name.trim() || catSaving} data-testid="cat-save-btn">
              {catSaving ? "Speichere..." : catDialog.mode === 'create' ? "Erstellen" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Delete Dialog */}
      <AlertDialog open={catDeleteDialog.open} onOpenChange={(open) => {
        if (!open) {
          setCatDeleteDialog({ open: false, category: null });
          setCatDeleteConfirmText("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Kategorie löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Möchten Sie die Kategorie <strong>"{catDeleteDialog.category?.name}"</strong> wirklich löschen?
                Untergeordnete Kategorien werden ebenfalls gelöscht.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <p className="text-red-700 text-sm mb-2">
                  Um fortzufahren, geben Sie <strong>DELETE</strong> ein:
                </p>
                <Input
                  placeholder="DELETE eingeben"
                  value={catDeleteConfirmText}
                  onChange={(e) => setCatDeleteConfirmText(e.target.value)}
                  className="bg-white"
                  data-testid="cat-delete-confirm-input"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCatDeleteConfirmText("")}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCat} 
              className="bg-red-600 hover:bg-red-700"
              disabled={catDeleteConfirmText !== "DELETE"}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    
    {/* Drag Overlay */}
    <DragOverlay>
      {activeDragItem && (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-indigo-500 shadow-lg flex items-center gap-3 min-w-[200px]">
          <FileText className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-medium truncate max-w-[200px]">
            {activeDragItem.title}
          </span>
        </div>
      )}
    </DragOverlay>
    </DndContext>
  );
};

export default Articles;
