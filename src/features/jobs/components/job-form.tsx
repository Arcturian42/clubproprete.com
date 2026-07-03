'use client';

import { useActionState, useMemo, useState } from 'react';
import { publishJob, type JobFormState } from '../actions';
import { CityAutocomplete, type CityValue } from '@/features/onboarding/components/city-autocomplete';
import { CONTRACT_TYPES } from '@/referentiels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

/** F-10 — formulaire de publication d'offre (entité vérifiée requise). */
export function JobForm({ entities }: { entities: { id: string; name: string }[] }) {
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState('CDI');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<CityValue | null>(null);
  const [expiresInDays, setExpiresInDays] = useState('30');

  const [state, action, pending] = useActionState<JobFormState, FormData>(publishJob, {});

  const payload = useMemo(
    () => JSON.stringify({ entityId, title, contractType, description, city, expiresInDays }),
    [entityId, title, contractType, description, city, expiresInDays],
  );

  if (entities.length === 0) {
    return (
      <Alert variant="warning">
        Pour publier une offre, vous devez être membre d&apos;une entité <strong>vérifiée</strong>.
        Demandez la vérification de votre fiche depuis « Mes fiches ».
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="payload" value={payload} />
      {state.success && <Alert variant="success">{state.success}</Alert>}
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <Field label="Entité employeur (vérifiée)" htmlFor="jb-entity" required>
        <Select id="jb-entity" value={entityId} onChange={(e) => setEntityId(e.target.value)}>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Intitulé du poste" htmlFor="jb-title" required error={state.fieldErrors?.title}>
        <Input id="jb-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type de contrat" htmlFor="jb-contract" required>
          <Select id="jb-contract" value={contractType} onChange={(e) => setContractType(e.target.value)}>
            {CONTRACT_TYPES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Durée de mise en ligne" htmlFor="jb-exp">
          <Select id="jb-exp" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)}>
            <option value="30">30 jours</option>
            <option value="60">60 jours</option>
            <option value="90">90 jours</option>
          </Select>
        </Field>
      </div>

      <Field label="Lieu" htmlFor="jb-city" required hint="Localisation de l'offre (recherche géo).">
        <CityAutocomplete value={city} onChange={setCity} />
      </Field>

      <Field label="Description du poste" htmlFor="jb-desc" required error={state.fieldErrors?.description}>
        <Textarea id="jb-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={8} maxLength={8000} />
      </Field>

      <Button type="submit" loading={pending} disabled={!city || !title}>
        Publier l&apos;offre
      </Button>
    </form>
  );
}
