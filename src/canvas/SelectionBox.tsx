import React from 'react';
import { RotateCw } from 'lucide-react';
import { EditorObject } from '../types/pdf';

interface SelectionBoxProps {
  object: EditorObject;
  zoom: number;
  onResizeStart: (handle: string, e: React.MouseEvent | React.TouchEvent) => void;
  onRotateStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  object,
  zoom,
  onResizeStart,
  onRotateStart,
}) => {
  const handles = [
    { name: 'nw', cursor: 'nwse-resize', top: -5, left: -5 },
    { name: 'n', cursor: 'ns-resize', top: -5, left: '50%', transform: 'translateX(-50%)' },
    { name: 'ne', cursor: 'nesw-resize', top: -5, right: -5 },
    { name: 'e', cursor: 'ew-resize', top: '50%', right: -5, transform: 'translateY(-50%)' },
    { name: 'se', cursor: 'nwse-resize', bottom: -5, right: -5 },
    { name: 's', cursor: 'ns-resize', bottom: -5, left: '50%', transform: 'translateX(-50%)' },
    { name: 'sw', cursor: 'nesw-resize', bottom: -5, left: -5 },
    { name: 'w', cursor: 'ew-resize', top: '50%', left: -5, transform: 'translateY(-50%)' },
  ];

  return (
    <div
      className="absolute pointer-events-none select-none touch-none"
      style={{
        left: object.x * zoom,
        top: object.y * zoom,
        width: object.width * zoom,
        height: object.height * zoom,
        transform: object.rotation ? `rotate(${object.rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
    >
      {/* Bounding box border */}
      <div className="absolute inset-0 border-2 border-blue-600 dark:border-blue-400 pointer-events-none rounded-xs shadow-xs" />

      {/* Rotation handle at top center with touch hit padding */}
      <div
        className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing group p-2 touch-none -m-2"
        onMouseDown={onRotateStart}
        onTouchStart={onRotateStart}
        title="Rotate object"
      >
        <div className="w-6 h-6 bg-white dark:bg-neutral-800 border-2 border-blue-600 dark:border-blue-400 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform">
          <RotateCw className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="w-0.5 h-2.5 bg-blue-600 dark:border-blue-400" />
      </div>

      {/* 8 Resize Handles with generous invisible touch hitboxes (at least 32px-40px touch zone) */}
      {handles.map((h) => (
        <div
          key={h.name}
          className="absolute w-3 h-3 bg-white dark:bg-neutral-800 border-2 border-blue-600 dark:border-blue-400 rounded-xs pointer-events-auto hover:scale-125 active:scale-110 transition-transform shadow-sm touch-none before:absolute before:-inset-3 before:content-['']"
          style={{
            cursor: h.cursor,
            top: h.top,
            left: h.left,
            right: h.right,
            bottom: h.bottom,
            transform: h.transform,
          }}
          onMouseDown={(e) => onResizeStart(h.name, e)}
          onTouchStart={(e) => onResizeStart(h.name, e)}
        />
      ))}

      {/* Dimensions indicator pill */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
        {Math.round(object.width)} × {Math.round(object.height)} pt
      </div>
    </div>
  );
};
