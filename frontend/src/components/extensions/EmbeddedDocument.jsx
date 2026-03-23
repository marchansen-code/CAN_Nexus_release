import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

// React component for rendering the embedded document in the editor
const EmbeddedDocumentComponent = ({ node }) => {
  const { documentId, filename, previewUrl, fileUrl } = node.attrs;
  
  return (
    <NodeViewWrapper className="embedded-document-wrapper" data-document-id={documentId}>
      <div 
        className="embedded-document my-4 border rounded-lg overflow-hidden bg-white dark:bg-slate-900"
        contentEditable={false}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{filename}</span>
          </div>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Öffnen
          </a>
        </div>
        <div className="relative" style={{ height: '500px' }}>
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={filename}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// Tiptap Node Extension for Embedded Documents
export const EmbeddedDocument = Node.create({
  name: 'embeddedDocument',
  
  group: 'block',
  
  atom: true,
  
  draggable: true,
  
  addAttributes() {
    return {
      documentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-document-id') || element.getAttribute('documentid'),
        renderHTML: attributes => {
          if (!attributes.documentId) return {};
          return { 'data-document-id': attributes.documentId };
        },
      },
      filename: {
        default: 'Dokument',
        parseHTML: element => element.getAttribute('data-filename') || element.getAttribute('filename') || 'Dokument',
        renderHTML: attributes => {
          if (!attributes.filename) return {};
          return { 'data-filename': attributes.filename };
        },
      },
      previewUrl: {
        default: null,
        parseHTML: element => element.getAttribute('data-preview-url') || element.getAttribute('previewurl'),
        renderHTML: attributes => {
          if (!attributes.previewUrl) return {};
          return { 'data-preview-url': attributes.previewUrl };
        },
      },
      fileUrl: {
        default: null,
        parseHTML: element => element.getAttribute('data-file-url') || element.getAttribute('fileurl'),
        renderHTML: attributes => {
          if (!attributes.fileUrl) return {};
          return { 'data-file-url': attributes.fileUrl };
        },
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-embedded-document]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const filename = HTMLAttributes['data-filename'] || 'Dokument';
    const previewUrl = HTMLAttributes['data-preview-url'] || '';
    const fileUrl = HTMLAttributes['data-file-url'] || '#';
    
    return ['div', mergeAttributes(HTMLAttributes, { 'data-embedded-document': '' }),
      ['div', { style: 'margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;' },
        ['div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;' },
          ['span', { style: 'font-weight:500;font-size:14px;color:#334155;' }, filename],
          ['a', { href: fileUrl, target: '_blank', rel: 'noopener noreferrer', style: 'font-size:12px;color:#2563eb;text-decoration:none;' }, 'Öffnen'],
        ],
        ['div', { style: 'height:500px;position:relative;' },
          ['iframe', { src: previewUrl, style: 'width:100%;height:100%;border:0;', title: filename }],
        ],
      ],
    ];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(EmbeddedDocumentComponent);
  },
});

export default EmbeddedDocument;
