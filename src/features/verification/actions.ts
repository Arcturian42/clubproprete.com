'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { audit } from '@/lib/audit';
import { notify, notifyCapabilityHolders } from '@/lib/notifications/notify';
import { t } from '@/i18n/fr';
import { verificationRequestSchema, decisionSchema } from './schemas';

export type VerificationFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

/** F-06 étape 1 — demande de vérification (membre de l'entité, RLS verif_insert). */
export async function requestVerification(
  _prev: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const user = await requireUser('/espace/fiches');

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('payload') ?? '{}'));
  } catch {
    return { error: t('error_validation') };
  }
  const parsed = verificationRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: t('error_validation'), fieldErrors };
  }
  const input = parsed.data;
  const supabase = await createClient();

  // Une seule demande pending par entité.
  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id')
    .eq('entity_id', input.entityId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing) {
    return { error: 'Une demande est déjà en cours pour cette fiche.' };
  }

  const { error } = await supabase.from('verification_requests').insert({
    entity_id: input.entityId,
    status: 'pending',
    seniority: input.seniority,
    headcount: input.headcount,
    requested_slots: input.slots,
  });
  if (error) return { error: t('error_forbidden') };

  await audit({
    actorId: user.id,
    action: 'verification_requested',
    targetType: 'entity',
    targetId: input.entityId,
  });
  await notifyCapabilityHolders({
    capability: 'moderate',
    type: 'admin_queue',
    payload: { kind: 'verification', entity_id: input.entityId },
  });

  const first = input.slots[0]!;
  revalidatePath(`/espace/fiches/${input.entityId}`);
  return {
    success: t('success_verification_requested', {
      date: first.date,
      creneau: first.period === 'matin' ? 'matin' : 'après-midi',
    }),
  };
}

/**
 * F-06 étapes 2-4 — décision admin (capacité moderate).
 * Approbation : verified=true → recalc_entity_capabilities pose publish_job
 * pour chaque membre + rôle verified_* (sans rétrograder) — effet « sans
 * reconnexion » via refreshSession côté client (chap. 13).
 * Refus/perte : recalc révoque publish_job si plus aucune entité vérifiée (B5).
 */
export async function decideVerification(formData: FormData): Promise<void> {
  const user = await requireUser('/admin/demandes');
  await requireCapability('moderate');

  const parsed = decisionSchema.safeParse({
    requestId: formData.get('requestId'),
    decision: formData.get('decision'),
    reason: (formData.get('reason') as string) || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/demandes?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? t('error_validation'))}`,
    );
  }
  const { requestId, decision, reason } = parsed.data;

  const supabase = await createClient();
  const { data: request } = await supabase
    .from('verification_requests')
    .select('id, entity_id, status, entities!inner(id, type)')
    .eq('id', requestId)
    .maybeSingle();
  if (!request || request.status !== 'pending') {
    // Action concurrente : la demande a déjà été traitée → rafraîchir (PRD 8).
    redirect('/admin/demandes?error=concurrent');
  }

  // 1. Transition de la demande (RLS verif_update : moderate).
  const { error: upError } = await supabase
    .from('verification_requests')
    .update({
      status: decision,
      reason: reason ?? null,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending'); // garde anti-concurrence
  if (upError) redirect(`/admin/demandes?error=${encodeURIComponent(t('error_forbidden'))}`);

  const admin = createAdminClient();
  const entityId = request.entity_id;
  const entityType = (request.entities as unknown as { type: string }).type;

  // 2. Effet sur l'entité.
  if (decision === 'approved') {
    await supabase.from('entities').update({ verified: true }).eq('id', entityId);
  }

  // 3. Recalcul des capacités des membres (pose/révoque publish_job — B5)
  //    + rôle verified_* posé sans rétrogradation à l'approbation.
  const { data: members } = await admin
    .from('entity_members')
    .select('user_id')
    .eq('entity_id', entityId);

  const verifiedRole = `verified_${entityType === 'training_org' ? 'training_org' : entityType}`;
  for (const m of members ?? []) {
    await admin.rpc('recalc_entity_capabilities', { p_user_id: m.user_id });
    if (decision === 'approved') {
      const { data: p } = await admin
        .from('profiles')
        .select('main_role')
        .eq('user_id', m.user_id)
        .single();
      const upgradable = ['registered_user', 'candidate', 'independent', 'training_org_owner', 'supplier_owner', 'company_owner'];
      if (p && upgradable.includes(p.main_role)) {
        await admin.from('profiles').update({ main_role: verifiedRole }).eq('user_id', m.user_id);
      }
    }
    await notify({
      userId: m.user_id,
      type: 'verification_decision',
      payload: { entity_id: entityId, decision, reason: reason ?? null },
    });
  }

  await audit({
    actorId: user.id,
    action: `verification_${decision}`,
    targetType: 'entity',
    targetId: entityId,
    reason,
  });

  revalidatePath('/admin/demandes');
  redirect('/admin/demandes?done=1');
}
