import * as React from 'react';
import { cn } from '@/lib/utils';

/** Input — états default / focus (anneau blue) / error / disabled (D.3). */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-11 w-full rounded-sm border bg-white px-3 py-2 text-body text-navy placeholder:text-grey/70',
        'focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-bg-light disabled:opacity-60',
        invalid ? 'border-error' : 'border-grey/40',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
