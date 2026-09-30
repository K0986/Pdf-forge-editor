import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for JSON & form parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory data store for server-side persistence fallback
const projectsDb: Map<string, any> = new Map();
const documentsDb: Map<string, any> = new Map();
const historyDb: Array<any> = [];

// --- API ROUTES ---

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    engine: 'PDFForge v2.0 Enterprise',
    privacy: 'Local-first architecture enabled',
    timestamp: new Date().toISOString(),
  });
});

// Projects API
app.get('/api/projects', (_req: Request, res: Response) => {
  res.json({
    success: true,
    projects: Array.from(projectsDb.values()),
  });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { title, metadata, pages } = req.body;
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const project = {
    id,
    title: title || 'Untitled Project',
    metadata: metadata || {},
    pagesCount: pages?.length || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projectsDb.set(id, project);
  res.status(201).json({ success: true, project });
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const proj = projectsDb.get(req.params.id);
  if (!proj) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, project: proj });
});

app.patch('/api/projects/:id', (req: Request, res: Response) => {
  const proj = projectsDb.get(req.params.id);
  if (!proj) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  const updated = { ...proj, ...req.body, updatedAt: new Date().toISOString() };
  projectsDb.set(req.params.id, updated);
  res.json({ success: true, project: updated });
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  if (!projectsDb.has(req.params.id)) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  projectsDb.delete(req.params.id);
  res.json({ success: true, message: 'Project deleted' });
});

// Documents API
app.post('/api/documents', (req: Request, res: Response) => {
  const { docModel } = req.body;
  if (!docModel) {
    return res.status(400).json({ success: false, error: 'Missing document payload' });
  }
  const id = docModel.id || `doc_${Date.now()}`;
  documentsDb.set(id, { ...docModel, savedAt: new Date().toISOString() });
  res.status(201).json({ success: true, id, message: 'Document saved successfully' });
});

app.get('/api/documents/:id', (req: Request, res: Response) => {
  const doc = documentsDb.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, document: doc });
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  documentsDb.delete(req.params.id);
  res.json({ success: true, message: 'Document deleted' });
});

// History API
app.post('/api/history', (req: Request, res: Response) => {
  const entry = { id: `hist_${Date.now()}`, ...req.body, timestamp: Date.now() };
  historyDb.push(entry);
  if (historyDb.length > 100) historyDb.shift();
  res.status(201).json({ success: true, entry });
});

app.get('/api/history', (_req: Request, res: Response) => {
  res.json({ success: true, history: historyDb });
});

// Server-side Extract text / images fallback
app.post('/api/extract-text', (req: Request, res: Response) => {
  const { pages } = req.body;
  if (!pages || !Array.isArray(pages)) {
    return res.status(400).json({ success: false, error: 'Invalid pages array' });
  }
  const extracted = pages.map((p: any, idx: number) => ({
    page: idx + 1,
    textBlocks: p.originalTextBlocks || [],
  }));
  res.json({ success: true, extracted });
});

app.post('/api/export', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PDF exported client-side via pdf-lib for maximum fidelity and zero server latency',
  });
});

// --- VITE MIDDLEWARE (DEV) & STATIC FILES (PROD) ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`PDFForge Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
