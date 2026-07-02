import { requireUser } from '@/lib/auth/session';
import { signOut } from '@/features/auth/actions';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Paramètres (M18) — MVP 1 : compte + déconnexion.
 * Notifications, export RGPD et suppression de compte arrivent avec MVP 2
 * (notification_preferences) et le flux F-04/F-20.
 */
export default async function ParametresPage() {
  const user = await requireUser('/espace/parametres');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-h2 font-bold text-navy">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <p className="text-body text-navy">{user.email}</p>
        <p className="mt-1 text-caption text-grey">
          Connecté via {user.app_metadata.provider === 'email' ? 'email' : user.app_metadata.provider}.
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Se déconnecter
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confidentialité & RGPD</CardTitle>
        </CardHeader>
        <p className="text-caption text-grey">
          Export de vos données et suppression du compte : disponibles avec le MVP 2 (le protocole
          complet est déjà spécifié — anonymisation, purge Storage, délai 30 jours).
        </p>
      </Card>
    </div>
  );
}
