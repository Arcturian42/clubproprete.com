import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getMessages, getConversationPeer } from '@/features/messaging/queries';
import { MessageThread } from '@/features/messaging/components/message-thread';
import { Avatar } from '@/components/ui/avatar';

export const metadata: Metadata = { title: 'Conversation' };

/** F-15 — fil d'une conversation (RLS : participant). */
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const user = await requireUser(`/espace/messages/${conversationId}`);

  const supabase = await createClient();
  // Garde participant (RLS renverrait vide, mais on veut un 404 explicite).
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) notFound();

  const [messages, peer] = await Promise.all([
    getMessages(conversationId),
    getConversationPeer(conversationId, user.id),
  ]);
  const name = `${peer?.first_name ?? ''} ${peer?.last_name ?? ''}`.trim() || 'Utilisateur supprimé';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/espace/messages" className="text-grey hover:text-navy" aria-label="Retour">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <Avatar src={peer?.photo_url} name={name} size={36} />
        <div>
          {peer ? (
            <Link href={`/p/${peer.slug}`} className="text-body font-semibold text-navy hover:text-blue">
              {name}
            </Link>
          ) : (
            <span className="text-body font-semibold text-navy">{name}</span>
          )}
        </div>
      </div>

      <MessageThread
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  );
}
