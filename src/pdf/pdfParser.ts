import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocModel, PageModel, PDFTextBlock, PDFMetadata } from '../types/pdf';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function parsePdfFile(
  data: ArrayBuffer | Uint8Array,
  fileName = 'Untitled Document.pdf'
): Promise<{ docModel: PDFDocModel; pdfProxy: pdfjsLib.PDFDocumentProxy }> {
  // Make an independent copy of the raw bytes immediately so it is never detached by PDF.js web worker
  const sourceBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const preservedOriginalBytes = new Uint8Array(sourceBytes.length);
  preservedOriginalBytes.set(sourceBytes);

  // A separate copy for PDF.js in case its web worker transfers/detaches the buffer
  const workerBytes = new Uint8Array(sourceBytes.length);
  workerBytes.set(sourceBytes);

  const loadingTask = pdfjsLib.getDocument({
    data: workerBytes,
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const pdfProxy = await loadingTask.promise;
  const numPages = pdfProxy.numPages;

  // Extract Metadata
  let metadata: PDFMetadata = {};
  try {
    const meta = await pdfProxy.getMetadata();
    if (meta && meta.info) {
      const info = meta.info as Record<string, any>;
      metadata = {
        title: (info.Title as string) || fileName.replace(/\.pdf$/i, ''),
        author: (info.Author as string) || '',
        subject: (info.Subject as string) || '',
        keywords: (info.Keywords as string) || '',
        creator: (info.Creator as string) || '',
        producer: (info.Producer as string) || '',
        creationDate: (info.CreationDate as string) || '',
        modDate: (info.ModDate as string) || '',
        pdfVersion: (meta.metadata?.get('pdf:pdfversion') as string) || '1.7',
      };
    }
  } catch (err) {
    console.warn('Could not read PDF metadata', err);
  }

  const pages: PageModel[] = [];

  for (let i = 1; i <= numPages; i++) {
    const pageProxy = await pdfProxy.getPage(i);
    const viewport = pageProxy.getViewport({ scale: 1.0 });

    const pageWidth = viewport.width;
    const pageHeight = viewport.height;
    const pageRotation = (viewport.rotation as number) || 0;

    // Extract text items
    const textContent = await pageProxy.getTextContent();
    const originalTextBlocks: PDFTextBlock[] = [];

    let totalChars = 0;

    // Group items into text lines
    for (let idx = 0; idx < textContent.items.length; idx++) {
      const item = textContent.items[idx] as any;
      if (!item.str || item.str.trim() === '') continue;

      totalChars += item.str.length;

      // Transform matrix: [scaleX, skewY, skewX, scaleY, tx, ty]
      const tx = item.transform[4];
      const ty = item.transform[5];
      const fontHeight = Math.hypot(item.transform[2], item.transform[3]) || item.height || 12;

      // Convert PDF coordinate (origin bottom-left) to canvas coordinate (origin top-left)
      const x = tx;
      const y = pageHeight - ty - fontHeight;
      const width = item.width || item.str.length * (fontHeight * 0.55);
      const height = fontHeight;

      originalTextBlocks.push({
        id: `orig-txt-p${i}-${idx}`,
        text: item.str,
        x: Math.max(0, Math.round(x * 10) / 10),
        y: Math.max(0, Math.round(y * 10) / 10),
        width: Math.max(8, Math.round(width * 10) / 10),
        height: Math.max(10, Math.round(height * 10) / 10),
        fontName: item.fontName || 'Helvetica',
        fontSize: Math.round(fontHeight * 10) / 10,
        color: '#111827',
      });
    }

    // Detect if this page is likely a scanned image with minimal/no extractable text
    const isScanned = totalChars < 25;

    pages.push({
      id: `page-${i}-${Date.now()}`,
      pageNumber: i,
      originalPageNumber: i,
      width: pageWidth,
      height: pageHeight,
      rotation: pageRotation,
      background: '#ffffff',
      objects: [],
      originalTextBlocks,
      isScanned,
    });
  }

  const docModel: PDFDocModel = {
    id: `doc-${Date.now()}`,
    title: metadata.title || fileName.replace(/\.pdf$/i, ''),
    pageCount: pages.length,
    pages,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    originalPdfBytes: preservedOriginalBytes,
  };

  return { docModel, pdfProxy };
}
