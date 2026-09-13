import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { PlaygroundClient } from '@/components/PlaygroundClient';

type PlaygroundPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'API Playground',
  description: 'Send live requests to the API Server model endpoints.',
};

export default async function PlaygroundPage(props: PlaygroundPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <PlaygroundClient />;
}
