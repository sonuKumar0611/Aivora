'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { MessageCircle, Tag, MessageSquareOff, UserPlus } from 'lucide-react';
import type { FlowNodeData, FlowNodeType } from '@/lib/flow';
import { clsx } from 'clsx';
import { useFlowBuilderContext } from './FlowBuilderContext';

const TYPE_CONFIG: Record<
  FlowNodeType,
  { label: string; icon: typeof MessageCircle; headerClass: string }
> = {
  prompt: {
    label: 'Prompt',
    icon: MessageCircle,
    headerClass: 'bg-violet-600/90 text-white',
  },
  conversation: {
    label: 'Conversation',
    icon: MessageCircle,
    headerClass: 'bg-violet-600/90 text-white',
  },
  message: {
    label: 'Message',
    icon: Tag,
    headerClass: 'bg-amber-600/90 text-white',
  },
  end_chat: {
    label: 'End chat',
    icon: MessageSquareOff,
    headerClass: 'bg-slate-600/90 text-white',
  },
  transfer_to_human: {
    label: 'Transfer to human',
    icon: UserPlus,
    headerClass: 'bg-emerald-600/90 text-white',
  },
  // Legacy voice types: show as chat equivalents
  end_call: {
    label: 'End chat',
    icon: MessageSquareOff,
    headerClass: 'bg-slate-600/90 text-white',
  },
  transfer_call: {
    label: 'Transfer to human',
    icon: UserPlus,
    headerClass: 'bg-emerald-600/90 text-white',
  },
};

function PromptNodeComponent({ data, selected, id }: NodeProps<FlowNodeData>) {
  const ctx = useFlowBuilderContext();
  const nodeType = (data.nodeType || 'prompt') as FlowNodeType;
  const config = TYPE_CONFIG[nodeType] ?? TYPE_CONFIG.prompt;
  const Icon = config.icon;
  const label = data.label ?? id;
  const prompt = data.prompt ?? '';

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, field: 'label' | 'prompt') => {
      const value = e.target.value;
      ctx?.onNodeDataChange(id, field, value);
    },
    [id, ctx]
  );

  const isEndOrTransfer =
    nodeType === 'end_chat' || nodeType === 'transfer_to_human' ||
    nodeType === 'end_call' || nodeType === 'transfer_call';
  const hasPrompt = nodeType === 'prompt' || nodeType === 'conversation' || nodeType === 'message';

  return (
    <div
      className={clsx(
        'rounded-lg border-2 min-w-[220px] max-w-[320px] overflow-hidden bg-brand-bgCard shadow-lg',
        selected ? 'border-brand-primary ring-2 ring-brand-primary/30' : 'border-brand-border'
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-brand-primary" />
      <div className={clsx('flex items-center gap-2 px-3 py-2 text-xs font-medium', config.headerClass)}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{config.label}</span>
      </div>
      <div className="p-3 space-y-2 bg-brand-sidebar/50">
        {!isEndOrTransfer && (
          <input
            type="text"
            value={label}
            onChange={(e) => onChange(e, 'label')}
            placeholder="Node ID / label"
            className="w-full rounded border border-brand-borderLight bg-brand-bgCard px-2 py-1 text-xs text-brand-text placeholder:text-brand-textMuted focus:ring-1 focus:ring-brand-primary"
          />
        )}
        {(nodeType === 'end_chat' || nodeType === 'end_call') && (
          <p className="text-xs text-brand-textMuted">Close the conversation or end this branch.</p>
        )}
        {(nodeType === 'transfer_to_human' || nodeType === 'transfer_call') && (
          <p className="text-xs text-brand-textMuted">Escalate or hand off to a human agent.</p>
        )}
        {hasPrompt && (
          <textarea
            value={prompt}
            onChange={(e) => onChange(e, 'prompt')}
            placeholder="What the agent should say or do..."
            rows={4}
            className="w-full rounded border border-brand-borderLight bg-brand-bgCard px-2 py-1.5 text-xs text-brand-text placeholder:text-brand-textMuted focus:ring-1 focus:ring-brand-primary resize-y"
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-brand-primary" />
    </div>
  );
}

export const PromptNode = memo(PromptNodeComponent);
