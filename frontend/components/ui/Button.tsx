import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bg disabled:opacity-50',
        {
          primary:
            'bg-brand-primary hover:bg-brand-primaryHover text-white shadow-sm hover:shadow-glow-primary',
          secondary:
            'border border-brand-borderLight bg-brand-border hover:bg-[#273244] text-foreground',
          ghost: 'text-brand-primaryLight hover:bg-brand-divider',
          danger: 'bg-brand-error text-white hover:opacity-90 focus:ring-brand-error',
        }[variant],
        {
          sm: 'px-3 py-1.5 text-sm',
          md: 'px-4 py-2 text-sm',
          lg: 'px-6 py-3 text-base',
        }[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
