import type { VectorMemoryRepositoryType, VectorQueryResponse, VectorRepository } from '@runtime/mastra/repositories'
import type { Thought } from '@runtime/mastra/schemas'
import type { Collection } from 'chromadb'

import { ChromaClient, IncludeEnum } from 'chromadb'

export class ChromaVectorRepository implements VectorRepository {
  private client: ChromaClient
  private collection: Collection | null = null
  private collectionName: string

  constructor(url: string, collectionName: string = 'thoughts') {
    this.client = new ChromaClient({ path: url })
    this.collectionName = collectionName
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.client.getOrCreateCollection({ name: this.collectionName })
    }
    catch (error) {
      console.error('Failed to initialize Chroma collection:', error)
      throw error
    }
  }

  async upsertVector(id: string, content: string, vector: number[]): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized')
    }

    try {
      await this.collection.upsert({
        ids: [id],
        embeddings: [vector],
        metadatas: [{ content }],
      })
    }
    catch (error) {
      console.error('Failed to upsert vector:', error)
      throw error
    }
  }

  async deleteVector(id: string): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized')
    }

    try {
      await this.collection.delete({
        ids: [id],
      })
    }
    catch (error) {
      console.error('Failed to delete vector:', error)
      throw error
    }
  }

  async findSimilar(vector: number[], limit: number = 10): Promise<VectorQueryResponse[]> {
    if (!this.collection) {
      throw new Error('Collection not initialized')
    }

    try {
      const results = await this.collection.query({
        queryEmbeddings: [vector],
        nResults: limit,
        include: [IncludeEnum.Distances],
      })

      if (!results.ids.length) {
        return []
      }

      return results.ids[0].map((id: string, idx: number) => ({
        id,
        distance: results.distances?.[0][idx] ?? Infinity,
      }))
    }
    catch (error) {
      console.error('Failed to find similar vectors:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    // Chroma client doesn't require explicit cleanup
  }
}

export class ChromaVectorMemoryRepository implements VectorMemoryRepositoryType {
  private client: ChromaClient
  private collection: Collection | null = null
  private collectionName: string

  constructor(url: string, collectionName: string = 'thoughts') {
    this.client = new ChromaClient({ path: url })
    this.collectionName = collectionName
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.client.getOrCreateCollection({ name: this.collectionName })
    }
    catch (error) {
      console.error('Failed to initialize Chroma collection:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    // Chroma client doesn't require explicit cleanup
  }

  async storeEmbedding(thought: Thought, embedding: number[]): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized')
    }

    try {
      await this.collection.add({
        ids: [thought.id],
        embeddings: [embedding],
        metadatas: [{ content: thought.content, timestamp: thought.timestamp.toISOString() }],
      })
    }
    catch (error) {
      console.error('Error storing embedding:', error)
      throw new Error('Failed to store embedding')
    }
  }

  async updateEmbedding(thought: Thought, embedding: number[]): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized')
    }

    try {
      await this.collection.update({
        ids: [thought.id],
        embeddings: [embedding],
        metadatas: [{ content: thought.content, timestamp: thought.timestamp.toISOString() }],
      })
    }
    catch (error) {
      console.error('Error updating embedding:', error)
      throw new Error('Failed to update embedding')
    }
  }

  async findSimilarThoughts(vector: number[], limit: number = 5): Promise<VectorQueryResponse[]> {
    if (!this.collection) {
      throw new Error('Collection not initialized')
    }

    try {
      const results = await this.collection.query({
        queryEmbeddings: [vector],
        nResults: limit,
        include: [IncludeEnum.Distances],
      })

      if (!results.ids.length) {
        return []
      }

      return results.ids[0]
        .map((id: string, idx: number) => ({
          id,
          distance: results.distances?.[0][idx] ?? Infinity,
        }))
    }
    catch (error) {
      console.error('Error finding similar thoughts:', error)
      throw new Error('Failed to find similar thoughts')
    }
  }
}
