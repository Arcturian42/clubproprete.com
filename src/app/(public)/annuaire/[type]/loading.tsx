import { Skeleton } from '@/components/states';

/** Chargement annuaire — skeletons à layout stable (4 états UI, PRD 8). */
export default function AnnuaireLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-40 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-9 w-80" />
      <Skeleton className="mt-2 h-5 w-full max-w-xl" />
      <Skeleton className="mt-6 h-20 w-full rounded-lg" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    </main>
  );
}
