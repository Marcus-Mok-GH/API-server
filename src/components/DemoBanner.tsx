import Link from 'next/link';

export const DemoBanner = () => (
  <div className="border-b border-cyan-100 bg-cyan-50/80 px-4 py-2.5 text-center text-xs font-medium text-slate-600 backdrop-blur">
    <span className="mr-2 inline-flex items-center gap-2 font-bold uppercase tracking-[0.16em] text-cyan-800">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Interactive API docs
    </span>
    <span className="hidden sm:inline">·</span>
    <span className="ml-2">Test authenticated routes in the</span>
    {' '}
    <Link
      href="/playground/"
      className="font-semibold text-slate-900 underline decoration-cyan-300 underline-offset-4 transition-colors hover:text-cyan-800"
    >
      live playground
    </Link>
    <span className="mx-2 hidden sm:inline">·</span>
    <Link
      href="/sign-up/"
      className="font-semibold text-slate-900 transition-colors hover:text-cyan-800"
    >
      Create an account →
    </Link>
  </div>
);
