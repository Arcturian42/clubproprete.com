'use client';

import { useActionState, useMemo, useState } from 'react';
import { updateEntity, type EntityFormState } from '../actions';
import { computeCompletion } from '../completion';
import {
  CityAutocomplete,
  type CityValue,
} from '@/features/onboarding/components/city-autocomplete';
import {
  SERVICE_TYPES,
  CLIENT_SEGMENTS,
  SUPPLIER_FAMILIES,
  SUPPLIER_FAMILY_KEYS,
  TRAINING_CERTIFICATIONS,
  type ServiceType,
  type ClientSegment,
  type SupplierFamily,
  type TrainingCertification,
  type EntityType,
} from '@/referentiels';
import {
  SERVICE_LABELS,
  SEGMENT_LABELS,
  FAMILY_LABELS,
  CERTIFICATION_LABELS,
  subCategoryLabel,
} from '@/referentiels/labels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/** Chips multi-sélection sur référentiel fermé (cible ≥44px, aria-pressed). */
function ChipGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onChange: (v: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((x) => x !== o) : [...value, o])}
            className={cn(
              'min-h-11 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors',
              active
                ? 'border-blue bg-blue text-white'
                : 'border-navy/20 bg-white text-navy hover:border-blue hover:text-blue',
            )}
          >
            {labels[o]}
          </button>
        );
      })}
    </div>
  );
}

export interface EntityFormInitial {
  entityId: string;
  type: EntityType;
  verified: boolean;
  publicUrl: string;
  city: CityValue | null;
  // company
  name: string;
  legalName: string;
  siret: string;
  description: string;
  website: string;
  linkedin: string;
  googleMapsUrl: string;
  googleBusinessUrl: string;
  address: string;
  headcount: string;
  foundedYear: string;
  services: ServiceType[];
  segments: ClientSegment[];
  serviceAreas: string[];
  interventionRadius: string;
  logoUrl: string | null;
  // supplier
  family: SupplierFamily | '';
  subCategory: string;
  // training_org
  certifications: TrainingCertification[];
  programsText: string;
  // independent
  headline: string;
}

export function EntityForm({ initial }: { initial: EntityFormInitial }) {
  const [f, setF] = useState(initial);
  const set = <K extends keyof EntityFormInitial>(k: K, v: EntityFormInitial[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const [state, formAction, pending] = useActionState<EntityFormState, FormData>(updateEntity, {});

  const completion = useMemo(
    () =>
      computeCompletion({
        name: f.name || null,
        siret: f.siret || null,
        inseeCode: f.city?.inseeCode ?? null,
        servicesCount: f.services.length,
        segmentsCount: f.segments.length,
        logoUrl: f.logoUrl,
        photosCount: 0, // galerie livrée avec l'upload Storage (Annexe B)
        website: f.website || null,
        googleMapsUrl: f.googleMapsUrl || null,
        googleBusinessUrl: f.googleBusinessUrl || null,
        serviceAreasCount: f.serviceAreas.length,
        description: f.description || null,
        verified: f.verified,
      }),
    [f],
  );

  const payload = useMemo(() => {
    if (f.type === 'company') {
      return JSON.stringify({
        type: 'company',
        name: f.name,
        legalName: f.legalName,
        siret: f.siret,
        description: f.description,
        website: f.website,
        linkedin: f.linkedin,
        googleMapsUrl: f.googleMapsUrl,
        googleBusinessUrl: f.googleBusinessUrl,
        address: f.address,
        headcount: f.headcount,
        foundedYear: f.foundedYear,
        services: f.services,
        segments: f.segments,
        serviceAreas: f.serviceAreas,
        interventionRadius: f.interventionRadius,
        city: f.city,
      });
    }
    if (f.type === 'supplier') {
      return JSON.stringify({
        type: 'supplier',
        name: f.name,
        family: f.family,
        subCategory: f.subCategory,
        description: f.description,
        website: f.website,
        city: f.city,
      });
    }
    if (f.type === 'training_org') {
      return JSON.stringify({
        type: 'training_org',
        name: f.name,
        certifications: f.certifications,
        programsText: f.programsText,
        website: f.website,
        city: f.city,
      });
    }
    return JSON.stringify({
      type: 'independent',
      headline: f.headline,
      serviceAreas: f.serviceAreas,
      city: f.city,
    });
  }, [f]);

  const isCompany = f.type === 'company';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form action={formAction} className="space-y-5 lg:col-span-2" noValidate>
        <input type="hidden" name="entityId" value={f.entityId} />
        <input type="hidden" name="payload" value={payload} />

        {state.success && <Alert variant="success">{state.success}</Alert>}
        {state.error && (
          <Alert variant="error">
            {state.error}
            {state.fieldErrors && (
              <ul className="mt-1 list-inside list-disc text-caption">
                {Object.values(state.fieldErrors).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        {f.type !== 'independent' && (
          <Field label="Nom" htmlFor="ef-name" required error={state.fieldErrors?.name}>
            <Input id="ef-name" value={f.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
        )}

        {f.type === 'independent' && (
          <Field
            label="Votre activité en une phrase"
            htmlFor="ef-headline"
            error={state.fieldErrors?.headline}
          >
            <Input
              id="ef-headline"
              maxLength={120}
              value={f.headline}
              onChange={(e) => set('headline', e.target.value)}
            />
          </Field>
        )}

        {isCompany && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Raison sociale" htmlFor="ef-legal">
              <Input id="ef-legal" value={f.legalName} onChange={(e) => set('legalName', e.target.value)} />
            </Field>
            <Field label="SIRET" htmlFor="ef-siret" hint="14 chiffres." error={state.fieldErrors?.siret}>
              <Input
                id="ef-siret"
                inputMode="numeric"
                maxLength={14}
                value={f.siret}
                onChange={(e) => set('siret', e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </div>
        )}

        {f.type === 'supplier' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Famille" htmlFor="ef-fam" required error={state.fieldErrors?.family}>
              <Select
                id="ef-fam"
                value={f.family}
                onChange={(e) => {
                  set('family', e.target.value as SupplierFamily | '');
                  set('subCategory', '');
                }}
              >
                <option value="">Choisir…</option>
                {SUPPLIER_FAMILY_KEYS.map((fam) => (
                  <option key={fam} value={fam}>
                    {FAMILY_LABELS[fam]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sous-catégorie" htmlFor="ef-sub" required error={state.fieldErrors?.subCategory}>
              <Select
                id="ef-sub"
                value={f.subCategory}
                onChange={(e) => set('subCategory', e.target.value)}
                disabled={!f.family}
              >
                <option value="">Choisir…</option>
                {f.family &&
                  SUPPLIER_FAMILIES[f.family].map((sub) => (
                    <option key={sub} value={sub}>
                      {subCategoryLabel(sub)}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
        )}

        {f.type === 'training_org' && (
          <>
            <fieldset>
              <legend className="mb-2 text-caption font-medium text-navy">Certifications</legend>
              <ChipGroup
                options={TRAINING_CERTIFICATIONS}
                labels={CERTIFICATION_LABELS}
                value={f.certifications}
                onChange={(v) => set('certifications', v)}
              />
            </fieldset>
            <Field
              label="Formations proposées"
              htmlFor="ef-programs"
              hint="Texte libre (décision produit v9 — pas de catalogue structuré)."
            >
              <Textarea
                id="ef-programs"
                rows={5}
                maxLength={5000}
                value={f.programsText}
                onChange={(e) => set('programsText', e.target.value)}
              />
            </Field>
          </>
        )}

        {(isCompany || f.type === 'supplier') && (
          <Field
            label="Description"
            htmlFor="ef-desc"
            hint="Présentez votre activité (30 caractères minimum pour compter dans le score)."
            error={state.fieldErrors?.description}
          >
            <Textarea
              id="ef-desc"
              rows={5}
              maxLength={3000}
              value={f.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        )}

        {isCompany && (
          <>
            <fieldset>
              <legend className="mb-2 text-caption font-medium text-navy">
                Services (référentiel) <span className="font-normal text-grey">— {f.services.length} sélectionné(s)</span>
              </legend>
              <ChipGroup
                options={SERVICE_TYPES}
                labels={SERVICE_LABELS}
                value={f.services}
                onChange={(v) => set('services', v)}
              />
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-caption font-medium text-navy">Segments clients</legend>
              <ChipGroup
                options={CLIENT_SEGMENTS}
                labels={SEGMENT_LABELS}
                value={f.segments}
                onChange={(v) => set('segments', v)}
              />
            </fieldset>
          </>
        )}

        {(isCompany || f.type === 'independent') && (
          <Field
            label="Zones d'intervention"
            htmlFor="ef-areas"
            hint="Séparées par des virgules — ex. « Lyon, Villeurbanne, Rhône »."
          >
            <Input
              id="ef-areas"
              value={f.serviceAreas.join(', ')}
              onChange={(e) =>
                set(
                  'serviceAreas',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
        )}

        {f.type !== 'independent' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site web" htmlFor="ef-web" hint="https:// requis." error={state.fieldErrors?.website}>
              <Input id="ef-web" type="url" value={f.website} onChange={(e) => set('website', e.target.value)} />
            </Field>
            {isCompany && (
              <Field label="LinkedIn" htmlFor="ef-li" error={state.fieldErrors?.linkedin}>
                <Input id="ef-li" type="url" value={f.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
              </Field>
            )}
          </div>
        )}

        {isCompany && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lien Google Maps" htmlFor="ef-maps" error={state.fieldErrors?.googleMapsUrl}>
              <Input id="ef-maps" type="url" value={f.googleMapsUrl} onChange={(e) => set('googleMapsUrl', e.target.value)} />
            </Field>
            <Field label="Lien Google Business" htmlFor="ef-gbp" error={state.fieldErrors?.googleBusinessUrl}>
              <Input id="ef-gbp" type="url" value={f.googleBusinessUrl} onChange={(e) => set('googleBusinessUrl', e.target.value)} />
            </Field>
          </div>
        )}

        <Field label="Ville" htmlFor="ef-city" hint="Localisation de la fiche dans l'annuaire.">
          <CityAutocomplete value={f.city} onChange={(v) => set('city', v)} />
        </Field>

        <div className="border-t border-navy/10 pt-4">
          <Button type="submit" loading={pending}>
            Enregistrer la fiche
          </Button>
        </div>
      </form>

      {/* Score de complétion (barème PRD 10.1) */}
      <aside className="lg:col-span-1">
        <div className="sticky top-4 rounded-lg border border-navy/10 bg-white p-5 shadow-lift">
          <p className="text-caption font-medium uppercase tracking-wide text-grey">
            Score de complétion
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-h1 font-bold text-navy">{completion.score}</span>
            <span className="text-body text-grey">/ 100 · {completion.label}</span>
          </p>
          <div
            role="progressbar"
            aria-valuenow={completion.score}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-2 overflow-hidden rounded-full bg-ice"
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                completion.score >= 80 ? 'bg-teal' : completion.score >= 50 ? 'bg-blue' : 'bg-warning',
              )}
              style={{ width: `${completion.score}%` }}
            />
          </div>
          {completion.missing.length > 0 && (
            <>
              <p className="mt-4 text-caption font-medium text-navy">Pour progresser :</p>
              <ul className="mt-1 space-y-1 text-caption text-grey">
                {completion.missing.map((m) => (
                  <li key={m}>· {m}</li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-caption text-grey">
            Logo et photos arrivent avec l&apos;upload de médias (buckets Storage, Annexe B).
          </p>
        </div>
      </aside>
    </div>
  );
}
