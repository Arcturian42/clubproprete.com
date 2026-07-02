'use client';

import { useActionState, useMemo, useState } from 'react';
import { Building2, Package, GraduationCap, UserRound, Search, Check } from 'lucide-react';
import { completeOnboarding, type OnboardingState } from '../actions';
import { SITUATIONS, type Situation } from '../schemas';
import { CityAutocomplete, type CityValue } from './city-autocomplete';
import { SUPPLIER_FAMILIES, SUPPLIER_FAMILY_KEYS, type SupplierFamily } from '@/referentiels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * F-01 — Wizard d'onboarding par situation.
 * 4 étapes : Contact → Situation(s) (multiples) → Détails → Récap.
 * Reprise T8 : pas d'état persisté ; abandonner = recommencer (assumé MVP).
 * La validation d'autorité est serveur (Zod, référentiels Annexe G).
 */

const SITUATION_META: Record<
  Situation,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  company: {
    label: 'Société de nettoyage',
    desc: 'Je dirige ou représente une entreprise de propreté.',
    icon: Building2,
  },
  supplier: {
    label: 'Fournisseur',
    desc: 'Machines, produits, consommables, EPI ou logiciels.',
    icon: Package,
  },
  training_org: {
    label: 'Centre de formation',
    desc: 'Organisme de formation aux métiers de la propreté.',
    icon: GraduationCap,
  },
  independent: {
    label: 'Indépendant',
    desc: 'Auto-entrepreneur ou indépendant du secteur.',
    icon: UserRound,
  },
  candidate: {
    label: "Demandeur d'emploi",
    desc: 'Je cherche un poste dans la propreté.',
    icon: Search,
  },
};

const FAMILY_LABELS: Record<SupplierFamily, string> = {
  machines: 'Machines',
  produits_chimiques: 'Produits chimiques',
  consommables: 'Consommables',
  equipements_protection: 'Équipements de protection',
  materiel_manuel: 'Matériel manuel',
  logiciels: 'Logiciels',
  services: 'Services',
};

const STEPS = ['Contact', 'Situation', 'Détails', 'Récapitulatif'] as const;

export function OnboardingWizard({
  defaultFirstName,
  defaultLastName,
}: {
  defaultFirstName: string;
  defaultLastName: string;
}) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [city, setCity] = useState<CityValue | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [companySiret, setCompanySiret] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierFamily, setSupplierFamily] = useState<SupplierFamily | ''>('');
  const [supplierSub, setSupplierSub] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [indepHeadline, setIndepHeadline] = useState('');

  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );

  const needsDetails = situations.some((s) => s !== 'candidate');

  const payload = useMemo(
    () =>
      JSON.stringify({
        firstName,
        lastName,
        city,
        situations,
        company: situations.includes('company')
          ? { name: companyName, siret: companySiret || undefined }
          : undefined,
        supplier: situations.includes('supplier')
          ? { name: supplierName, family: supplierFamily, subCategory: supplierSub }
          : undefined,
        trainingOrg: situations.includes('training_org') ? { name: trainingName } : undefined,
        independent: situations.includes('independent')
          ? { headline: indepHeadline || undefined }
          : undefined,
      }),
    [
      firstName,
      lastName,
      city,
      situations,
      companyName,
      companySiret,
      supplierName,
      supplierFamily,
      supplierSub,
      trainingName,
      indepHeadline,
    ],
  );

  const stepValid =
    step === 0
      ? firstName.trim() !== '' && lastName.trim() !== '' && city !== null
      : step === 1
        ? situations.length > 0
        : step === 2
          ? (!situations.includes('company') || companyName.trim().length >= 2) &&
            (!situations.includes('supplier') ||
              (supplierName.trim().length >= 2 && supplierFamily !== '' && supplierSub !== '')) &&
            (!situations.includes('training_org') || trainingName.trim().length >= 2)
          : true;

  function next() {
    // Saute l'étape Détails si seule la situation « candidat » est cochée.
    if (step === 1 && !needsDetails) setStep(3);
    else setStep((s) => Math.min(s + 1, 3));
  }
  function back() {
    if (step === 3 && !needsDetails) setStep(1);
    else setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2" aria-label="Étapes">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                i < step
                  ? 'bg-teal text-white'
                  : i === step
                    ? 'bg-blue text-white'
                    : 'bg-ice text-grey',
              )}
            >
              {i < step ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-caption sm:block',
                i === step ? 'font-medium text-navy' : 'text-grey',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-navy/10" aria-hidden />}
          </li>
        ))}
      </ol>

      {state.error && (
        <Alert variant="error" className="mb-4">
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

      {/* Étape 1 — Contact */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" htmlFor="ob-first" required>
              <Input id="ob-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Nom" htmlFor="ob-last" required>
              <Input id="ob-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field
            label="Votre ville"
            htmlFor="ob-city"
            required
            hint="Sélectionnez dans la liste — la géolocalisation alimente l'annuaire et la recherche."
          >
            <CityAutocomplete value={city} onChange={setCity} />
          </Field>
        </div>
      )}

      {/* Étape 2 — Situations (multiples) */}
      {step === 1 && (
        <fieldset>
          <legend className="mb-3 text-body text-grey">
            Plusieurs choix possibles — vous pourrez en ajouter plus tard.
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {SITUATIONS.map((s) => {
              const meta = SITUATION_META[s];
              const Icon = meta.icon;
              const checked = situations.includes(s);
              return (
                <label
                  key={s}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors',
                    checked ? 'border-blue bg-ice' : 'border-navy/15 bg-white hover:border-navy/30',
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[#0A66C2]"
                    checked={checked}
                    onChange={(e) =>
                      setSituations((prev) =>
                        e.target.checked ? [...prev, s] : prev.filter((x) => x !== s),
                      )
                    }
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium text-navy">
                      <Icon className="h-4 w-4 text-blue" aria-hidden />
                      {meta.label}
                    </span>
                    <span className="mt-0.5 block text-caption text-grey">{meta.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Étape 3 — Détails par situation */}
      {step === 2 && (
        <div className="space-y-6">
          {situations.includes('company') && (
            <section className="rounded-md border border-navy/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-h4 font-semibold text-navy">
                <Building2 className="h-4 w-4 text-blue" aria-hidden /> Votre société
              </h3>
              <div className="space-y-3">
                <Field label="Nom de l'entreprise" htmlFor="ob-cname" required>
                  <Input id="ob-cname" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </Field>
                <Field label="SIRET" htmlFor="ob-siret" hint="14 chiffres — facilite la vérification de votre fiche.">
                  <Input
                    id="ob-siret"
                    inputMode="numeric"
                    maxLength={14}
                    value={companySiret}
                    onChange={(e) => setCompanySiret(e.target.value.replace(/\D/g, ''))}
                  />
                </Field>
              </div>
            </section>
          )}

          {situations.includes('supplier') && (
            <section className="rounded-md border border-navy/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-h4 font-semibold text-navy">
                <Package className="h-4 w-4 text-blue" aria-hidden /> Votre offre fournisseur
              </h3>
              <div className="space-y-3">
                <Field label="Nom commercial" htmlFor="ob-sname" required>
                  <Input id="ob-sname" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Famille" htmlFor="ob-sfam" required>
                    <Select
                      id="ob-sfam"
                      value={supplierFamily}
                      onChange={(e) => {
                        setSupplierFamily(e.target.value as SupplierFamily | '');
                        setSupplierSub('');
                      }}
                    >
                      <option value="">Choisir…</option>
                      {SUPPLIER_FAMILY_KEYS.map((f) => (
                        <option key={f} value={f}>
                          {FAMILY_LABELS[f]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Sous-catégorie" htmlFor="ob-ssub" required>
                    <Select
                      id="ob-ssub"
                      value={supplierSub}
                      onChange={(e) => setSupplierSub(e.target.value)}
                      disabled={!supplierFamily}
                    >
                      <option value="">Choisir…</option>
                      {supplierFamily &&
                        SUPPLIER_FAMILIES[supplierFamily].map((sub) => (
                          <option key={sub} value={sub}>
                            {sub.replaceAll('_', ' ')}
                          </option>
                        ))}
                    </Select>
                  </Field>
                </div>
              </div>
            </section>
          )}

          {situations.includes('training_org') && (
            <section className="rounded-md border border-navy/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-h4 font-semibold text-navy">
                <GraduationCap className="h-4 w-4 text-blue" aria-hidden /> Votre organisme
              </h3>
              <Field label="Nom de l'organisme" htmlFor="ob-tname" required>
                <Input id="ob-tname" value={trainingName} onChange={(e) => setTrainingName(e.target.value)} />
              </Field>
            </section>
          )}

          {situations.includes('independent') && (
            <section className="rounded-md border border-navy/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-h4 font-semibold text-navy">
                <UserRound className="h-4 w-4 text-blue" aria-hidden /> Votre activité
              </h3>
              <Field
                label="En une phrase (optionnel)"
                htmlFor="ob-head"
                hint="Ex. : « Vitrerie et remise en état, secteur lyonnais »."
              >
                <Input
                  id="ob-head"
                  maxLength={120}
                  value={indepHeadline}
                  onChange={(e) => setIndepHeadline(e.target.value)}
                />
              </Field>
            </section>
          )}
        </div>
      )}

      {/* Étape 4 — Récapitulatif */}
      {step === 3 && (
        <div className="space-y-3">
          <dl className="divide-y divide-navy/10 rounded-md border border-navy/10">
            <div className="grid grid-cols-3 gap-2 p-3">
              <dt className="text-caption text-grey">Identité</dt>
              <dd className="col-span-2 text-body text-navy">
                {firstName} {lastName}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              <dt className="text-caption text-grey">Ville</dt>
              <dd className="col-span-2 text-body text-navy">
                {city ? `${city.cityName} (${city.postalCode}) — ${city.region}` : '—'}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              <dt className="text-caption text-grey">Situations</dt>
              <dd className="col-span-2 text-body text-navy">
                {situations.map((s) => SITUATION_META[s].label).join(' · ')}
              </dd>
            </div>
            {situations.includes('company') && (
              <div className="grid grid-cols-3 gap-2 p-3">
                <dt className="text-caption text-grey">Société</dt>
                <dd className="col-span-2 text-body text-navy">
                  {companyName}
                  {companySiret && ` — SIRET ${companySiret}`}
                </dd>
              </div>
            )}
            {situations.includes('supplier') && (
              <div className="grid grid-cols-3 gap-2 p-3">
                <dt className="text-caption text-grey">Fournisseur</dt>
                <dd className="col-span-2 text-body text-navy">
                  {supplierName} — {supplierFamily && FAMILY_LABELS[supplierFamily as SupplierFamily]} /{' '}
                  {supplierSub.replaceAll('_', ' ')}
                </dd>
              </div>
            )}
            {situations.includes('training_org') && (
              <div className="grid grid-cols-3 gap-2 p-3">
                <dt className="text-caption text-grey">Organisme</dt>
                <dd className="col-span-2 text-body text-navy">{trainingName}</dd>
              </div>
            )}
          </dl>
          <p className="text-caption text-grey">
            En validant, votre profil est initialisé et vos fiches sont créées puis publiées dans
            l&apos;annuaire. Vous pourrez les compléter à tout moment.
          </p>
        </div>
      )}

      {/* Navigation */}
      <form action={formAction} className="mt-8 flex items-center justify-between gap-3">
        <input type="hidden" name="payload" value={payload} />
        <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || pending}>
          Retour
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={next} disabled={!stepValid}>
            Continuer
          </Button>
        ) : (
          <Button type="submit" loading={pending}>
            Créer mon espace
          </Button>
        )}
      </form>
    </div>
  );
}
