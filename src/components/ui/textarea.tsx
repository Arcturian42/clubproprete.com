import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-[96px] w-full rounded-sm border bg-white px-3 py-2 text-body text-navy placeholder:text-grey/70',
        'focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-bg-light disabled:opacity-60',
        invalid ? 'border-error' : 'border-grey/40',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
