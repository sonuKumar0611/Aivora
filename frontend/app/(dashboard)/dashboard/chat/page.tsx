'use client';

import { TestChatPanel } from '@/components/dashboard/TestChatPanel';

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col animate-fade-in">
      <TestChatPanel />
    </div>
  );
}
