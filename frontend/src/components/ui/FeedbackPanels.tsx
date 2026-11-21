import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] px-6 py-14 text-center">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-gold/25 bg-gold/8 text-gold">
        <span aria-hidden="true" className="text-xl">◇</span>
      </div>
      <h3 className="font-display text-2xl text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md leading-7 text-zinc-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-5">
      <p className="font-semibold text-red-200">Something interrupted the mission</p>
      <p className="mt-1 text-sm leading-6 text-red-100/70">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function ConfirmationPanel({
  title,
  description,
  children,
  tone = 'success',
}: {
  title: string;
  description: string;
  children?: ReactNode;
  tone?: 'success' | 'warning';
}) {
  return (
    <section
      className={`rounded-2xl border p-6 ${
        tone === 'success'
          ? 'border-emerald-400/25 bg-emerald-400/[0.06]'
          : 'border-gold/25 bg-gold/[0.06]'
      }`}
    >
      <p className={`text-sm font-semibold ${tone === 'success' ? 'text-emerald-300' : 'text-gold'}`}>
        {title}
      </p>
      <p className="mt-2 leading-7 text-zinc-300">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
