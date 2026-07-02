import Link from 'next/link';
import { ArrowRight, Building2, UserRound, Sparkles } from 'lucide-react';
import { requireUser, getCurrentProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Dashboard membre — MVP 1 : état du profil, fiches, raccourcis.
 * Feed & suggestions arrivent avec le graphe social (MVP 3).
 */
export default async function EspacePage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenue?: string }>;
}) {
  const user = await requireUser('/espace');
  const { bienvenue } = await searchParams;
  const profile = await getCurrentProfile();

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('entity_members')
    .select('entity_id, role, entities!inner(id, slug, type, verified, status)')
    .eq('user_id', user.id);

  const entities = (memberships ?? []).map(
    (m) =>
      m.entities as unknown as {
        id: string;
        slug: string;
        type: string;
        verified: boolean;
        status: string;
      },
  );

  const onboarded = Boolean(profile?.insee_code);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {bienvenue && (
        <Alert variant="success">
          Bienvenue ! Votre espace est prêt — complétez votre fiche pour gagner en visibilité.
        </Alert>
      )}

      <h1 className="text-h2 font-bold text-navy">
        Bonjour{profile?.first_name ? ` ${profile.first_name}` : ''}
      </h1>

      {!onboarded && (
        <Card className="border-blue/30 bg-ice">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue" aria-hidden />
              Finalisez votre inscription
            </CardTitle>
          </CardHeader>
          <p className="text-body text-grey">
            Deux minutes pour indiquer votre ville et votre situation : c&apos;est ce qui vous rend
            visible dans l&apos;annuaire.
          </p>
          <Link
            href="/espace/onboarding"
            className={cn(buttonVariants({ size: 'sm' }), 'mt-4 inline-flex')}
          >
            Commencer <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-blue" aria-hidden /> Mon profil
            </CardTitle>
          </CardHeader>
          <p className="text-caption text-grey">
            {profile?.headline ?? 'Ajoutez un titre et une bio pour humaniser votre présence.'}
          </p>
          <Link href="/espace/profil" className="mt-3 inline-flex items-center gap-1 text-body font-medium text-blue">
            Compléter <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue" aria-hidden /> Mes fiches
            </CardTitle>
          </CardHeader>
          {entities.length === 0 ? (
            <p className="text-caption text-grey">
              Aucune fiche pour le moment — créez la vôtre pour apparaître dans l&apos;annuaire.
            </p>
          ) : (
            <ul className="space-y-1 text-body text-navy">
              {entities.map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className="truncate">{e.slug}</span>
                  {e.verified && <span className="text-caption text-teal">Vérifiée</span>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/espace/fiches" className="mt-3 inline-flex items-center gap-1 text-body font-medium text-blue">
            Gérer <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      </div>
    </div>
  );
}
