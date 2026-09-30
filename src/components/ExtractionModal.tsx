import React, { useState } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Info,
  Download,
  Copy,
  Check,
  FileDown,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { renderPdfPageToCanvas } from '../pdf/pdfRenderer';

export const ExtractionModal: React.FC = () => {
  const { isExtractionModalOpen, setModalOpen, doc, pdfProxy, currentPageIndex } = useEditorStore();
  const [tab, setTab] = useState<'text' | 'images' | 'metadata' | 'pages'>('text');
  const [copied, setCopied] = useState(false);

  if (!isExtractionModalOpen || !doc) return null;

  // Extract all text
  const allTextByPage = doc.pages.map((p, idx) => {
    const origTexts = p.originalTextBlocks.filter((b) => !b.isDeleted).map((b) => b.text);
    const addedTexts = p.objects
      .filter((o) => o.type === 'text')
      .map((o) => (o as any).content);
    return {
      page: idx + 1,
      text: [...origTexts, ...addedTexts].join(' '),
    };
  });

  const fullDocumentText = allTextByPage
    .map((p) => `--- PAGE ${p.page} ---\n${p.text}`)
    .join('\n\n');

  const totalWords = fullDocumentText
    .split(/\s+/)
    .filter((w) => w.trim().length > 0).length;

  // Collect all images in document
  const allImages = doc.pages.flatMap((p, idx) =>
    p.objects
      .filter((o) => o.type === 'image')
      .map((o) => ({
        page: idx + 1,
        ...(o as any),
      }))
  );

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullDocumentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([fullDocumentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'document'}-extracted-text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPageImage = async (pageIdx: number) => {
    if (!pdfProxy || !doc.pages[pageIdx].originalPageNumber) return;
    const canvas = document.createElement('canvas');
    await renderPdfPageToCanvas(
      pdfProxy,
      doc.pages[pageIdx].originalPageNumber,
      canvas,
      2.0,
      doc.pages[pageIdx].rotation
    );
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'document'}-page-${pageIdx + 1}.png`;
    a.click();
  };

  const activePage = doc.pages[currentPageIndex];
  const widthMm = (activePage.width * 0.352778).toFixed(1);
  const heightMm = (activePage.height * 0.352778).toFixed(1);
  const widthIn = (activePage.width / 72).toFixed(2);
  const heightIn = (activePage.height / 72).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Document Extraction & Metadata
              </h3>
              <p className="text-[11px] text-neutral-500">
                Export text, download images, inspect dimensions and PDF properties
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen('extraction', false)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700 px-5 pt-3">
          <button
            onClick={() => setTab('text')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors ${
              tab === 'text'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Extracted Text ({totalWords} words)</span>
          </button>
          <button
            onClick={() => setTab('images')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors ${
              tab === 'images'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images ({allImages.length})</span>
          </button>
          <button
            onClick={() => setTab('pages')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors ${
              tab === 'pages'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Pages (PNG)</span>
          </button>
          <button
            onClick={() => setTab('metadata')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors ${
              tab === 'metadata'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Metadata & Specs</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {/* TAB 1: TEXT EXTRACTION */}
          {tab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">
                  Full extracted document text across all {doc.pages.length} page(s):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={fullDocumentText}
                className="w-full h-72 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-3 font-mono text-[11px] leading-relaxed outline-none"
              />
            </div>
          )}

          {/* TAB 2: IMAGES GALLERY */}
          {tab === 'images' && (
            <div>
              {allImages.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 space-y-1">
                  <ImageIcon className="w-10 h-10 mx-auto stroke-1" />
                  <p>No user-added images in this document.</p>
                  <p className="text-[11px]">Use the Image tool to insert images into your pages.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {allImages.map((img, i) => (
                    <div
                      key={img.id}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 bg-neutral-50 dark:bg-neutral-900 flex flex-col justify-between"
                    >
                      <div className="h-32 bg-white dark:bg-neutral-800 rounded flex items-center justify-center overflow-hidden mb-2">
                        <img
                          src={img.src}
                          alt={img.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-medium truncate max-w-[120px]">{img.name}</span>
                        <a
                          href={img.src}
                          download={`image-p${img.page}-${i + 1}.png`}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-blue-600"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <span className="text-[10px] text-neutral-400">Page {img.page}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPORT HIGH-RES PAGE IMAGES */}
          {tab === 'pages' && (
            <div className="space-y-3">
              <p className="text-neutral-500">
                Render and export any page as a crystal clear 300-DPI PNG image:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {doc.pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                  >
                    <div>
                      <span className="font-semibold block">Page {idx + 1}</span>
                      <span className="text-[10px] text-neutral-400">
                        {Math.round(p.width)} × {Math.round(p.height)} pt
                      </span>
                    </div>
                    <button
                      onClick={() => handleExportPageImage(idx)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export PNG</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: METADATA & SPECS */}
          {tab === 'metadata' && (
            <div className="space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 block border-b border-neutral-200 dark:border-neutral-700 pb-1">
                  Active Page Dimensions
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Points:</span>
                    <span>
                      {Math.round(activePage.width)} × {Math.round(activePage.height)} pt
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Millimeters:</span>
                    <span>
                      {widthMm} × {heightMm} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Inches:</span>
                    <span>
                      {widthIn} × {heightIn} in
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 block border-b border-neutral-200 dark:border-neutral-700 pb-1">
                  PDF Metadata Properties
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Title:</span>
                    <span className="font-medium">{doc.metadata.title || 'Untitled'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Author:</span>
                    <span>{doc.metadata.author || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Producer:</span>
                    <span>{doc.metadata.producer || 'PDFForge Engine'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Creation Date:</span>
                    <span>{doc.metadata.creationDate || new Date().toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">PDF Specification:</span>
                    <span>Version {doc.metadata.pdfVersion || '1.7'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Total Pages:</span>
                    <span>{doc.pages.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setModalOpen('extraction', false)}
            className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
