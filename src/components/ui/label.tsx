import * as React from 'react';
import { cn } from '@/lib/utils';

/** Label au-dessus du champ (D.3) ; astérisque si requis. */
export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('mb-1 block text-caption font-medium text-navy', className)} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-error" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}
