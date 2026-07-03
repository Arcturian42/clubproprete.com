import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { hasCapability } from '@/lib/auth/capabilities';
import { getMissions, getMyMissionApplications, getApplicationsForMyMissions } from '@/features/subcontracting/queries';
import { MissionForm } from '@/features/subcontracting/components/mission-form';
import { applyToMission, setMissionApplicationStatus } from '@/features/subcontracting/actions';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Sous-traitance' };

/** F-18 — sous-traitance (garde access_subcontracting via middleware). */
export default async function SousTraitancePage() {
  const user = await requireUser('/espace/sous-traitance');
  const canPublish = await hasCapability('publish_mission');

  const [missions, myApps, mine] = await Promise.all([
    getMissions(),
    getMyMissionApplications(user.id),
    getApplicationsForMyMissions(user.id),
  ]);
  const appliedTo = new Set(myApps.map((a) => a.mission_id));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-h2 font-bold text-navy">Sous-traitance</h1>
        <p className="mt-1 text-body text-grey">Missions réservées aux membres de l&apos;association.</p>
      </div>

      {canPublish && (
        <Card>
          <CardHeader>
            <CardTitle>Publier une mission</CardTitle>
          </CardHeader>
          <MissionForm />
        </Card>
      )}

      {/* Candidatures reçues sur mes missions (2C : le créateur gère) */}
      {mine.missions.length > 0 && (
        <section>
          <h2 className="mb-2 text-h4 font-semibold text-navy">Candidatures reçues</h2>
          {mine.applications.length === 0 ? (
            <EmptyState title="Aucune candidature pour l'instant." />
          ) : (
            <ul className="space-y-2">
              {mine.applications.map((a) => {
                const mission = mine.missions.find((m) => m.id === a.mission_id);
                const p = a.applicant as unknown as { slug: string; first_name: string | null; last_name: string | null };
                return (
                  <Card key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link href={`/p/${p?.slug}`} className="text-body font-medium text-navy hover:text-blue">
                        {`${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || p?.slug}
                      </Link>
                      <p className="text-caption text-grey">{mission?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{a.status}</Badge>
                      {['submitted', 'viewed', 'interview'].includes(a.status) && (
                        <div className="flex gap-1">
                          {(['hired', 'rejected'] as const).map((s) => (
                            <form key={s} action={setMissionApplicationStatus}>
                              <input type="hidden" name="applicationId" value={a.id} />
                              <input type="hidden" name="status" value={s} />
                              <button
                                type="submit"
                                className="rounded-full border border-navy/20 px-2 py-1 text-[11px] text-grey hover:border-blue hover:text-blue"
                              >
                                {s === 'hired' ? 'Retenir' : 'Refuser'}
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Missions disponibles */}
      <section>
        <h2 className="mb-2 text-h4 font-semibold text-navy">Missions disponibles</h2>
        {missions.length === 0 ? (
          <EmptyState title="Aucune mission publiée pour le moment." />
        ) : (
          <ul className="space-y-3">
            {missions.map((m) => {
              const applied = appliedTo.has(m.id);
              const isMine = m.creator_id === user.id;
              const myApp = myApps.find((a) => a.mission_id === m.id);
              return (
                <Card key={m.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-body font-semibold text-navy">{m.title}</h3>
                      {m.city_name && <p className="text-caption text-grey">{m.city_name}</p>}
                    </div>
                    {isMine ? (
                      <Badge variant="outline">Ma mission</Badge>
                    ) : applied ? (
                      <Badge variant="pending">
                        {myApp?.status === 'submitted' ? 'Candidaté' : (myApp?.status ?? 'Candidaté')}
                      </Badge>
                    ) : (
                      <form action={applyToMission}>
                        <input type="hidden" name="missionId" value={m.id} />
                        <Button type="submit" size="sm">Candidater</Button>
                      </form>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-body text-grey">{m.description}</p>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      {mine.missions.length === 0 && !canPublish && missions.length === 0 && (
        <Alert variant="info">
          Bienvenue dans l&apos;espace membre. Les missions publiées par les autres membres
          apparaîtront ici.
        </Alert>
      )}
    </div>
  );
}
