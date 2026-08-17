export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(): Response {
  const providerConfigured = Boolean(
    process.env.NVIDIA_API_KEY && process.env.NOVA_NVIDIA_GATEWAY_TOKEN,
  );

  return new Response(JSON.stringify({
    status: 'ok',
    provider: 'nvidia-nim',
    providerConfigured,
  }), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
