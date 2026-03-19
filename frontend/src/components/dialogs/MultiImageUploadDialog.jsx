import React, { useState, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, X, Image as ImageIcon, Loader2, Check, AlertCircle, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const MultiImageUploadDialog = ({ open, onClose, onImagesUploaded }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saveToDocuments, setSaveToDocuments] = useState(true);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const imageFiles = Array.from(selectedFiles).filter(f => 
      f.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      toast.error("Keine gültigen Bilddateien ausgewählt");
      return;
    }

    // Create previews
    const newPreviews = imageFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...imageFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index].preview);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary', 'bg-primary/5');
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-primary', 'bg-primary/5');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary', 'bg-primary/5');
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(
        `${API}/images/upload-multiple?save_to_documents=${saveToDocuments}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        }
      );

      setResults(response.data);
      
      // Update previews with results
      const updatedPreviews = previews.map(p => {
        const result = response.data.uploaded.find(u => u.filename === p.name);
        const error = response.data.errors.find(e => e.filename === p.name);
        return {
          ...p,
          status: result ? 'success' : 'error',
          url: result?.url,
          error: error?.error
        };
      });
      setPreviews(updatedPreviews);

      if (response.data.success_count > 0) {
        toast.success(`${response.data.success_count} Bilder hochgeladen`);
        
        // Call callback with uploaded images
        if (onImagesUploaded) {
          onImagesUploaded(response.data.uploaded);
        }
      }
      
      if (response.data.error_count > 0) {
        toast.error(`${response.data.error_count} Bilder fehlgeschlagen`);
      }

    } catch (error) {
      toast.error("Fehler beim Hochladen der Bilder");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup previews
    previews.forEach(p => URL.revokeObjectURL(p.preview));
    setFiles([]);
    setPreviews([]);
    setResults(null);
    setProgress(0);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Bilder hochladen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie mehrere Bilder aus oder ziehen Sie sie hierher.
            {saveToDocuments && " Bilder werden auch im Ordner 'Bilder' bei den Dokumenten gespeichert."}
          </DialogDescription>
        </DialogHeader>

        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Klicken oder Dateien hierher ziehen
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, GIF, WebP (max. 10MB pro Bild)
          </p>
        </div>

        {/* File Previews */}
        {previews.length > 0 && (
          <ScrollArea className="h-[200px] border rounded-lg p-2">
            <div className="grid grid-cols-4 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img
                      src={preview.preview}
                      alt={preview.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Status overlay */}
                  {preview.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-md">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  {preview.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-md">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {!uploading && preview.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  
                  {/* File info */}
                  <p className="text-[10px] text-muted-foreground truncate mt-1" title={preview.name}>
                    {preview.name}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {progress}% hochgeladen...
            </p>
          </div>
        )}

        {/* Results summary */}
        {results && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p><strong>{results.success_count}</strong> von {results.total} Bildern erfolgreich hochgeladen</p>
            {results.folder_id && saveToDocuments && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <FolderOpen className="w-4 h-4" />
                Gespeichert im Ordner "Bilder"
              </p>
            )}
          </div>
        )}

        {/* Options */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="save-to-docs"
            checked={saveToDocuments}
            onCheckedChange={setSaveToDocuments}
            disabled={uploading || results}
          />
          <Label htmlFor="save-to-docs" className="cursor-pointer text-sm">
            Auch im Dokumenten-Ordner "Bilder" speichern
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {results ? "Schließen" : "Abbrechen"}
          </Button>
          {!results && (
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="bg-red-500 hover:bg-red-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Hochladen...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {files.length} Bild{files.length !== 1 ? 'er' : ''} hochladen
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiImageUploadDialog;
