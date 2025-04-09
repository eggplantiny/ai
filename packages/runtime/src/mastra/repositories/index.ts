import type { ThoughtRepository } from './types/repository.type'
import { CHROMA_COLLECTION_NAME, CHROMA_URL, NEO4J_PASSWORD, NEO4J_URI, NEO4J_USER } from '@runtime/mastra/constants'
import { ChromaVectorRepository } from '@runtime/mastra/repositories/modules/chroma.repository'
import { CompositeThoughtRepository } from '@runtime/mastra/repositories/modules/composite.repository'
import { Neo4jGraphRepository } from './modules/node4j.repository'

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
