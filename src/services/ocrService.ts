import { createWorker } from 'tesseract.js';
import { PDFTextBlock } from '../types/pdf';

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrResultItem {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export async function runOcrOnCanvas(
  canvas: HTMLCanvasElement,
  language = 'eng',
  onProgress?: (progress: OcrProgress) => void
): Promise<PDFTextBlock[]> {
  try {
    onProgress?.({ status: 'Initializing OCR Engine...', progress: 10 });
    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgress?.({
            status: `Recognizing text (${Math.round(m.progress * 100)}%)...`,
            progress: 20 + Math.round(m.progress * 75),
          });
        } else {
          onProgress?.({ status: m.status, progress: 20 });
        }
      },
    });

    onProgress?.({ status: 'Processing document image...', progress: 40 });
    const ret = await worker.recognize(canvas);

    onProgress?.({ status: 'Structuring text blocks...', progress: 95 });

    const blocks: PDFTextBlock[] = [];
    const lines = (ret.data as any).lines || [];

    // Scale from canvas actual pixels to CSS/PDF points
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    lines.forEach((line: any, index: number) => {
      const text = line.text?.trim() || '';
      if (!text) return;

      const x = (line.bbox?.x0 || 0) / dpr;
      const y = (line.bbox?.y0 || 0) / dpr;
      const width = ((line.bbox?.x1 || 100) - (line.bbox?.x0 || 0)) / dpr;
      const height = ((line.bbox?.y1 || 20) - (line.bbox?.y0 || 0)) / dpr;
      const approxFontSize = Math.max(9, Math.round(height * 0.75));

      blocks.push({
        id: `ocr-block-${Date.now()}-${index}`,
        text: text,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.max(20, Math.round(width)),
        height: Math.max(12, Math.round(height)),
        fontName: 'Helvetica',
        fontSize: approxFontSize,
        color: '#111827',
      });
    });

    await worker.terminate();
    onProgress?.({ status: 'OCR Complete!', progress: 100 });
    return blocks;
  } catch (err) {
    console.error('OCR Error:', err);
    throw err;
  }
}
