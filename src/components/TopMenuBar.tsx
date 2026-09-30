import React, { useState, useRef } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  Printer,
  Undo2,
  Redo2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FilePlus,
  Type,
  Image,
  Square,
  PenTool,
  Bookmark,
  Sparkles,
  HelpCircle,
  Moon,
  Sun,
  ShieldCheck,
  Cloud,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  FileCode,
  LayoutGrid,
  Menu,
  X,
} from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { exportDocumentToPdf, downloadPdf } from '../pdf/pdfExporter';
import { SAMPLE_TEMPLATES } from '../pdf/samplePdfs';

export const TopMenuBar: React.FC = () => {
  const {
    doc,
    undo,
    redo,
    historyIndex,
    history,
    theme,
    toggleTheme,
    zoom,
    setZoom,
    setTool,
    setShape,
    showGrid,
    toggleGrid,
    showRulers,
    toggleRulers,
    setSearchOpen,
    setModalOpen,
    loadBlankDocument,
    loadPdfFromData,
  } = useEditorStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [docTitle, setDocTitle] = useState(doc?.title || 'Untitled Document');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync doc title when doc changes
  React.useEffect(() => {
    if (doc?.title) setDocTitle(doc.title);
  }, [doc?.title]);

  const handleOpenLocalPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const bytes = new Uint8Array(ev.target?.result as ArrayBuffer);
      loadPdfFromData(bytes, file.name);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
    setActiveMenu(null);
  };

  const handleExport = () => {
    setModalOpen('export', true);
    setActiveMenu(null);
  };

  const handlePrint = async () => {
    if (!doc) return;
    try {
      const bytes = await exportDocumentToPdf(doc);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 60000);
      };
    } catch (err) {
      console.error('Print failed:', err);
    }
    setActiveMenu(null);
  };

  return (
    <div
      className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 select-none z-40 relative text-xs"
      onClick={() => setActiveMenu(null)}
    >
      {/* Hidden file input for opening PDFs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleOpenLocalPdf}
        accept="application/pdf"
        className="hidden"
      />

      <div className="flex items-center justify-between px-3 py-1.5 h-11">
        {/* Brand & Desktop Menus */}
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-blue-600 dark:text-blue-400 mr-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md flex items-center justify-center text-white shadow-xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span>PDFForge</span>
            <span className="text-[9px] font-mono uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded font-semibold">
              Pro
            </span>
          </div>

          {/* Desktop Menus (hidden on mobile/tablet to avoid overflow) */}
          <div className="hidden lg:flex items-center space-x-0.5" onClick={(e) => e.stopPropagation()}>
            {/* FILE MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium ${
                  activeMenu === 'file' ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                }`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      loadBlankDocument();
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-neutral-500" />
                    <span>New Blank Document</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5 text-neutral-500" /> Open PDF...
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl+O</span>
                  </button>

                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                  {/* Sample PDFs submenu */}
                  <div className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase">
                    Starter Templates
                  </div>
                  {SAMPLE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={async () => {
                        const bytes = await tmpl.generate();
                        loadPdfFromData(bytes, `${tmpl.name}.pdf`);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[11px]"
                    >
                      {tmpl.name}
                    </button>
                  ))}

                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                  <button
                    onClick={() => handleExport()}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium text-blue-600 dark:text-blue-400"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Export & Download PDF...
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl+S</span>
                  </button>
                  <button
                    onClick={() => handleExport()}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Save className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Export Flattened PDF...</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span className="flex items-center gap-2">
                      <Printer className="w-3.5 h-3.5 text-neutral-500" /> Print
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl+P</span>
                  </button>

                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                  <button
                    onClick={() => {
                      setModalOpen('extraction', true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <FileCode className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Document Properties & Metadata</span>
                  </button>
                </div>
              )}
            </div>

            {/* EDIT MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium ${
                  activeMenu === 'edit' ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                }`}
              >
                Edit
              </button>
              {activeMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50">
                  <button
                    onClick={() => {
                      undo();
                      setActiveMenu(null);
                    }}
                    disabled={historyIndex <= 0}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40"
                  >
                    <span className="flex items-center gap-2">
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl+Z</span>
                  </button>
                  <button
                    onClick={() => {
                      redo();
                      setActiveMenu(null);
                    }}
                    disabled={historyIndex >= history.length - 1}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40"
                  >
                    <span className="flex items-center gap-2">
                      <Redo2 className="w-3.5 h-3.5" /> Redo
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl+Y</span>
                  </button>

                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                  <button
                    onClick={() => {
                      setSearchOpen(true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" /> Find & Replace
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl+F</span>
                  </button>
                </div>
              )}
            </div>

            {/* VIEW MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium ${
                  activeMenu === 'view' ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                }`}
              >
                View
              </button>
              {activeMenu === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50">
                  <button
                    onClick={() => {
                      setZoom(zoom + 0.15);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span className="flex items-center gap-2">
                      <ZoomIn className="w-3.5 h-3.5" /> Zoom In
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl +</span>
                  </button>
                  <button
                    onClick={() => {
                      setZoom(zoom - 0.15);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span className="flex items-center gap-2">
                      <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
                    </span>
                    <span className="text-[10px] text-neutral-400">Ctrl -</span>
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1.0);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span>Actual Size (100%)</span>
                    <span className="text-[10px] text-neutral-400">Ctrl 0</span>
                  </button>

                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                  <button
                    onClick={() => {
                      toggleGrid();
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span>Show Grid</span>
                    {showGrid && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                  <button
                    onClick={() => {
                      toggleRulers();
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span>Show Alignment Guides</span>
                    {showRulers && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                </div>
              )}
            </div>

            {/* INSERT MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium ${
                  activeMenu === 'insert' ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                }`}
              >
                Insert
              </button>
              {activeMenu === 'insert' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50">
                  <button
                    onClick={() => {
                      setTool('text');
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Type className="w-3.5 h-3.5" /> Text Box
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('signature', true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Digital Signature...
                  </button>
                  <button
                    onClick={() => {
                      setTool('shape');
                      setShape('rectangle');
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Square className="w-3.5 h-3.5" /> Shapes (Rectangle, Circle, Arrow)
                  </button>
                  <button
                    onClick={() => {
                      setTool('sticky_note');
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Sticky Note Comment
                  </button>
                  <button
                    onClick={() => {
                      setTool('table');
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Table
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('forms', true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Layers className="w-3.5 h-3.5" /> Interactive Form Fields...
                  </button>
                </div>
              )}
            </div>

            {/* TOOLS & OCR MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium ${
                  activeMenu === 'tools' ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                }`}
              >
                Tools
              </button>
              {activeMenu === 'tools' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50">
                  <button
                    onClick={() => {
                      setModalOpen('ocr', true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-blue-600 dark:text-blue-400 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run OCR (Text Recognition)</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('pageManager', true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Page Manager (Merge / Split)</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('extraction', true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Image className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Extract Images & Text</span>
                  </button>
                </div>
              )}
            </div>

            {/* HELP MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium ${
                  activeMenu === 'help' ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                }`}
              >
                Help
              </button>
              {activeMenu === 'help' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl py-1 z-50">
                  <button
                    onClick={() => {
                      setModalOpen('shortcuts', true);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5" /> Keyboard Shortcuts
                    </span>
                    <span className="text-[10px] text-neutral-400">?</span>
                  </button>
                  <div className="px-3 py-2 text-[10px] text-neutral-500 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                      PDFForge Desktop v2.0
                    </p>
                    <p className="mt-0.5">Local-first browser PDF editor</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Inline Document Title (Responsive truncated) */}
        <div className="flex items-center gap-1.5 max-w-[120px] sm:max-w-xs md:max-w-sm truncate mx-1">
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="text-center font-medium bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:bg-white dark:focus:bg-neutral-900 border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 text-xs truncate w-full outline-none"
            title="Click to rename document"
          />
          {/* Privacy badge */}
          <div
            className="hidden xl:flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 cursor-help whitespace-nowrap"
            title="Privacy First: Your document is processed locally on your machine."
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Local & Private</span>
          </div>
        </div>

        {/* Right Actions: Undo/Redo, Cloud/Export, Theme, Mobile Hamburger */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Undo / Redo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 hidden sm:flex"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Cloud Projects modal */}
          <button
            onClick={() => setModalOpen('cloud', true)}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
            title="Cloud Storage"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud</span>
          </button>

          {/* Primary Download / Export Button */}
          <button
            onClick={() => handleExport()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 sm:px-3 py-1 rounded-md shadow-xs transition-colors text-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export & Download</span>
            <span className="sm:hidden">Export</span>
          </button>

          {/* Mobile Menu Button (< 1024px) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(true);
            }}
            className="lg:hidden p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-600 dark:text-neutral-300 ml-0.5"
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Application Menu Drawer (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-blue-600 dark:text-blue-400">
                <FileText className="w-4 h-4" />
                <span>PDFForge Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-3 space-y-4 text-xs">
              {/* File Options */}
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 px-2">
                  Document
                </span>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      loadBlankDocument();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <FilePlus className="w-4 h-4 text-blue-500" />
                    <span>New Blank Document</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span>Open PDF from Device...</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExport();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left font-medium text-blue-600 dark:text-blue-400"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export & Download PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      handlePrint();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <Printer className="w-4 h-4 text-neutral-500" />
                    <span>Print Document</span>
                  </button>
                </div>
              </div>

              {/* Tools & Features */}
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 px-2">
                  Tools & Capabilities
                </span>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setModalOpen('pageManager', true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <LayoutGrid className="w-4 h-4 text-indigo-500" />
                    <span>Page Manager (Merge/Split)</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('ocr', true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>OCR Scanned Text</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('signature', true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <PenTool className="w-4 h-4 text-emerald-500" />
                    <span>Digital Signatures</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('forms', true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>Form Fields & Calculations</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('extraction', true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <Image className="w-4 h-4 text-amber-500" />
                    <span>Extract Images & Text</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen('cloud', true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                  >
                    <Cloud className="w-4 h-4 text-blue-500" />
                    <span>Cloud Storage & Versions</span>
                  </button>
                </div>
              </div>

              {/* Starter Templates */}
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 px-2">
                  Sample Templates
                </span>
                <div className="space-y-0.5">
                  {SAMPLE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={async () => {
                        const bytes = await tmpl.generate();
                        loadPdfFromData(bytes, `${tmpl.name}.pdf`);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left text-neutral-600 dark:text-neutral-400"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{tmpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                >
                  <span className="flex items-center gap-2.5">
                    {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>Theme: {theme === 'light' ? 'Light' : 'Dark'}</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Toggle</span>
                </button>
                <button
                  onClick={() => {
                    setModalOpen('shortcuts', true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left text-neutral-600 dark:text-neutral-400"
                >
                  <HelpCircle className="w-4 h-4 text-neutral-400" />
                  <span>Keyboard Shortcuts & Help</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
