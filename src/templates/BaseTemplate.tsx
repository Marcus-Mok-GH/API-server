import { useTranslations } from 'next-intl';
import { AppConfig } from '@/utils/AppConfig';

export const BaseTemplate = (props: {
  leftNav: React.ReactNode;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BaseTemplate');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 antialiased">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200/80">
          <div className="flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold tracking-tight text-cyan-300 shadow-lg shadow-slate-950/10"
              >
                {'{ }'}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700">
                  API documentation
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {AppConfig.name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {t('description')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <nav aria-label="Main navigation">
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  {props.leftNav}
                </ul>
              </nav>

              <div className="hidden h-6 w-px bg-slate-200 sm:block" />

              <nav aria-label="Account navigation">
                <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {props.rightNav}
                </ul>
              </nav>
            </div>
          </div>
        </header>

        <main className="py-8 sm:py-12">{props.children}</main>

        <footer className="flex flex-col gap-2 border-t border-slate-200 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{'© Copyright ' + new Date().getFullYear() + ' ' + AppConfig.name + '.'}</p>
          <p>
            {t.rich('made_with', {
              author: () => (
                <a
                  href="https://creativedesignsguru.com"
                  className="font-medium text-slate-700 transition-colors hover:text-cyan-700"
                >
                  CreativeDesignsGuru
                </a>
              ),
            })}
          </p>
        </footer>
      </div>
    </div>
  );
};
