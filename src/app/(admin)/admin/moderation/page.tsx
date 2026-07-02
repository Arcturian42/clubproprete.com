import { EmptyState } from '@/components/states';
import { requireUser } from '@/lib/auth/session';

export default async function AdminModerationPage() {
  await requireUser('/admin/moderation');
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">Modération</h1>
      <EmptyState className="mt-6" title="Files de signalements et décisions — livrée AVEC l'UGC (MVP 2)." />
    </div>
  );
}
