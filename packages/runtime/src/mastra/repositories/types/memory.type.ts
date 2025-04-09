import type { Repository, VectorQueryResponse } from '@runtime/mastra/repositories'
import type { RelationType, Thought, ThoughtRelation } from '@runtime/mastra/schemas'

export interface MemoryRepositoryType extends Repository {
  storeThoughtWithRelations: (thought: Thought, previousThoughtId?: string) => Promise<void>
  findRelevantMemories: (query: string, sessionId: string, limit?: number) => Promise<Thought[]>
}

export interface VectorMemoryRepositoryType extends Repository {
  storeEmbedding: (thought: Thought, embedding: number[]) => Promise<void>
  updateEmbedding: (thought: Thought, embedding: number[]) => Promise<void>
  findSimilarThoughts: (vector: number[], limit?: number) => Promise<VectorQueryResponse[]>
}

export interface GraphMemoryRepositoryType extends Repository {
  storeThought: (thought: Thought) => Promise<void>
  createRelation: (relation: ThoughtRelation) => Promise<void>
  getThoughtById: (id: string) => Promise<Thought | null>
  getRelatedThoughts: (thoughtId: string, relationType?: RelationType) => Promise<Thought[]>
}
