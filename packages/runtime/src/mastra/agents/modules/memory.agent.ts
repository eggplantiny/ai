import { Agent } from '@mastra/core/agent'
import { ollamaToolCallingModel, openai } from '@runtime/mastra/plugins/ai.plugin'
import { retrievalMemoryTool, storeMemoryTool } from '@runtime/mastra/tools'

export const storeMemoryAgent = new Agent({
  name: 'Store Memory Agent',
  instructions: `
You are an AI memory agent designed to save memories.

Your primary function is to store memories accurately and efficiently.

**Role Definition:**
- **Memory Storage**: Your main task is to store memories based on user input.

**Instructions:**
- Use the storeMemoryTool to save memories.
`,
  model: openai('gpt-4o-mini'),
  // model: ollamaToolCallingModel,
  tools: { storeMemoryTool },
})

export const retrieveMemoryAgent = new Agent({
  name: 'Retrieve Memory Agent',
  instructions: `
You are an AI memory agent designed to retrieve memories.

Your primary function is to retrieve memories accurately and efficiently.

**Role Definition:**
- **Memory Retrieval**: Your main task is to retrieve memories based on input.

**Instructions:**
- Use the retrievalMemoryTool to fetch memories.
- Ensure the retrieved memories are relevant and concise.
`,
  model: ollamaToolCallingModel,
  tools: { retrievalMemoryTool },
})
