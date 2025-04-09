import { createLogger } from '@mastra/core/logger'
import { Mastra } from '@mastra/core/mastra'
import { memoryAgent } from '@runtime/mastra/agents/modules/memory.agent'
import { weatherAgent } from './agents'
import { weatherWorkflow } from './workflows'

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, memoryAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
})
