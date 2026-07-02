import { EmptyState } from '@/components/states';
import { requireUser } from '@/lib/auth/session';

export default async function AdminRessourcesPage() {
  await requireUser('/admin/ressources');
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">Ressources</h1>
      <EmptyState className="mt-6" title="Modèles et checklists téléchargeables (MVP 2)." />
    </div>
  );
}
