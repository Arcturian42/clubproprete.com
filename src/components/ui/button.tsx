import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — design system (docs/09-design-system.md §D.3).
 * États : default / hover / active / disabled / loading. Cible ≥ 44×44 px (a11y).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-body font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-blue text-white hover:brightness-95 active:brightness-90',
        secondary: 'border border-grey/30 bg-white text-navy hover:bg-bg-light',
        destructive: 'bg-error text-white hover:brightness-95',
        ghost: 'text-navy hover:bg-bg-light',
      },
      size: {
        // min-h/min-w 44px pour respecter la cible tactile WCAG
        default: 'min-h-11 px-4 py-2',
        sm: 'min-h-11 px-3 py-2 text-caption',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
