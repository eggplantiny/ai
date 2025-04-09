import type { ThoughtRepository } from './types/repository.type'
import {
  CHROMA_COLLECTION_NAME,
  CHROMA_URL,
  DEFAULT_SESSION_ID,
  NEO4J_PASSWORD,
  NEO4J_URI,
  NEO4J_USER,
} from '@runtime/mastra/constants'

import {
  ChromaVectorMemoryRepository,
  ChromaVectorRepository,
} from '@runtime/mastra/repositories/modules/chroma.repository'
import { CompositeThoughtRepository } from '@runtime/mastra/repositories/modules/composite.repository'
import { MemoryRepository } from '@runtime/mastra/repositories/modules/memory.repository'
import { Neo4jGraphMemoryRepository, Neo4jGraphRepository } from '@runtime/mastra/repositories/modules/neo4j.repository'

export * from './types/memory.type'
export * from './types/repository.type'

export class ThoughtNodeRepositoryFactory {
  static async create(): Promise<ThoughtRepository> {
    const metadataRepository = new Neo4jGraphRepository(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    const vectorRepository = new ChromaVectorRepository(CHROMA_URL, CHROMA_COLLECTION_NAME)
    const repository = new CompositeThoughtRepository(metadataRepository, vectorRepository)

    await repository.initialize()
    return repository
  }
}

export class MemoryRepositoryFactory {
  static async create(sessionId: string) {
    const metadataRepository = new Neo4jGraphMemoryRepository(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    const vectorRepository = new ChromaVectorMemoryRepository(CHROMA_URL, `${CHROMA_COLLECTION_NAME}-${sessionId}`)
    const repository = new MemoryRepository(metadataRepository, vectorRepository)

    await repository.initialize()
    return repository
  }
}

function MemoryRepositorySingleton(sessionId: string) {
  let instance: MemoryRepository | null = null

  return async () => {
    if (!instance) {
      instance = await MemoryRepositoryFactory.create(sessionId)
    }
    return instance
  }
}

export const getMemoryRepository = MemoryRepositorySingleton(DEFAULT_SESSION_ID)
