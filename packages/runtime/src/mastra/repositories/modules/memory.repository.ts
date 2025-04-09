import type {
  GraphMemoryRepositoryType,
  MemoryRepositoryType,
  VectorMemoryRepositoryType,
} from '@runtime/mastra/repositories'

import type { Thought, ThoughtRelation } from '@runtime/mastra/schemas'
import { embedding } from '@runtime/mastra/plugins/ai.plugin'

export class MemoryRepository implements MemoryRepositoryType {
  constructor(
    private readonly graphMemoryRepository: GraphMemoryRepositoryType,
    private readonly vectorMemoryRepository: VectorMemoryRepositoryType,
  ) {}

  async initialize(): Promise<void> {
    await Promise.all([
      this.graphMemoryRepository.initialize(),
      this.vectorMemoryRepository.initialize(),
    ])
  }

  async close(): Promise<void> {
    await Promise.all([
      this.graphMemoryRepository.close(),
      this.vectorMemoryRepository.close(),
    ])
  }

  async storeThoughtWithRelations(thought: Thought, previousThoughtId?: string): Promise<void> {
    try {
      const vector = await embedding(thought.content)

      await Promise.all([
        this.vectorMemoryRepository.storeEmbedding(thought, vector),
        this.graphMemoryRepository.storeThought(thought),
      ])

      if (previousThoughtId) {
        const relation: ThoughtRelation = {
          sourceId: previousThoughtId,
          targetId: thought.id,
          relationType: 'NEXT',
          strength: 1.0,
        }
        await this.graphMemoryRepository.createRelation(relation)
      }

      // const similarThoughts = await this.vectorMemoryRepository.findSimilarThoughts(vector, 3)
      //
      // const similarityRelations = similarThoughts
      //   .filter(vq => vq.id !== thought.id && vq.id !== previousThoughtId)
      //   .map(vq => ({
      //     sourceId: thought.id,
      //     targetId: vq.id,
      //     relationType: RelationTypeEnum.enum.SIMILAR_TO,
      //     strength: 0.8, // TODO: distance 로 정규화 필요
      //   }))
      //
      // for (const relation of similarityRelations) {
      //   await this.graphMemoryRepository.createRelation(relation)
      // }
    }
    catch (error) {
      console.error('Error in storeThoughtWithRelations:', error)
      throw new Error('Failed to store thought with relations')
    }
  }

  async findRelevantMemories(query: string, sessionId: string, limit: number = 5): Promise<Thought[]> {
    try {
      const vector = await embedding(query)

      const similarThoughts = (await this.vectorMemoryRepository.findSimilarThoughts(vector, limit))
        .filter(x => x.distance < 0.5) // TODO: distance threshold 고도화ㅈ

      const thoughts: Thought[] = []
      for (const similarThought of similarThoughts) {
        const thought = await this.graphMemoryRepository.getThoughtById(similarThought.id)
        if (thought) {
          thoughts.push(thought)
        }
      }

      return thoughts
    }
    catch (error) {
      console.error('Error finding relevant memories:', error)
      return []
    }
  }

  async getRecentThoughts(query: string, limit = 5): Promise<Thought[]> {
    try {
      return await this.graphMemoryRepository.getRecentThoughts(query, limit)
    }
    catch (error) {
      console.error('Error getting recent thoughts:', error)
      throw new Error('Failed to get recent thoughts')
    }
  }
}
