import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = '', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-zinc-200">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? messageId : undefined}
        className={`min-h-11 w-full rounded-xl border bg-black/20 px-3.5 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-gold/60 focus:ring-3 focus:ring-gold/10 ${
          error ? 'border-red-400/70' : 'border-white/12'
        } ${className}`}
        {...props}
      />
      {(error || hint) && (
        <p id={messageId} className={`text-sm ${error ? 'text-red-300' : 'text-zinc-500'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
