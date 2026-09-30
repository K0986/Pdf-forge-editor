import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  generate: () => Promise<Uint8Array>;
}

export async function createBlankDocPdf(pageWidth = 595.28, pageHeight = 841.89): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([pageWidth, pageHeight]);
  return await pdfDoc.save();
}

export async function createSampleContractPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 1: NDA Agreement
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page1.getSize();

  // Header banner
  page1.drawRectangle({
    x: 40,
    y: height - 80,
    width: width - 80,
    height: 40,
    color: rgb(0.93, 0.95, 0.98),
  });

  page1.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: 100,
    y: height - 65,
    size: 16,
    font: timesBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  page1.drawText('Document Reference: NDA-2026-0941 | Version 3.2', {
    x: 45,
    y: height - 105,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  const p1Text = [
    'This Non-Disclosure Agreement ("Agreement") is entered into as of September 30, 2026 by and',
    'between Apex Technologies Inc., a Delaware corporation ("Disclosing Party"), and Nova Systems LLC,',
    'a California limited liability company ("Receiving Party").',
    '',
    '1. Confidential Information. "Confidential Information" refers to any proprietary information, technical data,',
    'trade secrets, know-how, software code, customer lists, business strategies, and product roadmaps disclosed',
    'by the Disclosing Party to the Receiving Party in connection with the evaluation of strategic partnership.',
    '',
    '2. Obligations of Receiving Party. The Receiving Party agrees to protect the Confidential Information using the',
    'same degree of care it uses to protect its own confidential materials of like nature, but no less than reasonable care.',
    'The Receiving Party shall not distribute, sublicense, or disclose Confidential Information to any third party',
    'without prior written consent of the Disclosing Party.',
    '',
    '3. Term and Termination. This Agreement shall remain in effect for a period of three (3) years from the Effective',
    'Date, unless superseded by a definitive commercial agreement signed by authorized representatives of both parties.',
    '',
    '4. Governing Law and Jurisdiction. This Agreement shall be governed by and construed in accordance with the laws',
    'of the State of California, without giving effect to conflicts of law principles.',
  ];

  let currentY = height - 140;
  for (const line of p1Text) {
    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
      page1.drawText(line, { x: 45, y: currentY, size: 10, font: timesBold, color: rgb(0.1, 0.1, 0.1) });
    } else {
      page1.drawText(line, { x: 45, y: currentY, size: 10, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
    }
    currentY -= 17;
  }

  // Signatures Section
  currentY -= 20;
  page1.drawText('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.', {
    x: 45,
    y: currentY,
    size: 9,
    font: timesRoman,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 50;

  // Box 1
  page1.drawRectangle({
    x: 45,
    y: currentY - 60,
    width: 220,
    height: 70,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.99),
  });
  page1.drawText('DISCLOSING PARTY:', { x: 55, y: currentY - 5, size: 9, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
  page1.drawText('Apex Technologies Inc.', { x: 55, y: currentY - 22, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
  page1.drawText('Signature: _______________________', { x: 55, y: currentY - 45, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) });

  // Box 2
  page1.drawRectangle({
    x: 310,
    y: currentY - 60,
    width: 220,
    height: 70,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.99),
  });
  page1.drawText('RECEIVING PARTY:', { x: 320, y: currentY - 5, size: 9, font: timesBold, color: rgb(0.2, 0.2, 0.2) });
  page1.drawText('Nova Systems LLC', { x: 320, y: currentY - 22, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
  page1.drawText('Signature: _______________________', { x: 320, y: currentY - 45, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) });

  // Footer
  page1.drawText('Page 1 of 2  -  CONFIDENTIAL', {
    x: width / 2 - 60,
    y: 25,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Page 2: Exhibits
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  page2.drawText('EXHIBIT A: AUTHORIZED REPRESENTATIVES', {
    x: 45,
    y: height - 60,
    size: 14,
    font: timesBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  page2.drawText('The following individuals are designated as primary liaisons for information exchange:', {
    x: 45,
    y: height - 90,
    size: 10,
    font: timesRoman,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Table
  const tableY = height - 130;
  page2.drawRectangle({
    x: 45,
    y: tableY - 140,
    width: 505,
    height: 140,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });

  // Header row
  page2.drawRectangle({
    x: 45,
    y: tableY - 30,
    width: 505,
    height: 30,
    color: rgb(0.9, 0.93, 0.96),
  });
  page2.drawText('Party', { x: 55, y: tableY - 20, size: 9, font: timesBold, color: rgb(0.1, 0.1, 0.1) });
  page2.drawText('Designated Name', { x: 180, y: tableY - 20, size: 9, font: timesBold, color: rgb(0.1, 0.1, 0.1) });
  page2.drawText('Title & Email', { x: 330, y: tableY - 20, size: 9, font: timesBold, color: rgb(0.1, 0.1, 0.1) });

  // Row 1
  page2.drawText('Disclosing (Apex)', { x: 55, y: tableY - 55, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('Elena Rostova', { x: 180, y: tableY - 55, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('VP Engineering (elena@apex.io)', { x: 330, y: tableY - 55, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });

  // Row 2
  page2.drawText('Receiving (Nova)', { x: 55, y: tableY - 95, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('Marcus Chen', { x: 180, y: tableY - 95, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
  page2.drawText('Chief Architect (marcus@nova.dev)', { x: 330, y: tableY - 95, size: 9, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });

  page2.drawText('Page 2 of 2  -  CONFIDENTIAL', {
    x: width / 2 - 60,
    y: 25,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

export async function createSampleInvoicePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Top Accent Bar
  page.drawRectangle({
    x: 0,
    y: height - 12,
    width: width,
    height: 12,
    color: rgb(0.12, 0.35, 0.78),
  });

  // Title & Company
  page.drawText('INVOICE', {
    x: 45,
    y: height - 70,
    size: 28,
    font: helveticaBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText('ACME CLOUD SOLUTIONS', {
    x: width - 220,
    y: height - 60,
    size: 14,
    font: helveticaBold,
    color: rgb(0.12, 0.35, 0.78),
  });

  page.drawText('742 Evergreen Terrace, Suite 500\nSan Francisco, CA 94107\nbilling@acmecloud.com', {
    x: width - 220,
    y: height - 80,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
    lineHeight: 12,
  });

  // Invoice Details Box
  page.drawRectangle({
    x: 45,
    y: height - 165,
    width: width - 90,
    height: 55,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.88, 0.9, 0.94),
    borderWidth: 1,
  });

  page.drawText('Invoice Number: INV-2026-4829', { x: 60, y: height - 135, size: 10, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Invoice Date: September 30, 2026', { x: 60, y: height - 152, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('Due Date: October 30, 2026 (Net 30)', { x: 320, y: height - 135, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Payment Status: PENDING PAYMENT', { x: 320, y: height - 152, size: 9, font: helvetica, color: rgb(0.8, 0.3, 0.1) });

  // Bill To
  page.drawText('BILLED TO:', { x: 45, y: height - 195, size: 9, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('Global Logistics Enterprises\nAttn: Accounts Payable\n100 Enterprise Way, Boston MA 02110\naccounting@globallogistics.org', {
    x: 45,
    y: height - 212,
    size: 9,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
    lineHeight: 13,
  });

  // Items Table Header
  const itemsY = height - 280;
  page.drawRectangle({
    x: 45,
    y: itemsY - 24,
    width: width - 90,
    height: 24,
    color: rgb(0.12, 0.35, 0.78),
  });
  page.drawText('Description', { x: 55, y: itemsY - 16, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('Qty / Hours', { x: 310, y: itemsY - 16, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('Rate', { x: 400, y: itemsY - 16, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('Total', { x: 490, y: itemsY - 16, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });

  // Line items
  const items = [
    { desc: 'Cloud Infrastructure Hosting (Cluster US-East-1)', qty: '1 mo', rate: '$1,850.00', total: '$1,850.00' },
    { desc: 'Database High Availability Replication & Backup', qty: '1 mo', rate: '$420.00', total: '$420.00' },
    { desc: 'Site Reliability Engineering & DevOps Support', qty: '24 hrs', rate: '$125.00', total: '$3,000.00' },
    { desc: 'Enterprise Security Compliance & SSL Audit', qty: '1 svc', rate: '$850.00', total: '$850.00' },
  ];

  let rowY = itemsY - 45;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i % 2 === 1) {
      page.drawRectangle({
        x: 45,
        y: rowY - 10,
        width: width - 90,
        height: 24,
        color: rgb(0.97, 0.98, 0.99),
      });
    }
    page.drawText(item.desc, { x: 55, y: rowY - 2, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(item.qty, { x: 320, y: rowY - 2, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(item.rate, { x: 400, y: rowY - 2, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(item.total, { x: 490, y: rowY - 2, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
    rowY -= 26;
  }

  // Subtotal & Total
  rowY -= 15;
  page.drawLine({
    start: { x: 350, y: rowY },
    end: { x: width - 45, y: rowY },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  rowY -= 18;
  page.drawText('Subtotal:', { x: 380, y: rowY, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('$6,120.00', { x: 490, y: rowY, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });

  rowY -= 16;
  page.drawText('Tax (0.0%):', { x: 380, y: rowY, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('$0.00', { x: 490, y: rowY, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });

  rowY -= 20;
  page.drawRectangle({
    x: 360,
    y: rowY - 6,
    width: width - 405,
    height: 24,
    color: rgb(0.93, 0.95, 0.99),
  });
  page.drawText('TOTAL DUE:', { x: 375, y: rowY + 2, size: 10, font: helveticaBold, color: rgb(0.12, 0.35, 0.78) });
  page.drawText('$6,120.00', { x: 485, y: rowY + 2, size: 11, font: helveticaBold, color: rgb(0.12, 0.35, 0.78) });

  // Bank Info & Notes
  page.drawText('Payment Instructions:', { x: 45, y: 130, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Wire Transfer: Chase Bank  |  Routing: 121000358  |  Account: 9845720194\nSWIFT: CHASUS33  |  Reference: INV-2026-4829', {
    x: 45,
    y: 115,
    size: 8,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
    lineHeight: 11,
  });

  page.drawText('Thank you for your business. For billing inquiries, contact billing@acmecloud.com', {
    x: width / 2 - 150,
    y: 40,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'contract',
    name: 'Mutual NDA Agreement (2 Pages)',
    description: 'Corporate confidentiality agreement with clauses, signature blocks, and exhibits table.',
    category: 'Legal',
    generate: createSampleContractPdf,
  },
  {
    id: 'invoice',
    name: 'Modern Corporate Invoice',
    description: 'Clean business invoice with itemized services, totals, and bank wire instructions.',
    category: 'Finance',
    generate: createSampleInvoicePdf,
  },
  {
    id: 'blank-a4',
    name: 'Blank Document (A4)',
    description: 'Clean blank canvas (595 x 842 pt) for designing resumes, flyers, or custom docs.',
    category: 'General',
    generate: () => createBlankDocPdf(595.28, 841.89),
  },
  {
    id: 'blank-letter',
    name: 'Blank Document (US Letter)',
    description: 'Standard 8.5 x 11 inch blank document (612 x 792 pt).',
    category: 'General',
    generate: () => createBlankDocPdf(612, 792),
  },
];
