import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { Tables } from '@/types/database.types';
import type { EntityType } from '@/referentiels';

export interface MyEntity {
  entity: Tables<'entities'>;
  role: string;
  displayName: string;
}

/** Fiches dont je suis membre (avec nom d'affichage selon le type). */
export async function getMyEntities(userId: string): Promise<MyEntity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('entity_members')
    .select('role, entities!inner(*)')
    .eq('user_id', userId);

  const rows = (data ?? []).map((m) => ({
    role: m.role as string,
    entity: m.entities as unknown as Tables<'entities'>,
  }));

  const named = await Promise.all(
    rows.map(async ({ entity, role }) => ({
      entity,
      role,
      displayName: await getEntityDisplayName(entity.id, entity.type),
    })),
  );
  return named.filter((e) => e.entity.deleted_at === null);
}

async function getEntityDisplayName(entityId: string, type: EntityType): Promise<string> {
  const supabase = await createClient();
  if (type === 'company') {
    const { data } = await supabase.from('companies').select('name').eq('entity_id', entityId).maybeSingle();
    return data?.name ?? 'Société';
  }
  if (type === 'supplier') {
    const { data } = await supabase.from('suppliers').select('name').eq('entity_id', entityId).maybeSingle();
    return data?.name ?? 'Fournisseur';
  }
  if (type === 'training_org') {
    const { data } = await supabase.from('training_orgs').select('name').eq('entity_id', entityId).maybeSingle();
    return data?.name ?? 'Centre de formation';
  }
  const { data } = await supabase.from('independents').select('headline').eq('entity_id', entityId).maybeSingle();
  return data?.headline ?? 'Indépendant';
}

export interface EntityDetail {
  entity: Tables<'entities'>;
  company: Tables<'companies'> | null;
  supplier: Tables<'suppliers'> | null;
  trainingOrg: Tables<'training_orgs'> | null;
  independent: Tables<'independents'> | null;
  services: string[];
  role: string | null; // rôle du membre courant, null si non membre
}

/** Détail d'une fiche pour ÉDITION (client session, RLS membre). */
export async function getEntityForEdit(entityId: string, userId: string): Promise<EntityDetail | null> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('entity_members')
    .select('role')
    .eq('entity_id', entityId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!membership) return null;

  const { data: entity } = await supabase.from('entities').select('*').eq('id', entityId).maybeSingle();
  if (!entity || entity.deleted_at) return null;

  const detail = await loadChildren(supabase, entity as Tables<'entities'>);
  return { ...detail, role: membership.role as string };
}

/** Détail d'une fiche PUBLIQUE par type+slug (client anonyme, ISR). */
export async function getPublicEntityBySlug(
  type: EntityType,
  slug: string,
): Promise<EntityDetail | null> {
  const supabase = createPublicClient();
  const { data: entity } = await supabase
    .from('entities')
    .select('*')
    .eq('slug', slug)
    .eq('type', type)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  if (!entity) return null;

  const detail = await loadChildren(supabase, entity as Tables<'entities'>);
  return { ...detail, role: null };
}

type AnyClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createPublicClient>;

async function loadChildren(supabase: AnyClient, entity: Tables<'entities'>) {
  const [company, supplier, trainingOrg, independent, services] = await Promise.all([
    entity.type === 'company'
      ? supabase.from('companies').select('*').eq('entity_id', entity.id).maybeSingle()
      : Promise.resolve({ data: null }),
    entity.type === 'supplier'
      ? supabase.from('suppliers').select('*').eq('entity_id', entity.id).maybeSingle()
      : Promise.resolve({ data: null }),
    entity.type === 'training_org'
      ? supabase.from('training_orgs').select('*').eq('entity_id', entity.id).maybeSingle()
      : Promise.resolve({ data: null }),
    entity.type === 'independent'
      ? supabase.from('independents').select('*').eq('entity_id', entity.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('company_services').select('service_type').eq('entity_id', entity.id),
  ]);

  return {
    entity,
    company: (company.data as Tables<'companies'> | null) ?? null,
    supplier: (supplier.data as Tables<'suppliers'> | null) ?? null,
    trainingOrg: (trainingOrg.data as Tables<'training_orgs'> | null) ?? null,
    independent: (independent.data as Tables<'independents'> | null) ?? null,
    services: ('data' in services ? (services.data ?? []) : []).map(
      (s: { service_type: string }) => s.service_type,
    ),
  };
}
