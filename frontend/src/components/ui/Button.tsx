import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-crimson bg-crimson text-white shadow-[0_12px_30px_rgba(164,29,47,0.2)] hover:border-crimson-light hover:bg-crimson-light',
  secondary:
    'border-white/12 bg-white/[0.06] text-zinc-100 hover:border-gold/40 hover:bg-white/[0.1]',
  ghost: 'border-transparent bg-transparent text-zinc-300 hover:bg-white/[0.06] hover:text-white',
  danger: 'border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
