'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { updateProfile, type ProfileFormState } from '../actions';
import { CityAutocomplete, type CityValue } from '@/features/onboarding/components/city-autocomplete';
import { VISIBILITY_LEVELS, type VisibilityLevel } from '@/referentiels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  public: 'Public (visible de tous, indexé)',
  members: 'Membres connectés uniquement',
  connections: 'Mes connexions uniquement',
  private: 'Privé (masqué de l’annuaire)',
};

export interface ProfileFormInitial {
  slug: string;
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  phone: string;
  visibility: VisibilityLevel;
  city: CityValue | null;
  skillIds: string[];
}

export function ProfileForm({
  initial,
  allSkills,
}: {
  initial: ProfileFormInitial;
  allSkills: { id: string; label: string }[];
}) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [phone, setPhone] = useState(initial.phone);
  const [visibility, setVisibility] = useState<VisibilityLevel>(initial.visibility);
  const [city, setCity] = useState<CityValue | null>(initial.city);
  const [skillIds, setSkillIds] = useState<string[]>(initial.skillIds);

  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {},
  );

  const payload = useMemo(
    () =>
      JSON.stringify({
        firstName,
        lastName,
        headline: headline || undefined,
        bio: bio || undefined,
        phone: phone || undefined,
        visibility,
        city,
        skillIds,
      }),
    [firstName, lastName, headline, bio, phone, visibility, city, skillIds],
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="payload" value={payload} />

      {state.success && <Alert variant="success">{state.success}</Alert>}
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="pf-first" required error={state.fieldErrors?.firstName}>
          <Input id="pf-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Nom" htmlFor="pf-last" required error={state.fieldErrors?.lastName}>
          <Input id="pf-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
      </div>

      <Field
        label="Titre professionnel"
        htmlFor="pf-headline"
        hint="Affiché sous votre nom — ex. « Dirigeant, Net'Éclat Services »."
        error={state.fieldErrors?.headline}
      >
        <Input
          id="pf-headline"
          maxLength={120}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </Field>

      <Field label="À propos" htmlFor="pf-bio" error={state.fieldErrors?.bio}>
        <Textarea
          id="pf-bio"
          rows={5}
          maxLength={2000}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Téléphone"
          htmlFor="pf-phone"
          hint="Optionnel."
          error={state.fieldErrors?.phone}
        >
          <Input
            id="pf-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Visibilité du profil" htmlFor="pf-vis" error={state.fieldErrors?.visibility}>
          <Select
            id="pf-vis"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
          >
            {VISIBILITY_LEVELS.map((v) => (
              <option key={v} value={v}>
                {VISIBILITY_LABELS[v]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Ville" htmlFor="pf-city" hint="Sélectionnez dans la liste (normalisation INSEE).">
        <CityAutocomplete value={city} onChange={setCity} />
      </Field>

      <fieldset>
        <legend className="mb-2 text-caption font-medium text-navy">
          Compétences <span className="font-normal text-grey">({skillIds.length}/20)</span>
        </legend>
        {allSkills.length === 0 ? (
          <p className="text-caption text-grey">
            Le référentiel de compétences sera alimenté au lancement (table `skills`).
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allSkills.map((s) => {
              const active = skillIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setSkillIds((prev) =>
                      active ? prev.filter((id) => id !== s.id) : prev.length < 20 ? [...prev, s.id] : prev,
                    )
                  }
                  className={cn(
                    'min-h-11 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors',
                    active
                      ? 'border-blue bg-blue text-white'
                      : 'border-navy/20 bg-white text-navy hover:border-blue hover:text-blue',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="flex items-center justify-between gap-3 border-t border-navy/10 pt-4">
        <Link
          href={`/p/${initial.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-caption text-blue underline"
        >
          Voir mon profil public <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Button type="submit" loading={pending}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
