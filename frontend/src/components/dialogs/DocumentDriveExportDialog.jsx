import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Folder, ChevronRight, ExternalLink } from "lucide-react";

const GoogleDriveLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

const DocumentDriveExportDialog = ({ open, onOpenChange, documentId, documentName }) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("root");
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root"]));

  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/drive/folders`);
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error("Failed to load Drive folders:", error);
      toast.error("Fehler beim Laden der Google Drive Ordner");
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = () => {
    const folderMap = new Map();
    const roots = [];

    folders.forEach(f => {
      folderMap.set(f.id, { ...f, children: [] });
    });

    folders.forEach(f => {
      const folder = folderMap.get(f.id);
      if (f.parent && folderMap.has(f.parent)) {
        folderMap.get(f.parent).children.push(folder);
      } else if (f.id === "root" || !f.parent) {
        roots.push(folder);
      }
    });

    const sortChildren = (node) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      node.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);

    return roots;
  };

  const toggleExpanded = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder, depth = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer transition-colors ${
            isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-100"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedFolder(folder.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              <ChevronRight
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <Folder className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-amber-500"}`} />
          <span className={`text-sm truncate ${isSelected ? "font-medium text-blue-700" : ""}`}>
            {folder.name}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.post(
        `${API}/drive/export/document/${documentId}`,
        null,
        {
          params: {
            folder_id: selectedFolder
          }
        }
      );
      
      toast.success(
        <div>
          <p>{response.data.message}</p>
          {response.data.webViewLink && (
            <a
              href={response.data.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline text-sm mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              In Google Drive öffnen
            </a>
          )}
        </div>
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(error.response?.data?.detail || "Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  };

  const folderTree = buildFolderTree();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GoogleDriveLogo className="w-5 h-5" />
            Nach Google Drive exportieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document info */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Dokument:</p>
            <p className="font-medium truncate">{documentName}</p>
          </div>

          {/* Folder selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Zielordner</p>
            <ScrollArea className="h-[250px] border rounded-lg p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                folderTree.map((folder) => renderFolder(folder))
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                <GoogleDriveLogo className="w-4 h-4 mr-2" />
                Exportieren
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDriveExportDialog;
