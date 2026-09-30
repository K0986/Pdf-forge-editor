import React, { useRef, useState } from 'react';
import {
  MousePointer,
  Hand,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus as MinusIcon,
  ArrowRight,
  Triangle,
  Pen,
  Highlighter,
  PenTool,
  Stamp,
  StickyNote,
  CheckSquare,
  Table as TableIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { EditorTool, ShapeType, StampType } from '../types/pdf';

export const QuickToolbar: React.FC = () => {
  const {
    doc,
    currentPageIndex,
    setCurrentPage,
    currentTool,
    setTool,
    currentShape,
    setShape,
    zoom,
    setZoom,
    setModalOpen,
    addObject,
    fitToWidth,
  } = useEditorStore();

  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [stampMenuOpen, setStampMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doc) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const page = doc.pages[currentPageIndex] || doc.pages[0];
        const maxDisplayDim = 280;
        let w = img.width;
        let h = img.height;
        if (w > maxDisplayDim || h > maxDisplayDim) {
          if (w > h) {
            h = (h / w) * maxDisplayDim;
            w = maxDisplayDim;
          } else {
            w = (w / h) * maxDisplayDim;
            h = maxDisplayDim;
          }
        }

        // Crisp stored image data URL (max 1600px for sharpness without memory bloat)
        let finalSrc = src;
        try {
          const maxStoreDim = 1600;
          let nw = img.naturalWidth || img.width || w;
          let nh = img.naturalHeight || img.height || h;
          if (nw > maxStoreDim || nh > maxStoreDim) {
            if (nw > nh) {
              nh = Math.round((nh / nw) * maxStoreDim);
              nw = maxStoreDim;
            } else {
              nw = Math.round((nw / nh) * maxStoreDim);
              nh = maxStoreDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, nw);
          canvas.height = Math.max(1, nh);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, nw, nh);
            finalSrc = file.type === 'image/jpeg' ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');
          }
        } catch (cErr) {
          console.warn('Canvas conversion fallback:', cErr);
        }

        addObject(
          {
            id: `img-${Date.now()}`,
            type: 'image',
            pageId: page.id,
            x: Math.round(page.width / 2 - w / 2),
            y: Math.round(page.height / 2 - h / 2),
            width: Math.round(w),
            height: Math.round(h),
            rotation: 0,
            opacity: 1,
            zIndex: page.objects.length + 1,
            locked: false,
            visible: true,
            name: file.name,
            src: finalSrc,
            originalWidth: img.width,
            originalHeight: img.height,
            flipX: false,
            flipY: false,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#000000',
            shadow: false,
          },
          currentPageIndex
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddStamp = (type: StampType, text: string, color: string) => {
    if (!doc) return;
    const page = doc.pages[currentPageIndex];
    addObject({
      id: `stamp-${Date.now()}`,
      type: 'stamp',
      pageId: page.id,
      x: Math.round(page.width / 2 - 80),
      y: Math.round(page.height / 2 - 35),
      width: 160,
      height: 70,
      rotation: -12,
      opacity: 0.9,
      zIndex: page.objects.length + 1,
      locked: false,
      visible: true,
      name: `Stamp: ${text}`,
      stampType: type,
      text,
      color,
      hasBorder: true,
    });
    setStampMenuOpen(false);
  };

  const totalPages = doc?.pages.length || 1;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-700 px-2 sm:px-3 py-1 flex items-center justify-between gap-1 sm:gap-2 select-none z-30 relative text-xs overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* Main Tool Palette - Touch scrollable on small screens */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none touch-pan-x flex-nowrap shrink py-0.5 pr-2">
        {/* Select Tool */}
        <button
          onClick={() => setTool('select')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            currentTool === 'select'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          }`}
          title="Select Object / Text (V)"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Select</span>
        </button>

        {/* Hand Pan Tool */}
        <button
          onClick={() => setTool('hand')}
          className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md font-medium transition-colors ${
            currentTool === 'hand'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          }`}
          title="Hand / Pan Tool (H)"
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pan</span>
        </button>

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5 shrink-0" />

        {/* Text Tool */}
        <button
          onClick={() => setTool('text')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            currentTool === 'text'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          }`}
          title="Add Text Box (T)"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Text</span>
        </button>

        {/* Image Tool */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
          title="Add Image (PNG, JPG, WebP)"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Image</span>
        </button>

        {/* Shape Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShapeMenuOpen(!shapeMenuOpen)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md font-medium transition-colors ${
              currentTool === 'shape'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
            title="Shapes"
          >
            {currentShape === 'rectangle' && <Square className="w-3.5 h-3.5" />}
            {currentShape === 'ellipse' && <Circle className="w-3.5 h-3.5" />}
            {currentShape === 'arrow' && <ArrowRight className="w-3.5 h-3.5" />}
            {currentShape === 'line' && <MinusIcon className="w-3.5 h-3.5" />}
            {currentShape === 'triangle' && <Triangle className="w-3.5 h-3.5" />}
            <span className="hidden md:inline capitalize">{currentShape}</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {shapeMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50">
              {(['rectangle', 'ellipse', 'arrow', 'line', 'triangle'] as ShapeType[]).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setShape(st);
                    setShapeMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 capitalize text-left"
                >
                  {st === 'rectangle' && <Square className="w-3 h-3 text-blue-500" />}
                  {st === 'ellipse' && <Circle className="w-3 h-3 text-blue-500" />}
                  {st === 'arrow' && <ArrowRight className="w-3 h-3 text-blue-500" />}
                  {st === 'line' && <MinusIcon className="w-3 h-3 text-blue-500" />}
                  {st === 'triangle' && <Triangle className="w-3 h-3 text-blue-500" />}
                  <span>{st}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5 shrink-0" />

        {/* Freehand Pen */}
        <button
          onClick={() => setTool('draw')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            currentTool === 'draw'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          }`}
          title="Freehand Pen (Draw on PDF)"
        >
          <Pen className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Draw</span>
        </button>

        {/* Highlighter */}
        <button
          onClick={() => setTool('highlight')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            currentTool === 'highlight'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          }`}
          title="Highlight Area"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Highlight</span>
        </button>

        {/* Digital Signature */}
        <button
          onClick={() => setModalOpen('signature', true)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
          title="Sign Document"
        >
          <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Sign</span>
        </button>

        {/* Stamp Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setStampMenuOpen(!stampMenuOpen)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md font-medium hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Rubber Stamp"
          >
            <Stamp className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden lg:inline">Stamp</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {stampMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50">
              <button
                onClick={() => handleAddStamp('APPROVED', 'APPROVED', '#16a34a')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-emerald-600 font-bold"
              >
                ✓ APPROVED
              </button>
              <button
                onClick={() => handleAddStamp('CONFIDENTIAL', 'CONFIDENTIAL', '#dc2626')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-600 font-bold"
              >
                🔒 CONFIDENTIAL
              </button>
              <button
                onClick={() => handleAddStamp('DRAFT', 'DRAFT', '#eab308')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-amber-600 font-bold"
              >
                📝 DRAFT
              </button>
              <button
                onClick={() => handleAddStamp('PAID', 'PAID', '#2563eb')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-blue-600 font-bold"
              >
                💳 PAID
              </button>
              <button
                onClick={() => handleAddStamp('REJECTED', 'REJECTED', '#991b1b')}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-red-800 font-bold"
              >
                ✗ REJECTED
              </button>
            </div>
          )}
        </div>

        {/* Sticky Note */}
        <button
          onClick={() => setTool('sticky_note')}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
            currentTool === 'sticky_note'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          }`}
          title="Sticky Note Comment"
        >
          <StickyNote className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden lg:inline">Note</span>
        </button>

        {/* Table */}
        <button
          onClick={() => setTool('table')}
          className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md font-medium transition-colors ${
            currentTool === 'table'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          }`}
          title="Insert Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Controls: Page Navigator & Zoom Controls (Shrink-0 to never overlap) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
        {/* Page Prev/Next */}
        <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-1 py-0.5">
          <button
            onClick={() => setCurrentPage(currentPageIndex - 1)}
            disabled={currentPageIndex <= 0}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded disabled:opacity-30"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs px-1 text-center min-w-[34px]">
            {currentPageIndex + 1}/{totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPageIndex + 1)}
            disabled={currentPageIndex >= totalPages - 1}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded disabled:opacity-30"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls (collapsible on small mobile screens) */}
        <div className="hidden sm:flex items-center gap-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-1 py-0.5">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fitToWidth()}
            className="w-11 text-center font-mono text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded py-0.5"
            title="Click to Fit to Width"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fit Width 1-Tap button */}
        <button
          onClick={() => fitToWidth()}
          className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
          title="Fit Screen Width"
        >
          <Maximize2 className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
        </button>
      </div>
    </div>
  );
};
