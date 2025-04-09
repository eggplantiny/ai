import { createTool } from '@mastra/core/tools'
import { DEFAULT_SESSION_ID } from '@runtime/mastra/constants'
import { createThought } from '@runtime/mastra/models/modules/thought.model'
import { getMemoryRepository } from '@runtime/mastra/repositories'
import { ThoughtMetadataSchema } from '@runtime/mastra/schemas'
import { z } from 'zod'

export const getRecentThoughtsTool = createTool({
  id: 'get-recent-thoughts',
  description: 'Get recent thoughts from memory',
  // inputSchema: z.object({
  //   sessionId: z.string().describe('Session ID'),
  // }),
  outputSchema: z.string(),
  async execute() {
    const memoryRepository = await getMemoryRepository()
    const recentThoughts = await memoryRepository.getRecentThoughts(DEFAULT_SESSION_ID, 5)

    if (recentThoughts.length === 0) {
      return 'No recent thoughts found.'
    }

    const formattedThoughts = recentThoughts.map((thought) => {
      const role = thought.metadata?.source === 'user' ? 'user' : 'ai'
      return `${role}: ${thought.content}`
    })

    return `# Recent Messages:\n${formattedThoughts.join('\n')}`
  },
})

export const retrievalMemoryTool = createTool({
  id: 'retrieve-memory-tool',
  description: 'Retrieve relevant memories from memory',
  inputSchema: z.object({
    query: z.string().describe('Query to find relevant memories'),
  }),
  outputSchema: z.string(),
  async execute({ context }) {
    const { query } = context

    const memoryRepository = await getMemoryRepository()

    const recentMemories = await memoryRepository.findRelevantMemories(query, DEFAULT_SESSION_ID, 5)

    if (recentMemories.length === 0) {
      return 'No recent memories found.'
    }

    const formattedMemories = recentMemories.map(memory => `- ${memory.content}`)

    return `# Related memories:\n${formattedMemories.join('\n')}`
  },
})

export const storeMemoryTool = createTool({
  id: 'store-memory',
  description: 'Store a memory in the memory repository',
  inputSchema: z.object({
    content: z.string().describe('Content of the memory'),
    metadata: ThoughtMetadataSchema
      .nullish()
      .describe('Metadata for the memory'),
    previousThoughtId: z.string().nullish().describe('ID of the previous thought'),
  }),
  outputSchema: z.string(),
  async execute({ context }) {
    const { content, metadata, previousThoughtId } = context

    const memoryRepository = await getMemoryRepository()

    const thought = createThought(DEFAULT_SESSION_ID, content)
    thought.metadata = metadata ?? undefined

    await memoryRepository.storeThoughtWithRelations(thought, previousThoughtId ?? undefined)

    return 'Memory stored successfully.'
  },
})
