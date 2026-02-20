'use client';

import { useState, useRef, useEffect } from 'react';
import { useBots } from '@/hooks/useBots';
import { useSendMessage } from '@/hooks/useChat';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { bots } = useBots();
  const [selectedBotId, setSelectedBotId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedBotId) {
      if (!selectedBotId) toast.error('Select a bot first');
      return;
    }
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    sendMessage.mutate(
      {
        botId: selectedBotId,
        message: text,
        conversationId: conversationId || undefined,
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

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Test Chat</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Try your bot with RAG from your knowledge base
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bot</label>
          <select
            value={selectedBotId}
            onChange={(e) => {
              setSelectedBotId(e.target.value);
              setMessages([]);
              setConversationId(null);
            }}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 min-w-[180px]"
          >
            <option value="">Select a bot</option>
            {bots.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={handleNewChat}>
            New chat
          </Button>
        </div>
      </div>

      {!selectedBotId ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">Select a bot to start testing.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col min-h-0 transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col flex-1 min-h-0 p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
                  Send a message to start. The bot will use your knowledge base when available.
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      m.role === 'user'
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-500">
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  disabled={sendMessage.isPending}
                />
                <Button type="submit" disabled={sendMessage.isPending || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
