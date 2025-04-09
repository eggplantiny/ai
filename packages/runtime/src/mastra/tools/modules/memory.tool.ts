import { createTool } from '@mastra/core/tools'
import { DEFAULT_SESSION_ID } from '@runtime/mastra/constants'
import { getMemoryRepository } from '@runtime/mastra/repositories'
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
      const role = thought.metadata?.source === 'USER' ? 'USER' : 'AI'
      return `${role}: ${thought.content}`
    })

    return `# Recent Messages:\n${formattedThoughts.join('\n')}`
  },
})

export const getRecentMemoryTool = createTool({
  id: 'get-recent-memory',
  description: 'Get recent memory from memory',
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
