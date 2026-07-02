import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm, type ProfileFormInitial } from '@/features/profiles/components/profile-form';
import type { VisibilityLevel } from '@/referentiels';

export const metadata: Metadata = { title: 'Mon profil' };

/** F-04 — édition du profil (RLS own). */
export default async function ProfilEspacePage() {
  const user = await requireUser('/espace/profil');
  const supabase = await createClient();

  const [{ data: profile }, { data: skills }, { data: mySkills }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('skills').select('id, label').order('label'),
    supabase.from('profile_skills').select('skill_id').eq('profile_id', user.id),
  ]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-h2 font-bold text-navy">Mon profil</h1>
        <p className="mt-2 text-body text-error">
          Profil introuvable — reconnectez-vous ou contactez le support.
        </p>
      </div>
    );
  }

  const initial: ProfileFormInitial = {
    slug: profile.slug,
    firstName: profile.first_name ?? '',
    lastName: profile.last_name ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    phone: profile.phone ?? '',
    visibility: profile.visibility as VisibilityLevel,
    city: profile.insee_code
      ? {
          cityName: profile.city_name ?? '',
          inseeCode: profile.insee_code,
          postalCode: profile.postal_code ?? '',
          department: profile.department ?? '',
          region: profile.region ?? '',
          lat: profile.lat ?? 0,
          lng: profile.lng ?? 0,
        }
      : null,
    skillIds: (mySkills ?? []).map((s) => s.skill_id),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-h2 font-bold text-navy">Mon profil</h1>
      <p className="mb-6 mt-1 text-body text-grey">
        Ces informations alimentent votre profil public et la recherche.
      </p>
      <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
        <ProfileForm initial={initial} allSkills={skills ?? []} />
      </div>
    </div>
  );
}
