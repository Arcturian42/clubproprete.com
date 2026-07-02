import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Alert — feedback de formulaire/action (jamais d'échec silencieux). */
const alertVariants = cva('rounded-md border p-3 text-body', {
  variants: {
    variant: {
      info: 'border-blue/30 bg-blue/5 text-navy',
      success: 'border-teal/40 bg-teal/5 text-teal',
      error: 'border-error/40 bg-error/5 text-error',
      warning: 'border-warning/40 bg-warning/5 text-warning',
    },
  },
  defaultVariants: { variant: 'info' },
});

export function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
