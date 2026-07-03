'use client';

import { useActionState } from 'react';
import { createResource } from '../admin-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

export function CreateResourceForm() {
  const [state, action, pending] = useActionState(createResource, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.success && <Alert variant="success">{state.success}</Alert>}
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field label="Titre" htmlFor="rs-title" required>
        <Input id="rs-title" name="title" maxLength={160} />
      </Field>
      <Field label="Description" htmlFor="rs-desc">
        <Textarea id="rs-desc" name="description" rows={2} maxLength={500} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="URL du fichier (https)" htmlFor="rs-url" required>
          <Input id="rs-url" name="fileUrl" type="url" />
        </Field>
        <Field label="Format" htmlFor="rs-kind">
          <Select id="rs-kind" name="kind" defaultValue="">
            <option value="">—</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
          </Select>
        </Field>
      </div>
      <Button type="submit" loading={pending}>
        Publier la ressource
      </Button>
    </form>
  );
}
