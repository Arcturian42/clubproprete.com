import { EmptyState } from '@/components/states';
import { requireUser } from '@/lib/auth/session';

export default async function AdminParametresPage() {
  await requireUser('/admin/parametres');
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">Paramètres</h1>
      <EmptyState className="mt-6" title="Catégories, SEO, listes de modération (MVP 2)." />
    </div>
  );
}
