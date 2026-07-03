'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUser } from '@/lib/auth/session';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';
import { emailSchema } from '@/lib/validation/patterns';
import { clientIp } from '@/lib/rate-limit';
import { t } from '@/i18n/fr';

const downloadSchema = z.object({
  resourceId: z.string().uuid(),
  email: emailSchema,
});

/**
 * M09 — gating email : on enregistre l'email (resource_downloads, INSERT public)
 * puis on renvoie l'URL de la ressource. (Le lien signé Storage sera généré
 * côté serveur quand le bucket `resources` sera provisionné, Annexe B.)
 */
export async function requestResourceDownload(
  _prev: { error?: string; url?: string },
  formData: FormData,
): Promise<{ error?: string; url?: string }> {
  const parsed = downloadSchema.safeParse({
    resourceId: formData.get('resourceId'),
    email: formData.get('email'),
  });
  if (!parsed.success) return { error: t('error_validation') };

  try {
    await rateLimit('contact', await clientIp());
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: resource } = await supabase
    .from('resources')
    .select('id, file_url, status')
    .eq('id', parsed.data.resourceId)
    .eq('status', 'published')
    .maybeSingle();
  if (!resource) return { error: t('error_not_found') };

  const user = await getUser();
  const admin = createAdminClient();
  await admin.from('resource_downloads').insert({
    resource_id: parsed.data.resourceId,
    user_id: user?.id ?? null,
    email: parsed.data.email,
  });

  return { url: resource.file_url };
}
