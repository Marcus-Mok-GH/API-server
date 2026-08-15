import { createNvidiaGatewayHandler } from '@/libs/NvidiaGateway';

export const runtime = 'nodejs';
export const maxDuration = 20;

const gatewayHandler = createNvidiaGatewayHandler({
  getApiKey: () => process.env.NVIDIA_API_KEY,
  getServiceToken: () => process.env.NOVA_NVIDIA_GATEWAY_TOKEN,
});

export async function POST(request: Request): Promise<Response> {
  return gatewayHandler(request);
}
