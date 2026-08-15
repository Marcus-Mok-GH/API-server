import { describe, expect, it } from 'vitest';

import { API_SAFE_MIDDLEWARE_MATCHER } from './libs/MiddlewareConfig';

describe('middleware routing boundary', () => {
  it('excludes API and tRPC routes from locale and authentication middleware', () => {
    expect(API_SAFE_MIDDLEWARE_MATCHER).toContain('api');
    expect(API_SAFE_MIDDLEWARE_MATCHER).toContain('trpc');
  });
});
