import React, { useState } from 'react';
import { Sparkles, X, Check, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { runOcrOnCanvas, OcrProgress } from '../services/ocrService';
import { renderPdfPageToCanvas } from '../pdf/pdfRenderer';
import { TextObject } from '../types/pdf';

export const OcrModal: React.FC = () => {
  const {
    isOcrModalOpen,
    setModalOpen,
    doc,
    currentPageIndex,
    pdfProxy,
    pushHistorySnapshot,
  } = useEditorStore();

  const [language, setLanguage] = useState('eng');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<OcrProgress>({ status: '', progress: 0 });
  const [detectedCount, setDetectedCount] = useState<number | null>(null);

  if (!isOcrModalOpen || !doc) return null;

  const currentPage = doc.pages[currentPageIndex];
  const isImageOnly = currentPage.isScanned;

  const handleStartOcr = async () => {
    if (!pdfProxy || !currentPage.originalPageNumber) return;

    setIsRunning(true);
    setProgress({ status: 'Rendering high-resolution scan...', progress: 5 });

    try {
      // Create offscreen canvas for OCR at high DPI
      const offscreenCanvas = document.createElement('canvas');
      await renderPdfPageToCanvas(
        pdfProxy,
        currentPage.originalPageNumber,
        offscreenCanvas,
        2.0, // 2x scale for sharp OCR recognition
        currentPage.rotation
      );

      // Run Tesseract OCR
      const recognizedBlocks = await runOcrOnCanvas(offscreenCanvas, language, (prog) => {
        setProgress(prog);
      });

      setDetectedCount(recognizedBlocks.length);

      // Create editable TextObjects from recognized blocks
      const newTextObjects: TextObject[] = recognizedBlocks.map((b, idx) => ({
        id: `ocr-txt-${Date.now()}-${idx}`,
        type: 'text',
        pageId: currentPage.id,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        rotation: 0,
        opacity: 1,
        zIndex: currentPage.objects.length + idx + 1,
        locked: false,
        visible: true,
        name: `OCR Text: ${b.text.substring(0, 12)}...`,
        content: b.text,
        fontFamily: 'Inter, sans-serif',
        fontSize: b.fontSize,
        fontWeight: 'normal',
        fontStyle: 'normal',
        underline: false,
        strikethrough: false,
        color: '#0f172a',
        alignment: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        redactBackground: true,
      }));

      // Update doc state
      const newPages = [...doc.pages];
      newPages[currentPageIndex] = {
        ...currentPage,
        originalTextBlocks: [...currentPage.originalTextBlocks, ...recognizedBlocks],
        objects: [...currentPage.objects, ...newTextObjects],
        ocrApplied: true,
      };

      useEditorStore.setState({ doc: { ...doc, pages: newPages } });
      pushHistorySnapshot(`OCR Applied: ${recognizedBlocks.length} text blocks recognized`);

      setTimeout(() => {
        setIsRunning(false);
        setModalOpen('ocr', false);
      }, 1200);
    } catch (err: any) {
      console.error('OCR failed:', err);
      setProgress({ status: `OCR Error: ${err.message || 'Failed to process page'}`, progress: 0 });
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Optical Character Recognition (OCR)
              </h3>
              <p className="text-[11px] text-neutral-500">
                Transform scanned images and flat pages into editable text
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen('ocr', false)}
            disabled={isRunning}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status banner */}
          {isImageOnly ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block">Scanned / Image Page Detected</span>
                <span className="text-[11px] opacity-90">
                  Page {currentPageIndex + 1} appears to be an image without selectable text.
                  Running OCR will extract and align editable text blocks over the image.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-300">
              <span className="font-medium block">
                Page {currentPageIndex + 1} already has native text
              </span>
              <span className="text-[11px] opacity-90">
                You can already click and edit text directly. OCR is recommended only for flattened
                scans or embedded raster graphics.
              </span>
            </div>
          )}

          {/* Language selector */}
          <div className="space-y-1.5">
            <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Recognition Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isRunning}
              className="w-full bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="eng">English</option>
              <option value="spa">Spanish (Español)</option>
              <option value="fra">French (Français)</option>
              <option value="deu">German (Deutsch)</option>
              <option value="ita">Italian (Italiano)</option>
              <option value="por">Portuguese (Português)</option>
              <option value="jpn">Japanese (日本語)</option>
              <option value="chi_sim">Chinese Simplified (简体中文)</option>
            </select>
          </div>

          {/* Progress Bar (when running) */}
          {isRunning && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  {progress.status}
                </span>
                <span className="font-mono font-medium">{progress.progress}%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {detectedCount !== null && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 text-center font-medium">
              ✓ Successfully recognized and placed {detectedCount} text blocks!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setModalOpen('ocr', false)}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            Close
          </button>
          <button
            onClick={handleStartOcr}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run OCR on Page {currentPageIndex + 1}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
