import * as pdfjsLib from 'pdfjs-dist';

// Cache rendered canvases by `${pdfId}-${pageNumber}-${scale}`
const renderCache = new Map<string, HTMLCanvasElement>();

export async function renderPdfPageToCanvas(
  pdfProxy: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  targetCanvas: HTMLCanvasElement,
  scale = 1.0,
  rotation = 0
): Promise<void> {
  try {
    const page = await pdfProxy.getPage(pageNumber);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5); // cap DPR at 2.5 for mobile/retina performance

    const viewport = page.getViewport({ scale: scale * dpr, rotation });

    targetCanvas.width = viewport.width;
    targetCanvas.height = viewport.height;
    targetCanvas.style.width = `${viewport.width / dpr}px`;
    targetCanvas.style.height = `${viewport.height / dpr}px`;

    const ctx = targetCanvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Fill white background before PDF rendering
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

    const renderContext: any = {
      canvasContext: ctx,
      viewport: viewport,
      canvas: targetCanvas,
    };

    await page.render(renderContext).promise;
  } catch (err) {
    console.error(`Error rendering PDF page ${pageNumber}:`, err);
  }
}

export async function generatePageThumbnail(
  pdfProxy: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  maxWidth = 160
): Promise<string> {
  const cacheKey = `thumb-${(pdfProxy as any).fingerprints?.[0] || 'doc'}-${pageNumber}-${maxWidth}`;
  if (renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey)!.toDataURL('image/jpeg', 0.8);
  }

  const page = await pdfProxy.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = maxWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  } as any).promise;

  renderCache.set(cacheKey, canvas);
  return canvas.toDataURL('image/jpeg', 0.8);
}
