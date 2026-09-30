import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PageModel,
  EditorObject,
  AlignmentGuide,
  TextObject,
  ImageObject,
  ShapeObject,
  AnnotationObject,
  SignatureObject,
  StampObject,
  FormFieldObject,
  TableObject,
} from '../types/pdf';
import { useEditorStore } from '../stores/editorStore';
import { renderPdfPageToCanvas } from '../pdf/pdfRenderer';
import { SelectionBox } from './SelectionBox';
import { SnapGuides } from './SnapGuides';
import { FloatingFormatBar } from './FloatingFormatBar';
import { InlineTextEditor } from './InlineTextEditor';
import { calculateSnapping } from '../utils/geometry';
import { Edit3, Trash2, StickyNote, CheckSquare } from 'lucide-react';

interface PdfPageViewProps {
  page: PageModel;
  pageIndex: number;
}

export const PdfPageView: React.FC<PdfPageViewProps> = ({ page, pageIndex }) => {
  const {
    pdfProxy,
    zoom,
    selectedIds,
    currentTool,
    currentShape,
    editingTextId,
    snapToObjects,
    selectObject,
    clearSelection,
    addObject,
    updateObject,
    setCurrentPage,
    moveObjectsToPage,
    setEditingTextId,
    convertOriginalTextToEditable,
    deleteOriginalTextBlock,
    searchMatches,
    activeMatchIndex,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging and Transform State
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    clientStartX: number;
    clientStartY: number;
    initialObjects: Map<string, { x: number; y: number; width: number; height: number; rotation: number }>;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    handle: string;
    startX: number;
    startY: number;
    initialObj: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const [rotateState, setRotateState] = useState<{
    centerX: number;
    centerY: number;
    initialRotation: number;
  } | null>(null);

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);

  // Freehand drawing state
  const [drawingPoints, setDrawingPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Render PDF Canvas
  useEffect(() => {
    if (!canvasRef.current || !pdfProxy || !page.originalPageNumber) return;
    renderPdfPageToCanvas(
      pdfProxy,
      page.originalPageNumber,
      canvasRef.current,
      zoom,
      page.rotation
    );
  }, [pdfProxy, page.originalPageNumber, zoom, page.rotation]);

  // Selected object
  const primarySelected = page.objects.find((o) => selectedIds.includes(o.id));

  // --- MOUSE DOWN ON CANVAS (for tool actions) ---
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setCurrentPage(pageIndex);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    // Hand tool is handled by viewport pan
    if (currentTool === 'hand') return;

    if (currentTool === 'text') {
      const newText: TextObject = {
        id: `txt-${Date.now()}`,
        type: 'text',
        pageId: page.id,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 180,
        height: 32,
        rotation: 0,
        opacity: 1,
        zIndex: page.objects.length + 1,
        locked: false,
        visible: true,
        name: 'Text Box',
        content: 'Type your text here...',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        underline: false,
        strikethrough: false,
        color: '#111827',
        alignment: 'left',
        lineHeight: 1.25,
        letterSpacing: 0,
      };
      addObject(newText, pageIndex);
      setEditingTextId(newText.id);
      return;
    }

    if (currentTool === 'shape') {
      const isLine = currentShape === 'line' || currentShape === 'arrow';
      const newShape: ShapeObject = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        pageId: page.id,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: isLine ? 160 : 120,
        height: isLine ? 2 : 80,
        rotation: 0,
        opacity: 1,
        zIndex: page.objects.length + 1,
        locked: false,
        visible: true,
        name: `${currentShape.charAt(0).toUpperCase() + currentShape.slice(1)}`,
        shapeType: currentShape,
        fillColor: isLine ? 'transparent' : '#3b82f620',
        strokeColor: '#2563eb',
        strokeWidth: 2,
        strokeStyle: 'solid',
        arrowEnd: currentShape === 'arrow',
      };
      addObject(newShape, pageIndex);
      return;
    }

    if (currentTool === 'draw' || currentTool === 'highlight') {
      setIsDrawing(true);
      setDrawingPoints([{ x: clickX, y: clickY }]);
      return;
    }

    if (currentTool === 'sticky_note') {
      const note: AnnotationObject = {
        id: `note-${Date.now()}`,
        type: 'annotation',
        pageId: page.id,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 140,
        height: 100,
        rotation: 0,
        opacity: 0.95,
        zIndex: page.objects.length + 1,
        locked: false,
        visible: true,
        name: 'Sticky Note',
        annotationType: 'sticky',
        strokeColor: '#f59e0b',
        strokeWidth: 1,
        text: 'Add your note comments here...',
        commentAuthor: 'Reviewer',
        commentDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addObject(note, pageIndex);
      return;
    }

    if (currentTool === 'form_text' || currentTool === 'form_check') {
      const formObj: FormFieldObject = {
        id: `field-${Date.now()}`,
        type: 'formField',
        pageId: page.id,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: currentTool === 'form_check' ? 20 : 160,
        height: currentTool === 'form_check' ? 20 : 28,
        rotation: 0,
        opacity: 1,
        zIndex: page.objects.length + 1,
        locked: false,
        visible: true,
        name: currentTool === 'form_check' ? 'Checkbox' : 'Text Input Field',
        fieldType: currentTool === 'form_check' ? 'checkbox' : 'text',
        fieldName: `field_${Date.now().toString().slice(-4)}`,
        defaultValue: currentTool === 'form_check' ? false : '',
        currentValue: currentTool === 'form_check' ? false : '',
        required: false,
        readOnly: false,
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fontColor: '#111827',
        backgroundColor: '#eff6ff',
        borderColor: '#93c5fd',
        borderWidth: 1,
      };
      addObject(formObj, pageIndex);
      return;
    }

    if (currentTool === 'table') {
      const tbl: TableObject = {
        id: `table-${Date.now()}`,
        type: 'table',
        pageId: page.id,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 320,
        height: 120,
        rotation: 0,
        opacity: 1,
        zIndex: page.objects.length + 1,
        locked: false,
        visible: true,
        name: 'Table (3x3)',
        rows: 3,
        cols: 3,
        data: [
          ['Item', 'Qty', 'Price'],
          ['Product A', '2', '$50.00'],
          ['Product B', '1', '$120.00'],
        ],
        cellWidths: [120, 80, 120],
        cellHeights: [40, 40, 40],
        borderColor: '#cbd5e1',
        borderWidth: 1,
        headerBackground: '#f1f5f9',
        cellBackground: '#ffffff',
        textColor: '#0f172a',
        fontSize: 11,
      };
      addObject(tbl, pageIndex);
      return;
    }

    // Default select tool - clicking blank canvas clears selection
    if (e.target === containerRef.current || e.target === canvasRef.current) {
      clearSelection();
    }
  };

  // --- GLOBAL WINDOW LISTENER FOR DRAGGING, RESIZING, AND ROTATING (MOUSE & TOUCH) ---
  useEffect(() => {
    if (!dragState && !resizeState && !rotateState) return;

    const handleMoveAt = (clientX: number, clientY: number, isShiftKey: boolean) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = (clientX - rect.left) / zoom;
      const currentY = (clientY - rect.top) / zoom;

      // 1. Dragging objects across pages
      if (dragState && dragState.isDragging && primarySelected) {
        const dx = (clientX - dragState.clientStartX) / zoom;
        const dy = (clientY - dragState.clientStartY) / zoom;

        const init = dragState.initialObjects.get(primarySelected.id);
        if (!init) return;

        let targetX = init.x + dx;
        let targetY = init.y + dy;

        // Snapping calculations (when still on or near current page)
        if (snapToObjects) {
          const snapResult = calculateSnapping(
            { ...primarySelected, x: targetX, y: targetY },
            page.objects,
            page.width,
            page.height
          );
          targetX = snapResult.snappedX;
          targetY = snapResult.snappedY;
          setActiveGuides(snapResult.guides);
        }

        const actualDeltaX = targetX - init.x;
        const actualDeltaY = targetY - init.y;

        selectedIds.forEach((id) => {
          const itemInit = dragState.initialObjects.get(id);
          if (itemInit) {
            updateObject(
              id,
              {
                x: Math.round(itemInit.x + actualDeltaX),
                y: Math.round(itemInit.y + actualDeltaY),
              },
              false
            );
          }
        });
        return;
      }

      // 2. Resizing object
      if (resizeState && primarySelected) {
        const dx = currentX - resizeState.startX;
        const dy = currentY - resizeState.startY;
        const { handle, initialObj } = resizeState;

        let newX = initialObj.x;
        let newY = initialObj.y;
        let newWidth = initialObj.width;
        let newHeight = initialObj.height;

        if (handle.includes('e')) newWidth = Math.max(12, initialObj.width + dx);
        if (handle.includes('s')) newHeight = Math.max(12, initialObj.height + dy);
        if (handle.includes('w')) {
          const w = Math.max(12, initialObj.width - dx);
          newX = initialObj.x + (initialObj.width - w);
          newWidth = w;
        }
        if (handle.includes('n')) {
          const h = Math.max(12, initialObj.height - dy);
          newY = initialObj.y + (initialObj.height - h);
          newHeight = h;
        }

        if (isShiftKey && (handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw')) {
          const ratio = initialObj.width / initialObj.height;
          newHeight = newWidth / ratio;
        }

        updateObject(
          primarySelected.id,
          {
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newWidth),
            height: Math.round(newHeight),
          },
          false
        );
        return;
      }

      // 3. Rotating object
      if (rotateState && primarySelected) {
        const rad = Math.atan2(currentY - rotateState.centerY, currentX - rotateState.centerX);
        let deg = Math.round((rad * 180) / Math.PI) + 90;
        if (deg < 0) deg += 360;

        if (isShiftKey) {
          deg = Math.round(deg / 15) * 15;
        }

        updateObject(primarySelected.id, { rotation: deg }, false);
      }
    };

    const handleEndAt = (clientX: number, clientY: number) => {
      if (dragState && dragState.isDragging && containerRef.current) {
        // Detect which page container the mouse/touch was released over
        const pageElements = document.querySelectorAll<HTMLElement>('[data-page-index]');
        let targetPageIndex = pageIndex;
        let minDistance = Infinity;

        pageElements.forEach((el) => {
          const pRect = el.getBoundingClientRect();
          const dx = Math.max(pRect.left - clientX, 0, clientX - pRect.right);
          const dy = Math.max(pRect.top - clientY, 0, clientY - pRect.bottom);
          const dist = Math.hypot(dx, dy);
          if (dist < minDistance) {
            minDistance = dist;
            targetPageIndex = parseInt(el.getAttribute('data-page-index') || `${pageIndex}`, 10);
          }
        });

        const sourceContainer = containerRef.current;
        const targetEl = document.querySelector<HTMLElement>(`[data-page-index="${targetPageIndex}"]`);
        const currentDx = (clientX - dragState.clientStartX) / zoom;
        const currentDy = (clientY - dragState.clientStartY) / zoom;

        if (targetPageIndex !== pageIndex && sourceContainer && targetEl) {
          const sourceRect = sourceContainer.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          const updates: Array<{ objectId: string; targetPageIndex: number; newX: number; newY: number }> = [];

          selectedIds.forEach((id) => {
            const init = dragState.initialObjects.get(id);
            if (init) {
              const screenX = sourceRect.left + (init.x + currentDx) * zoom;
              const screenY = sourceRect.top + (init.y + currentDy) * zoom;
              const targetX = (screenX - targetRect.left) / zoom;
              const targetY = (screenY - targetRect.top) / zoom;
              updates.push({
                objectId: id,
                targetPageIndex,
                newX: targetX,
                newY: targetY,
              });
            }
          });

          if (updates.length > 0) {
            moveObjectsToPage(updates);
          }
        } else {
          // Same page: commit final position to history
          selectedIds.forEach((id) => {
            const init = dragState.initialObjects.get(id);
            if (init) {
              updateObject(
                id,
                {
                  x: Math.round(init.x + currentDx),
                  y: Math.round(init.y + currentDy),
                },
                true
              );
            }
          });
        }
      }

      setDragState(null);
      setResizeState(null);
      setRotateState(null);
      setActiveGuides([]);
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      handleMoveAt(e.clientX, e.clientY, e.shiftKey);
    };

    const onWindowMouseUp = (e: MouseEvent) => {
      handleEndAt(e.clientX, e.clientY);
    };

    const onWindowTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      if (dragState?.isDragging || resizeState || rotateState) {
        if (e.cancelable) e.preventDefault();
        handleMoveAt(e.touches[0].clientX, e.touches[0].clientY, false);
      }
    };

    const onWindowTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches?.[0] || e.touches?.[0];
      if (touch) {
        handleEndAt(touch.clientX, touch.clientY);
      } else {
        setDragState(null);
        setResizeState(null);
        setRotateState(null);
        setActiveGuides([]);
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onWindowTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
    };
  }, [
    dragState,
    resizeState,
    rotateState,
    primarySelected,
    selectedIds,
    zoom,
    snapToObjects,
    page.objects,
    page.width,
    page.height,
    pageIndex,
    moveObjectsToPage,
    updateObject,
  ]);

  // --- FREEHAND DRAWING LISTENER ---
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) / zoom;
      const currentY = (e.clientY - rect.top) / zoom;

      if (isDrawing && (currentTool === 'draw' || currentTool === 'highlight')) {
        setDrawingPoints((prev) => [...prev, { x: currentX, y: currentY }]);
      }
    },
    [isDrawing, currentTool, zoom]
  );

  const commitDrawing = useCallback(() => {
    if (isDrawing && drawingPoints.length > 1) {
      const minX = Math.min(...drawingPoints.map((p) => p.x));
      const minY = Math.min(...drawingPoints.map((p) => p.y));
      const maxX = Math.max(...drawingPoints.map((p) => p.x));
      const maxY = Math.max(...drawingPoints.map((p) => p.y));

      const relativePath = drawingPoints.map((p) => ({ x: p.x - minX, y: p.y - minY }));

      const annObj: AnnotationObject = {
        id: `ann-${Date.now()}`,
        type: 'annotation',
        pageId: page.id,
        x: Math.round(minX),
        y: Math.round(minY),
        width: Math.max(16, Math.round(maxX - minX)),
        height: Math.max(16, Math.round(maxY - minY)),
        rotation: 0,
        opacity: currentTool === 'highlight' ? 0.4 : 1,
        zIndex: page.objects.length + 1,
        locked: false,
        visible: true,
        name: currentTool === 'highlight' ? 'Highlight Stroke' : 'Pen Drawing',
        annotationType: currentTool === 'highlight' ? 'highlight' : 'freehand',
        strokeColor: currentTool === 'highlight' ? '#facc15' : '#ef4444',
        strokeWidth: currentTool === 'highlight' ? 16 : 3,
        path: relativePath,
      };

      addObject(annObj, pageIndex);
      setDrawingPoints([]);
      setIsDrawing(false);
    }
  }, [isDrawing, drawingPoints, currentTool, page.id, page.objects.length, pageIndex, addObject]);

  const handleMouseUp = () => {
    commitDrawing();
  };

  // Touch drawing handlers on canvas
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && (currentTool === 'draw' || currentTool === 'highlight')) {
      e.preventDefault();
      const touch = e.touches[0];
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = (touch.clientX - rect.left) / zoom;
      const clickY = (touch.clientY - rect.top) / zoom;
      setIsDrawing(true);
      setDrawingPoints([{ x: clickX, y: clickY }]);
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDrawing && e.touches.length === 1 && (currentTool === 'draw' || currentTool === 'highlight')) {
      e.preventDefault();
      const touch = e.touches[0];
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = (touch.clientX - rect.left) / zoom;
      const currentY = (touch.clientY - rect.top) / zoom;
      setDrawingPoints((prev) => [...prev, { x: currentX, y: currentY }]);
    }
  };

  const handleCanvasTouchEnd = () => {
    if (isDrawing && (currentTool === 'draw' || currentTool === 'highlight')) {
      commitDrawing();
    }
  };

  // --- START OBJECT DRAG (MOUSE) ---
  const handleObjectMouseDown = (obj: EditorObject, e: React.MouseEvent) => {
    setCurrentPage(pageIndex);
    if (currentTool !== 'select' && currentTool !== 'hand') return;
    if (obj.locked) return;

    e.stopPropagation();

    if (!selectedIds.includes(obj.id)) {
      selectObject(obj.id, e.shiftKey);
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    const initialMap = new Map();
    const targetIds = selectedIds.includes(obj.id) ? selectedIds : [obj.id];
    page.objects.forEach((o) => {
      if (targetIds.includes(o.id)) {
        initialMap.set(o.id, {
          x: o.x,
          y: o.y,
          width: o.width,
          height: o.height,
          rotation: o.rotation,
        });
      }
    });

    setDragState({
      isDragging: true,
      startX: mouseX,
      startY: mouseY,
      clientStartX: e.clientX,
      clientStartY: e.clientY,
      initialObjects: initialMap,
    });
  };

  // --- START OBJECT DRAG (TOUCH) ---
  const handleObjectTouchStart = (obj: EditorObject, e: React.TouchEvent) => {
    setCurrentPage(pageIndex);
    if (currentTool !== 'select' && currentTool !== 'hand') return;
    if (obj.locked) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    e.stopPropagation();

    if (!selectedIds.includes(obj.id)) {
      selectObject(obj.id, false);
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = (touch.clientX - rect.left) / zoom;
    const touchY = (touch.clientY - rect.top) / zoom;

    const initialMap = new Map();
    const targetIds = selectedIds.includes(obj.id) ? selectedIds : [obj.id];
    page.objects.forEach((o) => {
      if (targetIds.includes(o.id)) {
        initialMap.set(o.id, {
          x: o.x,
          y: o.y,
          width: o.width,
          height: o.height,
          rotation: o.rotation,
        });
      }
    });

    setDragState({
      isDragging: true,
      startX: touchX,
      startY: touchY,
      clientStartX: touch.clientX,
      clientStartY: touch.clientY,
      initialObjects: initialMap,
    });
  };

  // --- START RESIZE (MOUSE & TOUCH) ---
  const handleResizeStart = (handle: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!primarySelected || !containerRef.current) return;
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (clientX - rect.left) / zoom;
    const mouseY = (clientY - rect.top) / zoom;

    setResizeState({
      handle,
      startX: mouseX,
      startY: mouseY,
      initialObj: {
        x: primarySelected.x,
        y: primarySelected.y,
        width: primarySelected.width,
        height: primarySelected.height,
      },
    });
  };

  // --- START ROTATE (MOUSE & TOUCH) ---
  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!primarySelected) return;

    setRotateState({
      centerX: primarySelected.x + primarySelected.width / 2,
      centerY: primarySelected.y + primarySelected.height / 2,
      initialRotation: primarySelected.rotation,
    });
  };

  // --- DROP IMAGE FILE ONTO PAGE ---
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(pageIndex);
    if (!containerRef.current) return;
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dropX = (e.clientX - rect.left) / zoom;
    const dropY = (e.clientY - rect.top) / zoom;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Display dimensions on the canvas
          const maxDisplayDim = 320;
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
              // Use JPEG for photographic files if large, PNG otherwise
              finalSrc = file.type === 'image/jpeg' ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');
            }
          } catch (cErr) {
            console.warn('Canvas conversion fallback on drop:', cErr);
          }

          const imgObj: ImageObject = {
            id: `img-${Date.now()}`,
            type: 'image',
            pageId: page.id,
            x: Math.round(dropX - w / 2),
            y: Math.round(dropY - h / 2),
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
          };
          addObject(imgObj, pageIndex);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-white shadow-2xl transition-shadow select-none origin-top-left mx-auto ${
        dragState?.isDragging ? 'z-50 overflow-visible' : 'overflow-hidden'
      }`}
      style={{
        width: page.width * zoom,
        height: page.height * zoom,
        backgroundColor: page.background || '#ffffff',
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleCanvasTouchStart}
      onTouchMove={handleCanvasTouchMove}
      onTouchEnd={handleCanvasTouchEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* 1. Underlying PDF Render Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* 2. Redact / White-out Mask Layer for modified/deleted original PDF text */}
      {page.originalTextBlocks.map((block) => {
        if (!block.isModified && !block.isDeleted) return null;
        return (
          <div
            key={`redact-${block.id}`}
            className="absolute bg-white pointer-events-none z-10"
            style={{
              left: (block.x - 1) * zoom,
              top: (block.y - 1) * zoom,
              width: (block.width + 2) * zoom,
              height: (block.height + 2) * zoom,
            }}
          />
        );
      })}

      {/* 3. Search Highlights Layer */}
      {searchMatches
        .filter((m) => m.pageIndex === pageIndex)
        .map((match, idx) => {
          const isActive =
            searchMatches[activeMatchIndex]?.x === match.x &&
            searchMatches[activeMatchIndex]?.y === match.y &&
            searchMatches[activeMatchIndex]?.pageIndex === pageIndex;
          return (
            <div
              key={`search-match-${idx}`}
              className={`absolute pointer-events-none z-25 transition-colors ${
                isActive ? 'bg-orange-500/70 border border-orange-600' : 'bg-yellow-400/50'
              }`}
              style={{
                left: match.x * zoom,
                top: match.y * zoom,
                width: match.width * zoom,
                height: match.height * zoom,
              }}
            />
          );
        })}

      {/* 4. Original PDF Text Interactive Blocks (Word-like inline click-to-edit) */}
      {(currentTool === 'select' || currentTool === 'text') &&
        page.originalTextBlocks.map((block) => {
          if (block.isModified || block.isDeleted) return null;
          return (
            <div
              key={`orig-${block.id}`}
              className="absolute z-15 group cursor-text transition-colors border border-transparent hover:border-blue-400 hover:bg-blue-500/10 rounded-xs"
              style={{
                left: block.x * zoom,
                top: block.y * zoom,
                width: block.width * zoom,
                height: block.height * zoom,
              }}
              onClick={(e) => {
                e.stopPropagation();
                convertOriginalTextToEditable(pageIndex, block.id);
              }}
              title="Click to edit original text"
            >
              {/* Quick action buttons on hover */}
              <div className="hidden group-hover:flex absolute -top-5 right-0 bg-neutral-900 text-white rounded px-1 py-0.5 text-[9px] items-center gap-1 shadow-md z-30 pointer-events-auto">
                <span className="flex items-center gap-0.5">
                  <Edit3 className="w-2.5 h-2.5" /> Edit
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOriginalTextBlock(pageIndex, block.id);
                  }}
                  className="hover:text-red-300 p-0.5"
                  title="Delete original text"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}

      {/* 5. Editable Objects Layer */}
      {page.objects.map((obj) => {
        if (!obj.visible) return null;
        const isSelected = selectedIds.includes(obj.id);
        const isEditingThis = editingTextId === obj.id;

        return (
          <div
            key={obj.id}
            className={`absolute select-none touch-none ${
              isSelected ? (dragState?.isDragging ? 'z-50' : 'z-30') : 'z-20'
            } ${obj.locked ? 'cursor-not-allowed' : 'cursor-move'}`}
            style={{
              left: obj.x * zoom,
              top: obj.y * zoom,
              width: obj.width * zoom,
              height: obj.height * zoom,
              transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
              transformOrigin: 'center center',
              opacity: obj.opacity,
            }}
            onMouseDown={(e) => handleObjectMouseDown(obj, e)}
            onTouchStart={(e) => handleObjectTouchStart(obj, e)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (obj.type === 'text') {
                setEditingTextId(obj.id);
              }
            }}
          >
            {/* TEXT OBJECT */}
            {obj.type === 'text' && (
              <>
                {isEditingThis ? (
                  <InlineTextEditor object={obj as TextObject} zoom={zoom} />
                ) : (
                  <div
                    className={`w-full h-full whitespace-pre-wrap select-none p-0.5 break-words ${
                      (obj as TextObject).redactBackground ? 'bg-white' : ''
                    }`}
                    style={{
                      fontFamily: (obj as TextObject).fontFamily,
                      fontSize: `${(obj as TextObject).fontSize * zoom}px`,
                      fontWeight: (obj as TextObject).fontWeight,
                      fontStyle: (obj as TextObject).fontStyle,
                      color: (obj as TextObject).color,
                      textAlign: (obj as TextObject).alignment,
                      lineHeight: (obj as TextObject).lineHeight,
                      letterSpacing: `${(obj as TextObject).letterSpacing}px`,
                      textDecoration: `${(obj as TextObject).underline ? 'underline' : ''} ${
                        (obj as TextObject).strikethrough ? 'line-through' : ''
                      }`.trim(),
                    }}
                  >
                    {(obj as TextObject).content}
                  </div>
                )}
              </>
            )}

            {/* IMAGE OBJECT */}
            {obj.type === 'image' && (
              <img
                src={(obj as ImageObject).src}
                alt={(obj as ImageObject).name}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
                style={{
                  borderRadius: `${(obj as ImageObject).borderRadius * zoom}px`,
                  border: (obj as ImageObject).borderWidth
                    ? `${(obj as ImageObject).borderWidth * zoom}px solid ${
                        (obj as ImageObject).borderColor
                      }`
                    : undefined,
                  transform: `${(obj as ImageObject).flipX ? 'scaleX(-1)' : ''} ${
                    (obj as ImageObject).flipY ? 'scaleY(-1)' : ''
                  }`.trim(),
                  boxShadow: (obj as ImageObject).shadow
                    ? '0 4px 12px rgba(0,0,0,0.2)'
                    : undefined,
                }}
              />
            )}

            {/* SHAPE OBJECT */}
            {obj.type === 'shape' && (
              <svg className="w-full h-full overflow-visible pointer-events-none">
                {(obj as ShapeObject).shapeType === 'rectangle' && (
                  <rect
                    x={0}
                    y={0}
                    width={obj.width * zoom}
                    height={obj.height * zoom}
                    fill={(obj as ShapeObject).fillColor}
                    stroke={(obj as ShapeObject).strokeColor}
                    strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                    strokeDasharray={
                      (obj as ShapeObject).strokeStyle === 'dashed'
                        ? '6,4'
                        : (obj as ShapeObject).strokeStyle === 'dotted'
                        ? '2,2'
                        : undefined
                    }
                    rx={((obj as ShapeObject).borderRadius || 0) * zoom}
                  />
                )}
                {(obj as ShapeObject).shapeType === 'ellipse' && (
                  <ellipse
                    cx={(obj.width * zoom) / 2}
                    cy={(obj.height * zoom) / 2}
                    rx={(obj.width * zoom) / 2}
                    ry={(obj.height * zoom) / 2}
                    fill={(obj as ShapeObject).fillColor}
                    stroke={(obj as ShapeObject).strokeColor}
                    strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                  />
                )}
                {(obj as ShapeObject).shapeType === 'triangle' && (
                  <polygon
                    points={`${(obj.width * zoom) / 2},0 ${obj.width * zoom},${obj.height * zoom} 0,${obj.height * zoom}`}
                    fill={(obj as ShapeObject).fillColor}
                    stroke={(obj as ShapeObject).strokeColor}
                    strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                  />
                )}
                {((obj as ShapeObject).shapeType === 'line' ||
                  (obj as ShapeObject).shapeType === 'arrow') && (
                  <>
                    <line
                      x1={0}
                      y1={(obj.height * zoom) / 2}
                      x2={obj.width * zoom}
                      y2={(obj.height * zoom) / 2}
                      stroke={(obj as ShapeObject).strokeColor}
                      strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                    />
                    {(obj as ShapeObject).shapeType === 'arrow' && (
                      <polygon
                        points={`${obj.width * zoom},${(obj.height * zoom) / 2} ${
                          obj.width * zoom - 10 * zoom
                        },${(obj.height * zoom) / 2 - 5 * zoom} ${
                          obj.width * zoom - 10 * zoom
                        },${(obj.height * zoom) / 2 + 5 * zoom}`}
                        fill={(obj as ShapeObject).strokeColor}
                      />
                    )}
                  </>
                )}
              </svg>
            )}

            {/* ANNOTATION OBJECT */}
            {obj.type === 'annotation' && (
              <>
                {(obj as AnnotationObject).annotationType === 'highlight' && (
                  <div
                    className="w-full h-full rounded-xs"
                    style={{ backgroundColor: (obj as AnnotationObject).strokeColor }}
                  />
                )}
                {(obj as AnnotationObject).annotationType === 'freehand' && (
                  <svg className="w-full h-full overflow-visible pointer-events-none">
                    <polyline
                      points={(obj as AnnotationObject).path
                        ?.map((p) => `${p.x * zoom},${p.y * zoom}`)
                        .join(' ')}
                      fill="none"
                      stroke={(obj as AnnotationObject).strokeColor}
                      strokeWidth={(obj as AnnotationObject).strokeWidth * zoom}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {(obj as AnnotationObject).annotationType === 'sticky' && (
                  <div className="w-full h-full bg-amber-100 dark:bg-amber-900/60 border border-amber-400 dark:border-amber-600 rounded-md p-2 shadow-lg flex flex-col text-neutral-800 dark:text-neutral-100">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 pb-1 border-b border-amber-200 dark:border-amber-700">
                      <StickyNote className="w-3 h-3" />
                      <span>{(obj as AnnotationObject).commentAuthor || 'Comment'}</span>
                      <span className="text-[9px] text-neutral-500 ml-auto">
                        {(obj as AnnotationObject).commentDate}
                      </span>
                    </div>
                    <textarea
                      defaultValue={(obj as AnnotationObject).text}
                      onChange={(e) =>
                        updateObject(obj.id, { text: e.target.value }, false)
                      }
                      className="w-full flex-1 bg-transparent text-[11px] resize-none outline-none mt-1"
                      placeholder="Type note..."
                    />
                  </div>
                )}
              </>
            )}

            {/* SIGNATURE OBJECT */}
            {obj.type === 'signature' && (
              <img
                src={(obj as SignatureObject).dataUrl}
                alt="Digital Signature"
                draggable={false}
                className="w-full h-full object-contain pointer-events-none"
              />
            )}

            {/* STAMP OBJECT */}
            {obj.type === 'stamp' && (
              <div
                className="w-full h-full flex flex-col items-center justify-center border-4 border-dashed rounded-lg p-2 font-mono uppercase font-black tracking-widest text-center shadow-md select-none"
                style={{
                  borderColor: (obj as StampObject).color,
                  color: (obj as StampObject).color,
                }}
              >
                <span className="text-base">{(obj as StampObject).text}</span>
                <span className="text-[8px] font-normal tracking-normal mt-0.5">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            )}

            {/* FORM FIELD OBJECT */}
            {obj.type === 'formField' && (
              <div
                className="w-full h-full flex items-center justify-center p-1 rounded transition-colors"
                style={{
                  backgroundColor: (obj as FormFieldObject).backgroundColor,
                  border: `${(obj as FormFieldObject).borderWidth}px solid ${
                    (obj as FormFieldObject).borderColor
                  }`,
                }}
              >
                {(obj as FormFieldObject).fieldType === 'text' && (
                  <input
                    type="text"
                    defaultValue={String((obj as FormFieldObject).currentValue || '')}
                    onChange={(e) =>
                      updateObject(obj.id, { currentValue: e.target.value }, false)
                    }
                    placeholder={(obj as FormFieldObject).fieldName}
                    className="w-full h-full bg-transparent text-xs outline-none px-1"
                    style={{
                      fontFamily: (obj as FormFieldObject).fontFamily,
                      fontSize: `${(obj as FormFieldObject).fontSize}px`,
                      color: (obj as FormFieldObject).fontColor,
                    }}
                  />
                )}
                {(obj as FormFieldObject).fieldType === 'checkbox' && (
                  <input
                    type="checkbox"
                    defaultChecked={Boolean((obj as FormFieldObject).currentValue)}
                    onChange={(e) =>
                      updateObject(obj.id, { currentValue: e.target.checked }, false)
                    }
                    className="w-4 h-4 cursor-pointer text-blue-600 rounded"
                  />
                )}
              </div>
            )}

            {/* TABLE OBJECT */}
            {obj.type === 'table' && (
              <div
                className="w-full h-full grid border rounded overflow-hidden shadow-sm"
                style={{
                  borderColor: (obj as TableObject).borderColor,
                  gridTemplateColumns: `repeat(${(obj as TableObject).cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${(obj as TableObject).rows}, minmax(0, 1fr))`,
                }}
              >
                {(obj as TableObject).data.map((row, rIdx) =>
                  row.map((cellText, cIdx) => (
                    <input
                      key={`cell-${rIdx}-${cIdx}`}
                      type="text"
                      defaultValue={cellText}
                      onChange={(e) => {
                        const newData = [...(obj as TableObject).data.map((r) => [...r])];
                        newData[rIdx][cIdx] = e.target.value;
                        updateObject(obj.id, { data: newData }, false);
                      }}
                      className="border-b border-r px-1 text-center outline-none"
                      style={{
                        borderColor: (obj as TableObject).borderColor,
                        backgroundColor:
                          rIdx === 0
                            ? (obj as TableObject).headerBackground
                            : (obj as TableObject).cellBackground,
                        color: (obj as TableObject).textColor,
                        fontSize: `${(obj as TableObject).fontSize}px`,
                        fontWeight: rIdx === 0 ? 'bold' : 'normal',
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 6. Active In-Progress Freehand Drawing Preview */}
      {isDrawing && drawingPoints.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none z-45 w-full h-full overflow-visible">
          <polyline
            points={drawingPoints.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
            fill="none"
            stroke={currentTool === 'highlight' ? '#facc15' : '#ef4444'}
            strokeWidth={(currentTool === 'highlight' ? 16 : 3) * zoom}
            strokeOpacity={currentTool === 'highlight' ? 0.4 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* 7. Selection Box & Transform Handles */}
      {primarySelected && !editingTextId && (
        <SelectionBox
          object={primarySelected}
          zoom={zoom}
          onResizeStart={handleResizeStart}
          onRotateStart={handleRotateStart}
        />
      )}

      {/* 8. Floating Formatting Bar for Text Objects */}
      {primarySelected && primarySelected.type === 'text' && !editingTextId && (
        <FloatingFormatBar object={primarySelected as TextObject} zoom={zoom} />
      )}

      {/* 9. Canva/Figma Alignment Snapping Guides */}
      <SnapGuides guides={activeGuides} zoom={zoom} />
    </div>
  );
};
