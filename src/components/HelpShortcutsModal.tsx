import React from 'react';
import { X, Keyboard, ShieldCheck } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';

export const HelpShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setModalOpen } = useEditorStore();

  if (!isShortcutsModalOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + O', action: 'Open PDF file from your device' },
    { key: 'Ctrl + S', action: 'Download / Export PDF' },
    { key: 'Ctrl + Z', action: 'Undo last edit' },
    { key: 'Ctrl + Y / Ctrl + Shift + Z', action: 'Redo last edit' },
    { key: 'Ctrl + C', action: 'Copy selected object(s)' },
    { key: 'Ctrl + V', action: 'Paste clipboard object(s)' },
    { key: 'Ctrl + D', action: 'Duplicate selected object(s)' },
    { key: 'Delete / Backspace', action: 'Delete selected object(s)' },
    { key: 'Ctrl + F', action: 'Open Find & Replace bar' },
    { key: 'Ctrl + A', action: 'Select all objects on current page' },
    { key: 'Arrow Keys', action: 'Nudge object by 1 pt' },
    { key: 'Shift + Arrow Keys', action: 'Nudge object by 10 pt' },
    { key: 'Shift + Resize Handle', action: 'Lock aspect ratio while resizing' },
    { key: 'Double Click Original Text', action: 'Convert static PDF text into editable box' },
    { key: 'Esc', action: 'Deselect / Cancel active action' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Keyboard Shortcuts & Tips
              </h3>
              <p className="text-[11px] text-neutral-500">
                Desktop-grade productivity shortcuts for PDFForge
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen('shortcuts', false)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2 text-xs">
          <div className="space-y-1.5">
            {shortcuts.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              >
                <span className="text-neutral-600 dark:text-neutral-300">{s.action}</span>
                <kbd className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-[11px] font-mono text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-start gap-2 text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-[11px]">
              <span className="font-semibold block">Privacy First Architecture</span>
              <span>
                Your documents are never uploaded to our servers for editing. All parsing, inline
                text editing, image placement, and PDF rendering happen 100% locally in your
                browser.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setModalOpen('shortcuts', false)}
            className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md font-medium text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
