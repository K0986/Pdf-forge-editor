import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees,
  PDFPage,
  PDFFont,
} from 'pdf-lib';
import {
  PDFDocModel,
  PageModel,
  TextObject,
  ImageObject,
  ShapeObject,
  AnnotationObject,
  SignatureObject,
  FormFieldObject,
  StampObject,
  TableObject,
} from '../types/pdf';

// Parse color string (hex #ffffff, rgb(r, g, b), rgba(r, g, b, a)) to pdf-lib rgb(0-1, 0-1, 0-1)
export function parseColor(colorStr?: string, defaultR = 0, defaultG = 0, defaultB = 0) {
  if (!colorStr || typeof colorStr !== 'string') return rgb(defaultR, defaultG, defaultB);
  const str = colorStr.trim().toLowerCase();

  if (str === 'transparent') {
    return rgb(1, 1, 1);
  }

  // Check rgb/rgba
  const rgbMatch = str.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))) / 255;
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))) / 255;
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))) / 255;
    return rgb(r, g, b);
  }

  // Hex parsing
  let cleaned = str.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  if (cleaned.length >= 6) {
    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return rgb(r, g, b);
    }
  }

  return rgb(defaultR, defaultG, defaultB);
}

// Convert data URL to clean Uint8Array
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  if (!dataUrl) return new Uint8Array(0);
  const base64Index = dataUrl.indexOf(';base64,');
  let base64 = base64Index !== -1 ? dataUrl.substring(base64Index + 8) : dataUrl;
  base64 = base64.replace(/\s/g, ''); // strip any whitespace or newlines
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.warn('Failed atob decoding in dataUrlToUint8Array:', e);
    return new Uint8Array(0);
  }
}

// Extract raw bytes and format (png or jpeg) from any image source (data URL, blob URL, http URL)
export async function extractImageBytes(
  src: string
): Promise<{ bytes: Uint8Array; format: 'png' | 'jpeg' } | null> {
  if (!src) return null;

  // 1. Direct JPEG data URL
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
    const bytes = dataUrlToUint8Array(src);
    if (bytes.length > 0) return { bytes, format: 'jpeg' };
  }

  // 2. Direct PNG data URL
  if (src.startsWith('data:image/png')) {
    const bytes = dataUrlToUint8Array(src);
    if (bytes.length > 0) return { bytes, format: 'png' };
  }

  // 3. In browser environment: handle blob URLs, SVG, WebP, GIF, external URLs via Canvas or Fetch
  if (typeof window !== 'undefined') {
    try {
      if (src.startsWith('blob:')) {
        const resp = await fetch(src);
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        return { bytes, format: 'png' };
      }
    } catch {
      // Fall through to canvas
    }

    try {
      const bytes = await new Promise<Uint8Array | null>((resolve) => {
        const img = new Image();
        if (src.startsWith('http://') || src.startsWith('https://')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, img.naturalWidth || img.width || 100);
            canvas.height = Math.max(1, img.naturalHeight || img.height || 100);
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL('image/png');
            resolve(dataUrlToUint8Array(pngDataUrl));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });

      if (bytes && bytes.length > 0) {
        return { bytes, format: 'png' };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback
  const fallbackBytes = dataUrlToUint8Array(src);
  if (fallbackBytes.length > 0) {
    return { bytes: fallbackBytes, format: 'png' };
  }
  return null;
}

// Convert any image source (PNG, JPG, WebP, SVG, GIF, blob, data URL) to guaranteed clean PNG bytes (backwards compatible)
export async function convertImageToPngBytes(src: string): Promise<Uint8Array> {
  const extracted = await extractImageBytes(src);
  return extracted ? extracted.bytes : new Uint8Array(0);
}

// Sanitize text for pdf-lib WinAnsi StandardFonts to prevent fatal encoding exceptions
export function sanitizeTextForPdfLib(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // en-dash, em-dash
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '*') // bullets
    .replace(/[\u2713\u2714]/g, '[x]') // checkmarks
    .replace(/[\u00A0]/g, ' ') // non-breaking space
    .replace(/[^\x00-\x7F\xA0-\xFF]/g, '?'); // replace any unencodable character with '?'
}

export interface ExportPdfOptions {
  flatten?: boolean;
  createAcroForms?: boolean;
  pageRange?: number[]; // 0-indexed page numbers to export, defaults to all
  onProgress?: (status: string, percentage: number) => void;
}

export async function exportDocumentToPdf(
  docModel: PDFDocModel,
  options: ExportPdfOptions = {}
): Promise<Uint8Array> {
  options.onProgress?.('Preparing document model...', 10);

  // Load source document if available
  let sourceDoc: PDFDocument | null = null;
  if (docModel.originalPdfBytes && docModel.originalPdfBytes.length > 0) {
    try {
      sourceDoc = await PDFDocument.load(docModel.originalPdfBytes, { ignoreEncryption: true });
    } catch (e) {
      console.warn('Could not load original PDF bytes in pdf-lib, falling back to clean page generation', e);
    }
  }

  const targetPdfDoc = await PDFDocument.create();

  options.onProgress?.('Embedding standard typography fonts...', 25);

  // Embed standard typography fonts
  const fontHelvetica = await targetPdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await targetPdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await targetPdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimesRoman = await targetPdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesRomanBold = await targetPdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesRomanItalic = await targetPdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontCourier = await targetPdfDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await targetPdfDoc.embedFont(StandardFonts.CourierBold);

  const getFont = (family?: string, weight?: string, style?: string): PDFFont => {
    const f = (family || '').toLowerCase();
    const isBold = weight === 'bold' || weight === '700' || weight === '800';
    const isItalic = style === 'italic';

    if (f.includes('times') || f.includes('serif') || f.includes('merriweather') || f.includes('playfair')) {
      if (isBold) return fontTimesRomanBold;
      if (isItalic) return fontTimesRomanItalic;
      return fontTimesRoman;
    }
    if (f.includes('courier') || f.includes('mono') || f.includes('code')) {
      return isBold ? fontCourierBold : fontCourier;
    }
    // Default Helvetica
    if (isBold) return fontHelveticaBold;
    if (isItalic) return fontHelveticaOblique;
    return fontHelvetica;
  };

  const form = options.createAcroForms !== false ? targetPdfDoc.getForm() : null;

  const pagesToExport = options.pageRange && options.pageRange.length > 0
    ? docModel.pages.filter((_, idx) => options.pageRange!.includes(idx))
    : docModel.pages;

  const totalPages = pagesToExport.length;

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const pageModel = pagesToExport[pIdx];
    const pct = 30 + Math.round((pIdx / totalPages) * 55);
    options.onProgress?.(`Processing page ${pIdx + 1} of ${totalPages}...`, pct);

    let pdfPage: PDFPage;

    let isCopiedFromSource = false;

    // Check if sourceDoc can be copied
    if (
      sourceDoc &&
      pageModel.originalPageNumber &&
      pageModel.originalPageNumber <= sourceDoc.getPageCount()
    ) {
      try {
        const [copiedPage] = await targetPdfDoc.copyPages(sourceDoc, [pageModel.originalPageNumber - 1]);
        pdfPage = targetPdfDoc.addPage(copiedPage);
        isCopiedFromSource = true;
      } catch (copyErr) {
        console.warn(`Could not copy page ${pageModel.originalPageNumber} from sourceDoc:`, copyErr);
        pdfPage = targetPdfDoc.addPage([pageModel.width, pageModel.height]);
      }
    } else {
      pdfPage = targetPdfDoc.addPage([pageModel.width, pageModel.height]);
    }

    if (pageModel.rotation) {
      pdfPage.setRotation(degrees(pageModel.rotation));
    }

    // Handle MediaBox coordinate offsets
    const mediaBox = pdfPage.getMediaBox();
    const originX = mediaBox.x || 0;
    const originY = mediaBox.y || 0;
    const pHeight = mediaBox.height || pdfPage.getHeight();

    // 1. If page was copied from source, redact / white-out modified or deleted original text blocks
    if (isCopiedFromSource) {
      for (const textBlock of pageModel.originalTextBlocks) {
        if (textBlock.isModified || textBlock.isDeleted) {
          const pdfY = originY + pHeight - textBlock.y - textBlock.height;
          pdfPage.drawRectangle({
            x: Math.max(0, originX + textBlock.x - 1),
            y: Math.max(0, pdfY - 1),
            width: textBlock.width + 2,
            height: textBlock.height + 2,
            color: rgb(1, 1, 1),
          });
        }
      }
    } else if (pageModel.originalTextBlocks.length > 0) {
      // Fallback: SourceDoc could not be copied directly, so draw the original text blocks manually
      for (const textBlock of pageModel.originalTextBlocks) {
        if (textBlock.isModified || textBlock.isDeleted) continue;
        const font = getFont(textBlock.fontName);
        const textColor = parseColor(textBlock.color, 0.07, 0.09, 0.15);
        const fontSize = Math.max(6, Math.min(144, textBlock.fontSize || 12));
        const pdfY = originY + pHeight - textBlock.y - textBlock.height;
        try {
          pdfPage.drawText(sanitizeTextForPdfLib(textBlock.text), {
            x: originX + textBlock.x,
            y: pdfY,
            size: fontSize,
            font: font,
            color: textColor,
          });
        } catch (tErr) {
          console.warn('Failed drawing fallback original text block:', tErr);
        }
      }
    }

    // Sort objects by zIndex
    const sortedObjects = [...pageModel.objects].sort((a, b) => a.zIndex - b.zIndex);

    // 2. Render all EditorObjects
    for (const obj of sortedObjects) {
      if (!obj.visible) continue;

      // In PDF coordinate space, Y=0 is bottom
      const objPdfX = originX + obj.x;
      const objPdfY = originY + pHeight - obj.y - obj.height;

      switch (obj.type) {
        case 'text': {
          const txtObj = obj as TextObject;
          const font = getFont(txtObj.fontFamily, txtObj.fontWeight, txtObj.fontStyle);
          const textColor = parseColor(txtObj.color, 0.07, 0.09, 0.15);
          const fontSize = Math.max(6, Math.min(144, txtObj.fontSize || 12));

          // If redact background is requested
          if (txtObj.redactBackground || txtObj.backgroundColor) {
            const bgCol = txtObj.backgroundColor
              ? parseColor(txtObj.backgroundColor, 1, 1, 1)
              : rgb(1, 1, 1);
            pdfPage.drawRectangle({
              x: objPdfX,
              y: objPdfY,
              width: txtObj.width,
              height: txtObj.height,
              color: bgCol,
              opacity: txtObj.opacity ?? 1,
            });
          }

          const lines = (txtObj.content || '').split(/\r?\n/);
          const lineSpacing = fontSize * (txtObj.lineHeight || 1.25);
          let currentY = objPdfY + txtObj.height - fontSize;

          for (const rawLine of lines) {
            const line = sanitizeTextForPdfLib(rawLine);
            if (line.length === 0) {
              currentY -= lineSpacing;
              continue;
            }

            let lineX = objPdfX;
            let textWidth = 0;
            try {
              textWidth = font.widthOfTextAtSize(line, fontSize);
            } catch (wErr) {
              textWidth = line.length * fontSize * 0.5;
            }

            if (txtObj.alignment === 'center') {
              lineX = objPdfX + (txtObj.width - textWidth) / 2;
            } else if (txtObj.alignment === 'right') {
              lineX = objPdfX + txtObj.width - textWidth;
            }

            try {
              pdfPage.drawText(line, {
                x: lineX,
                y: currentY,
                size: fontSize,
                font: font,
                color: textColor,
                opacity: txtObj.opacity ?? 1,
              });
            } catch (dErr) {
              console.warn('Failed to draw text line in PDF:', line, dErr);
            }

            // Underline
            if (txtObj.underline) {
              pdfPage.drawLine({
                start: { x: lineX, y: currentY - 2 },
                end: { x: lineX + textWidth, y: currentY - 2 },
                thickness: Math.max(1, fontSize / 14),
                color: textColor,
                opacity: txtObj.opacity ?? 1,
              });
            }

            // Strikethrough
            if (txtObj.strikethrough) {
              const strikeY = currentY + fontSize * 0.35;
              pdfPage.drawLine({
                start: { x: lineX, y: strikeY },
                end: { x: lineX + textWidth, y: strikeY },
                thickness: Math.max(1, fontSize / 14),
                color: textColor,
                opacity: txtObj.opacity ?? 1,
              });
            }

            currentY -= lineSpacing;
          }
          break;
        }

        case 'image': {
          const imgObj = obj as ImageObject;
          try {
            const imgData = await extractImageBytes(imgObj.src);
            if (imgData && imgData.bytes.length > 0) {
              let embeddedImage;
              if (imgData.format === 'jpeg') {
                try {
                  embeddedImage = await targetPdfDoc.embedJpg(imgData.bytes);
                } catch {
                  embeddedImage = await targetPdfDoc.embedPng(imgData.bytes);
                }
              } else {
                try {
                  embeddedImage = await targetPdfDoc.embedPng(imgData.bytes);
                } catch {
                  embeddedImage = await targetPdfDoc.embedJpg(imgData.bytes);
                }
              }

              pdfPage.drawImage(embeddedImage, {
                x: objPdfX,
                y: objPdfY,
                width: imgObj.width,
                height: imgObj.height,
                opacity: imgObj.opacity ?? 1,
                rotate: imgObj.rotation ? degrees(imgObj.rotation) : undefined,
              });

              if (imgObj.borderWidth > 0 && imgObj.borderColor) {
                pdfPage.drawRectangle({
                  x: objPdfX,
                  y: objPdfY,
                  width: imgObj.width,
                  height: imgObj.height,
                  borderColor: parseColor(imgObj.borderColor, 0, 0, 0),
                  borderWidth: imgObj.borderWidth,
                  opacity: imgObj.opacity ?? 1,
                });
              }
            }
          } catch (imgErr) {
            console.error('Could not embed image into exported PDF:', imgErr);
          }
          break;
        }

        case 'signature': {
          const sigObj = obj as SignatureObject;
          try {
            const imgData = await extractImageBytes(sigObj.dataUrl);
            if (imgData && imgData.bytes.length > 0) {
              let embeddedSig;
              try {
                embeddedSig = await targetPdfDoc.embedPng(imgData.bytes);
              } catch {
                embeddedSig = await targetPdfDoc.embedJpg(imgData.bytes);
              }
              pdfPage.drawImage(embeddedSig, {
                x: objPdfX,
                y: objPdfY,
                width: sigObj.width,
                height: sigObj.height,
                opacity: sigObj.opacity ?? 1,
                rotate: sigObj.rotation ? degrees(sigObj.rotation) : undefined,
              });
            }
          } catch (sigErr) {
            console.error('Could not embed signature into exported PDF:', sigErr);
          }
          break;
        }

        case 'shape': {
          const shapeObj = obj as ShapeObject;
          const strokeCol = parseColor(shapeObj.strokeColor, 0, 0, 0);
          const hasFill = shapeObj.fillColor && shapeObj.fillColor !== 'transparent';
          const fillCol = hasFill ? parseColor(shapeObj.fillColor, 1, 1, 1) : undefined;

          try {
            if (shapeObj.shapeType === 'rectangle') {
              pdfPage.drawRectangle({
                x: objPdfX,
                y: objPdfY,
                width: shapeObj.width,
                height: shapeObj.height,
                color: fillCol,
                borderColor: strokeCol,
                borderWidth: shapeObj.strokeWidth,
                opacity: shapeObj.opacity ?? 1,
                rotate: shapeObj.rotation ? degrees(shapeObj.rotation) : undefined,
              });
            } else if (shapeObj.shapeType === 'ellipse') {
              pdfPage.drawEllipse({
                x: objPdfX + shapeObj.width / 2,
                y: objPdfY + shapeObj.height / 2,
                xScale: shapeObj.width / 2,
                yScale: shapeObj.height / 2,
                color: fillCol,
                borderColor: strokeCol,
                borderWidth: shapeObj.strokeWidth,
                opacity: shapeObj.opacity ?? 1,
              });
            } else if (shapeObj.shapeType === 'line' || shapeObj.shapeType === 'arrow') {
              const startX = objPdfX;
              const startY = objPdfY + shapeObj.height;
              const endX = objPdfX + shapeObj.width;
              const endY = objPdfY;

              pdfPage.drawLine({
                start: { x: startX, y: startY },
                end: { x: endX, y: endY },
                thickness: shapeObj.strokeWidth,
                color: strokeCol,
                opacity: shapeObj.opacity ?? 1,
              });

              if (shapeObj.shapeType === 'arrow') {
                const angle = Math.atan2(endY - startY, endX - startX);
                const headLen = 12;
                pdfPage.drawLine({
                  start: { x: endX, y: endY },
                  end: {
                    x: endX - headLen * Math.cos(angle - Math.PI / 6),
                    y: endY - headLen * Math.sin(angle - Math.PI / 6),
                  },
                  thickness: shapeObj.strokeWidth,
                  color: strokeCol,
                });
                pdfPage.drawLine({
                  start: { x: endX, y: endY },
                  end: {
                    x: endX - headLen * Math.cos(angle + Math.PI / 6),
                    y: endY - headLen * Math.sin(angle + Math.PI / 6),
                  },
                  thickness: shapeObj.strokeWidth,
                  color: strokeCol,
                });
              }
            }
          } catch (shapeErr) {
            console.warn('Shape drawing error:', shapeErr);
          }
          break;
        }

        case 'annotation': {
          const annObj = obj as AnnotationObject;
          const annColor = parseColor(annObj.strokeColor, 1, 0.9, 0);

          try {
            if (annObj.annotationType === 'highlight') {
              pdfPage.drawRectangle({
                x: objPdfX,
                y: objPdfY,
                width: annObj.width,
                height: annObj.height,
                color: annColor,
                opacity: 0.35,
              });
            } else if (annObj.annotationType === 'freehand' && annObj.path && annObj.path.length > 1) {
              for (let i = 0; i < annObj.path.length - 1; i++) {
                const p1 = annObj.path[i];
                const p2 = annObj.path[i + 1];
                pdfPage.drawLine({
                  start: { x: objPdfX + p1.x, y: originY + pHeight - (annObj.y + p1.y) },
                  end: { x: objPdfX + p2.x, y: originY + pHeight - (annObj.y + p2.y) },
                  thickness: annObj.strokeWidth || 2,
                  color: annColor,
                  opacity: annObj.opacity ?? 1,
                });
              }
            } else if (annObj.annotationType === 'sticky') {
              pdfPage.drawRectangle({
                x: objPdfX,
                y: objPdfY,
                width: annObj.width,
                height: annObj.height,
                color: rgb(1, 0.96, 0.7),
                borderColor: rgb(0.9, 0.8, 0.4),
                borderWidth: 1,
              });
              if (annObj.text) {
                const cleanNote = sanitizeTextForPdfLib(annObj.text.substring(0, 80));
                pdfPage.drawText(cleanNote, {
                  x: objPdfX + 4,
                  y: objPdfY + annObj.height - 12,
                  size: 8,
                  font: fontHelvetica,
                  color: rgb(0.2, 0.2, 0.2),
                });
              }
            }
          } catch (annErr) {
            console.warn('Annotation drawing error:', annErr);
          }
          break;
        }

        case 'stamp': {
          const stampObj = obj as StampObject;
          const stampColor = parseColor(stampObj.color, 0.8, 0.1, 0.1);
          const cleanText = sanitizeTextForPdfLib(stampObj.text || 'STAMP');

          try {
            pdfPage.drawRectangle({
              x: objPdfX,
              y: objPdfY,
              width: stampObj.width,
              height: stampObj.height,
              borderColor: stampColor,
              borderWidth: 2,
              opacity: stampObj.opacity ?? 1,
              rotate: degrees(stampObj.rotation || -12),
            });

            pdfPage.drawText(cleanText, {
              x: objPdfX + 8,
              y: objPdfY + stampObj.height / 2 - 5,
              size: 14,
              font: fontHelveticaBold,
              color: stampColor,
              opacity: stampObj.opacity ?? 1,
              rotate: degrees(stampObj.rotation || -12),
            });
          } catch (stErr) {
            console.warn('Stamp drawing error:', stErr);
          }
          break;
        }

        case 'formField': {
          const formObj = obj as FormFieldObject;
          if (form && !options.flatten) {
            try {
              if (formObj.fieldType === 'text') {
                const tf = form.createTextField(formObj.fieldName || `field_${formObj.id}`);
                tf.setText(sanitizeTextForPdfLib(String(formObj.currentValue || formObj.defaultValue || '')));
                tf.addToPage(pdfPage, {
                  x: objPdfX,
                  y: objPdfY,
                  width: formObj.width,
                  height: formObj.height,
                  borderWidth: formObj.borderWidth,
                  borderColor: parseColor(formObj.borderColor, 0.7, 0.7, 0.7),
                  backgroundColor: parseColor(formObj.backgroundColor, 0.98, 0.98, 1),
                });
              } else if (formObj.fieldType === 'checkbox') {
                const cb = form.createCheckBox(formObj.fieldName || `check_${formObj.id}`);
                if (formObj.currentValue) cb.check();
                cb.addToPage(pdfPage, {
                  x: objPdfX,
                  y: objPdfY,
                  width: formObj.width,
                  height: formObj.height,
                });
              }
            } catch (formErr) {
              console.warn('AcroForm field creation fallback to visual vector:', formErr);
            }
          } else {
            pdfPage.drawRectangle({
              x: objPdfX,
              y: objPdfY,
              width: formObj.width,
              height: formObj.height,
              color: parseColor(formObj.backgroundColor, 0.96, 0.97, 0.99),
              borderColor: parseColor(formObj.borderColor, 0.7, 0.7, 0.7),
              borderWidth: 1,
            });
            if (formObj.currentValue) {
              const cleanVal = sanitizeTextForPdfLib(String(formObj.currentValue));
              pdfPage.drawText(cleanVal, {
                x: objPdfX + 4,
                y: objPdfY + formObj.height / 2 - 4,
                size: formObj.fontSize || 9,
                font: fontHelvetica,
                color: parseColor(formObj.fontColor, 0.1, 0.1, 0.1),
              });
            }
          }
          break;
        }

        case 'table': {
          const tbl = obj as TableObject;
          const borderColor = parseColor(tbl.borderColor, 0.7, 0.7, 0.7);
          const cellWidth = tbl.width / Math.max(1, tbl.cols);
          const cellHeight = tbl.height / Math.max(1, tbl.rows);

          for (let r = 0; r < tbl.rows; r++) {
            for (let c = 0; c < tbl.cols; c++) {
              const cx = objPdfX + c * cellWidth;
              const cy = objPdfY + tbl.height - (r + 1) * cellHeight;
              const isHeader = r === 0;

              pdfPage.drawRectangle({
                x: cx,
                y: cy,
                width: cellWidth,
                height: cellHeight,
                color: isHeader
                  ? parseColor(tbl.headerBackground, 0.92, 0.94, 0.98)
                  : parseColor(tbl.cellBackground, 1, 1, 1),
                borderColor: borderColor,
                borderWidth: 1,
              });

              const cellVal = sanitizeTextForPdfLib(tbl.data?.[r]?.[c] || '');
              if (cellVal) {
                try {
                  pdfPage.drawText(cellVal, {
                    x: cx + 4,
                    y: cy + cellHeight / 2 - 4,
                    size: tbl.fontSize || 9,
                    font: isHeader ? fontHelveticaBold : fontHelvetica,
                    color: parseColor(tbl.textColor, 0.1, 0.1, 0.1),
                  });
                } catch (tErr) {
                  console.warn('Table cell drawing error:', tErr);
                }
              }
            }
          }
          break;
        }
      }
    }
  }

  options.onProgress?.('Writing metadata and serializing final PDF...', 90);

  // Set Metadata
  const docTitle = docModel.metadata?.title || docModel.title;
  if (docTitle) targetPdfDoc.setTitle(sanitizeTextForPdfLib(docTitle));
  if (docModel.metadata?.author) targetPdfDoc.setAuthor(sanitizeTextForPdfLib(docModel.metadata.author));
  if (docModel.metadata?.subject) targetPdfDoc.setSubject(sanitizeTextForPdfLib(docModel.metadata.subject));
  targetPdfDoc.setProducer('PDFForge v2.0 Professional Edition');
  targetPdfDoc.setModificationDate(new Date());

  const finalBytes = await targetPdfDoc.save();
  options.onProgress?.('Complete!', 100);

  return finalBytes;
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
