import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Loader2, 
  Search, 
  FileSpreadsheet, 
  File,
  CheckCircle2,
  Clock,
  XCircle,
  FolderOpen,
  Folder,
  HardDrive,
  Users,
  ArrowLeft,
  Check,
  Table2
} from 'lucide-react';
import { FileIcon } from './DocumentViewer';
import { cn } from '@/lib/utils';

const ACCEPTED_FILES = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx';

const StatusBadge = ({ status }) => {
  const badges = {
    completed: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Bereit</Badge>,
    processing: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1 animate-spin" />Verarbeitung</Badge>,
    pending: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Wartend</Badge>,
    failed: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Fehler</Badge>,
  };
  return badges[status] || null;
};

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

const DocumentImportDialog = ({ open, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState('existing');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Import state
  const [importing, setImporting] = useState(false);
  
  // Google Drive state
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFolders, setDriveFolders] = useState([]);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveFolderPath, setDriveFolderPath] = useState([{ id: "root", name: "Meine Ablage" }]);
  const [selectedDriveFile, setSelectedDriveFile] = useState(null);
  const [driveSubTab, setDriveSubTab] = useState("my-drive");
  const [sharedDrives, setSharedDrives] = useState([]);
  const [isInSharedDrive, setIsInSharedDrive] = useState(false);

  // Load existing documents and check drive status
  useEffect(() => {
    if (open) {
      loadDocuments();
      checkDriveStatus();
    }
  }, [open]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data.filter(d => d.status === 'completed'));
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Dokumente konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };
  
  const checkDriveStatus = async () => {
    try {
      const response = await axios.get(`${API}/drive/status`);
      setDriveConnected(response.data.connected);
      if (response.data.connected) {
        loadSharedDrives();
        // Load initial files for "Meine Ablage"
        loadDriveFiles("root");
      }
    } catch (error) {
      console.error('Failed to check drive status:', error);
    }
  };
  
  const loadSharedDrives = async () => {
    try {
      const response = await axios.get(`${API}/drive/shared-drives`);
      setSharedDrives(response.data.drives || []);
    } catch (error) {
      console.error('Failed to load shared drives:', error);
    }
  };
  
  const loadDriveFiles = async (folderId) => {
    setDriveLoading(true);
    setSelectedDriveFile(null);
    try {
      const response = await axios.get(`${API}/drive/files`, {
        params: { folder_id: folderId }
      });
      setDriveFolders(response.data.folders || []);
      setDriveFiles(response.data.files || []);
    } catch (error) {
      console.error('Failed to load drive files:', error);
      toast.error('Google Drive Dateien konnten nicht geladen werden');
    } finally {
      setDriveLoading(false);
    }
  };
  
  const connectDrive = async () => {
    try {
      const response = await axios.get(`${API}/drive/connect`);
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Failed to connect drive:', error);
      toast.error('Google Drive Verbindung fehlgeschlagen');
    }
  };
  
  const navigateDriveFolder = (folder) => {
    setDriveFolderPath([...driveFolderPath, { id: folder.id, name: folder.name }]);
    loadDriveFiles(folder.id);
  };
  
  const navigateDriveBack = () => {
    if (driveFolderPath.length > 1) {
      const newPath = driveFolderPath.slice(0, -1);
      setDriveFolderPath(newPath);
      loadDriveFiles(newPath[newPath.length - 1].id);
    } else if (isInSharedDrive && driveFolderPath.length === 1) {
      setIsInSharedDrive(false);
      setDriveFolderPath([]);
      setDriveFiles([]);
      setDriveFolders([]);
    }
  };
  
  const handleDriveSubTabChange = (tab) => {
    setDriveSubTab(tab);
    setSelectedDriveFile(null);
    if (tab === "my-drive") {
      setDriveFolderPath([{ id: "root", name: "Meine Ablage" }]);
      setIsInSharedDrive(false);
      loadDriveFiles("root");
    } else {
      setIsInSharedDrive(false);
      setDriveFolderPath([]);
      setDriveFiles([]);
      setDriveFolders([]);
    }
  };
  
  const handleSharedDriveClick = (drive) => {
    setIsInSharedDrive(true);
    setDriveFolderPath([{ id: drive.id, name: drive.name }]);
    loadDriveFiles(drive.id);
  };
  
  const handleDriveImport = async () => {
    if (!selectedDriveFile) return;
    
    setImporting(true);
    try {
      // First import to document system
      const importResponse = await axios.post(`${API}/drive/import/${selectedDriveFile.id}`);
      
      // Then get the content
      const contentResponse = await axios.get(`${API}/documents/${importResponse.data.doc_id}/content`);
      
      onImport({
        html: contentResponse.data.html_content,
        text: contentResponse.data.extracted_text,
        filename: contentResponse.data.filename,
        fileType: contentResponse.data.file_type
      });
      
      toast.success(`"${selectedDriveFile.name}" wurde importiert`);
      onClose();
    } catch (error) {
      console.error('Drive import failed:', error);
      toast.error(error.response?.data?.detail || 'Import fehlgeschlagen');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_language', 'de');

      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      toast.success('Datei hochgeladen. Verarbeitung läuft...');
      
      // Poll for completion
      const docId = response.data.document_id;
      let attempts = 0;
      const maxAttempts = 30;
      
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const docResponse = await axios.get(`${API}/documents/${docId}`);
          if (docResponse.data.status === 'completed') {
            clearInterval(pollInterval);
            toast.success('Datei erfolgreich verarbeitet. Importiere...');
            
            // Automatically import the content after successful upload
            try {
              const contentResponse = await axios.get(`${API}/documents/${docId}/content`);
              onImport({
                html: contentResponse.data.html_content,
                text: contentResponse.data.extracted_text,
                filename: contentResponse.data.filename,
                fileType: contentResponse.data.file_type
              });
              toast.success(`"${docResponse.data.filename}" wurde importiert`);
              loadDocuments();
              onClose();
            } catch (importErr) {
              console.error('Import after upload failed:', importErr);
              toast.error('Import fehlgeschlagen');
              // Fallback: show in existing docs
              setSelectedDoc(docResponse.data);
              setActiveTab('existing');
              loadDocuments();
            }
          } else if (docResponse.data.status === 'failed' || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            toast.error('Verarbeitung fehlgeschlagen');
          }
        } catch (err) {
          clearInterval(pollInterval);
        }
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedDoc) return;

    setImporting(true);
    try {
      const response = await axios.get(`${API}/documents/${selectedDoc.document_id}/content`);
      onImport({
        html: response.data.html_content,
        text: response.data.extracted_text,
        filename: response.data.filename,
        fileType: response.data.file_type
      });
      toast.success(`"${selectedDoc.filename}" wurde importiert`);
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import fehlgeschlagen');
    } finally {
      setImporting(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getDriveFileIcon = (mimeType) => {
    if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel") || mimeType?.includes("csv")) {
      return <Table2 className="w-5 h-5 text-green-600" />;
    }
    if (mimeType?.includes("word") || mimeType?.includes("document")) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType?.includes("pdf")) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dokument importieren</DialogTitle>
          <DialogDescription>
            Wählen Sie ein bestehendes Dokument, laden Sie eine neue Datei hoch oder importieren Sie aus Google Drive.
            Unterstützte Formate: PDF, DOC/DOCX, TXT, CSV, XLS/XLSX
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="existing" className="gap-2 focus:ring-0 focus:outline-none focus-visible:ring-0">
              <FolderOpen className="w-4 h-4" />
              Bestehende Dokumente
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2 focus:ring-0 focus:outline-none focus-visible:ring-0">
              <Upload className="w-4 h-4" />
              Neue Datei hochladen
            </TabsTrigger>
            <TabsTrigger value="drive" className="gap-2 focus:ring-0 focus:outline-none focus-visible:ring-0">
              <GoogleDriveLogo className="w-4 h-4" />
              Google Drive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Dokumente durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Document List */}
            <ScrollArea className="flex-1 border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Keine Dokumente gefunden</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.document_id}
                      onClick={() => setSelectedDoc(doc)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        selectedDoc?.document_id === doc.document_id
                          ? "bg-indigo-50 border-2 border-indigo-300 dark:bg-indigo-950"
                          : "hover:bg-muted border-2 border-transparent"
                      )}
                    >
                      <FileIcon fileType={doc.file_type || '.pdf'} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Import Button */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!selectedDoc || importing}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Importieren
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 flex flex-col mt-4">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                {uploading ? (
                  <div className="space-y-4">
                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-500" />
                    <div>
                      <p className="font-medium">Datei wird hochgeladen...</p>
                      <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                    </div>
                    <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept={ACCEPTED_FILES}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed rounded-lg p-12 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium mb-1">Datei zum Hochladen auswählen</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, DOC, DOCX, TXT, CSV, XLS, XLSX
                      </p>
                      <Button variant="outline" className="mt-4">
                        Datei auswählen
                      </Button>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drive" className="flex-1 flex flex-col min-h-0 mt-4">
            {!driveConnected ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <GoogleDriveLogo className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Google Drive verbinden</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Verbinden Sie Ihr Google Drive, um Dateien direkt zu importieren.
                  </p>
                  <Button onClick={connectDrive} className="bg-blue-600 hover:bg-blue-700">
                    <GoogleDriveLogo className="w-4 h-4 mr-2" />
                    Mit Google Drive verbinden
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Drive Sub-Tabs - Using buttons instead of TabsTrigger to avoid parent tab interference */}
                <div className="grid w-full grid-cols-2 gap-1 p-1 bg-muted rounded-lg mb-4">
                  <button
                    onClick={() => handleDriveSubTabChange("my-drive")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      driveSubTab === "my-drive"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <HardDrive className="w-4 h-4" />
                    Meine Ablage
                  </button>
                  <button
                    onClick={() => handleDriveSubTabChange("shared-drives")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      driveSubTab === "shared-drives"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    Geteilte Ablagen
                  </button>
                </div>
                
                {/* Breadcrumb */}
                {(driveSubTab === "my-drive" || isInSharedDrive) && driveFolderPath.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-slate-600 border-b pb-2 mb-2">
                    {(driveFolderPath.length > 1 || isInSharedDrive) && (
                      <Button variant="ghost" size="sm" onClick={navigateDriveBack} className="h-7 px-2">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    )}
                    {driveFolderPath.map((item, index) => (
                      <React.Fragment key={item.id}>
                        {index > 0 && <span className="text-slate-400">/</span>}
                        <span className="truncate max-w-[150px]">{item.name}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Drive Content */}
                <ScrollArea className="flex-1 border rounded-lg min-h-[280px]">
                  {driveLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : driveSubTab === "shared-drives" && !isInSharedDrive ? (
                    // Shared drives list
                    sharedDrives.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Keine geteilten Ablagen verfügbar</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {sharedDrives.map((drive) => (
                          <button
                            key={drive.id}
                            onClick={() => handleSharedDriveClick(drive)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted transition-colors"
                          >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{drive.name}</p>
                              <p className="text-xs text-muted-foreground">Geteilte Ablage</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    // Files and folders
                    <div className="p-2 space-y-1">
                      {/* Folders */}
                      {driveFolders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => navigateDriveFolder(folder)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted transition-colors"
                        >
                          <Folder className="w-5 h-5 text-amber-500" />
                          <span className="flex-1 font-medium truncate">{folder.name}</span>
                        </button>
                      ))}
                      
                      {/* Files */}
                      {driveFiles.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => setSelectedDriveFile(file)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                            selectedDriveFile?.id === file.id
                              ? "bg-blue-50 border-2 border-blue-300"
                              : "hover:bg-muted border-2 border-transparent"
                          )}
                        >
                          {getDriveFileIcon(file.mimeType)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.isGoogleDoc && <span className="text-blue-600">Google Docs • </span>}
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          {selectedDriveFile?.id === file.id && (
                            <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                      
                      {driveFolders.length === 0 && driveFiles.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Keine unterstützten Dateien in diesem Ordner</p>
                          <p className="text-sm mt-1">Unterstützt: PDF, DOCX, TXT, CSV, XLSX</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Import Button */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={onClose}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleDriveImport} 
                    disabled={!selectedDriveFile || importing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importiere...
                      </>
                    ) : (
                      <>
                        <GoogleDriveLogo className="w-4 h-4 mr-2" />
                        Importieren
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentImportDialog;
