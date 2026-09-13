import { describe, expect, it, vi } from 'vitest';

import {
  createFixedWindowRateLimiter,
  createNvidiaGatewayHandler,
  GATEWAY_WINDOW_MS,
  MAX_OUTPUT_TOKENS,
  NVIDIA_GATEWAY_MODEL,
  requestNvidiaCompletion,
  validatePrompt,
} from './NvidiaGateway';

const serviceToken = 'nova-gateway-token-that-is-long-enough-for-tests';

function createRequest(prompt: unknown, token = serviceToken) {
  return new Request('https://gateway.test/api/nvidia/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });
}

function createStreamingRequestBody(chunks: string[]): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
}

describe('NvidiaGateway', () => {
  it('rejects empty and oversized prompts before provider invocation', () => {
    expect(() => validatePrompt('   ')).toThrow('A text prompt is required.');
    expect(() => validatePrompt('a'.repeat(12_001))).toThrow('Prompt must not exceed');
  });

  it('requires the service token and never calls NVIDIA for unauthorized requests', async () => {
    const fetchImpl = vi.fn();
    const handler = createNvidiaGatewayHandler({
      getApiKey: () => 'nvidia-secret',
      getServiceToken: () => serviceToken,
      fetchImpl,
    });

    const response = await handler(createRequest('Hello', 'incorrect-token'));

    expect(response.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uses a fixed-window rate limit before forwarding to NVIDIA', async () => {
    let time = 0;
    const limiter = createFixedWindowRateLimiter(1, GATEWAY_WINDOW_MS, () => time);
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(
      Response.json({
        model: NVIDIA_GATEWAY_MODEL,
        choices: [{ message: { content: 'Ready.' } }],
        usage: { total_tokens: 3 },
      }),
    ));
    const handler = createNvidiaGatewayHandler({
      getApiKey: () => 'nvidia-secret',
      getServiceToken: () => serviceToken,
      fetchImpl,
      rateLimiter: limiter,
    });

    expect((await handler(createRequest('First'))).status).toBe(200);
    expect((await handler(createRequest('Second'))).status).toBe(429);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    time = GATEWAY_WINDOW_MS;

    expect((await handler(createRequest('Third'))).status).toBe(200);
  });

  it('forwards only the gateway-owned model and bounded completion parameters', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      Response.json({
        model: NVIDIA_GATEWAY_MODEL,
        choices: [{ message: { content: 'A bounded response.' } }],
        usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
      }),
    );
    const handler = createNvidiaGatewayHandler({
      getApiKey: () => 'nvidia-secret',
      getServiceToken: () => serviceToken,
      fetchImpl,
    });

    const response = await handler(createRequest('Explain a gateway.'));
    const payload = await response.json();
    const upstreamCall = fetchImpl.mock.calls[0];
    const upstreamRequest = JSON.parse(String(upstreamCall?.[1]?.body));

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ text: 'A bounded response.', model: NVIDIA_GATEWAY_MODEL });
    expect(upstreamCall?.[0]).toBe('https://integrate.api.nvidia.com/v1/chat/completions');
    expect(upstreamCall?.[1]?.headers).toMatchObject({ Authorization: 'Bearer nvidia-secret' });
    expect(upstreamRequest).toEqual({
      model: NVIDIA_GATEWAY_MODEL,
      messages: [{ role: 'user', content: 'Explain a gateway.' }],
      temperature: 0.2,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: false,
    });
  });

  it('normalizes provider failures without leaking raw upstream details', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('upstream details', { status: 500 }));
    const handler = createNvidiaGatewayHandler({
      getApiKey: () => 'nvidia-secret',
      getServiceToken: () => serviceToken,
      fetchImpl,
    });

    const response = await handler(createRequest('Hello'));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: { message: 'NVIDIA inference is temporarily unavailable. Please retry shortly.' },
    });
    expect(JSON.stringify(body)).not.toContain('upstream details');
  });

  it('streams provider deltas when a stream is requested', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createStreamingRequestBody([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n',
        '\ndata: {"choices":[{"delta":{"content":"lo "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"world"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );
    const deltas: string[] = [];

    const result = await requestNvidiaCompletion('Hello', 'nvidia-secret', fetchImpl, {
      stream: true,
      onDelta: delta => deltas.push(delta),
    });

    const upstreamRequest = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));

    expect(upstreamRequest.stream).toBe(true);
    expect(deltas).toEqual(['Hel', 'lo ', 'world']);
    expect(result.text).toBe('Hello world');
  });

  it('relays provider SSE deltas and terminates with [DONE] for streaming requests', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createStreamingRequestBody([
        'data: {"choices":[{"delta":{"content":"Hi "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"there"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );
    const handler = createNvidiaGatewayHandler({
      getApiKey: () => 'nvidia-secret',
      getServiceToken: () => serviceToken,
      fetchImpl,
    });

    const response = await handler(
      new Request('https://gateway.test/api/nvidia/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'Hello', stream: true }),
      }),
    );

    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(await response.text()).toBe(
      'data: {"choices":[{"delta":{"content":"Hi "}}]}\n\n'
      + 'data: {"choices":[{"delta":{"content":"there"}}]}\n\n'
      + 'data: [DONE]\n\n',
    );
  });

  it('returns the exact legacy JSON payload shape when stream is false (default)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      Response.json({
        model: NVIDIA_GATEWAY_MODEL,
        choices: [{ message: { content: 'Legacy response.' } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    );
    const handler = createNvidiaGatewayHandler({
      getApiKey: () => 'nvidia-secret',
      getServiceToken: () => serviceToken,
      fetchImpl,
    });

    const response = await handler(createRequest('Hello'));
    const upstreamRequest = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: 'Legacy response.',
      model: NVIDIA_GATEWAY_MODEL,
      usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
    });
    expect(upstreamRequest.stream).toBe(false);
  });
});
