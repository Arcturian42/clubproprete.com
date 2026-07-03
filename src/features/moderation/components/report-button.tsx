'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { reportContent } from '../actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';

type TargetType = 'article' | 'profile' | 'message' | 'recommendation' | 'entity';

/** F-14 — bouton de signalement (contenu UGC). Nécessite une session (RLS). */
export function ReportButton({ targetType, targetId }: { targetType: TargetType; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const res = await reportContent(formData);
    setResult(res);
    setPending(false);
    if (res.success) setOpen(false);
  }

  if (result?.success) {
    return <p className="text-caption text-teal">{result.success}</p>;
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-caption text-grey hover:text-error"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden /> Signaler
        </button>
      ) : (
        <form action={onSubmit} className="space-y-2 rounded-md border border-navy/10 bg-white p-3">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <label htmlFor={`report-${targetId}`} className="block text-caption font-medium text-navy">
            Motif du signalement
          </label>
          <Textarea id={`report-${targetId}`} name="reason" rows={3} required minLength={3} />
          {result?.error && <Alert variant="error">{result.error}</Alert>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="destructive" loading={pending}>
              Envoyer
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
