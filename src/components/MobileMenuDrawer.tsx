import React from 'react';
import {
  FileText,
  FilePlus,
  FolderOpen,
  Download,
  Printer,
  Search,
  Layers,
  PenTool,
  Sparkles,
  CheckSquare,
  Cloud,
  HelpCircle,
  Moon,
  Sun,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { SAMPLE_TEMPLATES } from '../pdf/samplePdfs';

export const MobileMenuDrawer: React.FC = () => {
  const {
    isMobileMenuOpen,
    setMobileMenuOpen,
    loadBlankDocument,
    loadPdfFromData,
    setModalOpen,
    setSearchOpen,
    theme,
    toggleTheme,
  } = useEditorStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isMobileMenuOpen) return null;

  const handleOpenPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const bytes = new Uint8Array(ev.target?.result as ArrayBuffer);
      loadPdfFromData(bytes, file.name);
      setMobileMenuOpen(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Slide-in Drawer */}
      <div className="relative w-4/5 max-w-sm bg-[#0c121e] border-r border-cyan-500/20 text-neutral-100 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleOpenPdf}
          accept="application/pdf"
          className="hidden"
        />

        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-cyan-400">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <FileText className="w-4 h-4" />
            </div>
            <span>PDFForge Pro</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Document Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block px-2 mb-1">
              Document
            </span>
            <button
              onClick={() => {
                loadBlankDocument();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <FilePlus className="w-4 h-4 text-cyan-400 lucid-icon-glow" />
              <span>New Blank Document</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-cyan-400 lucid-icon-glow" />
              <span>Open PDF File...</span>
            </button>
            <button
              onClick={() => {
                setModalOpen('export', true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-medium text-left shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              <Download className="w-4 h-4 text-blue-400 lucid-icon-glow-blue" />
              <span>Export & Download PDF</span>
            </button>
          </div>

          {/* Tools & Features Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block px-2 mb-1">
              Studio Tools
            </span>
            <button
              onClick={() => {
                setSearchOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Find & Replace Text</span>
            </button>
            <button
              onClick={() => {
                setModalOpen('pageManager', true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Page Manager & Reorder</span>
            </button>
            <button
              onClick={() => {
                setModalOpen('signature', true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <PenTool className="w-4 h-4 text-purple-400 lucid-icon-glow-purple" />
              <span>Digital Signatures</span>
            </button>
            <button
              onClick={() => {
                setModalOpen('ocr', true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400 lucid-icon-glow-amber" />
              <span>OCR Text Recognition</span>
            </button>
            <button
              onClick={() => {
                setModalOpen('forms', true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <CheckSquare className="w-4 h-4 text-emerald-400 lucid-icon-glow-emerald" />
              <span>Form Fields & Checkboxes</span>
            </button>
            <button
              onClick={() => {
                setModalOpen('cloud', true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 text-left transition-colors"
            >
              <Cloud className="w-4 h-4 text-blue-400" />
              <span>Cloud Storage & Versions</span>
            </button>
          </div>

          {/* Starter Templates */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block px-2 mb-1">
              Sample Templates
            </span>
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={async () => {
                  const bytes = await tmpl.generate();
                  loadPdfFromData(bytes, `${tmpl.name}.pdf`);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-800/60 text-left text-neutral-300"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-500" />
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400 lucid-icon-glow-amber" />
                <span>Light Mode</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setModalOpen('shortcuts', true);
              setMobileMenuOpen(false);
            }}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
            title="Help & Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
