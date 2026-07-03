'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { audit } from '@/lib/audit';
import { slugWithSuffix } from '@/lib/slug';
import { httpsUrlSchema } from '@/lib/validation/patterns';
import { t } from '@/i18n/fr';

const createResourceSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
  fileUrl: httpsUrlSchema,
  kind: z.enum(['pdf', 'docx']).optional().or(z.literal('').transform(() => undefined)),
});

/** M09 — création d'une ressource (capacité admin_panel). Publiée directement. */
export async function createResource(
  _prev: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser('/admin/ressources');
  await requireCapability('admin_panel');

  const parsed = createResourceSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    fileUrl: formData.get('fileUrl'),
    kind: formData.get('kind'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t('error_validation') };

  const supabase = await createClient();
  const { error } = await supabase.from('resources').insert({
    title: parsed.data.title,
    slug: slugWithSuffix(parsed.data.title),
    description: parsed.data.description ?? null,
    file_url: parsed.data.fileUrl,
    kind: parsed.data.kind ?? null,
    status: 'published',
    created_by: user.id,
  });
  if (error) return { error: t('error_generic') };

  await audit({ actorId: user.id, action: 'resource_created', targetType: 'resource' });
  revalidatePath('/admin/ressources');
  revalidatePath('/ressources');
  return { success: 'Ressource publiée.' };
}
