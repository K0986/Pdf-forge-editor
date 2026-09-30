import { EditorObject, AlignmentGuide } from '../types/pdf';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SNAP_THRESHOLD = 6; // snap threshold in points

export function calculateSnapping(
  draggingObject: EditorObject,
  otherObjects: EditorObject[],
  pageWidth: number,
  pageHeight: number
): {
  snappedX: number;
  snappedY: number;
  guides: AlignmentGuide[];
} {
  let snappedX = draggingObject.x;
  let snappedY = draggingObject.y;
  const guides: AlignmentGuide[] = [];

  const dragLeft = draggingObject.x;
  const dragCenter = draggingObject.x + draggingObject.width / 2;
  const dragRight = draggingObject.x + draggingObject.width;

  const dragTop = draggingObject.y;
  const dragMiddle = draggingObject.y + draggingObject.height / 2;
  const dragBottom = draggingObject.y + draggingObject.height;

  // 1. Snap to Page Edges and Center
  const pageCenterX = pageWidth / 2;
  const pageCenterY = pageHeight / 2;

  // Page Center X
  if (Math.abs(dragCenter - pageCenterX) < SNAP_THRESHOLD) {
    snappedX = pageCenterX - draggingObject.width / 2;
    guides.push({
      type: 'vertical',
      position: pageCenterX,
      start: 0,
      end: pageHeight,
      label: 'Page Center',
    });
  } else if (Math.abs(dragLeft - 36) < SNAP_THRESHOLD) {
    // 0.5 inch margin
    snappedX = 36;
    guides.push({ type: 'vertical', position: 36, start: 0, end: pageHeight, label: 'Margin' });
  } else if (Math.abs(dragRight - (pageWidth - 36)) < SNAP_THRESHOLD) {
    snappedX = pageWidth - 36 - draggingObject.width;
    guides.push({
      type: 'vertical',
      position: pageWidth - 36,
      start: 0,
      end: pageHeight,
      label: 'Margin',
    });
  }

  // Page Center Y
  if (Math.abs(dragMiddle - pageCenterY) < SNAP_THRESHOLD) {
    snappedY = pageCenterY - draggingObject.height / 2;
    guides.push({
      type: 'horizontal',
      position: pageCenterY,
      start: 0,
      end: pageWidth,
      label: 'Page Center',
    });
  } else if (Math.abs(dragTop - 36) < SNAP_THRESHOLD) {
    snappedY = 36;
    guides.push({ type: 'horizontal', position: 36, start: 0, end: pageWidth, label: 'Margin' });
  } else if (Math.abs(dragBottom - (pageHeight - 36)) < SNAP_THRESHOLD) {
    snappedY = pageHeight - 36 - draggingObject.height;
    guides.push({
      type: 'horizontal',
      position: pageHeight - 36,
      start: 0,
      end: pageWidth,
      label: 'Margin',
    });
  }

  // 2. Snap to other objects
  for (const obj of otherObjects) {
    if (obj.id === draggingObject.id || !obj.visible) continue;

    const otherLeft = obj.x;
    const otherCenter = obj.x + obj.width / 2;
    const otherRight = obj.x + obj.width;

    const otherTop = obj.y;
    const otherMiddle = obj.y + obj.height / 2;
    const otherBottom = obj.y + obj.height;

    // Horizontal alignment (Vertical guide lines)
    if (Math.abs(dragLeft - otherLeft) < SNAP_THRESHOLD) {
      snappedX = otherLeft;
      guides.push({
        type: 'vertical',
        position: otherLeft,
        start: Math.min(dragTop, otherTop),
        end: Math.max(dragBottom, otherBottom),
      });
    } else if (Math.abs(dragCenter - otherCenter) < SNAP_THRESHOLD) {
      snappedX = otherCenter - draggingObject.width / 2;
      guides.push({
        type: 'vertical',
        position: otherCenter,
        start: Math.min(dragTop, otherTop),
        end: Math.max(dragBottom, otherBottom),
      });
    } else if (Math.abs(dragRight - otherRight) < SNAP_THRESHOLD) {
      snappedX = otherRight - draggingObject.width;
      guides.push({
        type: 'vertical',
        position: otherRight,
        start: Math.min(dragTop, otherTop),
        end: Math.max(dragBottom, otherBottom),
      });
    }

    // Vertical alignment (Horizontal guide lines)
    if (Math.abs(dragTop - otherTop) < SNAP_THRESHOLD) {
      snappedY = otherTop;
      guides.push({
        type: 'horizontal',
        position: otherTop,
        start: Math.min(dragLeft, otherLeft),
        end: Math.max(dragRight, otherRight),
      });
    } else if (Math.abs(dragMiddle - otherMiddle) < SNAP_THRESHOLD) {
      snappedY = otherMiddle - draggingObject.height / 2;
      guides.push({
        type: 'horizontal',
        position: otherMiddle,
        start: Math.min(dragLeft, otherLeft),
        end: Math.max(dragRight, otherRight),
      });
    } else if (Math.abs(dragBottom - otherBottom) < SNAP_THRESHOLD) {
      snappedY = otherBottom - draggingObject.height;
      guides.push({
        type: 'horizontal',
        position: otherBottom,
        start: Math.min(dragLeft, otherLeft),
        end: Math.max(dragRight, otherRight),
      });
    }
  }

  return { snappedX, snappedY, guides };
}

export function rotatePoint(p: Point, center: Point, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
