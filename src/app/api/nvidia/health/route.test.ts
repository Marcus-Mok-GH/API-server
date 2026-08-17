import { afterEach, describe, expect, it } from 'vitest';

import { dynamic, GET } from './route';

const originalApiKey = process.env.NVIDIA_API_KEY;
const originalGatewayToken = process.env.NOVA_NVIDIA_GATEWAY_TOKEN;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.NVIDIA_API_KEY;
  } else {
    process.env.NVIDIA_API_KEY = originalApiKey;
  }
  if (originalGatewayToken === undefined) {
    delete process.env.NOVA_NVIDIA_GATEWAY_TOKEN;
  } else {
    process.env.NOVA_NVIDIA_GATEWAY_TOKEN = originalGatewayToken;
  }
});

describe('NVIDIA health route', () => {
  it('is dynamic and returns a parseable safe configuration status', async () => {
    delete process.env.NVIDIA_API_KEY;
    process.env.NOVA_NVIDIA_GATEWAY_TOKEN = 'gateway-token';

    const response = GET();

    expect(dynamic).toBe('force-dynamic');
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      provider: 'nvidia-nim',
      providerConfigured: false,
    });
  });
});
