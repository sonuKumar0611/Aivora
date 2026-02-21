import OpenAI from 'openai';
import { getOpenAI } from './openai';

const SYSTEM_PROMPT_TEMPLATE = `You are a customer support assistant for {business}.
Tone: {tone}

Use the provided context to answer. If the answer is not in the context, respond politely and ask for more details.

Context:
{retrieved_chunks}`;

const FLOW_INSTRUCTION_PREFIX = `Conversation flow (follow this guidance):
{flow_instruction}

`;

/** Get the start node's prompt from a flow definition for chat guidance */
export function getFlowStartInstruction(flowDefinition: unknown): string | null {
  if (!flowDefinition || typeof flowDefinition !== 'object') return null;
  const flow = flowDefinition as { nodes?: Array<{ id: string; data?: { prompt?: string } }> };
  const nodes = flow.nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  const start = nodes.find((n) => n.id === 'start');
  if (!start?.data?.prompt) return null;
  return start.data.prompt.trim();
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

export async function getChatCompletion(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  apiKey?: string | null
): Promise<string> {
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
  return choice?.message?.content?.trim() ?? '';
}
