import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { decideVerification } from '@/features/verification/actions';
import { decideAuthorApplication } from '@/features/moderation/actions';
import { decideMembership } from '@/features/association/actions';
import { SENIORITY_LABELS, HEADCOUNT_LABELS } from '@/features/verification/schemas';
import { ENTITY_TYPE_LABELS } from '@/referentiels/labels';
import type { EntityType } from '@/referentiels';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n/fr';

export const metadata: Metadata = { title: 'Demandes — back-office' };

interface Slot {
  date: string;
  period: 'matin' | 'apres_midi';
}

/**
 * File des demandes (M15) — MVP 1 : vérifications. Adhésions, rédacteurs,
 * claims et retraits rejoignent cette file avec leurs modules (MVP 2/4).
 * Motif obligatoire au refus ; action concurrente → message de rafraîchissement.
 */
export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  await requireUser('/admin/demandes');
  const { done, error: actionError } = await searchParams;
  const supabase = await createClient();

  // RLS verif_read : moderate voit tout.
  const [{ data: requests, error }, { data: authorApps }, { data: memberships }] = await Promise.all([
    supabase
      .from('verification_requests')
      .select('id, entity_id, status, seniority, headcount, requested_slots, created_at, entities!inner(id, slug, type, city_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('author_applications')
      .select('id, user_id, expertise, motivation, created_at, profiles!inner(slug, first_name, last_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('association_memberships')
      .select('id, user_id, requested_at, profiles!inner(slug, first_name, last_name)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">Demandes</h1>
      <p className="mt-1 text-body text-grey">
        Vérifications en attente — adhésions, rédacteurs, claims et retraits arrivent avec leurs
        modules.
      </p>

      {done && (
        <Alert variant="success" className="mt-4">
          {t('success_decision_saved')}
        </Alert>
      )}
      {actionError && (
        <Alert variant="error" className="mt-4">
          {actionError === 'concurrent'
            ? 'Demande déjà traitée par une autre action — liste rafraîchie.'
            : actionError}
        </Alert>
      )}

      <h2 className="mt-8 text-h4 font-semibold text-navy">Vérifications de fiche</h2>
      <div className="mt-3 space-y-4">
        {error ? (
          <Alert variant="error">{t('error_generic')}</Alert>
        ) : !requests || requests.length === 0 ? (
          <EmptyState title={t('empty_requests')} />
        ) : (
          requests.map((r) => {
            const entity = r.entities as unknown as {
              id: string;
              slug: string;
              type: EntityType;
              city_name: string | null;
            };
            const slots = (r.requested_slots ?? []) as unknown as Slot[];
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-body font-semibold text-navy">{entity.slug}</p>
                    <p className="text-caption text-grey">
                      {ENTITY_TYPE_LABELS[entity.type]}
                      {entity.city_name ? ` · ${entity.city_name}` : ''} · demandé le{' '}
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="pending">En attente</Badge>
                </div>

                <dl className="mt-3 grid gap-2 text-caption sm:grid-cols-3">
                  <div>
                    <dt className="text-grey">Ancienneté</dt>
                    <dd className="font-medium text-navy">
                      {SENIORITY_LABELS[r.seniority as keyof typeof SENIORITY_LABELS] ?? r.seniority ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-grey">Effectif</dt>
                    <dd className="font-medium text-navy">
                      {HEADCOUNT_LABELS[r.headcount as keyof typeof HEADCOUNT_LABELS] ?? r.headcount ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-grey">Créneaux d&apos;appel</dt>
                    <dd className="font-medium text-navy">
                      {slots.length > 0
                        ? slots
                            .map(
                              (s) =>
                                `${new Date(s.date).toLocaleDateString('fr-FR')} (${s.period === 'matin' ? 'matin' : 'après-midi'})`,
                            )
                            .join(' · ')
                        : '—'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-4">
                  <form action={decideVerification}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <Button type="submit" size="sm">
                      Approuver
                    </Button>
                  </form>
                  <form action={decideVerification} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <div>
                      <label htmlFor={`reason-${r.id}`} className="mb-1 block text-caption text-grey">
                        Motif (obligatoire pour refuser)
                      </label>
                      <input
                        id={`reason-${r.id}`}
                        name="reason"
                        required
                        minLength={3}
                        className="min-h-11 w-64 rounded-sm border border-navy/15 px-3 py-2 text-body"
                        placeholder="Ex. : SIRET introuvable"
                      />
                    </div>
                    <Button type="submit" variant="destructive" size="sm">
                      Refuser
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <h2 className="mt-10 text-h4 font-semibold text-navy">Candidatures rédacteur</h2>
      <div className="mt-3 space-y-4">
        {!authorApps || authorApps.length === 0 ? (
          <EmptyState title="Aucune candidature rédacteur en attente." />
        ) : (
          authorApps.map((a) => {
            const p = a.profiles as unknown as {
              slug: string;
              first_name: string | null;
              last_name: string | null;
            };
            return (
              <Card key={a.id}>
                <p className="text-body font-semibold text-navy">
                  {`${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || p?.slug}
                </p>
                <p className="text-caption text-grey">
                  Expertise : {a.expertise ?? '—'} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
                </p>
                {a.motivation && <p className="mt-2 text-body text-navy">{a.motivation}</p>}
                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-4">
                  <form action={decideAuthorApplication}>
                    <input type="hidden" name="applicationId" value={a.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <Button type="submit" size="sm">Approuver</Button>
                  </form>
                  <form action={decideAuthorApplication} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="applicationId" value={a.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <input
                      name="reason"
                      required
                      minLength={3}
                      className="min-h-11 w-56 rounded-sm border border-navy/15 px-3 py-2 text-body"
                      placeholder="Motif de refus"
                      aria-label="Motif de refus"
                    />
                    <Button type="submit" variant="destructive" size="sm">Refuser</Button>
                  </form>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <h2 className="mt-10 text-h4 font-semibold text-navy">Adhésions à l&apos;association</h2>
      <div className="mt-3 space-y-4">
        {!memberships || memberships.length === 0 ? (
          <EmptyState title="Aucune candidature d'adhésion en attente." />
        ) : (
          memberships.map((m) => {
            const p = m.profiles as unknown as { slug: string; first_name: string | null; last_name: string | null };
            return (
              <Card key={m.id}>
                <p className="text-body font-semibold text-navy">
                  {`${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || p?.slug}
                </p>
                <p className="text-caption text-grey">
                  Demandé le {new Date(m.requested_at).toLocaleDateString('fr-FR')}
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-4">
                  <form action={decideMembership}>
                    <input type="hidden" name="membershipId" value={m.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <Button type="submit" size="sm">Approuver</Button>
                  </form>
                  <form action={decideMembership} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="membershipId" value={m.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <input
                      name="reason"
                      required
                      minLength={3}
                      className="min-h-11 w-56 rounded-sm border border-navy/15 px-3 py-2 text-body"
                      placeholder="Motif de refus"
                      aria-label="Motif de refus"
                    />
                    <Button type="submit" variant="destructive" size="sm">Refuser</Button>
                  </form>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
