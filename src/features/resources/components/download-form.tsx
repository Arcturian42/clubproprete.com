'use client';

import { useActionState } from 'react';
import { requestResourceDownload } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

/** M09 — formulaire de gating email pour télécharger une ressource. */
export function ResourceDownloadForm({ resourceId }: { resourceId: string }) {
  const [state, action, pending] = useActionState(requestResourceDownload, {});

  if (state.url) {
    return (
      <Alert variant="success">
        Merci ! Votre téléchargement est prêt :{' '}
        <a href={state.url} className="font-medium underline" target="_blank" rel="noopener">
          télécharger le document
        </a>
        .
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="resourceId" value={resourceId} />
      <div className="flex-1">
        <label htmlFor={`dl-${resourceId}`} className="mb-1 block text-caption text-grey">
          Votre email
        </label>
        <Input id={`dl-${resourceId}`} name="email" type="email" required placeholder="vous@entreprise.fr" />
      </div>
      <Button type="submit" loading={pending}>
        Télécharger
      </Button>
      {state.error && <Alert variant="error" className="w-full">{state.error}</Alert>}
    </form>
  );
}
