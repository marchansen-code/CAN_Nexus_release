import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Category Tree Selector for parent selection
const CategoryTreeSelector = ({ categories, selectedId, onSelect, excludeId }) => {
  const [expandedIds, setExpandedIds] = useState([]);
  
  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const renderCategory = (category, level = 0) => {
    const children = categories.filter(c => c.parent_id === category.category_id && c.category_id !== excludeId);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.includes(category.category_id);
    const isSelected = selectedId === category.category_id;
    const isExcluded = category.category_id === excludeId;
    
    if (isExcluded) return null;
    
    return (
      <div key={category.category_id}>
        <div 
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
            isSelected && "bg-indigo-50 dark:bg-indigo-900/20"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelect(category.category_id)}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleExpand(category.category_id); }}
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
          
          {hasChildren && isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          
          <span className="text-sm flex-1 truncate">{category.name}</span>
          
          {isSelected && (
            <Check className="w-4 h-4 text-indigo-600" />
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  const rootCategories = categories.filter(c => !c.parent_id && c.category_id !== excludeId);
  
  return (
    <div className="max-h-64 overflow-y-auto">
      {rootCategories.map(cat => renderCategory(cat))}
    </div>
  );
};

const TreeItem = ({ category, categories, level = 0, onEdit, onDelete, onAddChild, expandedIds, toggleExpand }) => {
  const children = categories.filter(c => c.parent_id === category.category_id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.includes(category.category_id);

  return (
    <div>
      <div 
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors`}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {hasChildren ? (
          <button 
            onClick={() => toggleExpand(category.category_id)}
            className="p-1 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}
        
        {isExpanded && hasChildren ? (
          <FolderOpen className="w-5 h-5 text-amber-500" />
        ) : (
          <Folder className="w-5 h-5 text-amber-500" />
        )}
        
        <span className="flex-1 font-medium">{category.name}</span>
        
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={(e) => { e.stopPropagation(); onAddChild(category); }}
            title="Unterkategorie erstellen"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-500 hover:text-red-600"
            onClick={(e) => { e.stopPropagation(); onDelete(category); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeItem
              key={child.category_id}
              category={child}
              categories={categories}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, category: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: null
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Kategorien konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleOpenCreate = () => {
    setFormData({ name: "", description: "", parent_id: null });
    setEditDialog({ open: true, category: null });
  };

  const handleOpenCreateChild = (parentCategory) => {
    setFormData({ name: "", description: "", parent_id: parentCategory.category_id });
    setEditDialog({ open: true, category: null });
    // Expand the parent so the new child will be visible
    if (!expandedIds.includes(parentCategory.category_id)) {
      setExpandedIds(prev => [...prev, parentCategory.category_id]);
    }
  };

  const handleOpenEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      parent_id: category.parent_id
    });
    setEditDialog({ open: true, category });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id === "none" ? null : formData.parent_id
      };

      if (editDialog.category) {
        await axios.put(`${API}/categories/${editDialog.category.category_id}`, payload);
        toast.success("Kategorie aktualisiert");
      } else {
        await axios.post(`${API}/categories`, payload);
        toast.success("Kategorie erstellt");
      }
      
      fetchCategories();
      setEditDialog({ open: false, category: null });
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Kategorie konnte nicht gespeichert werden");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      await axios.delete(`${API}/categories/${deleteDialog.category.category_id}`);
      toast.success("Kategorie gelöscht");
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Kategorie konnte nicht gelöscht werden");
    } finally {
      setDeleteDialog({ open: false, category: null });
    }
  };

  const rootCategories = categories.filter(c => !c.parent_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="categories-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-['Plus_Jakarta_Sans']">
            Kategorien
          </h1>
          <p className="text-muted-foreground mt-1">
            Strukturieren Sie Ihre Wissensbasis hierarchisch
          </p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700"
          data-testid="create-category-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Kategorie
        </Button>
      </div>

      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5" />
            Kategoriestruktur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-1">
              {rootCategories.map((category) => (
                <TreeItem
                  key={category.category_id}
                  category={category}
                  categories={categories}
                  onEdit={handleOpenEdit}
                  onDelete={(cat) => setDeleteDialog({ open: true, category: cat })}
                  onAddChild={handleOpenCreateChild}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderTree className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Kategorien</h3>
              <p className="text-muted-foreground mb-6">
                Erstellen Sie Ihre erste Kategorie, um Ihre Wissensartikel zu strukturieren.
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Kategorie erstellen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, category: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog.category ? "Kategorie bearbeiten" : "Neue Kategorie"}
            </DialogTitle>
            <DialogDescription>
              {editDialog.category 
                ? "Bearbeiten Sie die Kategorie-Details." 
                : "Erstellen Sie eine neue Kategorie für Ihre Wissensbasis."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Kategoriename..."
                data-testid="category-name-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optionale Beschreibung..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Übergeordnete Kategorie</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {formData.parent_id ? (
                      <span className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-amber-500" />
                        {categories.find(c => c.category_id === formData.parent_id)?.name || "Unbekannt"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Keine (Root-Kategorie)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2" align="start">
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        !formData.parent_id && "bg-indigo-50 dark:bg-indigo-900/20"
                      )}
                      onClick={() => setFormData(prev => ({ ...prev, parent_id: null }))}
                    >
                      <FolderTree className="w-4 h-4 mr-2 text-muted-foreground" />
                      Keine (Root-Kategorie)
                      {!formData.parent_id && <Check className="w-4 h-4 ml-auto text-indigo-600" />}
                    </Button>
                    <div className="border-t pt-2">
                      <CategoryTreeSelector
                        categories={categories}
                        selectedId={formData.parent_id}
                        onSelect={(id) => setFormData(prev => ({ ...prev, parent_id: id }))}
                        excludeId={editDialog.category?.category_id}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, category: null })}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editDialog.category ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, category: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Kategorie "{deleteDialog.category?.name}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;
