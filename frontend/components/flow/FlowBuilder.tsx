'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { FlowDefinition } from '@/lib/flow';
import { generateInitialFlow } from '@/lib/generateFlow';
import { FlowBuilderProvider } from './FlowBuilderContext';
import { PromptNode } from './PromptNode';
import { Button } from '@/components/ui/Button';
import { MessageCircle, MessageSquareOff, UserPlus, Save, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const nodeTypes = { prompt: PromptNode };

function flowToReactFlow(flow: FlowDefinition): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = (flow.nodes ?? []).map((n) => ({
    id: n.id,
    type: n.type || 'prompt',
    position: n.position,
    data: n.data ?? {},
  }));
  const edges: Edge[] = (flow.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    label: e.label,
    data: e.data,
  }));
  return { nodes, edges };
}

function reactFlowToFlow(nodes: Node[], edges: Edge[]): FlowDefinition {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data ?? {},
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
      label: (e as Edge & { label?: string }).label ?? '',
      data: e.data,
    })),
  };
}

const PALETTE_ITEMS: { type: string; label: string; icon: typeof MessageCircle; nodeType: string }[] = [
  { type: 'conversation', label: 'Conversation', icon: MessageCircle, nodeType: 'conversation' },
  { type: 'end_chat', label: 'End chat', icon: MessageSquareOff, nodeType: 'end_chat' },
  { type: 'transfer_to_human', label: 'Transfer to human', icon: UserPlus, nodeType: 'transfer_to_human' },
];

function FlowBuilderInner({
  initialFlow,
  botType,
  description,
  onSave,
  isSaving,
}: {
  initialFlow: FlowDefinition | null | undefined;
  botType: string;
  description: string;
  onSave: (flow: FlowDefinition) => void;
  isSaving: boolean;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const hasInitial = initialFlow?.nodes?.length ? true : false;
  const { nodes: initNodes, edges: initEdges } = hasInitial
    ? flowToReactFlow(initialFlow!)
    : { nodes: [], edges: [] };

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [hasGenerated, setHasGenerated] = useState(hasInitial);
  const dragRef = useRef<{ type: string; nodeType: string } | null>(null);

  // Sync from server when initialFlow loads after mount (e.g. bot loaded late)
  useEffect(() => {
    if (!initialFlow?.nodes?.length) return;
    if (nodes.length > 0 || edges.length > 0) return;
    const { nodes: n, edges: e } = flowToReactFlow(initialFlow);
    setNodes(n);
    setEdges(e);
    setHasGenerated(true);
  }, [initialFlow?.nodes?.length, setNodes, setEdges]);

  const onNodeDataChange = useCallback((nodeId: string, field: string, value: string) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n))
    );
  }, [setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const item = dragRef.current;
      if (!item) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `${item.type}-${Date.now()}`;
      const newNode: Node = {
        id,
        type: 'prompt',
        position,
        data: {
          label: id,
          prompt: '',
          nodeType: item.nodeType,
        },
      };
      setNodes((nds) => nds.concat(newNode));
      dragRef.current = null;
    },
    [screenToFlowPosition, setNodes]
  );

  const handleGenerate = useCallback(() => {
    const flow = generateInitialFlow(botType, description);
    const { nodes: newNodes, edges: newEdges } = flowToReactFlow(flow);
    setNodes(newNodes);
    setEdges(newEdges);
    setHasGenerated(true);
  }, [botType, description, setNodes, setEdges]);

  const handleSave = useCallback(() => {
    const flow = reactFlowToFlow(nodes, edges);
    onSave(flow);
  }, [nodes, edges, onSave]);

  return (
    <FlowBuilderProvider onNodeDataChange={onNodeDataChange}>
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] rounded-xl border border-brand-border overflow-hidden bg-brand-sidebar">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 border-r border-brand-border bg-brand-bgCard p-4 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-semibold text-brand-textHeading mb-1">Basic information</h3>
            <p className="text-xs text-brand-textMuted">
              Configure the conversation flow for your chat agent. Drag nodes onto the canvas.
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save flow'}
          </Button>
          {!hasGenerated && (
            <Button variant="secondary" onClick={handleGenerate} className="w-full gap-2">
              <Sparkles className="w-4 h-4" />
              Generate flow
            </Button>
          )}
          <div>
            <h3 className="text-sm font-semibold text-brand-textHeading mb-2">Components</h3>
            <div className="space-y-2">
              {PALETTE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={() => {
                      dragRef.current = { type: item.type, nodeType: item.nodeType };
                    }}
                    className={clsx(
                      'flex items-center gap-2 rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 cursor-grab active:cursor-grabbing',
                      'text-sm text-brand-text hover:bg-brand-bgCardHover transition-colors'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-brand-textMuted" />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-brand-textMuted">
                        {item.type === 'conversation' && 'Start a conversation with the user.'}
                        {item.type === 'end_chat' && 'Close the conversation or end this branch.'}
                        {item.type === 'transfer_to_human' && 'Escalate or hand off to a human agent.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            className="bg-brand-sidebar"
            minZoom={0.2}
            maxZoom={1.5}
            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="bg-brand-sidebar" />
            <Controls className="!bg-brand-bgCard !border-brand-border !rounded-lg [&>button]:!bg-brand-sidebar [&>button]:!border-brand-border [&>button]:!text-white [&>button_svg]:!fill-white [&>button_svg]:!stroke-white [&>button_path]:!fill-white [&>button_path]:!stroke-white [&>button:hover]:!bg-brand-bgCardHover" />
            <Panel position="top-right">
              {!hasGenerated && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                  Click &quot;Generate flow&quot; to create a chat flow from your agent type. Then edit and save.
                </div>
              )}
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </FlowBuilderProvider>
  );
}

export function FlowBuilder({
  initialFlow,
  botType,
  description,
  onSave,
  isSaving,
}: {
  initialFlow: FlowDefinition | null | undefined;
  botType: string;
  description: string;
  onSave: (flow: FlowDefinition) => void;
  isSaving: boolean;
}) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner
        initialFlow={initialFlow}
        botType={botType}
        description={description}
        onSave={onSave}
        isSaving={isSaving}
      />
    </ReactFlowProvider>
  );
}
