/**
 * Flow builder types – aligned with React Flow and backend flowDefinition.
 */

/** Chat-only node types. Legacy end_call/transfer_call still supported for saved flows. */
export type FlowNodeType =
  | 'prompt'
  | 'conversation'
  | 'message'
  | 'end_chat'
  | 'transfer_to_human'
  | 'end_call'   // legacy: shown as "End chat"
  | 'transfer_call'; // legacy: shown as "Transfer to human"

export interface FlowNodeData {
  label?: string;
  prompt?: string;
  nodeType?: FlowNodeType;
  [key: string]: unknown;
}

export interface FlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  data?: Record<string, unknown>;
}

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export function emptyFlow(): FlowDefinition {
  return { nodes: [], edges: [] };
}

export function isFlowEmpty(flow: FlowDefinition | null | undefined): boolean {
  if (!flow) return true;
  return !flow.nodes?.length && !flow.edges?.length;
}
