import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const preferredPort = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';
const serveRoot = path.join(__dirname, 'dist');
const hasBuiltApp = await fs.access(serveRoot).then(() => true).catch(() => false);

function listenOnPort(server, portToTry, maxAttempts = 10) {
  server.once('error', error => {
    if (error.code === 'EADDRINUSE' && portToTry < preferredPort + maxAttempts) {
      const nextPort = portToTry + 1;
      console.warn(`Port ${portToTry} is already in use; trying ${nextPort} instead.`);
      listenOnPort(server, nextPort, maxAttempts - 1);
      return;
    }

    if (error.code === 'EADDRINUSE') {
      console.error(`No free port found starting from ${preferredPort}. Please stop the other process or choose a different PORT.`);
      process.exitCode = 1;
      return;
    }

    throw error;
  });

  server.listen(portToTry, host, () => {
    console.log(`Multiplikationstabellen is running at http://${host}:${portToTry}`);
  });
}

export function resolveRequestPath(requestPath, rootDir = hasBuiltApp ? serveRoot : __dirname) {
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
    const resolvedPath = resolveRequestPath(requestedPath);

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
  listenOnPort(server, preferredPort);
}

export default server;

