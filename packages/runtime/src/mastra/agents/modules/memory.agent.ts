import { Agent } from '@mastra/core/agent'
import { openai } from '@runtime/mastra/plugins/ai.plugin'
import { retrievalMemoryTool, storeMemoryTool } from '@runtime/mastra/tools'

export const StoreMemoryAgent = new Agent({
  name: 'Store Memory Agent',
  instructions: `
You are an AI memory agent designed to save memories. Your primary function is to store and retrieve memories accurately and efficiently.

**Role Definition:**
- **Memory Storage**: Your main task is to store memories based on user input.
`,
  model: openai('gpt-4o-mini'),
  tools: {
    storeMemoryTool,
  },
})

export const RetrieveMemoryAgent = new Agent({
  name: 'Retrieve Memory Agent',
  instructions: `
You are an AI memory agent designed to retrieve memories. Your primary function is to store and retrieve memories accurately and efficiently.

**Role Definition:**
- **Memory Retrieval**: Your main task is to retrieve memories based on input.
`,
  model: openai('gpt-4o-mini'),
  tools: { retrievalMemoryTool },
})
