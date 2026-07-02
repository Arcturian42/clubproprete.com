import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Badge — vérifié (teal), membre, statuts. Contrastes AA (D.1). */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium',
  {
    variants: {
      variant: {
        default: 'bg-bg-light text-navy',
        verified: 'bg-teal text-white',
        pending: 'bg-warning/15 text-warning',
        error: 'bg-error/10 text-error',
        outline: 'border border-grey/40 text-grey',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
