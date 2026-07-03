'use client';

import { useActionState, useMemo, useState } from 'react';
import { createMission } from '../actions';
import { CityAutocomplete, type CityValue } from '@/features/onboarding/components/city-autocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

/** F-18 — formulaire de création de mission (membres, publish_mission). */
export function MissionForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<CityValue | null>(null);
  const [state, action, pending] = useActionState(createMission, {});

  const payload = useMemo(() => JSON.stringify({ title, description, city }), [title, description, city]);

  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="payload" value={payload} />
      {state.success && <Alert variant="success">{state.success}</Alert>}
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field label="Intitulé de la mission" htmlFor="mi-title" required>
        <Input id="mi-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
      </Field>
      <Field label="Description" htmlFor="mi-desc" required>
        <Textarea id="mi-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={4000} />
      </Field>
      <Field label="Lieu (optionnel)" htmlFor="mi-city">
        <CityAutocomplete value={city} onChange={setCity} />
      </Field>
      <Button type="submit" loading={pending} disabled={!title || description.length < 20}>
        Publier la mission
      </Button>
    </form>
  );
}
