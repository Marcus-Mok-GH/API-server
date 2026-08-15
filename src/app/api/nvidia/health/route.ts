import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export function GET(): Response {
  const providerConfigured = Boolean(
    process.env.NVIDIA_API_KEY && process.env.NOVA_NVIDIA_GATEWAY_TOKEN,
  );

  return NextResponse.json({
    status: 'ok',
    provider: 'nvidia-nim',
    providerConfigured,
  });
}
