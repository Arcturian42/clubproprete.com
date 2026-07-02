import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — design system v2 (docs/09-design-system.md §D.3).
 * États : default / hover / active / disabled / loading. Cible ≥ 44×44 px.
 * Hover : bleu profond du token (pas de filtre brightness), micro-élévation.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-body font-medium transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary:
          'bg-blue text-white shadow-lift hover:-translate-y-px hover:bg-blue-deep hover:shadow-lift-lg active:translate-y-0 active:shadow-lift',
        secondary: 'border border-navy/15 bg-white text-navy hover:border-navy/30 hover:bg-ice',
        destructive: 'bg-error text-white hover:opacity-90',
        ghost: 'text-navy hover:bg-ice',
        'glass-light':
          'glass text-navy hover:-translate-y-px hover:bg-white/80 active:translate-y-0',
        // Secondaire sur surface sombre (hero) : verre teinté, texte blanc.
        'glass-dark':
          'border border-white/25 bg-white/10 text-white backdrop-blur-md hover:-translate-y-px hover:bg-white/20 active:translate-y-0',
      },
      size: {
        // min-h 44px : cible tactile WCAG
        default: 'min-h-11 px-5 py-2',
        sm: 'min-h-11 px-3 py-2 text-caption',
        lg: 'min-h-12 px-6 py-3',
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
