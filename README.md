# PDFForge - Professional Browser-Based PDF Editor

PDFForge is a desktop-grade, browser-based PDF document editor combining the capabilities of **Microsoft Word** (inline text editing, text wrap, typography, find & replace), **Adobe Acrobat** (page management, AcroForms, digital signatures, extraction, OCR), and **Canva/Figma** (freeform canvas positioning, 8-handle resizing, rotation, magnetic snapping alignment guides, layers, z-index ordering).

---

## 🚀 Key Features

### 1. Word-Like Inline Text Editing
- **Click to Edit Original PDF Text**: Click any text block to immediately transform it into an editable text box with an automatic whiteout redact mask covering the underlying static PDF glyph.
- **Word Formatting**: Font family (Inter, Times New Roman, Courier, Roboto, Georgia, Merriweather), font size, bold, italic, underline, strikethrough, text color, alignment (left/center/right/justify), line spacing, and letter spacing.
- **Contextual Floating Toolbar**: Appears directly above selected text blocks for quick Word-style formatting.
- **Full Keyboard Shortcuts**: `Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Z`, `Ctrl+Y`, `Ctrl+C`, `Ctrl+V`, `Ctrl+D`, `Delete`, `Shift+Arrow`.

### 2. Canva-Style Object Manipulation
- **Drag & Drop**: Freehand positioning with smart magnetic guidelines (page center, margins, object edge and center snapping).
- **8-Handle Resize & Free Transform**: Resize from any edge or corner with `Shift` to preserve aspect ratio.
- **Full Rotation**: Top rotation handle with degree indicator and 15° shift-snapping.
- **Supported Objects**:
  - Text Boxes
  - Images (PNG, JPG, WebP, SVG) with flip horizontal/vertical, corner radius, borders, and shadows
  - Shapes (Rectangle, Ellipse, Line, Arrow, Triangle)
  - Rubber Stamps (`APPROVED`, `CONFIDENTIAL`, `DRAFT`, `PAID`, `REJECTED`, Custom)
  - Tables with editable grid cells and header styles
  - Sticky Note Comments
  - Interactive Form Fields (Text inputs, Checkboxes, Dropdowns)

### 3. Digital Signatures
- **Draw**: Smooth bezier curve canvas pad with pen color and clear tools.
- **Type**: 4 elegant cursive script fonts (`Great Vibes`, `Dancing Script`, `Caveat`, `Playfair Display`).
- **Upload**: Signature image file with automatic transparency.
- **Reusable Signature Library**: Stored in `localStorage` for 1-click re-use across contracts and invoices.

### 4. Acrobat Page Management
- **Draggable Thumbnail Sidebar**: Real-time rendering of all pages via PDF.js.
- **Page Operations**: Add Blank Page, Duplicate Page, Rotate 90° Clockwise/Counter-clockwise, Delete Page, Reorder Pages.
- **Merge & Split**: Append pages from another PDF file or extract selected pages into a new PDF document.

### 5. Client-Side OCR (Optical Character Recognition)
- Built-in `tesseract.js` engine that detects scanned image-only pages and extracts editable text layers aligned with the original bounding box coordinates.
- Multi-language support: English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese.

### 6. Search & Replace
- Document-wide `Ctrl+F` Find and `Ctrl+H` Replace toolbar with next/prev navigation, match counts, match case, and whole word filters.
- Supports single Replace and **Replace All** across all pages.

### 7. Export Engine
- High-fidelity PDF generation via `pdf-lib` preserving original vector graphics, fonts, embedded images, form fields, and rotations.
- Export as editable PDF or flattened PDF.
- 300-DPI high-resolution page image export (PNG).

### 8. Privacy-First Architecture
- **100% Local-First**: PDF parsing, text extraction, visual editing, and PDF regeneration happen client-side in the browser. No raw PDF documents are transmitted to external servers without explicit user cloud sync.

---

## 🏗️ Architecture & Cloudflare Deployment

PDFForge is designed for modern cloud edge deployment:

- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand, PDF.js, pdf-lib, Lucide Icons.
- **Cloud Backend**: Cloudflare Workers (`worker/index.ts`).
- **Database**: Cloudflare D1 (`db/migrations/0001_initial.sql`).
- **Storage**: Cloudflare R2 object storage for project backups and documents.

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npx tsx tests/pdfModel.test.ts

# Production build
npm run build
```

### Cloudflare Deployment
```bash
# Login to Cloudflare Wrangler
npx wrangler login

# Create D1 database
npx wrangler d1 create pdfforge_production

# Apply database migrations
npx wrangler d1 execute pdfforge_production --file=./db/migrations/0001_initial.sql

# Create R2 bucket
npx wrangler r2 bucket create pdfforge-documents

# Deploy to Cloudflare Workers
npx wrangler deploy
```

---

## 🧪 Testing

Automated test suite covers:
- PDF document creation and font embedding
- Text replacement with whiteout redact layer verification
- PDF re-loading and page count integrity
- Canva-style magnetic snapping calculations
Run with:
```bash
npx tsx tests/pdfModel.test.ts
```
