import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const middlewareSource = readFileSync(
  fileURLToPath(new URL('./middleware.ts', import.meta.url)),
  'utf8',
);

describe('middleware routing boundary', () => {
  it('excludes API and tRPC routes from locale and authentication middleware', () => {
    expect(middlewareSource).toContain('api|trpc|_next|_vercel');
  });
});
