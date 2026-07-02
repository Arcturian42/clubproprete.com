import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-11 w-full rounded-sm border bg-white px-3 py-2 text-body text-navy',
        'focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-bg-light disabled:opacity-60',
        invalid ? 'border-error' : 'border-grey/40',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
