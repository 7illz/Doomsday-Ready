import { useEffect } from 'react';

interface ToastProps {
  message: string;
  tone?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

const tones = {
  success: 'border-emerald-400/30 bg-emerald-950/95 text-emerald-100',
  error: 'border-red-400/30 bg-red-950/95 text-red-100',
  info: 'border-gold/30 bg-[#211d14]/95 text-amber-100',
};

export function Toast({ message, tone = 'info', onDismiss }: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl sm:right-6 sm:bottom-6 ${tones[tone]}`}
    >
      <span className="leading-6">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded px-1 text-current/70 hover:text-current focus-visible:outline-2 focus-visible:outline-current"
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  );
}
