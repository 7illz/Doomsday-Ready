import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className = '', children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-sm font-medium text-zinc-200">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? messageId : undefined}
          className={`min-h-11 w-full appearance-none rounded-xl border bg-[#111114] px-3.5 pr-10 text-base text-white outline-none transition focus:border-gold/60 focus:ring-3 focus:ring-gold/10 ${
            error ? 'border-red-400/70' : 'border-white/12'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>
      {(error || hint) && (
        <p id={messageId} className={`text-sm ${error ? 'text-red-300' : 'text-zinc-500'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
