import * as React from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';

/**
 * Field — label au-dessus, message d'erreur sous le champ (D.3).
 * L'erreur est liée au champ via aria-describedby pour les lecteurs d'écran.
 */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string | undefined;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('w-full', className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className="mt-1 text-caption text-grey">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-caption text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
