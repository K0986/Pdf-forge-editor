import React, { useRef, useState, useEffect } from 'react';
import { X, PenTool, Type, Upload, Trash2, Check, RotateCcw } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { SignatureObject } from '../types/pdf';

export const SignaturesModal: React.FC = () => {
  const {
    isSignatureModalOpen,
    setModalOpen,
    savedSignatures,
    saveSignature,
    deleteSignature,
    addObject,
    doc,
    currentPageIndex,
  } = useEditorStore();

  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('John Doe');
  const [selectedFont, setSelectedFont] = useState('Great Vibes, cursive');
  const [penColor, setPenColor] = useState('#0f172a');
  const [saveLocally, setSaveLocally] = useState(true);

  // Canvas ref for drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Uploaded image state
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = penColor;
      }
    }
  }, [tab, penColor]);

  if (!isSignatureModalOpen) return null;

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setHasDrawn(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !canvasRef.current) return;
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    lastPointRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPointRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const currentPoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = penColor;
    ctx.stroke();

    lastPointRef.current = currentPoint;
    setHasDrawn(true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1 || !canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    lastPointRef.current = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPointRef.current || e.touches.length !== 1) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const currentPoint = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = penColor;
    ctx.stroke();

    lastPointRef.current = currentPoint;
    setHasDrawn(true);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // Convert typed name to canvas data URL
  const generateTypedSignatureDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, 400, 120);
    ctx.font = `italic 42px ${selectedFont}`;
    ctx.fillStyle = penColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(typedName, 200, 60);

    return canvas.toDataURL('image/png');
  };

  const handleInsert = (signatureDataUrl?: string) => {
    let finalUrl = signatureDataUrl;

    if (!finalUrl) {
      if (tab === 'draw') {
        if (!canvasRef.current || !hasDrawn) return;
        finalUrl = canvasRef.current.toDataURL('image/png');
      } else if (tab === 'type') {
        finalUrl = generateTypedSignatureDataUrl();
      } else if (tab === 'upload') {
        if (!uploadedUrl) return;
        finalUrl = uploadedUrl;
      }
    }

    if (!finalUrl || !doc) return;

    const page = doc.pages[currentPageIndex];

    const sigObj: SignatureObject = {
      id: `sig-${Date.now()}`,
      type: 'signature',
      pageId: page.id,
      x: Math.round(page.width / 2 - 90),
      y: Math.round(page.height / 2 - 35),
      width: 180,
      height: 70,
      rotation: 0,
      opacity: 1,
      zIndex: page.objects.length + 1,
      locked: false,
      visible: true,
      name: 'Digital Signature',
      signatureType: tab,
      dataUrl: finalUrl,
      signerName: typedName,
      date: new Date().toLocaleDateString(),
    };

    addObject(sigObj);

    if (saveLocally && !signatureDataUrl) {
      saveSignature({
        id: `sig-${Date.now()}`,
        title: typedName || 'Signature',
        dataUrl: finalUrl,
        type: tab,
        createdAt: Date.now(),
      });
    }

    setModalOpen('signature', false);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Create Digital Signature
              </h3>
              <p className="text-[11px] text-neutral-500">
                Sign visually or choose from your saved signatures
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen('signature', false)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saved Signatures Bar */}
        {savedSignatures.length > 0 && (
          <div className="px-5 py-2.5 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
              Quick Pick Saved Signature:
            </span>
            <div className="flex items-center gap-2 mt-1.5 overflow-x-auto pb-1">
              {savedSignatures.map((sig) => (
                <div
                  key={sig.id}
                  onClick={() => handleInsert(sig.dataUrl)}
                  className="group relative flex-shrink-0 w-28 h-12 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-1 cursor-pointer hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-center"
                >
                  <img
                    src={sig.dataUrl}
                    alt="Saved Sig"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSignature(sig.id);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Saved Signature"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs: Draw, Type, Upload */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700 px-5 pt-3">
          <button
            onClick={() => setTab('draw')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors ${
              tab === 'draw'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setTab('type')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors ${
              tab === 'type'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type</span>
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors ${
              tab === 'upload'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4">
          {/* TAB 1: DRAW */}
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Sign with mouse, stylus, or touch:</span>
                <div className="flex items-center gap-2">
                  {/* Colors */}
                  <div className="flex items-center gap-1">
                    {['#0f172a', '#1e40af', '#b91c1c'].map((col) => (
                      <button
                        key={col}
                        onClick={() => setPenColor(col)}
                        className={`w-4 h-4 rounded-full border ${
                          penColor === col ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={clearCanvas}
                    className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>

              {/* Drawing Canvas */}
              <div className="border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white overflow-hidden shadow-inner relative">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  className="w-full h-36 cursor-crosshair touch-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-300 text-sm italic">
                    Draw your signature here...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TYPE */}
          {tab === 'type' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500">Full Legal Name</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full mt-1 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Font Previews */}
              <div className="space-y-2">
                <span className="text-xs text-neutral-500">Choose Signature Style:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Elegant Script', font: 'Playfair Display, cursive' },
                    { name: 'Cursive Classic', font: 'Great Vibes, cursive' },
                    { name: 'Modern Hand', font: 'Dancing Script, cursive' },
                    { name: 'Casual Signature', font: 'Caveat, cursive' },
                  ].map((f) => (
                    <div
                      key={f.font}
                      onClick={() => setSelectedFont(f.font)}
                      className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                        selectedFont === f.font
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-[10px] text-neutral-400 block mb-1">{f.name}</span>
                      <span
                        className="text-xl block truncate"
                        style={{ fontFamily: f.font, color: penColor }}
                      >
                        {typedName || 'Your Name'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Click or drag signature image here
                </span>
                <span className="text-[10px] text-neutral-400 mt-1">PNG, JPG, or SVG supported</span>
                <input
                  type="file"
                  onChange={handleUploadFile}
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                />
              </label>

              {uploadedUrl && (
                <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center h-28">
                  <img
                    src={uploadedUrl}
                    alt="Uploaded Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Save locally toggle */}
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={saveLocally}
              onChange={(e) => setSaveLocally(e.target.checked)}
              className="rounded text-blue-600 w-3.5 h-3.5"
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Save this signature in local library for fast 1-click re-use
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setModalOpen('signature', false)}
            className="px-3 py-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            Cancel
          </button>
          <button
            onClick={() => handleInsert()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Place Signature on Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
