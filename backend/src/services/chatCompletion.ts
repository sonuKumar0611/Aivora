import OpenAI from 'openai';
import { getOpenAI } from './openai';

const SYSTEM_PROMPT_TEMPLATE = `You are a customer support assistant for {business}.
Tone: {tone}

Use the provided context to answer. If the answer is not in the context, respond politely and ask for more details.

Context:
{retrieved_chunks}`;

export async function buildSystemPrompt(
  businessDescription: string,
  tone: string,
  contextChunks: string[]
): Promise<string> {
  const context = contextChunks.length > 0
    ? contextChunks.map((t) => t.trim()).join('\n\n')
    : 'No specific context provided. Answer based on general knowledge and be helpful.';
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{business}', businessDescription)
    .replace('{tone}', tone)
    .replace('{retrieved_chunks}', context);
}

export async function getChatCompletion(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const openai = getOpenAI();
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
