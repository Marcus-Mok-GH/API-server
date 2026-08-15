const NVIDIA_CHAT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const NVIDIA_GATEWAY_MODEL = 'nvidia/nemotron-3-nano-30b-a3b';
export const MAX_PROMPT_CHARS = 12_000;
export const MAX_OUTPUT_TOKENS = 1_024;
export const GATEWAY_WINDOW_MS = 60_000;
export const GATEWAY_REQUEST_LIMIT = 15;
export const NVIDIA_TIMEOUT_MS = 18_000;

type GatewayErrorStatus = 400 | 401 | 429 | 502 | 503;

export class NvidiaGatewayError extends Error {
  public readonly status: GatewayErrorStatus;

  constructor(message: string, status: GatewayErrorStatus) {
    super(message);
    this.name = 'NvidiaGatewayError';
    this.status = status;
  }
}

export type RateLimiter = {
  tryTake: () => boolean;
};

export type NvidiaGatewayDependencies = {
  getApiKey: () => string | undefined;
  getServiceToken: () => string | undefined;
  fetchImpl?: typeof fetch;
  rateLimiter?: RateLimiter;
};

type NvidiaCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  model?: string;
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

export function createFixedWindowRateLimiter(
  limit = GATEWAY_REQUEST_LIMIT,
  windowMs = GATEWAY_WINDOW_MS,
  now: () => number = Date.now,
): RateLimiter {
  let windowStartedAt = now();
  let requestCount = 0;

  return {
    tryTake: () => {
      const currentTime = now();
      if (currentTime - windowStartedAt >= windowMs) {
        windowStartedAt = currentTime;
        requestCount = 0;
      }

      if (requestCount >= limit) {
        return false;
      }
      requestCount += 1;
      return true;
    },
  };
}

export function isAuthorizedGatewayRequest(
  authorizationHeader: string | null,
  serviceToken: string | undefined,
): boolean {
  if (!serviceToken) {
    return false;
  }
  return authorizationHeader === `Bearer ${serviceToken}`;
}

export function validatePrompt(value: unknown): string {
  if (typeof value !== 'string') {
    throw new NvidiaGatewayError('A text prompt is required.', 400);
  }

  const prompt = value.trim();
  if (!prompt) {
    throw new NvidiaGatewayError('A text prompt is required.', 400);
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    throw new NvidiaGatewayError(
      `Prompt must not exceed ${MAX_PROMPT_CHARS.toLocaleString()} characters.`,
      400,
    );
  }

  return prompt;
}

async function parsePrompt(request: Request): Promise<string> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      throw new NvidiaGatewayError('A JSON request body is required.', 400);
    }

    return validatePrompt((body as { prompt?: unknown }).prompt);
  } catch (error) {
    if (error instanceof NvidiaGatewayError) {
      throw error;
    }
    throw new NvidiaGatewayError('A valid JSON request body is required.', 400);
  }
}

function jsonError(message: string, status: GatewayErrorStatus): Response {
  return Response.json({ error: { message } }, { status });
}

export async function requestNvidiaCompletion(
  prompt: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ text: string; model: string; usage: NvidiaCompletion['usage'] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);

  try {
    const response = await fetchImpl(NVIDIA_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_GATEWAY_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const status: GatewayErrorStatus = response.status === 429 ? 429 : 502;
      throw new NvidiaGatewayError(
        status === 429
          ? 'NVIDIA inference is temporarily rate-limited. Please retry shortly.'
          : 'NVIDIA inference is temporarily unavailable. Please retry shortly.',
        status,
      );
    }

    const completion = (await response.json()) as NvidiaCompletion;
    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new NvidiaGatewayError('NVIDIA returned an empty completion.', 502);
    }

    return {
      text,
      model: completion.model || NVIDIA_GATEWAY_MODEL,
      usage: completion.usage,
    };
  } catch (error) {
    if (error instanceof NvidiaGatewayError) {
      throw error;
    }
    throw new NvidiaGatewayError('NVIDIA inference is temporarily unavailable. Please retry shortly.', 502);
  } finally {
    clearTimeout(timeout);
  }
}

export function createNvidiaGatewayHandler({
  getApiKey,
  getServiceToken,
  fetchImpl = fetch,
  rateLimiter = createFixedWindowRateLimiter(),
}: NvidiaGatewayDependencies): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const apiKey = getApiKey();
    const serviceToken = getServiceToken();
    if (!apiKey || !serviceToken) {
      return jsonError('NVIDIA gateway is not configured.', 503);
    }

    if (!isAuthorizedGatewayRequest(request.headers.get('authorization'), serviceToken)) {
      return jsonError('Unauthorized.', 401);
    }

    if (!rateLimiter.tryTake()) {
      return jsonError('Gateway rate limit reached. Please retry shortly.', 429);
    }

    try {
      const prompt = await parsePrompt(request);
      const completion = await requestNvidiaCompletion(prompt, apiKey, fetchImpl);
      return Response.json(completion, { status: 200 });
    } catch (error) {
      if (error instanceof NvidiaGatewayError) {
        return jsonError(error.message, error.status);
      }

      return jsonError('NVIDIA inference is temporarily unavailable. Please retry shortly.', 502);
    }
  };
}
