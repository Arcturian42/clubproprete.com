'use client';

import { useActionState, useEffect, useOptimistic, useRef, useState, startTransition } from 'react';
import { Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, markConversationRead } from '../actions';
import type { Message } from '../queries';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * Fil 1-1 (F-15) — Supabase Realtime avec FALLBACK polling (30 s) si le canal
 * n'est pas ouvert, envoi optimiste, accusé de lecture global (T4).
 */
export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [realtimeOk, setRealtimeOk] = useState(true);
  const [optimistic, addOptimistic] = useOptimistic(messages, (state, body: string) => [
    ...state,
    {
      id: `optimistic-${state.length}`,
      sender_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
      deleted_at: null,
    },
  ]);
  const [state, formAction] = useActionState(sendMessage, {});
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Marque lu à l'ouverture.
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  // Realtime : nouvelles lignes messages de cette conversation.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe((status) => setRealtimeOk(status === 'SUBSCRIBED'));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Fallback polling si Realtime KO (résilience PRD 19.3).
  useEffect(() => {
    if (realtimeOk) return;
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at, deleted_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (data) setMessages(data as Message[]);
    }, 30000);
    return () => clearInterval(interval);
  }, [realtimeOk, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [optimistic.length]);

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col">
      {!realtimeOk && (
        <Alert variant="warning" className="mb-2 text-caption">
          Connexion temps réel interrompue — les messages se rafraîchissent toutes les 30 s.
        </Alert>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto rounded-md bg-ice p-4">
        {optimistic.length === 0 ? (
          <p className="mt-8 text-center text-caption text-grey">
            Démarrez la conversation ci-dessous.
          </p>
        ) : (
          optimistic.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-3 py-2 text-body',
                    mine ? 'bg-blue text-white' : 'border border-navy/10 bg-white text-navy',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn('mt-0.5 text-[11px]', mine ? 'text-white/60' : 'text-grey')}>
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {state.error && <Alert variant="error" className="mt-2">{state.error}</Alert>}

      <form
        ref={formRef}
        action={(fd) => {
          const body = String(fd.get('body') ?? '').trim();
          if (!body) return;
          startTransition(() => addOptimistic(body));
          formRef.current?.reset();
          formAction(fd);
        }}
        className="mt-2 flex items-end gap-2"
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <textarea
          name="body"
          rows={1}
          required
          maxLength={4000}
          placeholder="Écrire un message…"
          className="min-h-11 flex-1 resize-none rounded-md border border-navy/20 px-3 py-2.5 text-body text-navy focus-visible:ring-2 focus-visible:ring-blue"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" size="icon" aria-label="Envoyer">
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
