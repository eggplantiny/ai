import type { MemoryRepository } from '@runtime/mastra/repositories/modules/memory.repository'
import type { Thought } from '@runtime/mastra/schemas'

export class MemoryContextBuilder {
  constructor(private memoryRepository: MemoryRepository) {}

  public async buildContext(query: string, sessionId: string, maxTokens: number = 2000): Promise<string> {
    try {
      const recentThoughts = await this.getRecentThoughts(sessionId, 3)
      const relevantMemories = await this.memoryRepository.findRelevantMemories(query, sessionId, 5)

      let contextText = '# Related memories:\n'

      relevantMemories.forEach((memory) => {
        contextText += `- ${memory.content}\n`
      })

      contextText += '\n# Recent Messages:\n'

      recentThoughts.forEach((thought) => {
        const role = thought.metadata?.source === 'USER' ? 'USER' : 'AI'
        contextText += `${role}: ${thought.content}\n`
      })

      return contextText
    }
    catch (error) {
      console.error('Error building context:', error)
      return ''
    }
  }

  private async getRecentThoughts(sessionId: string, limit: number): Promise<Thought[]> {
    return this.memoryRepository.getRecentThoughts(sessionId, limit)
  }
}
