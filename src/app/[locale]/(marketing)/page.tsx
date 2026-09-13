import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type IIndexProps = {
  params: Promise<{ locale: string }>;
};

const productionUrl = 'https://api-server-zeta.vercel.app';

const quickStartCode = [
  'const response = await fetch(\'/api/nvidia/chat\', {',
  '  method: \'POST\',',
  '  headers: {',
  '    Authorization: \'Bearer YOUR_NOVA_NVIDIA_GATEWAY_TOKEN\',',
  '    \'Content-Type\': \'application/json\',',
  '  },',
  '  body: JSON.stringify({',
  '    prompt: \'Explain rate limiting in one sentence.\',',
  '  }),',
  '});',
  '',
  'const data = await response.json();',
  'console.log(data.text);',
].join('\n');

const responseCode = [
  '{',
  '  "text": "Rate limiting controls...",',
  '  "model": "nvidia/nemotron-3-nano-30b-a3b",',
  '  "usage": {',
  '    "prompt_tokens": 8,',
  '    "completion_tokens": 7,',
  '    "total_tokens": 15',
  '  }',
  '}',
].join('\n');

const healthCode = [
  '{',
  '  "status": "ok",',
  '  "provider": "nvidia-nim",',
  '  "providerConfigured": true',
  '}',
].join('\n');

const nvidiaRequestCode = ['{', '  "prompt": "Your prompt here"', '}'].join(
  '\n',
);

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-7 text-slate-200 shadow-inner">
    <code>{children}</code>
  </pre>
);

const flowSteps = [
  {
    number: '01',
    title: 'Receive',
    description:
            'Next.js parses the JSON request and validates the prompt.',
  },
  {
    number: '02',
    title: 'Protect',
    description:
            'Auth and the endpoint-specific rate limiter run before provider work.',
  },
  {
    number: '03',
    title: 'Forward',
    description: 'The gateway sends a normalized request to NVIDIA NIM.',
  },
  {
    number: '04',
    title: 'Respond',
    description:
            'You receive JSON on success, or a useful status and error message.',
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'API Server Documentation',
    description:
            'A practical reference for the API Server gateway endpoints.',
  };
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <div className="pb-12 text-slate-800">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            API reference
          </div>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            One gateway. Clear contracts.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Send authenticated prompts to the configured AI provider
            through a small, predictable HTTP surface. This page
            covers the endpoints, request shapes, protection, and
            errors you should handle.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
            <a
              href="#quickstart"
              className="rounded-full bg-cyan-300 px-5 py-3 text-slate-950 transition hover:bg-cyan-200"
            >
              Try the quick start
            </a>
            <a
              href="#endpoints"
              className="rounded-full border border-white/20 px-5 py-3 text-white transition hover:bg-white/10"
            >
              Browse endpoints
            </a>
          </div>
        </div>
        <div className="relative mt-10 grid gap-3 border-t border-white/10 pt-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-400">Base URL</p>
            <p className="mt-1 font-mono text-cyan-200">
              {productionUrl}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Transport</p>
            <p className="mt-1 font-mono text-white">
              HTTPS + JSON
            </p>
          </div>
          <div>
            <p className="text-slate-400">Runtime</p>
            <p className="mt-1 font-mono text-white">
              Next.js App Router
            </p>
          </div>
        </div>
      </section>

      <section id="quickstart" className="scroll-mt-8 pt-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
              01 / Quick start
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Make your first gateway request
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            POST /api/nvidia/chat
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <CodeBlock>{quickStartCode}</CodeBlock>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Expected response
            </p>
            <div className="mt-3">
              <CodeBlock>{responseCode}</CodeBlock>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Use the relative
              {' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                /api
              </code>
              {' '}
              path from this app, or the production URL shown
              above from another service.
            </p>
          </div>
        </div>
      </section>

      <section id="endpoints" className="scroll-mt-8 pt-14">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
          02 / Endpoints
        </p>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Two routes, two jobs
        </h3>
        <div className="mt-6 grid gap-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800">
                GET
              </span>
              <code className="font-mono text-lg font-semibold text-slate-950">
                /api/nvidia/health
              </code>
              <span className="text-sm text-slate-500">
                Readiness check
              </span>
            </div>
            <p className="mt-4 leading-7 text-slate-600">
              Returns the gateway status, provider name, and
              whether the required NVIDIA credentials are
              configured. No authentication header is required.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CodeBlock>{healthCode}</CodeBlock>
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">
                  Use it for
                </p>
                <p className="mt-1">
                  Deploy checks, status pages, and startup
                  diagnostics. The response is never cached.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-cyan-100 px-2.5 py-1 font-mono text-xs font-bold text-cyan-800">
                POST
              </span>
              <code className="font-mono text-lg font-semibold text-slate-950">
                /api/nvidia/chat
              </code>
              <span className="text-sm text-slate-500">
                NVIDIA NIM gateway
              </span>
            </div>
            <p className="mt-4 leading-7 text-slate-600">
              Accepts a text prompt and forwards it to the
              configured NVIDIA model. Authenticate with
              {' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                Authorization: Bearer &lt;token&gt;
              </code>
              .
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CodeBlock>{nvidiaRequestCode}</CodeBlock>
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">
                  Limits
                </p>
                <p className="mt-1">
                  Prompts up to 12,000 characters. The gateway
                  allows 15 requests per minute and maps
                  provider failures to safe HTTP responses.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="pt-14">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
          03 / Request flow
        </p>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          What happens after you call an endpoint
        </h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {flowSteps.map(step => (
            <div
              key={step.number}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <span className="font-mono text-sm font-bold text-cyan-700">
                {step.number}
              </span>
              <h4 className="mt-3 font-semibold text-slate-950">
                {step.title}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-14">
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-slate-100 shadow-lg sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                04 / Error handling
              </p>
              <h3 className="mt-2 text-2xl font-semibold">
                Handle these statuses explicitly
              </h3>
            </div>
            <a
              href="https://github.com/Marcus-Mok-GH/API-server"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View source on GitHub ↗
            </a>
          </div>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {[
              [
                '400',
                'The JSON body or prompt is missing or invalid.',
              ],
              [
                '401',
                'Authentication is missing or does not match the configured token.',
              ],
              [
                '429',
                'The endpoint or upstream provider rate limit was reached.',
              ],
              [
                '500 / 502 / 503',
                'The server, upstream provider, or required configuration is unavailable.',
              ],
            ].map(([status, description]) => (
              <div
                key={status}
                className="flex gap-4 rounded-xl bg-white/10 p-4"
              >
                <code className="shrink-0 font-mono font-bold text-cyan-200">
                  {status}
                </code>
                <span className="leading-6 text-slate-300">
                  {description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
