import { createLogger } from '@mastra/core/logger'
import { Mastra } from '@mastra/core/mastra'

import { RetrieveMemoryAgent, StoreMemoryAgent } from '@runtime/mastra/agents'
import { weatherAgent } from './agents'
import { weatherWorkflow } from './workflows'

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, RetrieveMemoryAgent, StoreMemoryAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'debug',
  }),
})
