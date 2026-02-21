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

/** Tool definition for OpenAI function calling (id and name identify the tool; parameters schema is built from type). */
export interface ToolDefForChat {
  id: string;
  name: string;
  description?: string;
  type: 'google_calendar_create_event' | 'google_calendar_check_availability' | 'google_sheets_create_row';
}

function buildOpenAITools(tools: ToolDefForChat[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((t) => {
    const base = {
      type: 'function' as const,
      function: {
        name: `tool_${t.id}`,
        description: t.description || `Execute: ${t.name}`,
      },
    };
    switch (t.type) {
      case 'google_calendar_create_event':
        base.function.parameters = {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Event title/summary' },
            startDateTime: { type: 'string', description: 'Start date and time in ISO 8601 format (e.g. 2025-02-21T10:00:00)' },
            endDateTime: { type: 'string', description: 'End date and time in ISO 8601 format' },
            description: { type: 'string', description: 'Optional event description' },
          },
          required: ['summary', 'startDateTime', 'endDateTime'],
        };
        break;
      case 'google_calendar_check_availability':
        base.function.parameters = {
          type: 'object',
          properties: {
            timeMin: { type: 'string', description: 'Start of period in ISO 8601 format' },
            timeMax: { type: 'string', description: 'End of period in ISO 8601 format' },
          },
          required: ['timeMin', 'timeMax'],
        };
        break;
      case 'google_sheets_create_row':
        base.function.parameters = {
          type: 'object',
          properties: {
            values: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of cell values for the row, in order',
            },
          },
          required: ['values'],
        };
        break;
      default:
        base.function.parameters = { type: 'object', properties: {} };
    }
    return base;
  });
}

const MAX_TOOL_ROUNDS = 5;

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

export type ExecuteToolFn = (toolId: string, args: Record<string, unknown>) => Promise<string>;

/**
 * Chat completion with tool calling. If the model requests tool calls, they are executed and the loop continues until a final text reply or max rounds.
 */
export async function getChatCompletionWithTools(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  tools: ToolDefForChat[],
  executeTool: ExecuteToolFn,
  apiKey?: string | null
): Promise<ChatCompletionResult> {
  if (tools.length === 0) {
    return getChatCompletion(systemPrompt, messages, apiKey);
  }

  const openai = getOpenAI(apiKey);
  const nameToTool = new Map(tools.map((t) => [`tool_${t.id}`, t]));

  const openaiTools = buildOpenAITools(tools);
  type Message =
    | { role: 'user'; content: string }
    | { role: 'assistant'; content: string | null; tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] }
    | { role: 'tool'; tool_call_id: string; content: string };

  let current: Message[] = messages.map((m) => ({ role: m.role, content: m.content }));
  let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...current.map((m) => {
        if (m.role === 'tool') {
          return { role: 'tool' as const, tool_call_id: m.tool_call_id, content: m.content };
        }
        if (m.role === 'assistant' && m.tool_calls?.length) {
          return {
            role: 'assistant' as const,
            content: m.content ?? '',
            tool_calls: m.tool_calls,
          };
        }
        return { role: m.role, content: m.content ?? '' };
      }),
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
      max_tokens: 1024,
      tools: openaiTools,
      tool_choice: 'auto',
    });

    const choice = response.choices[0];
    const msg = choice?.message;
    if (response.usage) {
      totalUsage.promptTokens += response.usage.prompt_tokens ?? 0;
      totalUsage.completionTokens += response.usage.completion_tokens ?? 0;
      totalUsage.totalTokens += response.usage.total_tokens ?? 0;
    }

    if (!msg) {
      return { content: 'I could not generate a response.', usage: totalUsage };
    }

    const toolCalls = msg.tool_calls;
    if (!toolCalls?.length) {
      const content = (msg.content ?? '').trim();
      return { content: content || 'Done.', usage: totalUsage };
    }

    current.push({
      role: 'assistant',
      content: msg.content ?? null,
      tool_calls: toolCalls,
    });

    for (const tc of toolCalls) {
      const fnName = tc.function?.name ?? '';
      const toolDef = nameToTool.get(fnName);
      const toolId = toolDef?.id;
      let result: string;
      try {
        const args = (tc.function?.arguments && JSON.parse(tc.function.arguments)) ?? {};
        result = toolId ? await executeTool(toolId, args) : 'Tool not found.';
      } catch (err) {
        result = err instanceof Error ? err.message : 'Tool execution failed.';
        console.error('[Chat] Tool execution failed:', fnName, toolId, err);
      }
      current.push({ role: 'tool', tool_call_id: tc.id, content: result });
    }
  }

  return {
    content: 'I hit the limit of tool calls. Please try again with a simpler request.',
    usage: totalUsage,
  };
}
