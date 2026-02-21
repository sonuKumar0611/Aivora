/**
 * Generate an initial flow definition from agent type and description.
 * Chat-only: uses End chat and Transfer to human (no voice/call terminology).
 */

import type { FlowDefinition, FlowNode, FlowEdge, FlowNodeType } from './flow';

const DEFAULT_PROMPT =
  'Acknowledge the user and ask how you can help. Be concise and match the agent tone.';

function node(
  id: string,
  x: number,
  y: number,
  data: { label?: string; prompt?: string; nodeType?: FlowNodeType }
): FlowNode {
  return {
    id,
    type: 'prompt',
    position: { x, y },
    data: { ...data, nodeType: (data.nodeType ?? 'prompt') as FlowNodeType },
  };
}

function edge(id: string, source: string, target: string, label?: string): FlowEdge {
  return { id: `e-${id}`, source, target, label: label ?? '' };
}

export function generateInitialFlow(botType: string, description: string): FlowDefinition {
  const isSales = botType === 'sales';
  const isSupport = botType === 'support' || botType === 'faq';

  if (isSales) {
    return generateSalesFlow(description);
  }
  if (isSupport) {
    return generateSupportFlow(description);
  }
  return generateGenericFlow(botType, description);
}

function generateSalesFlow(description: string): FlowDefinition {
  const nodes: FlowNode[] = [
    node('start', 200, 0, {
      label: 'start',
      prompt: 'Greet the prospect and briefly state your value. Ask what brought them in today.',
      nodeType: 'conversation',
    }),
    node('qualify_lead', 200, 120, {
      label: 'qualify_lead',
      prompt:
        'Ask for company name and role. Determine if they are a good fit (budget, timeline, authority).',
      nodeType: 'prompt',
    }),
    node('schedule_demo', 80, 260, {
      label: 'schedule_demo',
      prompt:
        'Offer available demo times (e.g. tomorrow 10 AM or 2 PM). Ask for their preferred slot.',
      nodeType: 'prompt',
    }),
    node('confirm_and_end', 80, 400, {
      label: 'confirm_and_end',
      prompt:
        "Confirm the booking: 'I've scheduled your demo for [time]. Is there anything else I can help with?'",
      nodeType: 'prompt',
    }),
    node('transfer_to_sales', 320, 260, {
      label: 'transfer_to_sales',
      prompt: "Say: 'Let me connect you with a specialist who can help.' Then hand off to a human agent.",
      nodeType: 'transfer_to_human',
    }),
    node('not_qualified', 320, 400, {
      label: 'not_qualified',
      prompt: 'Politely thank them and offer to send follow-up info by email. Then close the conversation.',
      nodeType: 'end_chat',
    }),
    node('end', 80, 520, {
      label: 'end',
      prompt: 'Close the conversation politely.',
      nodeType: 'end_chat',
    }),
  ];
  const edges: FlowEdge[] = [
    edge('1', 'start', 'qualify_lead', 'User expresses interest'),
    edge('2', 'qualify_lead', 'schedule_demo', 'Qualified lead'),
    edge('3', 'qualify_lead', 'transfer_to_sales', 'Needs human'),
    edge('4', 'qualify_lead', 'not_qualified', 'Not qualified'),
    edge('5', 'schedule_demo', 'confirm_and_end', 'User picks a time'),
    edge('6', 'confirm_and_end', 'end', 'User confirms'),
  ];
  return { nodes, edges };
}

function generateSupportFlow(description: string): FlowDefinition {
  const nodes: FlowNode[] = [
    node('start', 200, 0, {
      label: 'start',
      prompt: 'Greet the user and ask how you can help. Be friendly and concise.',
      nodeType: 'conversation',
    }),
    node('intent_router', 200, 120, {
      label: 'intent_router',
      prompt:
        "Based on the user's message, route to: billing, technical support, or general inquiry. If unclear, ask them to choose.",
      nodeType: 'prompt',
    }),
    node('billing_inquiry', 40, 280, {
      label: 'billing_inquiry',
      prompt:
        "Acknowledge billing question: 'I can get you to the right person for billing.' Prepare to hand off to a human.",
      nodeType: 'prompt',
    }),
    node('technical_support', 200, 280, {
      label: 'technical_support',
      prompt: 'Ask for details about the issue. Offer to look up their account or walk through steps.',
      nodeType: 'prompt',
    }),
    node('unclear_inquiry', 360, 280, {
      label: 'unclear_inquiry',
      prompt:
        "Say: 'I'm not sure I understand. Could you rephrase? For example: product demo, technical support, or billing.'",
      nodeType: 'prompt',
    }),
    node('transfer_billing', 40, 420, {
      label: 'transfer_billing',
      prompt: "Say: 'Connecting you with Billing.' Then hand off to a human agent.",
      nodeType: 'transfer_to_human',
    }),
    node('resolve_or_escalate', 200, 420, {
      label: 'resolve_or_escalate',
      prompt: 'If you resolved the issue, confirm and offer more help. Otherwise offer to hand off to a human.',
      nodeType: 'prompt',
    }),
    node('end_chat', 360, 420, {
      label: 'end_chat',
      prompt: 'Close the conversation politely.',
      nodeType: 'end_chat',
    }),
  ];
  const edges: FlowEdge[] = [
    edge('1', 'start', 'intent_router', 'User stated issue'),
    edge('2', 'intent_router', 'billing_inquiry', "User says 'billing' or 'invoice'"),
    edge('3', 'intent_router', 'technical_support', "User describes a technical issue"),
    edge('4', 'intent_router', 'unclear_inquiry', 'Intent unclear'),
    edge('5', 'billing_inquiry', 'transfer_billing', 'User agrees to hand off'),
    edge('6', 'technical_support', 'resolve_or_escalate', 'After troubleshooting'),
    edge('7', 'unclear_inquiry', 'intent_router', 'User clarifies'),
    edge('8', 'resolve_or_escalate', 'end_chat', 'Done or hand off'),
  ];
  return { nodes, edges };
}

function generateGenericFlow(botType: string, _description: string): FlowDefinition {
  const nodes: FlowNode[] = [
    node('start', 200, 0, {
      label: 'start',
      prompt: DEFAULT_PROMPT,
      nodeType: 'conversation',
    }),
    node('handle_inquiry', 200, 140, {
      label: 'handle_inquiry',
      prompt: 'Respond based on the user question. Use your knowledge base when relevant.',
      nodeType: 'prompt',
    }),
    node('end_or_transfer', 200, 280, {
      label: 'end_or_transfer',
      prompt: 'If the user is satisfied, say goodbye. Otherwise offer to hand off to a human.',
      nodeType: 'prompt',
    }),
    node('end', 200, 420, {
      label: 'end',
      prompt: 'Close the conversation.',
      nodeType: 'end_chat',
    }),
  ];
  const edges: FlowEdge[] = [
    edge('1', 'start', 'handle_inquiry', 'User replied'),
    edge('2', 'handle_inquiry', 'end_or_transfer', 'After response'),
    edge('3', 'end_or_transfer', 'end', 'User done'),
  ];
  return { nodes, edges };
}
