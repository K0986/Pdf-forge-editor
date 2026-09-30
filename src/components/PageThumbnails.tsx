import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  RotateCw,
  Copy,
  Trash2,
  ChevronDown,
  Layers,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { generatePageThumbnail } from '../pdf/pdfRenderer';

export const PageThumbnails: React.FC = () => {
  const {
    doc,
    pdfProxy,
    currentPageIndex,
    setCurrentPage,
    addBlankPage,
    duplicatePage,
    deletePage,
    rotatePage,
    reorderPages,
    isMobileThumbnailsOpen,
    setMobileThumbnailsOpen,
  } = useEditorStore();

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

  // Load thumbnails
  useEffect(() => {
    if (!pdfProxy || !doc) return;

    let isMounted = true;
    doc.pages.forEach(async (page, idx) => {
      if (page.originalPageNumber) {
        try {
          const thumbUrl = await generatePageThumbnail(pdfProxy, page.originalPageNumber, 140);
          if (isMounted) {
            setThumbnails((prev) => ({ ...prev, [idx]: thumbUrl }));
          }
        } catch (e) {
          console.warn('Failed to generate thumbnail for page', page.pageNumber, e);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pdfProxy, doc?.pages.length, doc?.id]);

  if (!doc) return null;

  const renderThumbnailList = (isMobile = false) => (
    <>
      {/* Thumbnails Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {doc.pages.map((page, idx) => {
          const isSelected = idx === currentPageIndex;
          const thumbSrc = thumbnails[idx];

          return (
            <div
              key={page.id}
              draggable={!isMobile}
              onDragStart={() => setDraggedPageIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedPageIndex !== null && draggedPageIndex !== idx) {
                  reorderPages(draggedPageIndex, idx);
                }
                setDraggedPageIndex(null);
              }}
              className={`group relative flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500 shadow-sm'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800'
              }`}
              onClick={() => {
                setCurrentPage(idx);
                if (isMobile) {
                  setMobileThumbnailsOpen(false);
                }
              }}
            >
              {/* Thumbnail Card */}
              <div
                className="w-32 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-xs rounded flex items-center justify-center overflow-hidden relative"
                style={{
                  aspectRatio: `${page.width} / ${page.height}`,
                }}
              >
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                    style={{
                      transform: page.rotation ? `rotate(${page.rotation}deg)` : undefined,
                    }}
                  />
                ) : (
                  <div className="text-[10px] text-neutral-400 font-mono text-center p-2">
                    Page {idx + 1}
                    <br />
                    <span className="text-[9px]">
                      {Math.round(page.width)} × {Math.round(page.height)}
                    </span>
                  </div>
                )}

                {/* Page Objects count badge */}
                {page.objects.length > 0 && (
                  <span className="absolute bottom-1 right-1 bg-blue-600 text-white text-[9px] font-mono px-1 rounded">
                    +{page.objects.length}
                  </span>
                )}
              </div>

              {/* Page Number & Actions */}
              <div className="flex items-center justify-between w-full mt-1.5 px-1">
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Page {idx + 1}
                </span>

                {/* Action buttons (permanent on mobile touch, subtle hover on desktop) */}
                <div className={`flex items-center gap-0.5 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  {/* Touch Reorder Up */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (idx > 0) reorderPages(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500 disabled:opacity-20"
                    title="Move Page Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  {/* Touch Reorder Down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (idx < doc.pages.length - 1) reorderPages(idx, idx + 1);
                    }}
                    disabled={idx >= doc.pages.length - 1}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500 disabled:opacity-20"
                    title="Move Page Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  {/* Rotate Page */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rotatePage(idx, 90);
                    }}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
                    title="Rotate Page 90° Clockwise"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>

                  {/* Duplicate Page */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicatePage(idx);
                    }}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {/* Delete Page */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (doc.pages.length > 1) deletePage(idx);
                    }}
                    disabled={doc.pages.length <= 1}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-red-500 disabled:opacity-20"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Add Page Button */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => addBlankPage()}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs text-neutral-800 dark:text-neutral-200"
        >
          <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Add Blank Page</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Docked Sidebar (Hidden on small screens < 1024px to prevent overlapping) */}
      <div
        className={`hidden lg:flex bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col transition-all duration-200 select-none z-20 shrink-0 ${
          collapsed ? 'w-10' : 'w-48 xl:w-56'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 h-10">
          {!collapsed && (
            <div className="flex items-center gap-1.5 font-medium text-xs text-neutral-600 dark:text-neutral-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Pages ({doc.pages.length})</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500 mx-auto"
            title={collapsed ? 'Expand Thumbnails' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && renderThumbnailList(false)}
      </div>

      {/* 2. Mobile & Tablet Slide-Over Drawer (Non-blocking, zero overlap) */}
      {isMobileThumbnailsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileThumbnailsOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Pages ({doc.pages.length})</span>
              </div>
              <button
                onClick={() => setMobileThumbnailsOpen(false)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500"
                title="Close Pages"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderThumbnailList(true)}
          </div>
        </div>
      )}
    </>
  );
};
