import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getEntityForEdit } from '@/features/entities/queries';
import { VerificationForm } from '@/features/verification/components/verification-form';
import { createClient } from '@/lib/supabase/server';
import { Alert } from '@/components/ui/alert';

export const metadata: Metadata = { title: 'Demander la vérification' };

/** F-06 — demande de vérification d'une fiche (les 4 types d'entités). */
export default async function VerificationPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;
  const user = await requireUser(`/espace/fiches/${entityId}/verification`);
  const detail = await getEntityForEdit(entityId, user.id);
  if (!detail) notFound();

  const supabase = await createClient();
  const { data: pending } = await supabase
    .from('verification_requests')
    .select('id, created_at')
    .eq('entity_id', entityId)
    .eq('status', 'pending')
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/espace/fiches/${entityId}`}
        className="mb-4 inline-flex items-center gap-1 text-caption text-grey hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Retour à la fiche
      </Link>
      <h1 className="flex items-center gap-2 text-h2 font-bold text-navy">
        <BadgeCheck className="h-6 w-6 text-teal" aria-hidden /> Vérification de la fiche
      </h1>
      <p className="mb-6 mt-1 text-body text-grey">
        Le badge « Vérifiée » est délivré après un contrôle humain. Il renforce la confiance et
        débloque la publication d&apos;offres d&apos;emploi.
      </p>

      <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
        {detail.entity.verified ? (
          <Alert variant="success">Cette fiche est déjà vérifiée.</Alert>
        ) : pending ? (
          <Alert variant="info">
            Une demande est en cours depuis le{' '}
            {new Date(pending.created_at).toLocaleDateString('fr-FR')}. Nous vous appellerons sur
            le créneau proposé.
          </Alert>
        ) : (
          <VerificationForm entityId={entityId} />
        )}
      </div>
    </div>
  );
}
