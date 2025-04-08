import { Agent } from '@mastra/core/agent'
import { ollamaChatModel } from '@runtime/mastra/plugins/ai.plugin'

const instructions = `
You are a Thought‑Generator.
Return ONLY valid JSON that matches this TypeScript interface:
`

export const thoughtGeneratorAgent = new Agent({
  name: 'Thought Generator Agent',
  instructions,
  model: ollamaChatModel,
})
