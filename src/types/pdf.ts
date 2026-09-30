export type EditorTool =
  | 'select'
  | 'hand'
  | 'text'
  | 'image'
  | 'shape'
  | 'draw'
  | 'highlight'
  | 'signature'
  | 'stamp'
  | 'form_text'
  | 'form_check'
  | 'form_radio'
  | 'form_dropdown'
  | 'sticky_note'
  | 'table'
  | 'eraser';

export type ShapeType = 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'triangle' | 'star';

export type AnnotationType = 'highlight' | 'freehand' | 'underline' | 'strikeout' | 'sticky' | 'callout';

export type StampType =
  | 'APPROVED'
  | 'CONFIDENTIAL'
  | 'DRAFT'
  | 'REJECTED'
  | 'FINAL'
  | 'PAID'
  | 'URGENT'
  | 'COMPLETED'
  | 'CUSTOM';

export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'date' | 'signature';

export interface BaseObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'annotation' | 'signature' | 'formField' | 'stamp' | 'table';
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees 0-360
  opacity: number; // 0-1
  zIndex: number;
  locked: boolean;
  visible: boolean;
  name: string;
}

export interface TextObject extends BaseObject {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '500' | '600' | '700' | '800';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  strikethrough: boolean;
  color: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  backgroundColor?: string;
  isOriginalPdfText?: boolean;
  originalPdfFont?: string;
  originalPdfIndex?: number;
  redactBackground?: boolean; // if true, render an opaque patch covering the underlying PDF text
}

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string; // Data URL or object URL
  originalWidth: number;
  originalHeight: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  flipX: boolean;
  flipY: boolean;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
  mimeType?: string;
}

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  arrowStart?: boolean;
  arrowEnd?: boolean;
  borderRadius?: number;
}

export interface AnnotationObject extends BaseObject {
  type: 'annotation';
  annotationType: AnnotationType;
  path?: Array<{ x: number; y: number }>;
  strokeColor: string;
  strokeWidth: number;
  text?: string;
  commentAuthor?: string;
  commentDate?: string;
  resolved?: boolean;
}

export interface SignatureObject extends BaseObject {
  type: 'signature';
  signatureType: 'draw' | 'type' | 'upload';
  dataUrl: string;
  signerName?: string;
  date?: string;
  penColor?: string;
}

export interface FormFieldObject extends BaseObject {
  type: 'formField';
  fieldType: FormFieldType;
  fieldName: string;
  defaultValue: string | boolean;
  currentValue: string | boolean;
  options?: string[]; // for dropdown or radio
  required: boolean;
  readOnly: boolean;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface StampObject extends BaseObject {
  type: 'stamp';
  stampType: StampType;
  text: string;
  color: string;
  dateString?: string;
  hasBorder: boolean;
}

export interface TableObject extends BaseObject {
  type: 'table';
  rows: number;
  cols: number;
  data: string[][];
  cellWidths: number[];
  cellHeights: number[];
  borderColor: string;
  borderWidth: number;
  headerBackground: string;
  cellBackground: string;
  textColor: string;
  fontSize: number;
}

export type EditorObject =
  | TextObject
  | ImageObject
  | ShapeObject
  | AnnotationObject
  | SignatureObject
  | FormFieldObject
  | StampObject
  | TableObject;

export interface PDFTextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  color?: string;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  pdfVersion?: string;
}

export interface PageModel {
  id: string;
  pageNumber: number; // 1-indexed
  originalPageNumber?: number;
  width: number; // points (e.g., 595.28 for A4, 612 for US Letter)
  height: number; // points (e.g., 841.89 for A4, 792 for US Letter)
  rotation: number; // 0, 90, 180, 270
  background: string;
  objects: EditorObject[];
  originalTextBlocks: PDFTextBlock[];
  isScanned?: boolean;
  ocrApplied?: boolean;
}

export interface PDFDocModel {
  id: string;
  title: string;
  pageCount: number;
  pages: PageModel[];
  metadata: PDFMetadata;
  createdAt: string;
  updatedAt: string;
  originalPdfBytes?: Uint8Array;
}

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number; // in page coordinates
  start: number;
  end: number;
  label?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  pagesSnapshot: PageModel[];
  selectedObjectIds: string[];
}

export interface SavedSignature {
  id: string;
  title: string;
  dataUrl: string;
  type: 'draw' | 'type' | 'upload';
  createdAt: number;
}

export interface SearchMatch {
  pageIndex: number;
  textBlockId?: string;
  objectId?: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  matchIndex: number;
}
