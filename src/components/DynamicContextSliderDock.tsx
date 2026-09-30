import React, { useState, useRef } from 'react';
import {
  Type,
  Sliders,
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
  RotateCw,
  Palette,
  Minus,
  Plus,
  Layers,
  ArrowUp,
  ArrowDown,
  FlipHorizontal,
  FlipVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MousePointer,
  Hand,
  Image as ImageIcon,
  Square,
  Circle,
  Minus as MinusIcon,
  Pen,
  Highlighter,
  PenTool,
  StickyNote,
  Table as TableIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { TextObject, ImageObject, ShapeObject, EditorTool, ShapeType } from '../types/pdf';

const FONT_FAMILIES = [
  { label: 'Inter (Sans)', value: 'Inter, sans-serif' },
  { label: 'Times New Roman (Serif)', value: 'Times New Roman, serif' },
  { label: 'Courier (Mono)', value: 'Courier Prime, monospace' },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Playfair Display', value: 'Playfair Display, serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
];

const LUCID_COLORS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Obsidian Black', hex: '#000000' },
  { name: 'Slate Gray', hex: '#475569' },
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Vibrant Blue', hex: '#3b82f6' },
  { name: 'Lucid Emerald', hex: '#10b981' },
  { name: 'Bright Amber', hex: '#f59e0b' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Hot Rose', hex: '#f43f5e' },
];

export const DynamicContextSliderDock: React.FC = () => {
  const {
    doc,
    currentPageIndex,
    setCurrentPage,
    selectedIds,
    updateObject,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    alignSelected,
    currentTool,
    setTool,
    currentShape,
    setShape,
    zoom,
    setZoom,
    setModalOpen,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<'font' | 'style' | 'align' | 'transform'>('font');
  const [activeImageTab, setActiveImageTab] = useState<'adjust' | 'transform' | 'layers'>('adjust');
  const [activeShapeTab, setActiveShapeTab] = useState<'stroke' | 'transform' | 'layers'>('stroke');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!doc) return null;
  const currentPage = doc.pages[currentPageIndex];
  if (!currentPage) return null;

  const selectedObject = currentPage.objects.find((o) => selectedIds.includes(o.id));
  const isText = selectedObject?.type === 'text';
  const isImage = selectedObject?.type === 'image';
  const isShape = selectedObject?.type === 'shape';

  const textObj = isText ? (selectedObject as TextObject) : null;
  const imgObj = isImage ? (selectedObject as ImageObject) : null;
  const shapeObj = isShape ? (selectedObject as ShapeObject) : null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 select-none ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Container with lucid dark glassmorphism */}
      <div className="bg-[#0c121e]/95 dark:bg-[#0c121e]/95 bg-white/95 backdrop-blur-xl border-t border-neutral-200 dark:border-cyan-500/20 shadow-[0_-10px_35px_rgba(0,0,0,0.35)] text-neutral-800 dark:text-neutral-200">
        {/* Sleek Collapse / Expand Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-neutral-200 dark:border-neutral-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 dark:shadow-[0_0_8px_#22d3ee] animate-pulse" />
            {textObj && <span>Text Inspector · Slider Studio</span>}
            {imgObj && <span>Image Controls · Slider Studio</span>}
            {shapeObj && <span>Shape Controls · Slider Studio</span>}
            {!selectedObject && <span>Studio Navigator & Quick Tools</span>}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Context Summary */}
            {selectedObject && (
              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                {selectedObject.name || selectedObject.type}
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              title={isCollapsed ? 'Expand Dock' : 'Minimize Dock'}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* --- CONTEXT MODE A: TEXT OBJECT SELECTED --- */}
        {textObj && (
          <div className="p-3 max-w-5xl mx-auto space-y-3">
            {/* Horizontal Slider Tabs (Left-to-Right swipeable) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs border-b border-neutral-200 dark:border-neutral-800/60">
              <button
                onClick={() => setActiveTab('font')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'font'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-white'
                }`}
              >
                Font & Size
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'style'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-white'
                }`}
              >
                Styling & Color
              </button>
              <button
                onClick={() => setActiveTab('align')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'align'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-white'
                }`}
              >
                Alignment & Spacing
              </button>
              <button
                onClick={() => setActiveTab('transform')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'transform'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-white'
                }`}
              >
                Transform & Layers
              </button>
            </div>

            {/* TAB CONTENT 1: FONT & SIZE SLIDERS */}
            {activeTab === 'font' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Font Family */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    Font Family
                  </label>
                  <select
                    value={textObj.fontFamily}
                    onChange={(e) => updateObject(textObj.id, { fontFamily: e.target.value })}
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value} className="bg-neutral-900 text-white">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size Dynamic Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Font Size</span>
                    <span className="font-mono text-cyan-400 font-semibold">{Math.round(textObj.fontSize)} px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateObject(textObj.id, { fontSize: Math.max(6, textObj.fontSize - 1) })}
                      className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={Math.round(textObj.fontSize)}
                      onChange={(e) => updateObject(textObj.id, { fontSize: parseInt(e.target.value, 10) })}
                      className="lucid-slider flex-1"
                    />
                    <button
                      onClick={() => updateObject(textObj.id, { fontSize: Math.min(120, textObj.fontSize + 1) })}
                      className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Line Height Dynamic Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Line Height</span>
                    <span className="font-mono text-cyan-400 font-semibold">{textObj.lineHeight.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="2.5"
                    step="0.1"
                    value={textObj.lineHeight}
                    onChange={(e) => updateObject(textObj.id, { lineHeight: parseFloat(e.target.value) })}
                    className="lucid-slider w-full"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: STYLING & COLOR */}
            {activeTab === 'style' && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Bold, Italic, Underline, Strikethrough Buttons */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg">
                  <button
                    onClick={() =>
                      updateObject(textObj.id, {
                        fontWeight: textObj.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                    className={`p-2 rounded-md transition-colors ${
                      textObj.fontWeight === 'bold'
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      updateObject(textObj.id, {
                        fontStyle: textObj.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`p-2 rounded-md transition-colors ${
                      textObj.fontStyle === 'italic'
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateObject(textObj.id, { underline: !textObj.underline })}
                    className={`p-2 rounded-md transition-colors ${
                      textObj.underline
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                    }`}
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateObject(textObj.id, { strikethrough: !textObj.strikethrough })}
                    className={`p-2 rounded-md transition-colors ${
                      textObj.strikethrough
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                    }`}
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                </div>

                {/* Lucid Glowing Color Swatches */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {LUCID_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => updateObject(textObj.id, { color: c.hex })}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        textObj.color === c.hex
                          ? 'border-cyan-400 ring-2 ring-cyan-500/60 scale-110 shadow-[0_0_10px_#22d3ee]'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  {/* Custom color input */}
                  <label className="relative cursor-pointer ml-1">
                    <input
                      type="color"
                      value={textObj.color}
                      onChange={(e) => updateObject(textObj.id, { color: e.target.value })}
                      className="sr-only"
                    />
                    <div className="w-6 h-6 rounded-full border border-dashed border-cyan-400 flex items-center justify-center text-cyan-400 hover:scale-105 shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                      <Palette className="w-3 h-3" />
                    </div>
                  </label>
                </div>

                {/* Redact Background Toggle */}
                <button
                  onClick={() => updateObject(textObj.id, { redactBackground: !textObj.redactBackground })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    textObj.redactBackground
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Redact Underlying PDF</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT 3: ALIGNMENT & SPACING */}
            {activeTab === 'align' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Alignment */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg w-fit">
                  {(['left', 'center', 'right', 'justify'] as const).map((al) => (
                    <button
                      key={al}
                      onClick={() => updateObject(textObj.id, { alignment: al })}
                      className={`p-2 rounded-md capitalize transition-colors ${
                        textObj.alignment === al
                          ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                      }`}
                      title={`Align ${al}`}
                    >
                      {al === 'left' && <AlignLeft className="w-4 h-4" />}
                      {al === 'center' && <AlignCenter className="w-4 h-4" />}
                      {al === 'right' && <AlignRight className="w-4 h-4" />}
                      {al === 'justify' && <AlignJustify className="w-4 h-4" />}
                    </button>
                  ))}
                </div>

                {/* Letter Spacing Dynamic Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Letter Spacing</span>
                    <span className="font-mono text-cyan-400 font-semibold">{textObj.letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="10"
                    step="0.5"
                    value={textObj.letterSpacing}
                    onChange={(e) => updateObject(textObj.id, { letterSpacing: parseFloat(e.target.value) })}
                    className="lucid-slider w-full"
                  />
                </div>

                {/* Opacity Dynamic Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Opacity</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {Math.round(textObj.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(textObj.opacity * 100)}
                    onChange={(e) =>
                      updateObject(textObj.id, { opacity: parseInt(e.target.value, 10) / 100 })
                    }
                    className="lucid-slider w-full"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: TRANSFORM & LAYERS */}
            {activeTab === 'transform' && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Rotation Slider */}
                <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Rotation Angle</span>
                    <span className="font-mono text-cyan-400 font-semibold">{textObj.rotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={textObj.rotation}
                      onChange={(e) => updateObject(textObj.id, { rotation: parseInt(e.target.value, 10) })}
                      className="lucid-slider flex-1"
                    />
                    <button
                      onClick={() => updateObject(textObj.id, { rotation: 0 })}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-400 hover:text-white"
                    >
                      Reset 0°
                    </button>
                  </div>
                </div>

                {/* Layer Ordering Buttons */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg">
                  <button
                    onClick={bringForward}
                    className="p-2 hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                    title="Bring Forward"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sendBackward}
                    className="p-2 hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                    title="Send Backward"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={bringToFront}
                    className="px-2 py-1 text-xs hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                  >
                    To Front
                  </button>
                  <button
                    onClick={sendToBack}
                    className="px-2 py-1 text-xs hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                  >
                    To Back
                  </button>
                </div>

                {/* Duplicate & Delete Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={duplicateSelected}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-300"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-medium text-red-400 border border-red-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- CONTEXT MODE B: IMAGE OBJECT SELECTED --- */}
        {imgObj && (
          <div className="p-3 max-w-5xl mx-auto space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs border-b border-neutral-200 dark:border-neutral-800/60">
              <button
                onClick={() => setActiveImageTab('adjust')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeImageTab === 'adjust'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-white'
                }`}
              >
                Adjustments
              </button>
              <button
                onClick={() => setActiveImageTab('transform')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeImageTab === 'transform'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-white'
                }`}
              >
                Transforms & Angle
              </button>
              <button
                onClick={() => setActiveImageTab('layers')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeImageTab === 'layers'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-white'
                }`}
              >
                Layers & Actions
              </button>
            </div>

            {activeImageTab === 'adjust' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Opacity Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 font-medium">Image Opacity</span>
                    <span className="font-mono text-cyan-400 font-semibold">{Math.round(imgObj.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(imgObj.opacity * 100)}
                    onChange={(e) => updateObject(imgObj.id, { opacity: parseInt(e.target.value, 10) / 100 })}
                    className="lucid-slider w-full"
                  />
                </div>

                {/* Border Width Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 font-medium">Border Width</span>
                    <span className="font-mono text-cyan-400 font-semibold">{imgObj.borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={imgObj.borderWidth}
                    onChange={(e) => updateObject(imgObj.id, { borderWidth: parseInt(e.target.value, 10) })}
                    className="lucid-slider w-full"
                  />
                </div>

                {/* Corner Radius Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 font-medium">Corner Radius</span>
                    <span className="font-mono text-cyan-400 font-semibold">{imgObj.borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={imgObj.borderRadius}
                    onChange={(e) => updateObject(imgObj.id, { borderRadius: parseInt(e.target.value, 10) })}
                    className="lucid-slider w-full"
                  />
                </div>
              </div>
            )}

            {activeImageTab === 'transform' && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Rotation Slider */}
                <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 font-medium">Rotation Angle</span>
                    <span className="font-mono text-cyan-400 font-semibold">{imgObj.rotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={imgObj.rotation}
                      onChange={(e) => updateObject(imgObj.id, { rotation: parseInt(e.target.value, 10) })}
                      className="lucid-slider flex-1"
                    />
                    <button
                      onClick={() => updateObject(imgObj.id, { rotation: 0 })}
                      className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 hover:text-white"
                    >
                      Reset 0°
                    </button>
                  </div>
                </div>

                {/* Flip Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateObject(imgObj.id, { flipX: !imgObj.flipX })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      imgObj.flipX
                        ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                        : 'border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Flip Horizontal</span>
                  </button>
                  <button
                    onClick={() => updateObject(imgObj.id, { flipY: !imgObj.flipY })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      imgObj.flipY
                        ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                        : 'border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span>Flip Vertical</span>
                  </button>
                </div>
              </div>
            )}

            {activeImageTab === 'layers' && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-lg">
                  <button
                    onClick={bringForward}
                    className="p-2 hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                    title="Bring Forward"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sendBackward}
                    className="p-2 hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                    title="Send Backward"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={bringToFront}
                    className="px-2.5 py-1 text-xs hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                  >
                    To Front
                  </button>
                  <button
                    onClick={sendToBack}
                    className="px-2.5 py-1 text-xs hover:bg-neutral-700/60 rounded text-neutral-400 hover:text-white"
                  >
                    To Back
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={duplicateSelected}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-medium text-red-400 border border-red-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Image</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- CONTEXT MODE C: SHAPE / OTHER OBJECT SELECTED --- */}
        {shapeObj && (
          <div className="p-3 max-w-5xl mx-auto space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Stroke Width Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium">Stroke Width</span>
                  <span className="font-mono text-cyan-400 font-semibold">{shapeObj.strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="32"
                  value={shapeObj.strokeWidth}
                  onChange={(e) => updateObject(shapeObj.id, { strokeWidth: parseInt(e.target.value, 10) })}
                  className="lucid-slider w-full"
                />
              </div>

              {/* Opacity Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium">Shape Opacity</span>
                  <span className="font-mono text-cyan-400 font-semibold">{Math.round(shapeObj.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={Math.round(shapeObj.opacity * 100)}
                  onChange={(e) => updateObject(shapeObj.id, { opacity: parseInt(e.target.value, 10) / 100 })}
                  className="lucid-slider w-full"
                />
              </div>

              {/* Rotation Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-medium">Rotation Angle</span>
                  <span className="font-mono text-cyan-400 font-semibold">{shapeObj.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={shapeObj.rotation}
                  onChange={(e) => updateObject(shapeObj.id, { rotation: parseInt(e.target.value, 10) })}
                  className="lucid-slider w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] text-neutral-400 mr-1">Stroke Color:</span>
                {LUCID_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => updateObject(shapeObj.id, { strokeColor: c.hex })}
                    className={`w-5 h-5 rounded-full border ${
                      shapeObj.strokeColor === c.hex ? 'ring-2 ring-cyan-400 scale-110' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={duplicateSelected}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 text-xs text-neutral-300"
                >
                  <Copy className="w-3 h-3 text-blue-400" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/20 text-xs text-red-400 border border-red-500/30"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CONTEXT MODE D: DEFAULT / NOTHING SELECTED --- */}
        {!selectedObject && (
          <div className="p-3 max-w-5xl mx-auto space-y-3">
            {/* 1. Page Scrubber Slider (Swipe left to right to change pages smoothly) */}
            <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800/60 px-3 py-2 rounded-xl">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-400 hover:text-white"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs font-mono font-medium text-cyan-400 whitespace-nowrap">
                  Page {currentPageIndex + 1} / {doc.pages.length}
                </span>
                <input
                  type="range"
                  min="0"
                  max={doc.pages.length - 1}
                  value={currentPageIndex}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                  className="lucid-slider flex-1"
                />
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(doc.pages.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex >= doc.pages.length - 1}
                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-400 hover:text-white"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Lucid Glowing Quick Tools Slider Strip */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center gap-1.5 flex-nowrap">
                {/* Select Tool */}
                <button
                  onClick={() => setTool('select')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentTool === 'select'
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-1 ring-blue-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-white'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5 lucid-icon-glow" />
                  <span>Select</span>
                </button>

                {/* Hand Pan Tool */}
                <button
                  onClick={() => setTool('hand')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentTool === 'hand'
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-1 ring-blue-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-white'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Pan</span>
                </button>

                {/* Text Tool */}
                <button
                  onClick={() => setTool('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentTool === 'text'
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-1 ring-blue-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5 lucid-icon-glow" />
                  <span>Text</span>
                </button>

                {/* Draw Tool */}
                <button
                  onClick={() => setTool('draw')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentTool === 'draw'
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-1 ring-blue-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-white'
                  }`}
                >
                  <Pen className="w-3.5 h-3.5" />
                  <span>Pen</span>
                </button>

                {/* Highlight Tool */}
                <button
                  onClick={() => setTool('highlight')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentTool === 'highlight'
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-1 ring-blue-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-white'
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5 lucid-icon-glow-amber" />
                  <span>Highlight</span>
                </button>

                {/* Signature Tool */}
                <button
                  onClick={() => setModalOpen('signature', true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-white hover:bg-neutral-700 transition-all"
                >
                  <PenTool className="w-3.5 h-3.5 lucid-icon-glow-purple" />
                  <span>Sign</span>
                </button>
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-2 min-w-[160px] pl-3 border-l border-neutral-300 dark:border-neutral-800">
                <ZoomOut
                  onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
                  className="w-3.5 h-3.5 text-neutral-400 hover:text-white cursor-pointer"
                />
                <input
                  type="range"
                  min="30"
                  max="250"
                  value={Math.round(zoom * 100)}
                  onChange={(e) => setZoom(parseInt(e.target.value, 10) / 100)}
                  className="lucid-slider flex-1"
                />
                <ZoomIn
                  onClick={() => setZoom(Math.min(3.0, zoom + 0.1))}
                  className="w-3.5 h-3.5 text-neutral-400 hover:text-white cursor-pointer"
                />
                <span className="text-[11px] font-mono text-cyan-400 w-9 text-right font-medium">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
