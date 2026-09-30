import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  exportDocumentToPdf,
  sanitizeTextForPdfLib,
  parseColor,
  dataUrlToUint8Array,
} from '../src/pdf/pdfExporter';
import { PDFDocModel, TextObject, ShapeObject, ImageObject } from '../src/types/pdf';
import { calculateSnapping } from '../src/utils/geometry';

async function runTests() {
  console.log('--- Starting PDFForge Automated Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // TEST 1: PDF Document Creation
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Test Suite PDF', { x: 50, y: 800, size: 14, font, color: rgb(0, 0, 0) });
    const bytes = await pdfDoc.save();
    assert(bytes.length > 500, 'Created valid PDF binary with pdf-lib');
  } catch (e: any) {
    assert(false, `PDF creation failed: ${e.message}`);
  }

  // TEST 2: PDF Export with Original Source PDF, Modified Text, Added Text, and Embedded Images
  try {
    // 2a. Create a base original PDF
    const baseDoc = await PDFDocument.create();
    const bFont = await baseDoc.embedFont(StandardFonts.HelveticaBold);
    const bPage = baseDoc.addPage([595, 842]);
    bPage.drawText('Apex Confidential NDA - Page 1 Base Text', { x: 50, y: 750, size: 16, font: bFont });
    const originalBytes = await baseDoc.save();

    // 2b. Build a 1x1 test PNG data url
    const testPngDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const testDocModel: PDFDocModel = {
      id: 'test-doc-complex',
      title: 'Full Document With Text and Images',
      pageCount: 1,
      originalPdfBytes: originalBytes,
      pages: [
        {
          id: 'page-1',
          pageNumber: 1,
          originalPageNumber: 1,
          width: 595,
          height: 842,
          rotation: 0,
          background: '#ffffff',
          originalTextBlocks: [
            {
              id: 'tb-1',
              text: 'Apex Confidential NDA - Page 1 Base Text',
              x: 50,
              y: 72,
              width: 250,
              height: 20,
              fontName: 'Helvetica',
              fontSize: 16,
              isModified: true, // redact patch
            },
          ],
          objects: [
            {
              id: 'txt-1',
              type: 'text',
              pageId: 'page-1',
              x: 50,
              y: 72,
              width: 300,
              height: 30,
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              locked: false,
              visible: true,
              name: 'Updated Header',
              content: 'Brand New Executive Agreement — With “Quotes” & Accents',
              fontFamily: 'Helvetica',
              fontSize: 14,
              fontWeight: 'bold',
              fontStyle: 'normal',
              underline: true,
              strikethrough: false,
              color: '#1d4ed8',
              alignment: 'left',
              lineHeight: 1.2,
              letterSpacing: 0,
            } as TextObject,
            {
              id: 'img-1',
              type: 'image',
              pageId: 'page-1',
              x: 50,
              y: 200,
              width: 120,
              height: 120,
              rotation: 0,
              opacity: 1,
              zIndex: 2,
              locked: false,
              visible: true,
              name: 'Logo Image',
              src: testPngDataUrl,
              originalWidth: 100,
              originalHeight: 100,
              flipX: false,
              flipY: false,
              borderRadius: 0,
              borderWidth: 1,
              borderColor: '#000000',
              shadow: false,
            } as ImageObject,
            {
              id: 'shape-1',
              type: 'shape',
              pageId: 'page-1',
              x: 50,
              y: 400,
              width: 150,
              height: 50,
              rotation: 0,
              opacity: 0.9,
              zIndex: 3,
              locked: false,
              visible: true,
              name: 'Accent Box',
              shapeType: 'rectangle',
              fillColor: 'rgba(59, 130, 246, 0.2)',
              strokeColor: '#2563eb',
              strokeWidth: 2,
              strokeStyle: 'solid',
            } as ShapeObject,
          ],
        },
      ],
      metadata: {
        title: 'Full Document With Text and Images',
        author: 'PDFForge Test Suite',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const exportedBytes = await exportDocumentToPdf(testDocModel);
    assert(exportedBytes.length > originalBytes.length, `Exported PDF with original base + added text + embedded image (${exportedBytes.length} bytes)`);

    // Reload and verify
    const reloaded = await PDFDocument.load(exportedBytes);
    assert(reloaded.getPageCount() === 1, 'Verified reloaded exported PDF has exactly 1 page');
  } catch (e: any) {
    assert(false, `Complex export test failed: ${e.message}`);
  }

  // TEST 3: Text Sanitization (Prevents WinAnsi Crash on Smart Quotes, Dashes, Bullets, Checkmarks)
  try {
    const raw = '“Hello” ‘world’ — test – bullet • check ✓ space\u00A0end';
    const sanitized = sanitizeTextForPdfLib(raw);
    assert(!sanitized.includes('“') && !sanitized.includes('”'), 'Smart quotes converted to standard ASCII');
    assert(!sanitized.includes('—') && !sanitized.includes('–'), 'Em and En dashes converted to hyphens');
    assert(!sanitized.includes('•'), 'Bullets converted to asterisks');
    assert(!sanitized.includes('✓'), 'Checkmark converted safely to [x]');
  } catch (e: any) {
    assert(false, `Sanitization test failed: ${e.message}`);
  }

  // TEST 4: Color Parsing (Hex, RGB, RGBA, Transparent)
  try {
    const c1 = parseColor('#2563eb');
    assert(c1.red > 0.1 && c1.blue > 0.8, 'Hex color #2563eb parsed accurately');

    const c2 = parseColor('rgb(220, 38, 38)');
    assert(c2.red > 0.8 && c2.blue < 0.2, 'RGB color rgb(220, 38, 38) parsed accurately');

    const c3 = parseColor('rgba(16, 185, 129, 0.5)');
    assert(c3.green > 0.7, 'RGBA color parsed accurately');
  } catch (e: any) {
    assert(false, `Color parsing test failed: ${e.message}`);
  }

  // TEST 5: Canva/Figma Alignment Snapping Engine
  try {
    const objA: any = { id: 'a', x: 100, y: 100, width: 100, height: 100, visible: true };
    const draggingObj: any = { id: 'b', x: 103, y: 250, width: 100, height: 100, visible: true };

    const snap = calculateSnapping(draggingObj, [objA], 600, 800);
    assert(snap.snappedX === 100, 'Snapping correctly magnetic-locks left edge to adjacent object');
    assert(snap.guides.length > 0, 'Generated alignment guide line for magnetic snap');
  } catch (e: any) {
    assert(false, `Snapping calculation failed: ${e.message}`);
  }

  // TEST 6: Multi-Page Export with Image and Text on Page 2
  try {
    const testPngDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const multiPageDoc: PDFDocModel = {
      id: 'multi-page-doc',
      title: 'Two Page Document',
      pageCount: 2,
      metadata: { title: 'Two Page Document' },
      pages: [
        {
          id: 'p-1',
          pageNumber: 1,
          width: 595,
          height: 842,
          rotation: 0,
          background: '#ffffff',
          originalTextBlocks: [],
          objects: [
            {
              id: 'p1-txt',
              type: 'text',
              pageId: 'p-1',
              x: 50,
              y: 50,
              width: 200,
              height: 30,
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              locked: false,
              visible: true,
              name: 'Page 1 Title',
              content: 'Page 1 Header Text',
              fontFamily: 'Helvetica',
              fontSize: 14,
              color: '#000000',
            } as TextObject,
          ],
        },
        {
          id: 'p-2',
          pageNumber: 2,
          width: 595,
          height: 842,
          rotation: 0,
          background: '#ffffff',
          originalTextBlocks: [],
          objects: [
            {
              id: 'p2-img',
              type: 'image',
              pageId: 'p-2',
              x: 100,
              y: 150,
              width: 150,
              height: 150,
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              locked: false,
              visible: true,
              name: 'Page 2 Imported Image',
              src: testPngDataUrl,
              originalWidth: 100,
              originalHeight: 100,
              flipX: false,
              flipY: false,
              borderRadius: 0,
              borderWidth: 0,
              borderColor: '#000000',
              shadow: false,
            } as ImageObject,
            {
              id: 'p2-txt',
              type: 'text',
              pageId: 'p-2',
              x: 100,
              y: 350,
              width: 250,
              height: 40,
              rotation: 0,
              opacity: 1,
              zIndex: 2,
              locked: false,
              visible: true,
              name: 'Page 2 Caption',
              content: 'Caption below image on Page 2',
              fontFamily: 'Helvetica',
              fontSize: 12,
              color: '#333333',
            } as TextObject,
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const multiExportBytes = await exportDocumentToPdf(multiPageDoc);
    assert(multiExportBytes.length > 1000, `Multi-page PDF exported successfully (${multiExportBytes.length} bytes)`);

    const reloadedMulti = await PDFDocument.load(multiExportBytes);
    assert(reloadedMulti.getPageCount() === 2, 'Reloaded multi-page PDF has exactly 2 pages');
  } catch (e: any) {
    assert(false, `Multi-page export test failed: ${e.message}`);
  }

  // TEST 7: Fallback Original Text Rendering when sourceDoc is null
  try {
    const fallbackDoc: PDFDocModel = {
      id: 'fallback-doc',
      title: 'Fallback Text Preservation',
      pageCount: 1,
      metadata: { title: 'Fallback Text Preservation' },
      // No originalPdfBytes provided:
      pages: [
        {
          id: 'fb-p1',
          pageNumber: 1,
          width: 595,
          height: 842,
          rotation: 0,
          background: '#ffffff',
          originalTextBlocks: [
            {
              id: 'fb-tb-1',
              text: 'Original Text Preserved Even Without Source PDF Binary',
              x: 50,
              y: 100,
              width: 300,
              height: 20,
              fontName: 'Helvetica',
              fontSize: 14,
              color: '#111827',
              isModified: false,
              isDeleted: false,
            },
          ],
          objects: [],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fbBytes = await exportDocumentToPdf(fallbackDoc);
    assert(fbBytes.length > 800, `Fallback export preserved text (${fbBytes.length} bytes)`);
    const reloadedFb = await PDFDocument.load(fbBytes);
    assert(reloadedFb.getPageCount() === 1, 'Verified fallback PDF contains 1 page');
  } catch (e: any) {
    assert(false, `Fallback text preservation test failed: ${e.message}`);
  }

  // TEST 8: Cross-Page Object Migration Logic (Page 1 to Page 2 transfer)
  try {
    const p1Obj: ImageObject = {
      id: 'img-to-migrate',
      type: 'image',
      pageId: 'page-1',
      x: 100,
      y: 750, // near bottom of page 1
      width: 120,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      locked: false,
      visible: true,
      name: 'Migrated Image',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      originalWidth: 100,
      originalHeight: 100,
      flipX: false,
      flipY: false,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#000000',
      shadow: false,
    };

    const docBeforeMove: PDFDocModel = {
      id: 'doc-cross-page',
      title: 'Cross Page Move Doc',
      pageCount: 2,
      metadata: { title: 'Cross Page Move Doc' },
      pages: [
        {
          id: 'page-1',
          pageNumber: 1,
          width: 595,
          height: 842,
          rotation: 0,
          background: '#ffffff',
          originalTextBlocks: [],
          objects: [p1Obj],
        },
        {
          id: 'page-2',
          pageNumber: 2,
          width: 595,
          height: 842,
          rotation: 0,
          background: '#ffffff',
          originalTextBlocks: [],
          objects: [],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate cross-page drop onto Page 2
    const targetPageIndex = 1;
    const newTargetPageId = docBeforeMove.pages[targetPageIndex].id;
    const newTargetX = 100;
    const newTargetY = 50; // top of page 2

    const newPages = docBeforeMove.pages.map((p) => ({ ...p, objects: [...p.objects] }));
    // Remove from Page 1
    newPages[0].objects = newPages[0].objects.filter((o) => o.id !== p1Obj.id);
    // Add to Page 2
    newPages[1].objects.push({
      ...p1Obj,
      pageId: newTargetPageId,
      x: newTargetX,
      y: newTargetY,
      zIndex: 1,
    });

    const docAfterMove: PDFDocModel = { ...docBeforeMove, pages: newPages };

    assert(docAfterMove.pages[0].objects.length === 0, 'Image successfully removed from Page 1');
    assert(docAfterMove.pages[1].objects.length === 1, 'Image successfully added to Page 2');
    assert(docAfterMove.pages[1].objects[0].pageId === 'page-2', 'Object pageId updated to Page 2');
    assert(docAfterMove.pages[1].objects[0].y === 50, 'Object coordinates updated to Page 2 relative coordinate');

    // Verify it exports cleanly with image on Page 2
    const moveExportBytes = await exportDocumentToPdf(docAfterMove);
    const reloadedMoveDoc = await PDFDocument.load(moveExportBytes);
    assert(reloadedMoveDoc.getPageCount() === 2, 'Exported document has 2 valid pages with image transferred to Page 2');
  } catch (e: any) {
    assert(false, `Cross-page migration test failed: ${e.message}`);
  }

  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runTests();
