import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { DemoBanner } from '@/components/DemoBanner';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { BaseTemplate } from '@/templates/BaseTemplate';

const navLinkClass = 'border-none text-sm font-medium text-slate-600 transition-colors hover:text-slate-950';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'RootLayout',
  });

  return (
    <>
      <DemoBanner />
      <BaseTemplate
        leftNav={(
          <>
            <li>
              <Link href="/" className={navLinkClass}>
                {t('home_link')}
              </Link>
            </li>
            <li>
              <Link href="/about/" className={navLinkClass}>
                {t('about_link')}
              </Link>
            </li>
            <li>
              <Link href="/portfolio/" className={navLinkClass}>
                {t('portfolio_link')}
              </Link>
            </li>
            <li>
              <Link href="/playground/" className={navLinkClass}>
                Playground
              </Link>
            </li>
            <li>
              <a
                className={navLinkClass}
                href="https://github.com/Marcus-Mok-GH/API-server"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub ↗
              </a>
            </li>
          </>
        )}
        rightNav={(
          <>
            <li>
              <Link href="/sign-in/" className={navLinkClass}>
                {t('sign_in_link')}
              </Link>
            </li>
            <li>
              <Link
                href="/sign-up/"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-950"
              >
                {t('sign_up_link')}
              </Link>
            </li>
            <li>
              <LocaleSwitcher />
            </li>
          </>
        )}
      >
        {props.children}
      </BaseTemplate>
    </>
  );
}
