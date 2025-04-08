import { createLogger } from '@mastra/core/logger'
import { Mastra } from '@mastra/core/mastra'
import { thoughtGeneratorAgent, weatherAgent } from './agents'
import { weatherWorkflow } from './workflows'

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, thoughtGeneratorAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
})
