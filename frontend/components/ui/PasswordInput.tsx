'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
  containerClassName?: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  error,
  className,
  containerClassName,
  disabled,
  ...rest
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={containerClassName}>
      {/* Wrap input + button only so the eye is centered to the input, not the whole block (including error text) */}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={clsx(
            'w-full rounded-lg border bg-brand-sidebar px-3 py-2.5 pr-10 text-brand-text placeholder-brand-textDisabled transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-transparent',
            error
              ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/50'
              : 'border-brand-borderLight focus:border-brand-primary focus:ring-brand-primary/50',
            disabled && 'cursor-not-allowed opacity-60',
            className
          )}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-brand-textMuted transition-colors hover:bg-brand-borderLight hover:text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0 focus:ring-offset-transparent disabled:pointer-events-none"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          className="mt-1.5 flex items-center gap-1.5 text-sm text-brand-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
