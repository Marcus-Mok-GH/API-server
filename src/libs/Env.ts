import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const Env = createEnv({
  server: {
    ARCJET_KEY: z.string().startsWith('ajkey_').optional(),
    CLERK_SECRET_KEY: z.string().min(1),
    NVIDIA_API_KEY: z.string().min(1).optional(),
    NOVA_NVIDIA_GATEWAY_TOKEN: z.string().min(32).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    ARCJET_KEY: process.env.ARCJET_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
    NOVA_NVIDIA_GATEWAY_TOKEN: process.env.NOVA_NVIDIA_GATEWAY_TOKEN,
  },
});
