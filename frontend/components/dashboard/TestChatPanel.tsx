'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useBots } from '@/hooks/useBots';
import { useSendMessage } from '@/hooks/useChat';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, MessageSquare, MessageSquarePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TestChatPanelProps {
  /** When set, this agent is pre-selected and the agent selector is hidden (e.g. when embedded in agent detail page). */
  preselectedBotId?: string;
  /** Alias for preselectedBotId. When set, this agent is pre-selected. */
  preselectedAgentId?: string;
  /** When true, hide the header (title + agent selector). Useful when embedded as a tab. */
  embedded?: boolean;
}

const SUGGESTIONS = [
  'What can you help me with?',
  'Summarize your capabilities',
  'Ask a question from my knowledge base',
];

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 max-w-[85%] rounded-2xl bg-brand-bgCard border border-brand-borderLight px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-brand-primary/70" />
          <span className="typing-dot h-2 w-2 rounded-full bg-brand-primary/70" />
          <span className="typing-dot h-2 w-2 rounded-full bg-brand-primary/70" />
        </div>
        <span className="text-xs text-brand-textMuted ml-1">Thinking...</span>
      </div>
    </div>
  );
}

export function TestChatPanel({ preselectedBotId, preselectedAgentId, embedded = false }: TestChatPanelProps) {
  const preselectedId = preselectedAgentId ?? preselectedBotId;
  const { bots } = useBots();
  const [selectedBotId, setSelectedBotId] = useState(preselectedId ?? '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveBotId = preselectedId ?? selectedBotId;

  useEffect(() => {
    if (preselectedId) setSelectedBotId(preselectedId);
  }, [preselectedId]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !effectiveBotId) {
      if (!effectiveBotId) toast.error('Select an agent first');
      return;
    }
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    sendMessage.mutate(
      {
        botId: effectiveBotId,
        message: text,
        conversationId: conversationId || undefined,
        sessionId: sessionIdRef.current,
      },
      {
        onSuccess: (data) => {
          setConversationId(data.conversationId);
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err));
          setMessages((prev) => prev.slice(0, -1));
        },
      }
    );
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div className={embedded ? 'h-full flex flex-col min-h-0' : 'space-y-6 h-full flex flex-col'}>
      {!embedded && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-brand-textHeading">Test Chat</h1>
            <p className="mt-1 text-sm text-brand-textMuted">
              Try your agent with RAG from your knowledge base
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-brand-text">Agent</label>
            <select
              value={selectedBotId}
              onChange={(e) => {
                setSelectedBotId(e.target.value);
                setMessages([]);
                setConversationId(null);
              }}
              className="rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary min-w-[180px]"
            >
              <option value="">Select an agent</option>
              {bots.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={handleNewChat}>
              New chat
            </Button>
          </div>
        </div>
      )}

      {!effectiveBotId ? (
        <Card className="flex-1 flex items-center justify-center min-h-0">
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-brand-textMuted mb-4" />
            <p className="text-brand-textMuted">Select an agent to start testing.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-brand-borderLight shadow-lg">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl bg-gradient-to-b from-brand-bgCard/50 to-brand-sidebar/30">
            <div
              className={`flex-1 flex flex-col min-h-0 px-4 pt-4 pb-2 ${
                messages.length === 0 ? 'overflow-hidden' : 'overflow-y-auto space-y-5'
              }`}
            >
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-8 px-4 text-center">
                  <div className="rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-4 mb-5">
                    <Image src="/brand-logo.png" alt="Aivora" width={48} height={48} className="w-12 h-12 object-contain" />
                  </div>
                  <h3 className="text-base font-medium text-brand-textHeading mb-1">Start a conversation</h3>
                  <p className="text-sm text-brand-textMuted max-w-sm mb-6">
                    Send a message to test your agent. It will use your knowledge base when available.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSuggestion(s)}
                        className="rounded-full border border-brand-borderLight bg-brand-bgCard hover:bg-brand-bgCardHover hover:border-brand-primary/40 px-4 py-2 text-sm text-brand-text transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.length > 0 && (
                <>
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {m.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-brand-bgCard border border-brand-borderLight flex items-center justify-center">
                          <Image src="/brand-logo.png" alt="" width={32} height={32} className="w-8 h-8 object-contain" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          m.role === 'user'
                            ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25'
                            : 'bg-brand-bgCard border border-brand-borderLight text-brand-text shadow-sm'
                        } ${m.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                      {m.role === 'user' && <div className="w-8 flex-shrink-0" />}
                    </div>
                  ))}
                  {sendMessage.isPending && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div className="flex-shrink-0 p-4 pt-2">
              <div className="flex gap-2 items-stretch h-12">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex-1 flex min-w-0 h-full rounded-2xl border border-brand-borderLight bg-brand-sidebar/80 shadow-inner pl-4 pr-1 py-1.5 focus-within:ring-2 focus-within:ring-brand-primary/50 focus-within:border-brand-primary/50 transition-all"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 min-w-0 h-full bg-transparent py-0 text-sm text-brand-text placeholder-brand-textMuted focus:outline-none"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={sendMessage.isPending || !input.trim()}
                    size="sm"
                    className="rounded-xl px-4 shadow-sm flex-shrink-0 h-full py-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                {effectiveBotId && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleNewChat}
                    className="rounded-xl px-4 shadow-sm flex-shrink-0 h-full py-0"
                    title="New session"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
