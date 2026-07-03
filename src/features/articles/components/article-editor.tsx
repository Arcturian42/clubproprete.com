'use client';

import { useActionState } from 'react';
import { saveArticleDraft, type ArticleFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

/** Éditeur d'article — Markdown (converti + sanitizé serveur, R8). */
export function ArticleEditor({
  initial,
  categories,
}: {
  initial: {
    id?: string;
    title: string;
    contentMarkdown: string;
    categoryId: string;
    featuredImage: string;
  };
  categories: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<ArticleFormState, FormData>(
    saveArticleDraft,
    {},
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <Field label="Titre" htmlFor="ar-title" required error={state.fieldErrors?.title}>
        <Input id="ar-title" name="title" defaultValue={initial.title} maxLength={160} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories.length > 0 && (
          <Field label="Catégorie" htmlFor="ar-cat">
            <select
              id="ar-cat"
              name="categoryId"
              defaultValue={initial.categoryId}
              className="min-h-11 w-full rounded-sm border border-navy/40 bg-white px-3 py-2 text-body text-navy"
            >
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field
          label="Image à la une (URL https)"
          htmlFor="ar-img"
          hint="Requise pour soumettre à publication."
          error={state.fieldErrors?.featuredImage}
        >
          <Input id="ar-img" name="featuredImage" type="url" defaultValue={initial.featuredImage} />
        </Field>
      </div>

      <Field
        label="Contenu (Markdown)"
        htmlFor="ar-content"
        hint="Titres (##), gras (**), listes (-), liens [texte](https://…). Le HTML est nettoyé automatiquement."
        error={state.fieldErrors?.contentMarkdown}
      >
        <Textarea
          id="ar-content"
          name="contentMarkdown"
          rows={16}
          defaultValue={initial.contentMarkdown}
          className="font-mono text-caption"
        />
      </Field>

      <Button type="submit" loading={pending}>
        Enregistrer le brouillon
      </Button>
    </form>
  );
}
