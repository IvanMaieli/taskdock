import { createServer } from 'node:http';

/** Read-only foundation API. Execution endpoints are not implemented yet. */
export function createApp() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method === 'GET' && request.url === '/api/health') {
      response.writeHead(200);
      response.end(JSON.stringify({ name: 'TaskDock', status: 'ok' }));
      return;
    }
    response.writeHead(404);
    response.end(JSON.stringify({ error: 'Not found' }));
  });
}
