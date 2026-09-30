import React, { useState } from 'react';
import {
  Download,
  X,
  FileCheck,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Layers,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { exportDocumentToPdf, downloadPdf } from '../pdf/pdfExporter';
import { formatFileSize } from '../utils/geometry';

export const ExportModal: React.FC = () => {
  const { isExportModalOpen, setModalOpen, doc, currentPageIndex } = useEditorStore();

  const [fileName, setFileName] = useState(doc?.title || 'Document');
  const [pageSelection, setPageSelection] = useState<'all' | 'current'>('all');
  const [flatten, setFlatten] = useState(false);
  const [maskRedacted, setMaskRedacted] = useState(true);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  // Completed PDF bytes
  const [processedBytes, setProcessedBytes] = useState<Uint8Array | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Sync title when opened
  React.useEffect(() => {
    if (doc?.title) {
      setFileName(doc.title.replace(/\.pdf$/i, ''));
    }
    setProcessedBytes(null);
    setPreviewBlobUrl(null);
    setIsProcessing(false);
    setProgressPct(0);
  }, [isExportModalOpen, doc?.title]);

  if (!isExportModalOpen || !doc) return null;

  const totalObjectsCount = doc.pages.reduce((acc, p) => acc + p.objects.length, 0);
  const totalOriginalTextCount = doc.pages.reduce(
    (acc, p) => acc + p.originalTextBlocks.filter((b) => b.isModified).length,
    0
  );

  const handleStartProcessing = async () => {
    useEditorStore.getState().setEditingTextId(null);
    setIsProcessing(true);
    setProgressPct(10);
    setProcessStatus('Saving document changes and preparing pages...');

    try {
      // Determine page range
      const pageRange =
        pageSelection === 'current' ? [currentPageIndex] : undefined;

      const bytes = await exportDocumentToPdf(doc, {
        flatten,
        pageRange,
        onProgress: (status, pct) => {
          setProcessStatus(status);
          setProgressPct(pct);
        },
      });

      // Create preview blob URL
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setProcessedBytes(bytes);
      setPreviewBlobUrl(url);
      setProgressPct(100);
      setProcessStatus('PDF Processed Successfully!');
    } catch (err: any) {
      console.error('Export error:', err);
      setProcessStatus(`Export Error: ${err.message || 'Failed to generate PDF'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedDownload = () => {
    if (!processedBytes) return;
    const finalName = `${fileName.trim() || 'document'}.pdf`;
    downloadPdf(processedBytes, finalName);
  };

  const handlePreviewNewTab = () => {
    if (!previewBlobUrl) return;
    window.open(previewBlobUrl, '_blank');
  };

  const handleClose = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setModalOpen('export', false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Export & Download PDF
              </h3>
              <p className="text-[11px] text-neutral-500">
                Save changes, process vector & image layers, and download your PDF
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* STEP 1: CONFIGURATION (if not yet processed) */}
          {!processedBytes ? (
            <div className="space-y-4">
              {/* File Name */}
              <div className="space-y-1">
                <label className="font-medium text-neutral-700 dark:text-neutral-300">
                  PDF File Name
                </label>
                <div className="flex items-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter file name"
                    disabled={isProcessing}
                    className="w-full bg-transparent outline-none font-medium text-xs text-neutral-800 dark:text-neutral-200"
                  />
                  <span className="text-neutral-400 font-mono text-[11px] ml-1">.pdf</span>
                </div>
              </div>

              {/* Document Overview Summary */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> Document Content:
                  </span>
                  <span className="font-mono">
                    {doc.pages.length} Page{doc.pages.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Custom Added Objects:</span>
                  <span>{totalObjectsCount} elements</span>
                </div>
                {totalOriginalTextCount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400">
                    <span>Modified Original Text:</span>
                    <span>{totalOriginalTextCount} blocks masked</span>
                  </div>
                )}
              </div>

              {/* Page Selection */}
              <div className="space-y-1.5">
                <label className="font-medium text-neutral-700 dark:text-neutral-300">
                  Pages to Include
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPageSelection('all')}
                    disabled={isProcessing}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      pageSelection === 'all'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span>All Pages (1 - {doc.pages.length})</span>
                    {pageSelection === 'all' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSelection('current')}
                    disabled={isProcessing}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      pageSelection === 'current'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span>Current Page ({currentPageIndex + 1} only)</span>
                    {pageSelection === 'current' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maskRedacted}
                    onChange={(e) => setMaskRedacted(e.target.checked)}
                    disabled={isProcessing}
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 block">
                      Ensure modified text is whited-out
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Covers old original PDF text underneath replacement text
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flatten}
                    onChange={(e) => setFlatten(e.target.checked)}
                    disabled={isProcessing}
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 block">
                      Flatten PDF Annotations & Forms
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Locks form fields and annotations into static graphics for maximum viewer compatibility
                    </span>
                  </div>
                </label>
              </div>

              {/* Privacy badge */}
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-md text-[11px] text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>100% Local-First: Processing and file assembly happen in your browser.</span>
              </div>

              {/* In-Progress Progress Bar */}
              {isProcessing && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      {processStatus}
                    </span>
                    <span className="font-mono font-bold">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: PROCESSED & READY FOR DOWNLOAD */
            <div className="space-y-4 py-2 text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <FileCheck className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  PDF Processed & Ready!
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  All text edits, embedded images, and vector layers have been compiled successfully.
                </p>
              </div>

              {/* File details card */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-between text-left">
                <div className="truncate max-w-[280px]">
                  <span className="font-semibold block truncate">
                    {fileName.trim() || 'document'}.pdf
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {pageSelection === 'all'
                      ? `${doc.pages.length} Pages`
                      : `Page ${currentPageIndex + 1}`}
                  </span>
                </div>
                <div className="text-right font-mono text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                  {formatFileSize(processedBytes.length)}
                </div>
              </div>

              {/* Big Download Button */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleProceedDownload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-md transition-all hover:scale-[1.01]"
                >
                  <Download className="w-4 h-4" />
                  <span>Proceed to Download PDF</span>
                </button>

                {previewBlobUrl && (
                  <button
                    onClick={handlePreviewNewTab}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg font-medium text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview in New Tab</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          {processedBytes ? (
            <button
              onClick={() => setProcessedBytes(null)}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
            >
              ← Back to Settings
            </button>
          ) : (
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300"
            >
              Cancel
            </button>
          )}

          {!processedBytes && (
            <button
              onClick={handleStartProcessing}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Changes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Changes & Process PDF</span>
                </>
              )}
            </button>
          )}

          {processedBytes && (
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md font-medium text-xs text-neutral-700 dark:text-neutral-200"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
