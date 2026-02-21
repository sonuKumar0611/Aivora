/**
 * Generate a conversation flow definition using AI from bot profile and knowledge base context.
 */

import OpenAI from 'openai';
import { getOpenAI } from './openai';

export interface BotProfileForFlow {
  name: string;
  description: string;
  tone: string;
  botType: string;
  systemPrompt?: string;
}

export interface FlowNodeInput {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    prompt?: string;
    nodeType?: string;
    [key: string]: unknown;
  };
}

export interface FlowEdgeInput {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  data?: Record<string, unknown>;
}

export interface GeneratedFlow {
  nodes: FlowNodeInput[];
  edges: FlowEdgeInput[];
}

const NODE_TYPES = ['conversation', 'prompt', 'end_chat', 'transfer_to_human'] as const;
const MAX_KB_CHARS = 4000;

/**
 * Build a short summary of knowledge base content from chunk texts (for AI context).
 */
export function buildKnowledgeSummary(chunkTexts: string[]): string {
  if (chunkTexts.length === 0) return 'No knowledge base content yet.';
  let total = 0;
  const lines: string[] = [];
  for (const t of chunkTexts) {
    const snippet = (t || '').trim().slice(0, 500);
    if (!snippet) continue;
    if (total + snippet.length > MAX_KB_CHARS) {
      lines.push(snippet.slice(0, MAX_KB_CHARS - total) + '…');
      break;
    }
    lines.push(snippet);
    total += snippet.length;
  }
  return lines.join('\n\n---\n\n') || 'No content.';
}

const SYSTEM_PROMPT = `You are an expert at designing conversation flows for chat agents. Given a bot profile and optional knowledge base summary, you produce a single JSON object with this exact shape (no markdown, no code fence):

{
  "nodes": [
    {
      "id": "string (e.g. start, qualify_lead)",
      "type": "prompt",
      "position": { "x": number, "y": number },
      "data": {
        "label": "short_id",
        "prompt": "Instructions for this step (what the agent should say/do)",
        "nodeType": "conversation" | "prompt" | "end_chat" | "transfer_to_human"
      }
    }
  ],
  "edges": [
    {
      "id": "e-1",
      "source": "node_id",
      "target": "node_id",
      "label": "Condition (e.g. User confirms, Qualified lead)"
    }
  ]
}

Rules:
- nodeType "conversation" only for the first node (start). It starts the conversation.
- nodeType "prompt" for steps that ask questions, gather info, or respond using the knowledge base.
- nodeType "end_chat" for closing the conversation.
- nodeType "transfer_to_human" for handing off to a human agent.
- Every node must have id, type "prompt", position (x, y), and data with label, prompt, nodeType.
- Position nodes so the flow reads top to bottom; leave space (e.g. x: 80, 200, 320 and y: 0, 120, 260, 400).
- Edges must reference existing node ids. Use short condition labels (e.g. "User agrees", "Not qualified").
- First node id must be "start". Use snake_case for ids (e.g. qualify_lead, schedule_demo).
- Create a flow that fits the bot type (sales: qualify, demo, transfer; support: intent routing, resolve or transfer; faq: answer from KB, then end or transfer).
- Use the knowledge base summary to suggest prompts that reference the kind of content the agent can use (e.g. "Answer using the product docs", "Check the FAQ").
- Output only valid JSON. No explanation.`;

function buildUserPrompt(profile: BotProfileForFlow, knowledgeSummary: string): string {
  const parts = [
    `Bot name: ${profile.name}`,
    `Business description: ${profile.description}`,
    `Tone: ${profile.tone}`,
    `Agent type: ${profile.botType}`,
  ];
  if (profile.systemPrompt?.trim()) {
    parts.push(`Custom instructions: ${profile.systemPrompt.trim()}`);
  }
  parts.push('');
  parts.push('Knowledge base content (sample):');
  parts.push(knowledgeSummary);
  parts.push('');
  parts.push('Generate a conversation flow JSON for this agent. Output only the JSON object.');
  return parts.join('\n');
}

function parseFlowFromResponse(content: string): GeneratedFlow {
  const trimmed = content.trim();
  const jsonStr = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(jsonStr) as { nodes?: unknown[]; edges?: unknown[] };
  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
  return {
    nodes: nodes.map((n, i) => {
      const node = n as Record<string, unknown>;
      const data = (node.data as Record<string, unknown>) || {};
      return {
        id: typeof node.id === 'string' ? node.id : `node_${i}`,
        type: (node.type as string) || 'prompt',
        position: validatePosition(node.position),
        data: {
          label: (data.label as string) ?? (node.id as string),
          prompt: (data.prompt as string) ?? '',
          nodeType: (data.nodeType as string) || 'prompt',
          ...data,
        },
      };
    }),
    edges: edges.map((e, i) => {
      const edge = e as Record<string, unknown>;
      return {
        id: typeof edge.id === 'string' ? edge.id : `e-${i + 1}`,
        source: String(edge.source ?? ''),
        target: String(edge.target ?? ''),
        sourceHandle: edge.sourceHandle as string | null | undefined,
        targetHandle: edge.targetHandle as string | null | undefined,
        label: (edge.label as string) ?? '',
        data: edge.data as Record<string, unknown> | undefined,
      };
    }),
  };
}

function validatePosition(pos: unknown): { x: number; y: number } {
  if (pos && typeof pos === 'object' && 'x' in pos && 'y' in pos) {
    const p = pos as { x: unknown; y: unknown };
    return {
      x: typeof p.x === 'number' ? p.x : 200,
      y: typeof p.y === 'number' ? p.y : 0,
    };
  }
  return { x: 200, y: 0 };
}

/**
 * Generate a flow definition using OpenAI from bot profile and knowledge base summary.
 */
export async function generateFlowWithAI(
  profile: BotProfileForFlow,
  knowledgeSummary: string,
  apiKey?: string | null
): Promise<GeneratedFlow> {
  const openai = getOpenAI(apiKey);
  const userPrompt = buildUserPrompt(profile, knowledgeSummary);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2048,
    temperature: 0.3,
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Empty response from AI');
  }
  return parseFlowFromResponse(content);
}
