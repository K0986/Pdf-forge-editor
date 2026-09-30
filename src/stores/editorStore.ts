import { create } from 'zustand';
import * as pdfjsLib from 'pdfjs-dist';
import {
  PDFDocModel,
  PageModel,
  EditorObject,
  EditorTool,
  ShapeType,
  TextObject,
  HistoryEntry,
  SavedSignature,
  SearchMatch,
} from '../types/pdf';
import { parsePdfFile } from '../pdf/pdfParser';
import { createBlankDocPdf } from '../pdf/samplePdfs';

interface EditorState {
  doc: PDFDocModel | null;
  pdfProxy: pdfjsLib.PDFDocumentProxy | null;
  currentPageIndex: number;
  selectedIds: string[];
  currentTool: EditorTool;
  currentShape: ShapeType;
  zoom: number;
  zoomMode: 'fit-width' | 'fit-page' | 'custom';
  showRulers: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  theme: 'light' | 'dark';
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Clipboard
  clipboard: EditorObject[];

  // Active inline text editing
  editingTextId: string | null;

  // Search & Replace
  searchQuery: string;
  replaceText: string;
  searchMatches: SearchMatch[];
  activeMatchIndex: number;
  searchCaseSensitive: boolean;
  searchWholeWord: boolean;
  isSearchOpen: boolean;

  // Modals
  isSignatureModalOpen: boolean;
  isOcrModalOpen: boolean;
  isExtractionModalOpen: boolean;
  isCloudModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  isFormsConfigOpen: boolean;
  isPageManagerOpen: boolean;
  isExportModalOpen: boolean;

  // Mobile Drawers
  isMobileThumbnailsOpen: boolean;
  isMobileInspectorOpen: boolean;
  setMobileThumbnailsOpen: (open: boolean) => void;
  setMobileInspectorOpen: (open: boolean) => void;
  fitToWidth: () => void;

  // Saved Signatures
  savedSignatures: SavedSignature[];

  // Actions
  loadPdfFromData: (data: Uint8Array | ArrayBuffer, fileName?: string) => Promise<void>;
  loadBlankDocument: (width?: number, height?: number) => Promise<void>;
  setCurrentPage: (index: number) => void;
  setTool: (tool: EditorTool) => void;
  setShape: (shape: ShapeType) => void;
  setZoom: (zoom: number, mode?: 'fit-width' | 'fit-page' | 'custom') => void;
  toggleRulers: () => void;
  toggleGrid: () => void;
  toggleTheme: () => void;
  setEditingTextId: (id: string | null) => void;

  // Selection
  selectObject: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Object Manipulation
  addObject: (obj: EditorObject, targetPageIndex?: number) => void;
  updateObject: (id: string, patch: Partial<EditorObject>, recordHistory?: boolean) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  moveObjectsToPage: (
    updates: Array<{ objectId: string; targetPageIndex: number; newX: number; newY: number }>
  ) => void;

  // Layer Ordering
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;

  // Alignment
  alignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;

  // Original PDF Text Editing
  convertOriginalTextToEditable: (pageIndex: number, textBlockId: string) => void;
  deleteOriginalTextBlock: (pageIndex: number, textBlockId: string) => void;

  // Page Management
  addBlankPage: (width?: number, height?: number) => void;
  duplicatePage: (pageIndex: number) => void;
  deletePage: (pageIndex: number) => void;
  rotatePage: (pageIndex: number, angleDegrees: number) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // History (Undo/Redo)
  pushHistorySnapshot: (description: string) => void;
  undo: () => void;
  redo: () => void;

  // Search & Replace
  setSearchOpen: (open: boolean) => void;
  performSearch: (query: string, caseSensitive?: boolean, wholeWord?: boolean) => void;
  nextSearchMatch: () => void;
  prevSearchMatch: () => void;
  replaceCurrentMatch: () => void;
  replaceAllMatches: () => void;
  setReplaceText: (text: string) => void;

  // Signatures
  saveSignature: (sig: SavedSignature) => void;
  deleteSignature: (id: string) => void;

  // Modal Open/Close
  setModalOpen: (
    modal: 'signature' | 'ocr' | 'extraction' | 'cloud' | 'shortcuts' | 'forms' | 'pageManager' | 'export',
    open: boolean
  ) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  doc: null,
  pdfProxy: null,
  currentPageIndex: 0,
  selectedIds: [],
  currentTool: 'select',
  currentShape: 'rectangle',
  zoom: 1.0,
  zoomMode: 'fit-width',
  showRulers: true,
  showGrid: false,
  snapToGrid: false,
  snapToObjects: true,
  theme: 'light',
  isLoading: false,
  loadingMessage: '',
  error: null,

  history: [],
  historyIndex: -1,
  clipboard: [],
  editingTextId: null,

  searchQuery: '',
  replaceText: '',
  searchMatches: [],
  activeMatchIndex: -1,
  searchCaseSensitive: false,
  searchWholeWord: false,
  isSearchOpen: false,

  isSignatureModalOpen: false,
  isOcrModalOpen: false,
  isExtractionModalOpen: false,
  isCloudModalOpen: false,
  isShortcutsModalOpen: false,
  isFormsConfigOpen: false,
  isPageManagerOpen: false,
  isExportModalOpen: false,

  // Mobile Drawers
  isMobileThumbnailsOpen: false,
  isMobileInspectorOpen: false,
  setMobileThumbnailsOpen: (open: boolean) => set({ isMobileThumbnailsOpen: open }),
  setMobileInspectorOpen: (open: boolean) => set({ isMobileInspectorOpen: open }),
  fitToWidth: () => {
    const { doc, currentPageIndex } = get();
    if (!doc) return;
    const page = doc.pages[currentPageIndex] || doc.pages[0];
    const pageWidth = page?.width || 595.28;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const availableWidth = typeof window !== 'undefined' ? window.innerWidth - (isMobile ? 24 : 100) : 600;
    const calculatedZoom = Math.min(2.5, Math.max(0.35, availableWidth / pageWidth));
    set({ zoom: Number(calculatedZoom.toFixed(2)), zoomMode: 'fit-width' });
  },

  savedSignatures: (() => {
    try {
      const stored = localStorage.getItem('pdfforge_signatures');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),

  loadPdfFromData: async (data: Uint8Array | ArrayBuffer, fileName = 'Document.pdf') => {
    set({ isLoading: true, loadingMessage: 'Parsing PDF structure and extracting text...', error: null });
    try {
      const { docModel, pdfProxy } = await parsePdfFile(data, fileName);
      const firstPage = docModel.pages[0];
      const initialPageWidth = firstPage?.width || 595.28;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      let initialZoom = 1.0;
      if (isMobile) {
        const availableW = window.innerWidth - 24;
        initialZoom = Number(Math.min(1.0, Math.max(0.35, availableW / initialPageWidth)).toFixed(2));
      }

      set({
        doc: docModel,
        pdfProxy,
        currentPageIndex: 0,
        selectedIds: [],
        editingTextId: null,
        zoom: initialZoom,
        history: [
          {
            id: `hist-${Date.now()}`,
            timestamp: Date.now(),
            description: 'Opened Document',
            pagesSnapshot: JSON.parse(JSON.stringify(docModel.pages)),
            selectedObjectIds: [],
          },
        ],
        historyIndex: 0,
        isLoading: false,
        loadingMessage: '',
      });
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      set({
        isLoading: false,
        error: `Could not parse PDF: ${err.message || 'Invalid or corrupted PDF file'}`,
      });
    }
  },

  loadBlankDocument: async (width = 595.28, height = 841.89) => {
    set({ isLoading: true, loadingMessage: 'Creating blank document...' });
    const bytes = await createBlankDocPdf(width, height);
    await get().loadPdfFromData(bytes, 'New Document.pdf');
  },

  setCurrentPage: (index: number) => {
    const { doc } = get();
    if (!doc) return;
    const clamped = Math.max(0, Math.min(index, doc.pages.length - 1));
    set({ currentPageIndex: clamped, selectedIds: [], editingTextId: null });
  },

  setTool: (tool: EditorTool) => {
    set({ currentTool: tool });
    if (tool !== 'select' && tool !== 'hand') {
      set({ selectedIds: [], editingTextId: null });
    }
  },

  setShape: (shape: ShapeType) => {
    set({ currentShape: shape, currentTool: 'shape' });
  },

  setZoom: (zoom: number, mode = 'custom') => {
    const clamped = Math.max(0.2, Math.min(zoom, 4.0));
    set({ zoom: clamped, zoomMode: mode });
  },

  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: next };
    }),

  setEditingTextId: (id: string | null) => set({ editingTextId: id }),

  selectObject: (id: string, multi = false) => {
    const { doc } = get();
    let targetPageIdx: number | null = null;
    if (doc) {
      for (let i = 0; i < doc.pages.length; i++) {
        if (doc.pages[i].objects.some((o) => o.id === id)) {
          targetPageIdx = i;
          break;
        }
      }
    }

    set((s) => {
      const nextPageIndex = targetPageIdx !== null && !multi ? targetPageIdx : s.currentPageIndex;
      if (multi) {
        const already = s.selectedIds.includes(id);
        const next = already ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id];
        return { selectedIds: next, editingTextId: null, currentPageIndex: nextPageIndex };
      }
      return { selectedIds: [id], editingTextId: null, currentPageIndex: nextPageIndex };
    });
  },

  selectAll: () => {
    const { doc, currentPageIndex } = get();
    if (!doc || !doc.pages[currentPageIndex]) return;
    const allIds = doc.pages[currentPageIndex].objects.filter((o) => o.visible && !o.locked).map((o) => o.id);
    set({ selectedIds: allIds });
  },

  clearSelection: () => {
    set({ selectedIds: [], editingTextId: null });
  },

  pushHistorySnapshot: (description: string) => {
    const { doc, history, historyIndex, selectedIds } = get();
    if (!doc) return;
    const newEntry: HistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      description,
      pagesSnapshot: JSON.parse(JSON.stringify(doc.pages)),
      selectedObjectIds: [...selectedIds],
    };
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newEntry);
    // Keep max 50 entries
    if (nextHistory.length > 50) nextHistory.shift();
    set({ history: nextHistory, historyIndex: nextHistory.length - 1 });
  },

  addObject: (obj: EditorObject, targetPageIndex?: number) => {
    const { doc, currentPageIndex, pushHistorySnapshot } = get();
    if (!doc || doc.pages.length === 0) return;

    let pageIdx = currentPageIndex;
    if (targetPageIndex !== undefined && targetPageIndex >= 0 && targetPageIndex < doc.pages.length) {
      pageIdx = targetPageIndex;
    } else if (obj.pageId) {
      const foundIdx = doc.pages.findIndex((p) => p.id === obj.pageId);
      if (foundIdx !== -1) pageIdx = foundIdx;
    }

    const page = doc.pages[pageIdx];
    const normalizedObj = { ...obj, pageId: page.id };
    const newObjects = [...page.objects, normalizedObj];
    const newPages = [...doc.pages];
    newPages[pageIdx] = { ...page, objects: newObjects };

    set({
      doc: { ...doc, pages: newPages },
      currentPageIndex: pageIdx,
      selectedIds: [normalizedObj.id],
      currentTool: 'select',
    });
    pushHistorySnapshot(`Add ${normalizedObj.type}`);
  },

  updateObject: (id: string, patch: Partial<EditorObject>, recordHistory = true) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc) return;

    // Search across ALL pages so updates never fail regardless of active page
    let foundPageIdx = -1;
    let foundObjIdx = -1;

    for (let pIdx = 0; pIdx < doc.pages.length; pIdx++) {
      const oIdx = doc.pages[pIdx].objects.findIndex((o) => o.id === id);
      if (oIdx !== -1) {
        foundPageIdx = pIdx;
        foundObjIdx = oIdx;
        break;
      }
    }

    if (foundPageIdx === -1 || foundObjIdx === -1) return;

    const page = doc.pages[foundPageIdx];
    const updated = { ...page.objects[foundObjIdx], ...patch } as EditorObject;
    const newObjects = [...page.objects];
    newObjects[foundObjIdx] = updated;

    const newPages = [...doc.pages];
    newPages[foundPageIdx] = { ...page, objects: newObjects };

    set({ doc: { ...doc, pages: newPages } });
    if (recordHistory) {
      pushHistorySnapshot(`Update ${updated.name || updated.type}`);
    }
  },

  deleteSelected: () => {
    const { doc, selectedIds, pushHistorySnapshot } = get();
    if (!doc || selectedIds.length === 0) return;

    let totalDeleted = 0;
    const newPages = doc.pages.map((page) => {
      const remaining = page.objects.filter((o) => !selectedIds.includes(o.id));
      totalDeleted += page.objects.length - remaining.length;
      return { ...page, objects: remaining };
    });

    if (totalDeleted === 0) return;

    set({
      doc: { ...doc, pages: newPages },
      selectedIds: [],
      editingTextId: null,
    });
    pushHistorySnapshot(`Delete ${totalDeleted} object(s)`);
  },

  duplicateSelected: () => {
    const { doc, selectedIds, pushHistorySnapshot } = get();
    if (!doc || selectedIds.length === 0) return;

    const newSelectedIds: string[] = [];
    const newPages = doc.pages.map((page) => {
      const duplicates: EditorObject[] = [];
      page.objects.forEach((o) => {
        if (selectedIds.includes(o.id)) {
          const newId = `dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          newSelectedIds.push(newId);
          duplicates.push({
            ...o,
            id: newId,
            x: o.x + 20,
            y: o.y + 20,
            name: `${o.name || o.type} (Copy)`,
          });
        }
      });
      return { ...page, objects: [...page.objects, ...duplicates] };
    });

    set({
      doc: { ...doc, pages: newPages },
      selectedIds: newSelectedIds,
      editingTextId: null,
    });
    pushHistorySnapshot(`Duplicate ${newSelectedIds.length} object(s)`);
  },

  copySelection: () => {
    const { doc, selectedIds } = get();
    if (!doc || selectedIds.length === 0) return;
    const copied: EditorObject[] = [];
    doc.pages.forEach((page) => {
      page.objects.forEach((o) => {
        if (selectedIds.includes(o.id)) {
          copied.push(o);
        }
      });
    });
    set({ clipboard: JSON.parse(JSON.stringify(copied)) });
  },

  pasteClipboard: () => {
    const { doc, currentPageIndex, clipboard, pushHistorySnapshot } = get();
    if (!doc || clipboard.length === 0) return;

    const page = doc.pages[currentPageIndex];
    const pasted: EditorObject[] = clipboard.map((o) => ({
      ...JSON.parse(JSON.stringify(o)),
      id: `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: o.x + 20,
      y: o.y + 20,
      pageId: page.id,
      zIndex: page.objects.length + 1,
    }));

    const newPages = [...doc.pages];
    newPages[currentPageIndex] = { ...page, objects: [...page.objects, ...pasted] };

    set({
      doc: { ...doc, pages: newPages },
      selectedIds: pasted.map((o) => o.id),
    });
    pushHistorySnapshot(`Paste ${clipboard.length} object(s)`);
  },

  moveObjectsToPage: (
    updates: Array<{ objectId: string; targetPageIndex: number; newX: number; newY: number }>
  ) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc || updates.length === 0) return;

    const newPages = doc.pages.map((p) => ({ ...p, objects: [...p.objects] }));
    const movedIds: string[] = [];
    let crossPageCount = 0;

    for (const update of updates) {
      const { objectId, targetPageIndex, newX, newY } = update;
      if (targetPageIndex < 0 || targetPageIndex >= newPages.length) continue;

      let sourcePageIdx = -1;
      let objIndex = -1;
      let obj: EditorObject | null = null;

      for (let p = 0; p < newPages.length; p++) {
        const idx = newPages[p].objects.findIndex((o) => o.id === objectId);
        if (idx !== -1) {
          sourcePageIdx = p;
          objIndex = idx;
          obj = newPages[p].objects[idx];
          break;
        }
      }

      if (sourcePageIdx === -1 || !obj) continue;
      movedIds.push(objectId);

      if (sourcePageIdx === targetPageIndex) {
        newPages[sourcePageIdx].objects[objIndex] = {
          ...obj,
          x: Math.round(newX),
          y: Math.round(newY),
        };
      } else {
        crossPageCount++;
        newPages[sourcePageIdx].objects.splice(objIndex, 1);
        const targetPage = newPages[targetPageIndex];
        const migrated: EditorObject = {
          ...obj,
          pageId: targetPage.id,
          x: Math.round(newX),
          y: Math.round(newY),
          zIndex: targetPage.objects.length + 1,
        };
        newPages[targetPageIndex].objects.push(migrated);
      }
    }

    const firstTarget = updates[0].targetPageIndex;
    set({
      doc: { ...doc, pages: newPages },
      currentPageIndex: firstTarget,
      selectedIds: movedIds,
    });

    if (crossPageCount > 0) {
      pushHistorySnapshot(`Move ${crossPageCount} object(s) to Page ${firstTarget + 1}`);
    } else {
      pushHistorySnapshot(`Move ${updates.length} object(s)`);
    }
  },

  bringForward: () => {
    const { doc, selectedIds, pushHistorySnapshot } = get();
    if (!doc || selectedIds.length === 0) return;

    let targetPageIdx = -1;
    for (let i = 0; i < doc.pages.length; i++) {
      if (doc.pages[i].objects.some((o) => selectedIds.includes(o.id))) {
        targetPageIdx = i;
        break;
      }
    }
    if (targetPageIdx === -1) return;

    const page = doc.pages[targetPageIdx];
    const objs = [...page.objects];
    for (const id of selectedIds) {
      const idx = objs.findIndex((o) => o.id === id);
      if (idx !== -1 && idx < objs.length - 1) {
        const temp = objs[idx];
        objs[idx] = objs[idx + 1];
        objs[idx + 1] = temp;
      }
    }
    objs.forEach((o, i) => (o.zIndex = i + 1));
    const newPages = [...doc.pages];
    newPages[targetPageIdx] = { ...page, objects: objs };
    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot('Bring Forward');
  },

  sendBackward: () => {
    const { doc, selectedIds, pushHistorySnapshot } = get();
    if (!doc || selectedIds.length === 0) return;

    let targetPageIdx = -1;
    for (let i = 0; i < doc.pages.length; i++) {
      if (doc.pages[i].objects.some((o) => selectedIds.includes(o.id))) {
        targetPageIdx = i;
        break;
      }
    }
    if (targetPageIdx === -1) return;

    const page = doc.pages[targetPageIdx];
    const objs = [...page.objects];
    for (const id of selectedIds) {
      const idx = objs.findIndex((o) => o.id === id);
      if (idx > 0) {
        const temp = objs[idx];
        objs[idx] = objs[idx - 1];
        objs[idx - 1] = temp;
      }
    }
    objs.forEach((o, i) => (o.zIndex = i + 1));
    const newPages = [...doc.pages];
    newPages[targetPageIdx] = { ...page, objects: objs };
    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot('Send Backward');
  },

  bringToFront: () => {
    const { doc, selectedIds, pushHistorySnapshot } = get();
    if (!doc || selectedIds.length === 0) return;

    let targetPageIdx = -1;
    for (let i = 0; i < doc.pages.length; i++) {
      if (doc.pages[i].objects.some((o) => selectedIds.includes(o.id))) {
        targetPageIdx = i;
        break;
      }
    }
    if (targetPageIdx === -1) return;

    const page = doc.pages[targetPageIdx];
    const selected = page.objects.filter((o) => selectedIds.includes(o.id));
    const unselected = page.objects.filter((o) => !selectedIds.includes(o.id));
    const objs = [...unselected, ...selected];
    objs.forEach((o, i) => (o.zIndex = i + 1));
    const newPages = [...doc.pages];
    newPages[targetPageIdx] = { ...page, objects: objs };
    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot('Bring to Front');
  },

  sendToBack: () => {
    const { doc, selectedIds, pushHistorySnapshot } = get();
    if (!doc || selectedIds.length === 0) return;

    let targetPageIdx = -1;
    for (let i = 0; i < doc.pages.length; i++) {
      if (doc.pages[i].objects.some((o) => selectedIds.includes(o.id))) {
        targetPageIdx = i;
        break;
      }
    }
    if (targetPageIdx === -1) return;

    const page = doc.pages[targetPageIdx];
    const selected = page.objects.filter((o) => selectedIds.includes(o.id));
    const unselected = page.objects.filter((o) => !selectedIds.includes(o.id));
    const objs = [...selected, ...unselected];
    objs.forEach((o, i) => (o.zIndex = i + 1));
    const newPages = [...doc.pages];
    newPages[targetPageIdx] = { ...page, objects: objs };
    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot('Send to Back');
  },

  alignSelected: (alignment) => {
    const { doc, selectedIds, pushHistorySnapshot } = get();
    if (!doc || selectedIds.length < 2) return;

    let targetPageIdx = -1;
    for (let i = 0; i < doc.pages.length; i++) {
      if (doc.pages[i].objects.some((o) => selectedIds.includes(o.id))) {
        targetPageIdx = i;
        break;
      }
    }
    if (targetPageIdx === -1) return;

    const page = doc.pages[targetPageIdx];
    const selected = page.objects.filter((o) => selectedIds.includes(o.id));

    let minX = Math.min(...selected.map((o) => o.x));
    let maxX = Math.max(...selected.map((o) => o.x + o.width));
    let minY = Math.min(...selected.map((o) => o.y));
    let maxY = Math.max(...selected.map((o) => o.y + o.height));

    const newObjs = page.objects.map((o) => {
      if (!selectedIds.includes(o.id)) return o;
      let newX = o.x;
      let newY = o.y;
      switch (alignment) {
        case 'left':
          newX = minX;
          break;
        case 'center':
          newX = (minX + maxX) / 2 - o.width / 2;
          break;
        case 'right':
          newX = maxX - o.width;
          break;
        case 'top':
          newY = minY;
          break;
        case 'middle':
          newY = (minY + maxY) / 2 - o.height / 2;
          break;
        case 'bottom':
          newY = maxY - o.height;
          break;
      }
      return { ...o, x: Math.round(newX), y: Math.round(newY) };
    });

    const newPages = [...doc.pages];
    newPages[targetPageIdx] = { ...page, objects: newObjs };
    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot(`Align ${alignment}`);
  },

  convertOriginalTextToEditable: (pageIndex: number, textBlockId: string) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc || !doc.pages[pageIndex]) return;

    const page = doc.pages[pageIndex];
    const block = page.originalTextBlocks.find((b) => b.id === textBlockId);
    if (!block) return;

    // Mark original block as modified (so PDF exporter covers it with a white patch)
    const newBlocks = page.originalTextBlocks.map((b) =>
      b.id === textBlockId ? { ...b, isModified: true } : b
    );

    // Create a new editable TextObject right on top with matching font and size
    const newTextObj: TextObject = {
      id: `text-edit-${Date.now()}`,
      type: 'text',
      pageId: page.id,
      x: block.x,
      y: block.y,
      width: Math.max(block.width + 10, 40),
      height: Math.max(block.height + 4, 18),
      rotation: 0,
      opacity: 1,
      zIndex: page.objects.length + 10,
      locked: false,
      visible: true,
      name: `Text: ${block.text.substring(0, 16)}...`,
      content: block.text,
      fontFamily: block.fontName.toLowerCase().includes('times') ? 'Times New Roman' : 'Inter, sans-serif',
      fontSize: block.fontSize,
      fontWeight: block.fontName.toLowerCase().includes('bold') ? 'bold' : 'normal',
      fontStyle: block.fontName.toLowerCase().includes('italic') || block.fontName.toLowerCase().includes('oblique') ? 'italic' : 'normal',
      underline: false,
      strikethrough: false,
      color: block.color || '#111827',
      alignment: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      isOriginalPdfText: true,
      redactBackground: true, // covers underlying PDF vector glyph
    };

    const newPages = [...doc.pages];
    newPages[pageIndex] = {
      ...page,
      originalTextBlocks: newBlocks,
      objects: [...page.objects, newTextObj],
    };

    set({
      doc: { ...doc, pages: newPages },
      selectedIds: [newTextObj.id],
      editingTextId: newTextObj.id,
      currentTool: 'select',
    });
    pushHistorySnapshot(`Edit original text: "${block.text.substring(0, 20)}"`);
  },

  deleteOriginalTextBlock: (pageIndex: number, textBlockId: string) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc || !doc.pages[pageIndex]) return;

    const page = doc.pages[pageIndex];
    const newBlocks = page.originalTextBlocks.map((b) =>
      b.id === textBlockId ? { ...b, isDeleted: true } : b
    );

    const newPages = [...doc.pages];
    newPages[pageIndex] = { ...page, originalTextBlocks: newBlocks };

    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot('Delete original text block');
  },

  addBlankPage: (width = 595.28, height = 841.89) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc) return;

    const newPage: PageModel = {
      id: `page-${Date.now()}`,
      pageNumber: doc.pages.length + 1,
      width,
      height,
      rotation: 0,
      background: '#ffffff',
      objects: [],
      originalTextBlocks: [],
    };

    const newPages = [...doc.pages, newPage];
    set({
      doc: { ...doc, pages: newPages, pageCount: newPages.length },
      currentPageIndex: newPages.length - 1,
    });
    pushHistorySnapshot('Add Blank Page');
  },

  duplicatePage: (pageIndex: number) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc || !doc.pages[pageIndex]) return;

    const source = doc.pages[pageIndex];
    const clonedObjects = JSON.parse(JSON.stringify(source.objects)).map((o: EditorObject) => ({
      ...o,
      id: `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    const newPage: PageModel = {
      ...JSON.parse(JSON.stringify(source)),
      id: `page-${Date.now()}`,
      pageNumber: doc.pages.length + 1,
      objects: clonedObjects,
    };

    const newPages = [...doc.pages];
    newPages.splice(pageIndex + 1, 0, newPage);
    newPages.forEach((p, idx) => (p.pageNumber = idx + 1));

    set({
      doc: { ...doc, pages: newPages, pageCount: newPages.length },
      currentPageIndex: pageIndex + 1,
    });
    pushHistorySnapshot(`Duplicate Page ${pageIndex + 1}`);
  },

  deletePage: (pageIndex: number) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc || doc.pages.length <= 1) return;

    const newPages = doc.pages.filter((_, idx) => idx !== pageIndex);
    newPages.forEach((p, idx) => (p.pageNumber = idx + 1));

    const nextIdx = Math.min(pageIndex, newPages.length - 1);
    set({
      doc: { ...doc, pages: newPages, pageCount: newPages.length },
      currentPageIndex: nextIdx,
      selectedIds: [],
    });
    pushHistorySnapshot(`Delete Page ${pageIndex + 1}`);
  },

  rotatePage: (pageIndex: number, angleDegrees: number) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc || !doc.pages[pageIndex]) return;

    const page = doc.pages[pageIndex];
    const newRot = (page.rotation + angleDegrees + 360) % 360;

    const newPages = [...doc.pages];
    newPages[pageIndex] = { ...page, rotation: newRot };

    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot(`Rotate Page ${pageIndex + 1} by ${angleDegrees}°`);
  },

  reorderPages: (fromIndex: number, toIndex: number) => {
    const { doc, pushHistorySnapshot } = get();
    if (!doc || fromIndex === toIndex) return;

    const newPages = [...doc.pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    newPages.forEach((p, idx) => (p.pageNumber = idx + 1));

    set({
      doc: { ...doc, pages: newPages },
      currentPageIndex: toIndex,
    });
    pushHistorySnapshot(`Reorder Page ${fromIndex + 1} -> ${toIndex + 1}`);
  },

  undo: () => {
    const { history, historyIndex, doc } = get();
    if (historyIndex <= 0 || !doc) return;

    const prevIndex = historyIndex - 1;
    const entry = history[prevIndex];
    set({
      doc: {
        ...doc,
        pages: JSON.parse(JSON.stringify(entry.pagesSnapshot)),
        pageCount: entry.pagesSnapshot.length,
      },
      selectedIds: entry.selectedObjectIds || [],
      historyIndex: prevIndex,
      editingTextId: null,
    });
  },

  redo: () => {
    const { history, historyIndex, doc } = get();
    if (historyIndex >= history.length - 1 || !doc) return;

    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    set({
      doc: {
        ...doc,
        pages: JSON.parse(JSON.stringify(entry.pagesSnapshot)),
        pageCount: entry.pagesSnapshot.length,
      },
      selectedIds: entry.selectedObjectIds || [],
      historyIndex: nextIndex,
      editingTextId: null,
    });
  },

  setSearchOpen: (open: boolean) => {
    set({ isSearchOpen: open });
    if (!open) {
      set({ searchQuery: '', searchMatches: [], activeMatchIndex: -1 });
    }
  },

  performSearch: (query: string, caseSensitive = false, wholeWord = false) => {
    const { doc } = get();
    if (!doc || !query.trim()) {
      set({ searchQuery: query, searchMatches: [], activeMatchIndex: -1 });
      return;
    }

    const matches: SearchMatch[] = [];
    const q = caseSensitive ? query : query.toLowerCase();

    doc.pages.forEach((page, pIdx) => {
      // 1. Search in original text blocks
      page.originalTextBlocks.forEach((tb) => {
        if (tb.isDeleted) return;
        const textToSearch = caseSensitive ? tb.text : tb.text.toLowerCase();
        let pos = 0;
        while ((pos = textToSearch.indexOf(q, pos)) !== -1) {
          if (wholeWord) {
            const isStartWord = pos === 0 || /\s|[.,!?;:"]/.test(textToSearch[pos - 1]);
            const isEndWord =
              pos + q.length >= textToSearch.length ||
              /\s|[.,!?;:"]/.test(textToSearch[pos + q.length]);
            if (!isStartWord || !isEndWord) {
              pos += 1;
              continue;
            }
          }
          matches.push({
            pageIndex: pIdx,
            textBlockId: tb.id,
            text: tb.text,
            x: tb.x,
            y: tb.y,
            width: tb.width,
            height: tb.height,
            matchIndex: matches.length,
          });
          pos += q.length;
        }
      });

      // 2. Search in added TextObjects
      page.objects.forEach((obj) => {
        if (obj.type === 'text' && obj.visible) {
          const txtObj = obj as TextObject;
          const textToSearch = caseSensitive ? txtObj.content : txtObj.content.toLowerCase();
          let pos = 0;
          while ((pos = textToSearch.indexOf(q, pos)) !== -1) {
            matches.push({
              pageIndex: pIdx,
              objectId: obj.id,
              text: txtObj.content,
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
              matchIndex: matches.length,
            });
            pos += q.length;
          }
        }
      });
    });

    set({
      searchQuery: query,
      searchMatches: matches,
      activeMatchIndex: matches.length > 0 ? 0 : -1,
      searchCaseSensitive: caseSensitive,
      searchWholeWord: wholeWord,
    });

    if (matches.length > 0) {
      set({ currentPageIndex: matches[0].pageIndex });
    }
  },

  nextSearchMatch: () => {
    const { searchMatches, activeMatchIndex } = get();
    if (searchMatches.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % searchMatches.length;
    set({
      activeMatchIndex: nextIdx,
      currentPageIndex: searchMatches[nextIdx].pageIndex,
    });
  },

  prevSearchMatch: () => {
    const { searchMatches, activeMatchIndex } = get();
    if (searchMatches.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    set({
      activeMatchIndex: prevIdx,
      currentPageIndex: searchMatches[prevIdx].pageIndex,
    });
  },

  setReplaceText: (text: string) => set({ replaceText: text }),

  replaceCurrentMatch: () => {
    const { searchMatches, activeMatchIndex, replaceText, searchQuery, convertOriginalTextToEditable, updateObject } = get();
    if (activeMatchIndex === -1 || activeMatchIndex >= searchMatches.length) return;
    const match = searchMatches[activeMatchIndex];

    if (match.textBlockId) {
      // First convert to editable text object, then replace text
      convertOriginalTextToEditable(match.pageIndex, match.textBlockId);
      // Re-trigger search
      setTimeout(() => {
        get().performSearch(searchQuery);
      }, 50);
    } else if (match.objectId) {
      const { doc } = get();
      if (!doc) return;
      const page = doc.pages[match.pageIndex];
      const obj = page.objects.find((o) => o.id === match.objectId) as TextObject;
      if (obj) {
        const newContent = obj.content.replace(new RegExp(searchQuery, 'i'), replaceText);
        updateObject(obj.id, { content: newContent });
        setTimeout(() => {
          get().performSearch(searchQuery);
        }, 50);
      }
    }
  },

  replaceAllMatches: () => {
    const { searchMatches, searchQuery, replaceText, convertOriginalTextToEditable, updateObject, pushHistorySnapshot } = get();
    if (searchMatches.length === 0) return;

    // Convert all original text blocks
    for (const match of searchMatches) {
      if (match.textBlockId) {
        convertOriginalTextToEditable(match.pageIndex, match.textBlockId);
      }
    }

    // Now replace all in TextObjects
    const { doc } = get();
    if (!doc) return;

    const regex = new RegExp(searchQuery, 'gi');
    const newPages = doc.pages.map((p) => ({
      ...p,
      objects: p.objects.map((obj) => {
        if (obj.type === 'text') {
          const txtObj = obj as TextObject;
          if (regex.test(txtObj.content)) {
            return { ...txtObj, content: txtObj.content.replace(regex, replaceText) };
          }
        }
        return obj;
      }),
    }));

    set({ doc: { ...doc, pages: newPages } });
    pushHistorySnapshot(`Replace all "${searchQuery}" with "${replaceText}"`);
    get().performSearch(searchQuery);
  },

  saveSignature: (sig: SavedSignature) => {
    set((s) => {
      const next = [sig, ...s.savedSignatures.filter((x) => x.id !== sig.id)];
      try {
        localStorage.setItem('pdfforge_signatures', JSON.stringify(next));
      } catch {}
      return { savedSignatures: next };
    });
  },

  deleteSignature: (id: string) => {
    set((s) => {
      const next = s.savedSignatures.filter((x) => x.id !== id);
      try {
        localStorage.setItem('pdfforge_signatures', JSON.stringify(next));
      } catch {}
      return { savedSignatures: next };
    });
  },

  setModalOpen: (modal, open) => {
    switch (modal) {
      case 'signature':
        set({ isSignatureModalOpen: open });
        break;
      case 'ocr':
        set({ isOcrModalOpen: open });
        break;
      case 'extraction':
        set({ isExtractionModalOpen: open });
        break;
      case 'cloud':
        set({ isCloudModalOpen: open });
        break;
      case 'shortcuts':
        set({ isShortcutsModalOpen: open });
        break;
      case 'forms':
        set({ isFormsConfigOpen: open });
        break;
      case 'pageManager':
        set({ isPageManagerOpen: open });
        break;
      case 'export':
        set({ isExportModalOpen: open });
        break;
    }
  },
}));
