'use client';

import { useActionState } from 'react';
import { sendRecommendation } from '../actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

/** F-09 — recommander un professionnel (petit formulaire inline). */
export function RecommendForm({
  targetUserId,
  targetName,
  onDone,
}: {
  targetUserId: string;
  targetName: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(sendRecommendation, {});

  if (state.success) {
    return <Alert variant="success" className="w-72">{state.success}</Alert>;
  }

  return (
    <form action={action} className="w-72 space-y-2 rounded-md border border-navy/10 bg-white p-3 text-left shadow-lift">
      <input type="hidden" name="toUserId" value={targetUserId} />
      <p className="text-caption font-medium text-navy">Recommander {targetName}</p>
      <Input name="quality" placeholder="Qualité (ex. : ponctualité)" maxLength={60} />
      <Textarea name="text" rows={3} required minLength={10} placeholder="Votre recommandation…" />
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>Publier</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Annuler</Button>
      </div>
    </form>
  );
}
