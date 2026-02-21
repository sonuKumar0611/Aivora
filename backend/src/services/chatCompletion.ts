import OpenAI from 'openai';
import { getOpenAI } from './openai';

const SYSTEM_PROMPT_TEMPLATE = `You are a customer support assistant for {business}.
Tone: {tone}

Use the provided context to answer. If the answer is not in the context, respond politely and ask for more details.

Context:
{retrieved_chunks}`;

const FLOW_INSTRUCTION_PREFIX = `Conversation flow (generative—do not paste):
The flow below describes what to do at each step. For the step that matches the user's message, use its text as INSTRUCTIONS only: generate a natural, conversational reply that follows that guidance. Use the Context/knowledge base when relevant. Never output the instruction text verbatim.

{flow_instruction}

`;

type FlowNode = { id: string; data?: { prompt?: string; label?: string; nodeType?: string } };
type FlowEdge = { source: string; target: string; label?: string };

/** Build full flow instruction from all nodes and edges so the bot follows every branch (e.g. not_interested). */
export function getFlowInstruction(flowDefinition: unknown): string | null {
  if (!flowDefinition || typeof flowDefinition !== 'object') return null;
  const flow = flowDefinition as {
    nodes?: FlowNode[];
    edges?: FlowEdge[];
  };
  const nodes = flow.nodes;
  const edges = flow.edges ?? [];
  if (!Array.isArray(nodes) || nodes.length === 0) return null;

  const lines: string[] = [
    'Pick the step that fits the conversation (e.g. "start" for first message). Based on the user\'s last message, choose the matching branch. For that step, generate a natural reply that follows the guidance below—do not repeat the guidance word-for-word.',
    '',
  ];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  for (const n of nodes) {
    const prompt = n.data?.prompt?.trim();
    if (!prompt) continue;
    const label = n.data?.label ?? n.id;
    const outgoing = edges.filter((e) => e.source === n.id);
    lines.push(`**${label}** — Guidance (generate a response that does this): ${prompt}`);
    if (outgoing.length > 0) {
      const branches = outgoing
        .map((e) => {
          const cond = e.label?.trim() || 'User responds';
          const targetNode = nodeById.get(e.target);
          const targetLabel = targetNode?.data?.label ?? e.target;
          return `- If "${cond}" → follow the "${targetLabel}" step.`;
        })
        .join('\n');
      lines.push(branches);
    }
    lines.push('');
  }

  const text = lines.join('\n').trim();
  return text || null;
}

/** @deprecated Use getFlowInstruction for full flow; only start node was used before. */
export function getFlowStartInstruction(flowDefinition: unknown): string | null {
  return getFlowInstruction(flowDefinition);
}

export async function buildSystemPrompt(
  businessDescription: string,
  tone: string,
  contextChunks: string[],
  customPrompt?: string,
  flowInstruction?: string | null
): Promise<string> {
  const context = contextChunks.length > 0
    ? contextChunks.map((t) => t.trim()).join('\n\n')
    : 'No specific context provided. Answer based on general knowledge and be helpful.';
  let base = SYSTEM_PROMPT_TEMPLATE
    .replace('{business}', businessDescription)
    .replace('{tone}', tone)
    .replace('{retrieved_chunks}', context);
  if (flowInstruction?.trim()) {
    base = FLOW_INSTRUCTION_PREFIX.replace('{flow_instruction}', flowInstruction.trim()) + base;
  }
  if (customPrompt?.trim()) {
    return `${customPrompt.trim()}\n\n${base}`;
  }
  return base;
}

export interface ChatCompletionResult {
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function getChatCompletion(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  apiKey?: string | null
): Promise<ChatCompletionResult> {
  const openai = getOpenAI(apiKey);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 1024,
  });
  const choice = response.choices[0];
  const content = choice?.message?.content?.trim() ?? '';
  const usage = response.usage
    ? {
        promptTokens: response.usage.prompt_tokens ?? 0,
        completionTokens: response.usage.completion_tokens ?? 0,
        totalTokens: response.usage.total_tokens ?? 0,
      }
    : { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  return { content, usage };
}
