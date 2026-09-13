'use client';

import Link from 'next/link';
import { useState } from 'react';

type Provider = 'nvidia' | 'gemini';

type PlaygroundResponse = {
  ok: boolean;
  status: number;
  duration: number;
  payload: unknown;
};

type HealthResponse = {
  status?: string;
  provider?: string;
  providerConfigured?: boolean;
  error?: unknown;
};

const examples = [
  {
    label: 'Explain a concept',
    prompt: 'Explain rate limiting in one sentence, then give one practical example.',
  },
  {
    label: 'Write a plan',
    prompt: 'Give me a concise three-step plan for launching a small API.',
  },
  {
    label: 'Review an idea',
    prompt: 'What are the most important things to monitor in a production API?',
  },
];

const defaultPrompt = examples[0]?.prompt ?? '';

function getErrorMessage(payload: unknown, status: number) {
  if (typeof payload === 'string' && payload) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const data = payload as {
      error?: string | { message?: string };
      message?: string;
    };

    if (typeof data.error === 'string') {
      return data.error;
    }

    if (data.error?.message) {
      return data.error.message;
    }

    if (data.message) {
      return data.message;
    }
  }

  return `Request failed with status ${status}.`;
}

function getResponseText(payload: unknown) {
  if (
    !payload
    || typeof payload !== 'object'
    || !('text' in payload)
    || typeof payload.text !== 'string'
  ) {
    return null;
  }

  return payload.text;
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? '';
}

export function PlaygroundClient() {
  const [provider, setProvider] = useState<Provider>('nvidia');
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [token, setToken] = useState('');
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const endpoint = provider === 'nvidia' ? '/api/nvidia/chat' : '/api/gemini';
  const model
    = provider === 'nvidia'
      ? 'nvidia/nemotron-3-nano-30b-a3b'
      : 'gemini-1.5-flash';

  async function runPrompt() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError('Add a prompt before running the request.');
      return;
    }

    if (provider === 'nvidia' && !token.trim()) {
      setError('Add your NVIDIA gateway token to test this endpoint.');
      return;
    }

    setError('');
    setResponse(null);
    setCopied(false);
    setIsRunning(true);
    const startedAt = performance.now();

    try {
      const request = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider === 'nvidia'
            ? { Authorization: `Bearer ${token.trim()}` }
            : {}),
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });
      const rawBody = await request.text();
      let payload: unknown = rawBody;

      try {
        payload = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        // Keep plain-text responses, such as an unauthenticated Clerk response.
      }

      setResponse({
        ok: request.ok,
        status: request.status,
        duration: Math.round(performance.now() - startedAt),
        payload,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The request could not be sent.',
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function checkHealth() {
    setIsCheckingHealth(true);

    try {
      const request = await fetch('/api/nvidia/health', { cache: 'no-store' });
      const payload = (await request.json()) as HealthResponse;
      setHealth(payload);
    } catch {
      setHealth({ error: 'Health check could not be completed.' });
    } finally {
      setIsCheckingHealth(false);
    }
  }

  async function copyResponse() {
    if (!response) {
      return;
    }

    await navigator.clipboard.writeText(formatJson(response.payload));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const responseText = getResponseText(response?.payload);

  return (
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live playground
          </div>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Send a real request.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Try the configured model routes from this browser. Responses come
            from your running API server, so you can validate auth, latency,
            and payloads before writing client code.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-slate-200">
              {`POST ${endpoint}`}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-slate-200">
              {model}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
                Request
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Test a model endpoint
              </h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {isRunning ? 'Running…' : 'Ready'}
            </span>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {(['nvidia', 'gemini'] as Provider[]).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setProvider(option);
                  setResponse(null);
                  setError('');
                }}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  provider === option
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-950 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="block text-sm font-semibold">
                  {option === 'nvidia' ? 'NVIDIA NIM' : 'Google Gemini'}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {option === 'nvidia'
                    ? 'Gateway token · 15 req/min'
                    : 'Clerk session · 10 requests'}
                </span>
              </button>
            ))}
          </div>

          {provider === 'nvidia'
            ? (
                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    NVIDIA gateway token
                  </span>
                  <input
                    type="password"
                    value={token}
                    onChange={event => setToken(event.target.value)}
                    placeholder="Bearer token value"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  />
                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    Used for this request only. It stays in browser memory and
                    is sent to the local API route as an Authorization header.
                  </span>
                </label>
              )
            : (
                <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
                  Gemini uses the current Clerk session.
                  {' '}
                  <Link
                    href="/sign-in/"
                    className="font-semibold underline decoration-violet-300 underline-offset-4 hover:decoration-violet-700"
                  >
                    Sign in
                  </Link>
                  {' '}
                  if the request returns 401.
                </div>
              )}

          <div className="mt-6 flex flex-wrap gap-2">
            {examples.map(example => (
              <button
                key={example.label}
                type="button"
                onClick={() => setPrompt(example.prompt)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
              >
                {example.label}
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              Prompt
            </span>
            <textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              rows={8}
              maxLength={12000}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              placeholder="Ask the model something…"
            />
            <span className="mt-2 block text-right text-xs text-slate-400">
              {prompt.length.toLocaleString()}
              {' '}
              / 12,000
            </span>
          </label>

          {error
            ? (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800"
                >
                  {error}
                </div>
              )
            : null}

          <button
            type="button"
            onClick={runPrompt}
            disabled={isRunning}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-cyan-950 disabled:cursor-wait disabled:opacity-60"
          >
            {isRunning ? 'Sending request…' : `Run ${provider === 'nvidia' ? 'NVIDIA' : 'Gemini'} request`}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                Response
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                Inspect the payload
              </h3>
            </div>
            {response
              ? (
                  <button
                    type="button"
                    onClick={copyResponse}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                )
              : null}
          </div>

          {response
            ? (
                <>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-white/10 p-3">
                      <span className="block text-slate-400">Status</span>
                      <strong
                        className={`mt-1 block text-lg ${
                          response.ok ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {response.status}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white/10 p-3">
                      <span className="block text-slate-400">Time</span>
                      <strong className="mt-1 block text-lg text-cyan-200">
                        {response.duration}
                        ms
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white/10 p-3">
                      <span className="block text-slate-400">Route</span>
                      <strong className="mt-1 block truncate text-lg text-violet-200">
                        {provider}
                      </strong>
                    </div>
                  </div>
                  {responseText
                    ? (
                        <div className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                            Generated text
                          </p>
                          <p className="whitespace-pre-wrap">{responseText}</p>
                        </div>
                      )
                    : null}
                  <pre className="mt-5 max-h-[28rem] overflow-auto rounded-xl bg-black/30 p-4 text-xs leading-6 text-slate-300">
                    <code>{formatJson(response.payload)}</code>
                  </pre>
                </>
              )
            : (
                <div className="mt-6 flex min-h-[22rem] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-2xl text-cyan-200">
                      {'{ }'}
                    </div>
                    <p className="mt-4 font-semibold text-white">
                      Your response will appear here
                    </p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                      Run a request to see status, latency, generated text, and the
                      raw JSON payload.
                    </p>
                  </div>
                </div>
              )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
              Service status
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Is the NVIDIA gateway ready?
            </h3>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            disabled={isCheckingHealth}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-900 disabled:cursor-wait disabled:opacity-60"
          >
            {isCheckingHealth ? 'Checking…' : 'Check health'}
          </button>
        </div>
        {health
          ? (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    health.status === 'ok' && health.providerConfigured
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="font-semibold text-slate-900">
                  {health.status ?? 'Unavailable'}
                </span>
                <span className="text-slate-500">
                  {health.provider ?? 'nvidia-nim'}
                  {typeof health.providerConfigured === 'boolean'
                    ? ` · credentials ${health.providerConfigured ? 'configured' : 'missing'}`
                    : ''}
                </span>
                {health.error
                  ? (
                      <span className="text-rose-700">{getErrorMessage(health.error, 500)}</span>
                    )
                  : null}
              </div>
            )
          : (
              <p className="mt-5 text-sm leading-6 text-slate-500">
                The health route does not require a token. Use it to separate
                deployment or configuration issues from prompt and auth issues.
              </p>
            )}
      </section>
    </div>
  );
}
