import type { ReactNode } from 'react';

interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <header className="mb-8 flex flex-col gap-6 border-b border-white/8 pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold tracking-[0.22em] text-gold uppercase">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
