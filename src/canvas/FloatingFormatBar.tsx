import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Copy,
  Trash2,
  Palette,
  Minus,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { TextObject } from '../types/pdf';
import { useEditorStore } from '../stores/editorStore';

interface FloatingFormatBarProps {
  object: TextObject;
  zoom: number;
}

const FONT_FAMILIES = [
  { label: 'Inter (Sans)', value: 'Inter, sans-serif' },
  { label: 'Times New Roman (Serif)', value: 'Times New Roman, serif' },
  { label: 'Courier (Mono)', value: 'Courier Prime, monospace' },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
];

const PRESET_COLORS = [
  '#000000',
  '#374151',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ffffff',
];

export const FloatingFormatBar: React.FC<FloatingFormatBarProps> = ({ object, zoom }) => {
  const { updateObject, deleteSelected, duplicateSelected } = useEditorStore();
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const topPos = Math.max(8, object.y * zoom - (isMobile ? 54 : 46));
  const leftPos = Math.max(8, Math.min(object.x * zoom, isMobile ? 8 : (window.innerWidth - 420)));

  return (
    <div
      className="absolute z-50 flex items-center gap-1 bg-white/95 dark:bg-neutral-850/95 backdrop-blur-md text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-lg px-2 py-1 select-none text-xs max-w-[calc(100vw-24px)] overflow-x-auto scrollbar-none touch-pan-x flex-nowrap shrink-0"
      style={{
        top: topPos,
        left: leftPos,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Font Family */}
      <select
        value={object.fontFamily}
        onChange={(e) => updateObject(object.id, { fontFamily: e.target.value })}
        className="bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded px-1.5 py-1 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 my-auto mx-0.5" />

      {/* Font Size */}
      <div className="flex items-center gap-0.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded px-1 py-0.5">
        <button
          onClick={() =>
            updateObject(object.id, { fontSize: Math.max(6, Math.round(object.fontSize - 1)) })
          }
          className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded"
          title="Decrease font size"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center font-mono font-medium">{Math.round(object.fontSize)}</span>
        <button
          onClick={() =>
            updateObject(object.id, { fontSize: Math.min(120, Math.round(object.fontSize + 1)) })
          }
          className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded"
          title="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 my-auto mx-0.5" />

      {/* Bold */}
      <button
        onClick={() =>
          updateObject(object.id, {
            fontWeight: object.fontWeight === 'bold' ? 'normal' : 'bold',
          })
        }
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.fontWeight === 'bold' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Italic */}
      <button
        onClick={() =>
          updateObject(object.id, {
            fontStyle: object.fontStyle === 'italic' ? 'normal' : 'italic',
          })
        }
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.fontStyle === 'italic' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      {/* Underline */}
      <button
        onClick={() => updateObject(object.id, { underline: !object.underline })}
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.underline ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''
        }`}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      {/* Strikethrough */}
      <button
        onClick={() => updateObject(object.id, { strikethrough: !object.strikethrough })}
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.strikethrough ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 my-auto mx-0.5" />

      {/* Color Picker Toggle */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-1"
          title="Text Color"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600"
            style={{ backgroundColor: object.color }}
          />
          <Palette className="w-3 h-3 text-neutral-500" />
        </button>

        {showColorPicker && (
          <div className="absolute top-8 left-0 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl p-2 grid grid-cols-5 gap-1.5 w-36">
            {PRESET_COLORS.map((col) => (
              <button
                key={col}
                onClick={() => {
                  updateObject(object.id, { color: col });
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 hover:scale-115 transition-transform"
                style={{ backgroundColor: col }}
              />
            ))}
            <input
              type="color"
              value={object.color}
              onChange={(e) => updateObject(object.id, { color: e.target.value })}
              className="col-span-5 h-6 w-full cursor-pointer mt-1"
            />
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 my-auto mx-0.5" />

      {/* Alignment */}
      <button
        onClick={() => updateObject(object.id, { alignment: 'left' })}
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.alignment === 'left' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''
        }`}
        title="Align Left"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => updateObject(object.id, { alignment: 'center' })}
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.alignment === 'center' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''
        }`}
        title="Align Center"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => updateObject(object.id, { alignment: 'right' })}
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.alignment === 'right' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''
        }`}
        title="Align Right"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 my-auto mx-0.5" />

      {/* Redact Background Toggle (Cover underlying PDF text) */}
      <button
        onClick={() =>
          updateObject(object.id, { redactBackground: !object.redactBackground })
        }
        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
          object.redactBackground
            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
            : 'text-neutral-500'
        }`}
        title={
          object.redactBackground
            ? 'Whiteout patch active (underlying original text covered)'
            : 'Enable whiteout patch'
        }
      >
        <ShieldAlert className="w-3.5 h-3.5" />
      </button>

      {/* Duplicate */}
      <button
        onClick={() => duplicateSelected()}
        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
        title="Duplicate (Ctrl+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Delete */}
      <button
        onClick={() => deleteSelected()}
        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
        title="Delete (Delete/Backspace)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
