import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Avatar — photo ou initiales sur fond bleu (D.4). */
export function Avatar({
  src,
  name,
  size = 48,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        'flex items-center justify-center rounded-full bg-blue font-semibold text-white',
        className,
      )}
    >
      {initials || '·'}
    </span>
  );
}
