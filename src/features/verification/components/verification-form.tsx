'use client';

import { useActionState, useMemo, useState } from 'react';
import { requestVerification, type VerificationFormState } from '../actions';
import { SENIORITY_LABELS, HEADCOUNT_LABELS } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

/** F-06 — créneaux structurés + questionnaire (jamais de texte libre inutile). */
export function VerificationForm({ entityId }: { entityId: string }) {
  const [seniority, setSeniority] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [date1, setDate1] = useState('');
  const [period1, setPeriod1] = useState<'matin' | 'apres_midi'>('matin');
  const [date2, setDate2] = useState('');
  const [period2, setPeriod2] = useState<'matin' | 'apres_midi'>('matin');

  const [state, formAction, pending] = useActionState<VerificationFormState, FormData>(
    requestVerification,
    {},
  );

  const payload = useMemo(() => {
    const slots = [
      date1 && { date: date1, period: period1 },
      date2 && { date: date2, period: period2 },
    ].filter(Boolean);
    return JSON.stringify({ entityId, seniority, headcount, slots });
  }, [entityId, seniority, headcount, date1, period1, date2, period2]);

  if (state.success) {
    return <Alert variant="success">{state.success}</Alert>;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="payload" value={payload} />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ancienneté de l'activité" htmlFor="vf-sen" required>
          <Select id="vf-sen" value={seniority} onChange={(e) => setSeniority(e.target.value)}>
            <option value="">Choisir…</option>
            {Object.entries(SENIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Effectif" htmlFor="vf-head" required>
          <Select id="vf-head" value={headcount} onChange={(e) => setHeadcount(e.target.value)}>
            <option value="">Choisir…</option>
            {Object.entries(HEADCOUNT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-caption font-medium text-navy">
          Créneaux d&apos;appel (nous vous contactons par téléphone)
        </legend>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              aria-label="Date du premier créneau"
              type="date"
              min={today}
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
            />
            <Select
              aria-label="Période du premier créneau"
              value={period1}
              onChange={(e) => setPeriod1(e.target.value as 'matin' | 'apres_midi')}
            >
              <option value="matin">Matin (9h–12h)</option>
              <option value="apres_midi">Après-midi (14h–18h)</option>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              aria-label="Date du second créneau (optionnel)"
              type="date"
              min={today}
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
            />
            <Select
              aria-label="Période du second créneau"
              value={period2}
              onChange={(e) => setPeriod2(e.target.value as 'matin' | 'apres_midi')}
            >
              <option value="matin">Matin (9h–12h)</option>
              <option value="apres_midi">Après-midi (14h–18h)</option>
            </Select>
          </div>
        </div>
      </fieldset>

      <p className="text-caption text-grey">
        L&apos;envoi de justificatifs (K-bis, attestation) arrivera avec l&apos;upload de
        documents ; la vérification téléphonique suffit pour démarrer.
      </p>

      <Button type="submit" loading={pending} disabled={!seniority || !headcount || !date1}>
        Envoyer la demande
      </Button>
    </form>
  );
}
