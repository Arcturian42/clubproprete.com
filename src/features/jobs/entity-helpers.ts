import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** Entités VÉRIFIÉES dont l'utilisateur est membre (employeurs éligibles F-10). */
export async function getMyVerifiedEntities(userId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('entity_members')
    .select('entities!inner(id, type, verified, status, deleted_at)')
    .eq('user_id', userId);

  const entities = (data ?? [])
    .map((m) => m.entities as unknown as { id: string; type: string; verified: boolean; status: string; deleted_at: string | null })
    .filter((e) => e.verified && e.status === 'active' && !e.deleted_at);

  const named = await Promise.all(
    entities.map(async (e) => {
      let name = 'Entité vérifiée';
      if (e.type === 'company') {
        const { data: c } = await supabase.from('companies').select('name').eq('entity_id', e.id).maybeSingle();
        name = c?.name ?? name;
      } else if (e.type === 'supplier') {
        const { data: s } = await supabase.from('suppliers').select('name').eq('entity_id', e.id).maybeSingle();
        name = s?.name ?? name;
      } else if (e.type === 'training_org') {
        const { data: t } = await supabase.from('training_orgs').select('name').eq('entity_id', e.id).maybeSingle();
        name = t?.name ?? name;
      }
      return { id: e.id, name };
    }),
  );
  return named;
}
