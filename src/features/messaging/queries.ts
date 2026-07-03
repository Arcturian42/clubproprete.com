import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface ConversationSummary {
  id: string;
  updatedAt: string;
  lastReadAt: string | null;
  other: {
    user_id: string;
    slug: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
  } | null;
  lastMessage: string | null;
}

/** F-15 — liste des conversations de l'utilisateur (RLS : participant). */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  // Conversations dont je suis membre actif.
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
    .is('left_at', null);

  const convIds = (memberships ?? []).map((m) => m.conversation_id);
  if (convIds.length === 0) return [];
  const lastReadMap = new Map((memberships ?? []).map((m) => [m.conversation_id, m.last_read_at]));

  const { data: convs } = await supabase
    .from('conversations')
    .select('id, updated_at')
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  const summaries: ConversationSummary[] = [];
  for (const c of convs ?? []) {
    const { data: others } = await supabase
      .from('conversation_members')
      .select('profiles!inner(user_id, slug, first_name, last_name, photo_url)')
      .eq('conversation_id', c.id)
      .neq('user_id', userId)
      .limit(1);
    const { data: last } = await supabase
      .from('messages')
      .select('body')
      .eq('conversation_id', c.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    summaries.push({
      id: c.id,
      updatedAt: c.updated_at,
      lastReadAt: lastReadMap.get(c.id) ?? null,
      other: (others?.[0]?.profiles as unknown as ConversationSummary['other']) ?? null,
      lastMessage: last?.body ?? null,
    });
  }
  return summaries;
}

export interface Message {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  deleted_at: string | null;
}

/** Messages d'une conversation (RLS : participant non bloqué, non soft-deleté). */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at, deleted_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  return (data ?? []) as Message[];
}

/** L'autre participant d'une conversation directe. */
export async function getConversationPeer(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('conversation_members')
    .select('profiles!inner(user_id, slug, first_name, last_name, photo_url)')
    .eq('conversation_id', conversationId)
    .neq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return (data?.profiles as unknown as ConversationSummary['other']) ?? null;
}
