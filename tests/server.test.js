import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRequestPath } from '../server.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

test('resolveRequestPath serves HTML from the project root', () => {
  const resolved = resolveRequestPath('/', path.join(rootDir, '..'));
  assert.match(resolved, /index\.html$/);
});

test('resolveRequestPath refuses paths that escape the project root', () => {
  assert.throws(() => resolveRequestPath('/../../etc/passwd', path.join(rootDir, '..')));
});
