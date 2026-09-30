/**
 * Cloudflare Worker for PDFForge Enterprise API
 * Integrates Cloudflare D1 (SQL Database) and Cloudflare R2 (Object Storage)
 */

export interface D1Database {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      run: () => Promise<any>;
      all: () => Promise<{ results: any[] }>;
    };
    all: () => Promise<{ results: any[] }>;
  };
}

export interface R2Bucket {
  get: (key: string) => Promise<any>;
  put: (key: string, value: any) => Promise<any>;
}

export interface Env {
  DB: D1Database;
  DOCUMENTS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health Check
    if (pathname === '/api/health') {
      return Response.json(
        {
          status: 'healthy',
          runtime: 'Cloudflare Workers (Edge)',
          database: 'Cloudflare D1',
          storage: 'Cloudflare R2',
          timestamp: new Date().toISOString(),
        },
        { headers: corsHeaders }
      );
    }

    // Projects Routes
    if (pathname === '/api/projects') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, title, page_count, created_at, updated_at FROM projects ORDER BY updated_at DESC LIMIT 50'
        ).all();
        return Response.json({ success: true, projects: results }, { headers: corsHeaders });
      }

      if (method === 'POST') {
        const body: any = await request.json();
        const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();

        await env.DB.prepare(
          'INSERT INTO projects (id, title, page_count, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
          .bind(id, body.title || 'Untitled', body.pageCount || 1, JSON.stringify(body.metadata || {}), now, now)
          .run();

        return Response.json({ success: true, id }, { status: 201, headers: corsHeaders });
      }
    }

    // Documents R2 storage route
    if (pathname.startsWith('/api/documents/')) {
      const docId = pathname.replace('/api/documents/', '');
      if (method === 'GET') {
        const object = await env.DOCUMENTS_BUCKET.get(docId);
        if (!object) {
          return Response.json({ error: 'Document not found' }, { status: 404, headers: corsHeaders });
        }
        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers as any);
        headers.set('etag', object.httpEtag);
        return new Response(object.body, { headers });
      }
    }

    return Response.json({ error: 'Not Found' }, { status: 404, headers: corsHeaders });
  },
};
