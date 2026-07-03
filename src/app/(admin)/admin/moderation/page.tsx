import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { resolveReport } from '@/features/moderation/actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n/fr';

export const metadata: Metadata = { title: 'Modération — back-office' };

const TARGET_LABELS: Record<string, string> = {
  article: 'Article',
  profile: 'Profil',
  message: 'Message',
  recommendation: 'Recommandation',
  entity: 'Fiche',
};

/** F-14 — file de modération (signalements ouverts). Capacité moderate. */
export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  await requireUser('/admin/moderation');
  const { done, error } = await searchParams;
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from('reports')
    .select('id, reporter_id, target_type, target_id, reason, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">Modération</h1>
      <p className="mt-1 text-body text-grey">
        Signalements ouverts — auto-modération niveau 1 (liste noire) + récidive automatique (3
        décisions / 24 h → suspension).
      </p>

      {done && <Alert variant="success" className="mt-4">{t('success_decision_saved')}</Alert>}
      {error === 'concurrent' && (
        <Alert variant="error" className="mt-4">Signalement déjà traité — liste rafraîchie.</Alert>
      )}

      <div className="mt-6 space-y-4">
        {!reports || reports.length === 0 ? (
          <EmptyState title="Aucun signalement en attente." />
        ) : (
          reports.map((r) => (
            <Card key={r.id}>
              <div>
                <Badge variant="outline">{TARGET_LABELS[r.target_type] ?? r.target_type}</Badge>
                <p className="mt-2 text-body text-navy">{r.reason ?? 'Sans motif précisé'}</p>
                <p className="mt-1 font-mono text-caption text-grey">
                  cible: {r.target_id.slice(0, 8)} · {new Date(r.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-navy/10 pt-4">
                {(['dismiss', 'hide', 'warn', 'suspend'] as const).map((action) => (
                  <form key={action} action={resolveReport}>
                    <input type="hidden" name="reportId" value={r.id} />
                    <input type="hidden" name="action" value={action} />
                    <input
                      type="hidden"
                      name="reason"
                      value={
                        action === 'dismiss'
                          ? 'Classé sans suite'
                          : action === 'hide'
                            ? 'Contenu masqué'
                            : action === 'warn'
                              ? 'Avertissement'
                              : 'Suspension 24 h'
                      }
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant={action === 'dismiss' ? 'ghost' : action === 'suspend' ? 'destructive' : 'secondary'}
                    >
                      {action === 'dismiss'
                        ? 'Classer'
                        : action === 'hide'
                          ? 'Masquer'
                          : action === 'warn'
                            ? 'Avertir'
                            : 'Suspendre 24 h'}
                    </Button>
                  </form>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
