import React, { useState } from 'react';
import {
  Sliders,
  Layers,
  MessageSquare,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  FlipHorizontal,
  FlipVertical,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import {
  TextObject,
  ImageObject,
  ShapeObject,
  FormFieldObject,
  StampObject,
  AnnotationObject,
  TableObject,
} from '../types/pdf';

export const PropertyPanel: React.FC = () => {
  const {
    doc,
    currentPageIndex,
    selectedIds,
    updateObject,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    alignSelected,
    selectObject,
    isMobileInspectorOpen,
    setMobileInspectorOpen,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<'properties' | 'layers' | 'comments'>('properties');
  const [collapsed, setCollapsed] = useState(false);

  if (!doc) return null;
  const currentPage = doc.pages[currentPageIndex];
  if (!currentPage) return null;

  const selectedObject = currentPage.objects.find((o) => selectedIds.includes(o.id));

  const renderPanelContent = (isMobile = false) => (
    <>
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-2 py-1.5">
        <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-neutral-800 p-0.5 rounded-md text-xs">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors ${
              activeTab === 'properties'
                ? 'bg-white dark:bg-neutral-700 shadow-xs text-blue-600 dark:text-blue-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors ${
              activeTab === 'layers'
                ? 'bg-white dark:bg-neutral-700 shadow-xs text-blue-600 dark:text-blue-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Layers</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors ${
              activeTab === 'comments'
                ? 'bg-white dark:bg-neutral-700 shadow-xs text-blue-600 dark:text-blue-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Notes</span>
          </button>
        </div>

        {isMobile ? (
          <button
            onClick={() => setMobileInspectorOpen(false)}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500 ml-auto"
            title={collapsed ? 'Expand Inspector' : 'Collapse Inspector'}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
          {/* TAB 1: PROPERTIES INSPECTOR */}
          {activeTab === 'properties' && (
            <>
              {selectedObject ? (
                <div className="space-y-4">
                  {/* Object Type & Name */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <span className="font-semibold capitalize text-neutral-700 dark:text-neutral-200">
                      {selectedObject.name || selectedObject.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateObject(selectedObject.id, { locked: !selectedObject.locked })
                        }
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
                        title={selectedObject.locked ? 'Unlock Object' : 'Lock Object'}
                      >
                        {selectedObject.locked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          updateObject(selectedObject.id, { visible: !selectedObject.visible })
                        }
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
                        title="Toggle Visibility"
                      >
                        {selectedObject.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </button>
                      <button
                        onClick={duplicateSelected}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
                        title="Duplicate (Ctrl+D)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={deleteSelected}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-red-500"
                        title="Delete Object"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Position & Dimensions */}
                  <div className="space-y-2">
                    <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">
                      Transform
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1">
                        <span className="text-neutral-400 font-mono text-[10px]">X</span>
                        <input
                          type="number"
                          value={Math.round(selectedObject.x)}
                          onChange={(e) =>
                            updateObject(selectedObject.id, { x: Number(e.target.value) })
                          }
                          className="w-full bg-transparent outline-none font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1">
                        <span className="text-neutral-400 font-mono text-[10px]">Y</span>
                        <input
                          type="number"
                          value={Math.round(selectedObject.y)}
                          onChange={(e) =>
                            updateObject(selectedObject.id, { y: Number(e.target.value) })
                          }
                          className="w-full bg-transparent outline-none font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1">
                        <span className="text-neutral-400 font-mono text-[10px]">W</span>
                        <input
                          type="number"
                          value={Math.round(selectedObject.width)}
                          onChange={(e) =>
                            updateObject(selectedObject.id, {
                              width: Math.max(5, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-transparent outline-none font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1">
                        <span className="text-neutral-400 font-mono text-[10px]">H</span>
                        <input
                          type="number"
                          value={Math.round(selectedObject.height)}
                          onChange={(e) =>
                            updateObject(selectedObject.id, {
                              height: Math.max(5, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-transparent outline-none font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Rotation & Opacity */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-400">Rotation</span>
                        <input
                          type="number"
                          value={selectedObject.rotation || 0}
                          onChange={(e) =>
                            updateObject(selectedObject.id, { rotation: Number(e.target.value) })
                          }
                          className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 font-mono text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-400">Opacity ({Math.round(selectedObject.opacity * 100)}%)</span>
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={selectedObject.opacity}
                          onChange={(e) =>
                            updateObject(selectedObject.id, { opacity: parseFloat(e.target.value) })
                          }
                          className="w-full h-4 cursor-pointer mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alignment Tools */}
                  <div className="space-y-2">
                    <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">
                      Align to Canvas
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-1">
                      <button
                        onClick={() =>
                          updateObject(selectedObject.id, { x: 36 })
                        }
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-center text-[10px]"
                      >
                        Left Margin
                      </button>
                      <button
                        onClick={() =>
                          updateObject(selectedObject.id, {
                            x: Math.round(currentPage.width / 2 - selectedObject.width / 2),
                          })
                        }
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-center text-[10px]"
                      >
                        Center X
                      </button>
                      <button
                        onClick={() =>
                          updateObject(selectedObject.id, {
                            x: Math.round(currentPage.width - 36 - selectedObject.width),
                          })
                        }
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-center text-[10px]"
                      >
                        Right Margin
                      </button>
                    </div>
                  </div>

                  {/* Layer Z-Index Actions */}
                  <div className="space-y-2">
                    <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">
                      Layer Stacking
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={bringForward}
                        className="flex items-center justify-center gap-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded py-1 px-2"
                      >
                        <ArrowUp className="w-3 h-3" /> Bring Forward
                      </button>
                      <button
                        onClick={sendBackward}
                        className="flex items-center justify-center gap-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded py-1 px-2"
                      >
                        <ArrowDown className="w-3 h-3" /> Send Backward
                      </button>
                    </div>
                  </div>

                  {/* SPECIFIC PROPERTIES BY TYPE */}
                  {/* TEXT PROPERTIES */}
                  {selectedObject.type === 'text' && (
                    <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">
                        Typography
                      </span>

                      {/* Font size & color */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400">Size</span>
                          <input
                            type="number"
                            value={(selectedObject as TextObject).fontSize}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                fontSize: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 font-mono outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400">Color</span>
                          <input
                            type="color"
                            value={(selectedObject as TextObject).color}
                            onChange={(e) =>
                              updateObject(selectedObject.id, { color: e.target.value })
                            }
                            className="w-full h-7 rounded border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Redact background toggle */}
                      <label className="flex items-center gap-2 cursor-pointer bg-neutral-100 dark:bg-neutral-800/80 p-2 rounded border border-neutral-200 dark:border-neutral-700">
                        <input
                          type="checkbox"
                          checked={Boolean((selectedObject as TextObject).redactBackground)}
                          onChange={(e) =>
                            updateObject(selectedObject.id, {
                              redactBackground: e.target.checked,
                            })
                          }
                          className="rounded text-blue-600 w-3.5 h-3.5"
                        />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-500" /> Cover Original PDF Text
                          </span>
                          <span className="text-[9px] text-neutral-400">
                            Draws white opaque background mask underneath
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* IMAGE PROPERTIES */}
                  {selectedObject.type === 'image' && (
                    <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">
                        Image Adjustments
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            updateObject(selectedObject.id, {
                              flipX: !(selectedObject as ImageObject).flipX,
                            })
                          }
                          className="flex items-center justify-center gap-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded py-1"
                        >
                          <FlipHorizontal className="w-3 h-3" /> Flip X
                        </button>
                        <button
                          onClick={() =>
                            updateObject(selectedObject.id, {
                              flipY: !(selectedObject as ImageObject).flipY,
                            })
                          }
                          className="flex items-center justify-center gap-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded py-1"
                        >
                          <FlipVertical className="w-3 h-3" /> Flip Y
                        </button>
                      </div>

                      {/* Border & Corner Radius */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400">Border Radius</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={(selectedObject as ImageObject).borderRadius || 0}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                borderRadius: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400">Border Width</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={(selectedObject as ImageObject).borderWidth || 0}
                            onChange={(e) =>
                              updateObject(selectedObject.id, {
                                borderWidth: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SHAPE PROPERTIES */}
                  {selectedObject.type === 'shape' && (
                    <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">
                        Shape Style
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400">Fill Color</span>
                          <input
                            type="color"
                            value={(selectedObject as ShapeObject).fillColor || '#ffffff'}
                            onChange={(e) =>
                              updateObject(selectedObject.id, { fillColor: e.target.value })
                            }
                            className="w-full h-7 rounded border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-400">Stroke Color</span>
                          <input
                            type="color"
                            value={(selectedObject as ShapeObject).strokeColor}
                            onChange={(e) =>
                              updateObject(selectedObject.id, { strokeColor: e.target.value })
                            }
                            className="w-full h-7 rounded border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400 space-y-2">
                  <Sliders className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs">No object selected</p>
                  <p className="text-[10px]">
                    Click any text, image, or shape on the canvas to inspect and edit its properties.
                  </p>
                </div>
              )}
            </>
          )}

          {/* TAB 2: LAYERS LIST */}
          {activeTab === 'layers' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Page {currentPageIndex + 1} Objects ({currentPage.objects.length})
                </span>
              </div>

              {currentPage.objects.length === 0 ? (
                <p className="text-neutral-400 text-center py-8 text-[11px]">
                  No editable objects on this page yet. Add text, shapes, or images.
                </p>
              ) : (
                <div className="space-y-1">
                  {[...currentPage.objects]
                    .reverse()
                    .map((obj) => {
                      const isSelected = selectedIds.includes(obj.id);
                      return (
                        <div
                          key={obj.id}
                          onClick={() => selectObject(obj.id, false)}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <span className="truncate max-w-[140px] text-xs">
                            {obj.name || obj.type}
                          </span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => updateObject(obj.id, { visible: !obj.visible })}
                              className="p-0.5 hover:text-blue-500 text-neutral-400"
                            >
                              {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => updateObject(obj.id, { locked: !obj.locked })}
                              className="p-0.5 hover:text-blue-500 text-neutral-400"
                            >
                              {obj.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMENTS & NOTES */}
          {activeTab === 'comments' && (
            <div className="space-y-2">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Document Comments & Notes
              </span>
              {doc.pages.flatMap((p) => p.objects.filter((o) => o.type === 'annotation' && (o as AnnotationObject).annotationType === 'sticky')).length === 0 ? (
                <p className="text-neutral-400 text-center py-8 text-[11px]">
                  No comments yet. Click the "Note" tool to pin a sticky comment.
                </p>
              ) : (
                <div className="space-y-2">
                  {doc.pages.flatMap((p, pIdx) =>
                    p.objects
                      .filter((o) => o.type === 'annotation' && (o as AnnotationObject).annotationType === 'sticky')
                      .map((note) => (
                        <div
                          key={note.id}
                          onClick={() => {
                            useEditorStore.getState().setCurrentPage(pIdx);
                            selectObject(note.id);
                          }}
                          className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md cursor-pointer hover:shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                            <span>Page {pIdx + 1}</span>
                            <span>{(note as AnnotationObject).commentDate}</span>
                          </div>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 line-clamp-2">
                            {(note as AnnotationObject).text || 'Empty comment'}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Docked Sidebar */}
      <div
        className={`hidden lg:flex bg-neutral-50 dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex-col transition-all duration-200 select-none z-20 shrink-0 ${
          collapsed ? 'w-10' : 'w-64 sm:w-72'
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center py-2 h-full">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500"
              title="Expand Inspector"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          renderPanelContent(false)
        )}
      </div>

      {/* 2. Mobile & Tablet Slide-Over Sheet / Drawer */}
      {isMobileInspectorOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileInspectorOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-80 max-w-[90vw] h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {renderPanelContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
