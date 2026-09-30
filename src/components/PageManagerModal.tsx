import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  RotateCw,
  Copy,
  Trash2,
  FilePlus,
  Scissors,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { parsePdfFile } from '../pdf/pdfParser';
import { exportDocumentToPdf, downloadPdf } from '../pdf/pdfExporter';

export const PageManagerModal: React.FC = () => {
  const {
    isPageManagerOpen,
    setModalOpen,
    doc,
    addBlankPage,
    duplicatePage,
    deletePage,
    rotatePage,
    reorderPages,
  } = useEditorStore();

  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  if (!isPageManagerOpen || !doc) return null;

  const togglePageSelect = (idx: number) => {
    if (selectedPages.includes(idx)) {
      setSelectedPages(selectedPages.filter((p) => p !== idx));
    } else {
      setSelectedPages([...selectedPages, idx]);
    }
  };

  const selectAll = () => {
    if (selectedPages.length === doc.pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(doc.pages.map((_, i) => i));
    }
  };

  // Merge another PDF file
  const handleMergePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const bytes = new Uint8Array(ev.target?.result as ArrayBuffer);
        const { docModel: incomingDoc } = await parsePdfFile(bytes, file.name);

        const newPages = [...doc.pages, ...incomingDoc.pages];
        newPages.forEach((p, i) => (p.pageNumber = i + 1));

        useEditorStore.setState({
          doc: {
            ...doc,
            pages: newPages,
            pageCount: newPages.length,
          },
        });
        useEditorStore.getState().pushHistorySnapshot(`Merged ${incomingDoc.pages.length} pages from "${file.name}"`);
      } catch (err) {
        console.error('Merge failed:', err);
        alert('Could not merge the selected PDF.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Extract selected pages as a new PDF
  const handleExtractSelectedPages = async () => {
    if (selectedPages.length === 0) return;
    const extractedPages = doc.pages.filter((_, idx) => selectedPages.includes(idx));

    const extractedDoc = {
      ...doc,
      id: `doc-extract-${Date.now()}`,
      title: `${doc.title} (Extracted Pages)`,
      pages: extractedPages,
      pageCount: extractedPages.length,
    };

    try {
      const bytes = await exportDocumentToPdf(extractedDoc);
      downloadPdf(bytes, `${doc.title}-extracted.pdf`);
    } catch (e) {
      console.error('Extract failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <input
          type="file"
          ref={mergeInputRef}
          onChange={handleMergePdf}
          accept="application/pdf"
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Document Page Manager
              </h3>
              <p className="text-[11px] text-neutral-500">
                Organize, merge other PDFs, batch rotate, duplicate, or extract pages
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen('pageManager', false)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100"
            >
              {selectedPages.length === doc.pages.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Select All ({selectedPages.length})</span>
            </button>

            {selectedPages.length > 0 && (
              <>
                <button
                  onClick={() => {
                    selectedPages.forEach((idx) => rotatePage(idx, 90));
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate Selected</span>
                </button>
                <button
                  onClick={handleExtractSelectedPages}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 text-blue-600"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Extract to New PDF</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => mergeInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 font-medium"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Merge Another PDF</span>
            </button>
            <button
              onClick={() => addBlankPage()}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Blank Page</span>
            </button>
          </div>
        </div>

        {/* Page Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-4 gap-4">
          {doc.pages.map((p, idx) => {
            const isSelected = selectedPages.includes(idx);
            return (
              <div
                key={p.id}
                onClick={() => togglePageSelect(idx)}
                className={`border rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/40 dark:bg-blue-950/40'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="font-semibold text-xs">Page {idx + 1}</span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-blue-600 pointer-events-none"
                  />
                </div>

                <div
                  className="w-full bg-white dark:bg-neutral-800 border rounded shadow-2xs flex items-center justify-center p-2 mb-2 font-mono text-[10px] text-neutral-400"
                  style={{
                    aspectRatio: '1 / 1.3',
                    transform: p.rotation ? `rotate(${p.rotation}deg)` : undefined,
                  }}
                >
                  {Math.round(p.width)} × {Math.round(p.height)} pt
                </div>

                <div
                  className="flex items-center justify-between pt-1 text-neutral-500 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => rotatePage(idx, 90)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => duplicatePage(idx)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (doc.pages.length > 1) deletePage(idx);
                    }}
                    disabled={doc.pages.length <= 1}
                    className="p-1 hover:bg-red-100 rounded text-red-500 disabled:opacity-20"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setModalOpen('pageManager', false)}
            className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md font-medium text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
