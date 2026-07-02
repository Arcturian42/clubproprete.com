import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Plus, Pencil, ExternalLink } from 'lucide-react';
import { requireUser, getCurrentProfile } from '@/lib/auth/session';
import { getMyEntities } from '@/features/entities/queries';
import { setCurrentEntity } from '@/features/entities/actions';
import { ENTITY_TYPE_SLUGS } from '@/config/routes';
import { ENTITY_TYPE_LABELS } from '@/referentiels/labels';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Mes fiches' };

/** F-05/F-21 — mes fiches + switcher persisté (current_entity_id, T5). */
export default async function FichesPage() {
  const user = await requireUser('/espace/fiches');
  const [entities, profile] = await Promise.all([getMyEntities(user.id), getCurrentProfile()]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-navy">Mes fiches</h1>
          <p className="mt-1 text-body text-grey">
            Une fiche par activité — votre profil personnel reste intact.
          </p>
        </div>
        <Link href="/espace/onboarding" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" aria-hidden /> Nouvelle activité
        </Link>
      </div>

      {entities.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Vous n'avez pas encore de fiche."
          description="Créez la vôtre en deux minutes : elle sera publiée dans l'annuaire."
          action={
            <Link href="/espace/onboarding" className={cn(buttonVariants({ size: 'sm' }))}>
              Créer ma fiche
            </Link>
          }
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {entities.map(({ entity, role, displayName }) => {
            const isCurrent = profile?.current_entity_id === entity.id;
            return (
              <li key={entity.id}>
                <Card className={cn('flex flex-wrap items-center gap-3', isCurrent && 'border-blue')}>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-body font-semibold text-navy">
                      <span className="truncate">{displayName}</span>
                      {entity.verified && (
                        <span className="inline-flex items-center gap-1 text-caption font-medium text-teal">
                          <BadgeCheck className="h-4 w-4" aria-hidden /> Vérifiée
                        </span>
                      )}
                      {entity.status !== 'active' && <Badge variant="pending">{entity.status}</Badge>}
                    </p>
                    <p className="text-caption text-grey">
                      {ENTITY_TYPE_LABELS[entity.type]} · rôle : {role}
                      {isCurrent && ' · fiche active'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCurrent && (
                      <form
                        action={async () => {
                          'use server';
                          await setCurrentEntity(entity.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="min-h-11 rounded-sm px-3 text-caption font-medium text-blue hover:bg-ice"
                        >
                          Définir active
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/${ENTITY_TYPE_SLUGS[entity.type]}/${entity.slug}`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                      aria-label="Voir la fiche publique"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </Link>
                    <Link
                      href={`/espace/fiches/${entity.id}`}
                      className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                    >
                      <Pencil className="h-4 w-4" aria-hidden /> Modifier
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
