import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from './stores/editorStore';
import { TopMenuBar } from './components/TopMenuBar';
import { QuickToolbar } from './components/QuickToolbar';
import { PageThumbnails } from './components/PageThumbnails';
import { PropertyPanel } from './components/PropertyPanel';
import { PdfPageView } from './canvas/PdfPageView';
import { SearchReplaceBar } from './components/SearchReplaceBar';
import { SignaturesModal } from './components/SignaturesModal';
import { OcrModal } from './components/OcrModal';
import { ExtractionModal } from './components/ExtractionModal';
import { PageManagerModal } from './components/PageManagerModal';
import { FormsConfigModal } from './components/FormsConfigModal';
import { CloudProjectsModal } from './components/CloudProjectsModal';
import { HelpShortcutsModal } from './components/HelpShortcutsModal';
import { ExportModal } from './components/ExportModal';
import { createSampleContractPdf, SAMPLE_TEMPLATES } from './pdf/samplePdfs';
import {
  FileText,
  Upload,
  FilePlus,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Layers,
  Sliders,
  PlusCircle,
  Maximize2,
  Hand,
  MousePointer,
  PenTool,
  Type,
  Image as ImageIcon,
  StickyNote,
  Stamp,
  Square,
  X,
} from 'lucide-react';

export default function App() {
  const {
    doc,
    loadPdfFromData,
    loadBlankDocument,
    currentPageIndex,
    setCurrentPage,
    zoom,
    setZoom,
    currentTool,
    setTool,
    undo,
    redo,
    copySelection,
    pasteClipboard,
    duplicateSelected,
    deleteSelected,
    selectAll,
    clearSelection,
    setSearchOpen,
    updateObject,
    selectedIds,
    isLoading,
    loadingMessage,
    error,
    setModalOpen,
    isMobileThumbnailsOpen,
    isMobileInspectorOpen,
    setMobileThumbnailsOpen,
    setMobileInspectorOpen,
    fitToWidth,
    addObject,
  } = useEditorStore();

  const workspaceRef = useRef<HTMLDivElement>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);
  const [mobileAddSheetOpen, setMobileAddSheetOpen] = useState(false);

  // Pan state for Space + drag or Hand tool
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const isSpacePressedRef = useRef(false);

  // Touch panning & pinch-to-zoom state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName?.toLowerCase() !== 'input' && (e.target as HTMLElement)?.tagName?.toLowerCase() !== 'textarea') {
        isSpacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Auto-load starter contract on mount so the user has an instant interactive playground
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const bytes = await createSampleContractPdf();
        if (active && !useEditorStore.getState().doc) {
          await loadPdfFromData(bytes, 'Apex-Mutual-NDA-Contract.pdf');
        }
      } catch (e) {
        console.warn('Initial sample load skipped or failed', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Track visible page on scroll
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws || !doc || doc.pages.length <= 1) return;

    let timeoutId: any = null;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const pageElements = ws.querySelectorAll('[data-page-index]');
        if (pageElements.length === 0) return;

        const wsRect = ws.getBoundingClientRect();
        const wsCenterY = wsRect.top + wsRect.height / 2;

        let bestIndex = 0;
        let minDistance = Infinity;

        pageElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const pageCenterY = rect.top + rect.height / 2;
          const distance = Math.abs(pageCenterY - wsCenterY);
          if (distance < minDistance) {
            minDistance = distance;
            const pIdx = parseInt(el.getAttribute('data-page-index') || '0', 10);
            bestIndex = pIdx;
          }
        });

        if (bestIndex !== useEditorStore.getState().currentPageIndex) {
          useEditorStore.getState().setCurrentPage(bestIndex);
        }
      }, 100);
    };

    ws.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      ws.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [doc]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts if typing inside input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      // Ctrl/Cmd + shortcuts
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          if (!isInput) {
            e.preventDefault();
            copySelection();
          }
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          if (!isInput) {
            e.preventDefault();
            pasteClipboard();
          }
          return;
        }
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          duplicateSelected();
          return;
        }
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          setSearchOpen(true);
          return;
        }
        if (e.key === 'a' || e.key === 'A') {
          if (!isInput) {
            e.preventDefault();
            selectAll();
          }
          return;
        }
        if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          filePickerRef.current?.click();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setModalOpen('export', true);
          return;
        }
      }

      // Standalone keys
      if (!isInput) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          deleteSelected();
          return;
        }
        if (e.key === 'Escape') {
          clearSelection();
          setSearchOpen(false);
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          setTool('select');
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          setTool('hand');
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          setTool('text');
          return;
        }

        // Arrow keys nudge
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

          if (doc && doc.pages[currentPageIndex]) {
            const page = doc.pages[currentPageIndex];
            selectedIds.forEach((id) => {
              const obj = page.objects.find((o) => o.id === id);
              if (obj && !obj.locked) {
                updateObject(id, { x: obj.x + dx, y: obj.y + dy }, false);
              }
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    copySelection,
    pasteClipboard,
    duplicateSelected,
    deleteSelected,
    selectAll,
    clearSelection,
    setSearchOpen,
    setTool,
    selectedIds,
    doc,
    currentPageIndex,
    updateObject,
  ]);

  // Hand tool & Space key panning handlers
  const handleWorkspaceMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTool === 'hand' || e.button === 1 || isSpacePressedRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleWorkspaceMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && panStart && workspaceRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      workspaceRef.current.scrollLeft -= dx;
      workspaceRef.current.scrollTop -= dy;
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleWorkspaceMouseUp = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  // Touch panning & pinch-to-zoom handlers
  const handleWorkspaceTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      if (currentTool === 'hand') {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartDistanceRef.current = dist;
      pinchStartZoomRef.current = useEditorStore.getState().zoom;
      touchStartRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleWorkspaceTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && touchStartRef.current && currentTool === 'hand' && workspaceRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      workspaceRef.current.scrollLeft -= dx;
      workspaceRef.current.scrollTop -= dy;
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && pinchStartDistanceRef.current && workspaceRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / pinchStartDistanceRef.current;
      const newZoom = Math.min(3.0, Math.max(0.3, pinchStartZoomRef.current * ratio));
      setZoom(Number(newZoom.toFixed(2)));

      if (touchStartRef.current) {
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const dx = midX - touchStartRef.current.x;
        const dy = midY - touchStartRef.current.y;
        workspaceRef.current.scrollLeft -= dx;
        workspaceRef.current.scrollTop -= dy;
        touchStartRef.current = { x: midX, y: midY };
      }
    }
  };

  const handleWorkspaceTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartDistanceRef.current = null;
    }
    if (e.touches.length === 0) {
      touchStartRef.current = null;
    }
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const bytes = new Uint8Array(ev.target?.result as ArrayBuffer);
      loadPdfFromData(bytes, file.name);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 select-none">
      <input
        type="file"
        ref={filePickerRef}
        onChange={handleFilePicked}
        accept="application/pdf"
        className="hidden"
      />

      {/* Top Application Menu */}
      <TopMenuBar />

      {/* Quick Access Formatting & Tool Toolbar */}
      <QuickToolbar />

      {/* Main Studio Middle Row */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Adobe Acrobat Style Page Thumbnails */}
        <PageThumbnails />

        {/* Center: Document Canvas Scroll Viewport */}
        <div
          ref={workspaceRef}
          onMouseDown={handleWorkspaceMouseDown}
          onMouseMove={handleWorkspaceMouseMove}
          onMouseUp={handleWorkspaceMouseUp}
          onTouchStart={handleWorkspaceTouchStart}
          onTouchMove={handleWorkspaceTouchMove}
          onTouchEnd={handleWorkspaceTouchEnd}
          className={`flex-1 overflow-auto bg-neutral-200/70 dark:bg-neutral-950 p-2 sm:p-8 pb-24 lg:pb-12 flex flex-col items-center relative ${
            currentTool === 'hand' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(156, 163, 175, 0.35) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {doc && doc.pages.length > 0 ? (
            <div className="space-y-8 my-auto pb-12">
              {doc.pages.map((page, idx) => (
                <div
                  key={page.id}
                  data-page-index={idx}
                  onMouseDown={() => {
                    if (idx !== currentPageIndex) setCurrentPage(idx);
                  }}
                  onClick={() => {
                    if (idx !== currentPageIndex) setCurrentPage(idx);
                  }}
                  className={`relative transition-all duration-150 ${
                    idx === currentPageIndex
                      ? 'ring-4 ring-blue-500/20 rounded-xs'
                      : 'opacity-95 hover:opacity-100'
                  }`}
                >
                  {/* Floating Page Number indicator */}
                  <div className="absolute -top-6 left-0 text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
                    Page {idx + 1} of {doc.pages.length}
                  </div>

                  <PdfPageView page={page} pageIndex={idx} />
                </div>
              ))}
            </div>
          ) : (
            /* Welcome / Starter Screen */
            <div className="my-auto max-w-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-8 shadow-xl text-center space-y-5">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                <FileText className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Welcome to PDFForge Pro
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Professional desktop PDF editor in your browser with Word-like text editing,
                  Canva-style positioning, digital signatures, and OCR.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => filePickerRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Open PDF File</span>
                </button>
                <button
                  onClick={() => loadBlankDocument()}
                  className="flex items-center justify-center gap-2 p-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Blank Document</span>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700">
                <span className="text-[11px] text-neutral-400 block mb-2 font-medium">
                  Or load a starter demo document:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {SAMPLE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={async () => {
                        const bytes = await tmpl.generate();
                        loadPdfFromData(bytes, `${tmpl.name}.pdf`);
                      }}
                      className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-[11px] text-neutral-700 dark:text-neutral-300"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Property Inspector & Layers Panel */}
        <PropertyPanel />
      </div>

      {/* Floating Find & Replace Bar */}
      <SearchReplaceBar />

      {/* Modals */}
      <SignaturesModal />
      <OcrModal />
      <ExtractionModal />
      <PageManagerModal />
      <FormsConfigModal />
      <CloudProjectsModal />
      <HelpShortcutsModal />
      <ExportModal />

      {/* Mobile Ergonomic Bottom Thumb Navigation Bar (< 1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 shadow-xl px-2 py-1 flex items-center justify-around h-14">
        {/* Tool Mode toggle (Select vs Hand Pan) */}
        <button
          onClick={() => setTool(currentTool === 'hand' ? 'select' : 'hand')}
          className={`flex flex-col items-center justify-center w-14 h-11 rounded-lg transition-colors ${
            currentTool === 'hand'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {currentTool === 'hand' ? <Hand className="w-4 h-4" /> : <MousePointer className="w-4 h-4" />}
          <span className="text-[10px] tracking-tight mt-0.5">{currentTool === 'hand' ? 'Pan' : 'Select'}</span>
        </button>

        {/* Pages Drawer trigger */}
        <button
          onClick={() => setMobileThumbnailsOpen(!isMobileThumbnailsOpen)}
          className={`flex flex-col items-center justify-center w-14 h-11 rounded-lg transition-colors relative ${
            isMobileThumbnailsOpen
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] tracking-tight mt-0.5">
            {doc ? `P.${currentPageIndex + 1}/${doc.pages.length}` : 'Pages'}
          </span>
        </button>

        {/* Quick Add Element Button */}
        <button
          onClick={() => setMobileAddSheetOpen(!mobileAddSheetOpen)}
          className="flex flex-col items-center justify-center w-14 h-11 rounded-lg text-blue-600 dark:text-blue-400 font-semibold active:scale-95 transition-transform"
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] tracking-tight mt-0.5">Add</span>
        </button>

        {/* Inspector Drawer trigger */}
        <button
          onClick={() => setMobileInspectorOpen(!isMobileInspectorOpen)}
          className={`flex flex-col items-center justify-center w-14 h-11 rounded-lg transition-colors relative ${
            isMobileInspectorOpen
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <Sliders className="w-4 h-4" />
            {selectedIds.length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-neutral-900" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Style</span>
        </button>

        {/* Fit Screen width */}
        <button
          onClick={() => fitToWidth()}
          className="flex flex-col items-center justify-center w-14 h-11 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 transition-colors"
          title="Fit Document to Screen Width"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="text-[10px] tracking-tight mt-0.5">Fit</span>
        </button>
      </div>

      {/* Mobile Add Element Bottom Sheet */}
      {mobileAddSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileAddSheetOpen(false)}
          />
          <div className="relative w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-2xl shadow-2xl p-4 z-10 animate-in slide-in-from-bottom duration-200 space-y-3 pb-8">
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">
                Insert into Document
              </span>
              <button
                onClick={() => setMobileAddSheetOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => {
                  setTool('text');
                  setMobileAddSheetOpen(false);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <Type className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium">Text Box</span>
              </button>
              <button
                onClick={() => {
                  filePickerRef.current?.click();
                  setMobileAddSheetOpen(false);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-medium">Image</span>
              </button>
              <button
                onClick={() => {
                  setModalOpen('signature', true);
                  setMobileAddSheetOpen(false);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <PenTool className="w-5 h-5 text-violet-600" />
                <span className="text-xs font-medium">Signature</span>
              </button>
              <button
                onClick={() => {
                  setTool('draw');
                  setMobileAddSheetOpen(false);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <PenTool className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-medium">Draw / Pen</span>
              </button>
              <button
                onClick={() => {
                  setTool('sticky_note');
                  setMobileAddSheetOpen(false);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <StickyNote className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-medium">Sticky Note</span>
              </button>
              <button
                onClick={() => {
                  setTool('shape');
                  setMobileAddSheetOpen(false);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <Square className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-medium">Shape</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 shadow-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              {loadingMessage || 'Processing PDF document...'}
            </span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2">
          <span>{error}</span>
          <button
            onClick={() => useEditorStore.setState({ error: null })}
            className="ml-2 font-bold hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
