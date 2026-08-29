import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-4 border-b border-slate-200/80 pb-5 md:mb-7 md:flex-row md:items-end md:justify-between md:pb-6">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">{eyebrow}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl md:text-[2rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div> : null}
    </header>
  );
}

export function Panel({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.32)] sm:p-5 ${className}`}>
      {title ? (
        <div className="mb-5">
          <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div>
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-lg text-emerald-700">+</div>
        <p className="mt-3 font-semibold text-slate-700">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
