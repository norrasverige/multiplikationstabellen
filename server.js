import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '127.0.0.1';

export function resolveRequestPath(requestPath, rootDir = __dirname) {
  const sanitizedPath = requestPath.split('?')[0].split('#')[0] || '/';
  const targetPath = sanitizedPath === '/' ? '/index.html' : sanitizedPath;
  const absolutePath = path.resolve(rootDir, `.${targetPath}`);
  const relativePath = path.relative(rootDir, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Path escapes the app root: ${requestPath}`);
  }

  return absolutePath;
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

async function sendFile(response, filePath) {
  const content = await fs.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, { 'Content-Type': mimeTypes[extension] || 'application/octet-stream' });
  response.end(content);
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    const requestedPath = requestUrl.pathname;
    const resolvedPath = resolveRequestPath(requestedPath, __dirname);

    try {
      const stats = await fs.stat(resolvedPath);
      const filePath = stats.isDirectory() ? path.join(resolvedPath, 'index.html') : resolvedPath;
      await sendFile(response, filePath);
      return;
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
  } catch (error) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
  }
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(port, host, () => {
    console.log(`Multiplikationstabellen is running at http://${host}:${port}`);
  });
}

export default server;

