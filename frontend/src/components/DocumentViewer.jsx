import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCw, Download, FileText, Table, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from 'axios';
import { API } from '@/App';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FileIcon = ({ fileType }) => {
  const icons = {
    '.pdf': <FileText className="w-5 h-5 text-red-500" />,
    '.doc': <FileText className="w-5 h-5 text-blue-500" />,
    '.docx': <FileText className="w-5 h-5 text-blue-500" />,
    '.txt': <FileText className="w-5 h-5 text-gray-500" />,
    '.csv': <Table className="w-5 h-5 text-green-500" />,
    '.xls': <FileSpreadsheet className="w-5 h-5 text-green-600" />,
    '.xlsx': <FileSpreadsheet className="w-5 h-5 text-green-600" />,
  };
  return icons[fileType] || <FileText className="w-5 h-5" />;
};

// PDF Viewer Component
const PdfViewerContent = ({ url, filename }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('PDF load error:', error);
    setError('PDF konnte nicht geladen werden');
    setLoading(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-800 border-b flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm">
            <Input
              type="number"
              min={1}
              max={numPages || 1}
              value={pageNumber}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= (numPages || 1)) setPageNumber(v);
              }}
              className="w-14 h-8 text-center"
            />
            <span className="text-muted-foreground">/ {numPages || '-'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPageNumber(p => Math.min(p + 1, numPages || 1))} disabled={pageNumber >= (numPages || 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}><ZoomOut className="w-4 h-4" /></Button>
          <span className="text-sm min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setScale(s => Math.min(s + 0.25, 3.0))}><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setRotation(r => (r + 90) % 360)}><RotateCw className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-900 flex justify-center p-4">
        {loading && <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}
        {error && <div className="flex items-center justify-center h-full text-red-500">{error}</div>}
        <Document file={url} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={null} className="flex justify-center">
          <Page pageNumber={pageNumber} scale={scale} rotate={rotation} renderTextLayer={true} renderAnnotationLayer={true} className="shadow-xl" />
        </Document>
      </div>
    </div>
  );
};

// HTML Content Viewer (for processed documents)
const HtmlViewerContent = ({ content, filename }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-slate-100 dark:bg-slate-800 border-b flex items-center gap-2">
        <span className="text-sm font-medium">{filename}</span>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-white dark:bg-slate-950">
        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

// Text Viewer
const TextViewerContent = ({ content, filename }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-slate-100 dark:bg-slate-800 border-b flex items-center gap-2">
        <span className="text-sm font-medium">{filename}</span>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-white dark:bg-slate-950">
        <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
      </div>
    </div>
  );
};

// Spreadsheet Viewer
const SpreadsheetViewerContent = ({ content, filename }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-slate-100 dark:bg-slate-800 border-b flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium">{filename}</span>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-white dark:bg-slate-950">
        <div 
          className="overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

// Main Multi-Format Viewer
const DocumentViewer = ({ documentId, url, filename, fileType, className }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContent = async () => {
      if (fileType === '.pdf') {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/documents/${documentId}/content`);
        setContent(response.data);
        setLoading(false);
      } catch (err) {
        setError('Inhalt konnte nicht geladen werden');
        setLoading(false);
      }
    };

    loadContent();
  }, [documentId, fileType]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full text-red-500", className)}>
        {error}
      </div>
    );
  }

  // PDF viewer
  if (fileType === '.pdf') {
    return <PdfViewerContent url={url} filename={filename} />;
  }

  // Word documents
  if (fileType === '.doc' || fileType === '.docx') {
    return <HtmlViewerContent content={content?.html_content || ''} filename={filename} />;
  }

  // Text files
  if (fileType === '.txt') {
    return <TextViewerContent content={content?.extracted_text || ''} filename={filename} />;
  }

  // Spreadsheets
  if (['.csv', '.xls', '.xlsx'].includes(fileType)) {
    return <SpreadsheetViewerContent content={content?.html_content || ''} filename={filename} />;
  }

  // Fallback
  return (
    <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
      <div className="text-center">
        <FileIcon fileType={fileType} />
        <p className="mt-2">Vorschau nicht verfügbar für diesen Dateityp</p>
      </div>
    </div>
  );
};

export default DocumentViewer;
export { FileIcon };
