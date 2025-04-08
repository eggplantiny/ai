import type { GraphRepository, ThoughtRepository, VectorRepository } from '@runtime/mastra/repositories'
import type { ThoughtEdge, ThoughtNode } from '@runtime/mastra/schemas'

export class CompositeThoughtRepository implements ThoughtRepository {
  constructor(
    private readonly graphRepository: GraphRepository,
    private readonly vectorRepository: VectorRepository,
  ) {}

  async initialize(): Promise<void> {
    await Promise.all([
      this.graphRepository.initialize(),
      this.vectorRepository.initialize(),
    ])
  }

  async close(): Promise<void> {
    await Promise.all([
      this.graphRepository.close(),
      this.vectorRepository.close(),
    ])
  }

  async saveThought(thought: ThoughtNode): Promise<void> {
    await this.graphRepository.createNode(thought.id, {
      id: thought.id,
      content: thought.content,
      goalId: thought.goalId,
      activationScore: thought.activationScore,
      goalContribution: thought.goalContribution,
      evaluationScores: thought.evaluationScores,
      metadata: thought.metadata || {},
      createdAt: thought.createdAt,
      updatedAt: thought.updatedAt,
    })

    await this.vectorRepository.upsertVector(
      thought.id,
      thought.content,
      thought.vectorEmbedding,
    )
  }

  async getThoughtById(id: string): Promise<ThoughtNode | null> {
    const metadata = await this.graphRepository.getNode(id)
    if (!metadata) {
      return null
    }

    const [parents, children] = await Promise.all([
      this.graphRepository.getParentNodes(id),
      this.graphRepository.getChildNodes(id),
    ])

    return {
      id: metadata.id,
      content: metadata.content,
      goalId: metadata.goalId,
      activationScore: metadata.activationScore,
      goalContribution: metadata.goalContribution,
      evaluationScores: metadata.evaluationScores,
      metadata: metadata.metadata || {},
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      vectorEmbedding: [] as number[],
      purposeEmbedding: [] as number[],
      parentIds: parents.map(parent => parent.id),
      childIds: children.map(child => child.id),
      versionHistory: [] as string[],
    }
  }

  async getThoughtsByGoal(goalId: string): Promise<ThoughtNode[]> {
    const nodes = await this.graphRepository.getNodesByGoal(goalId)

    const thoughts = await Promise.all(
      nodes.map(async (node) => {
        const [parents, children] = await Promise.all([
          this.graphRepository.getParentNodes(node.id),
          this.graphRepository.getChildNodes(node.id),
        ])

        return {
          id: node.id,
          content: node.content,
          goalId: node.goalId,
          activationScore: node.activationScore,
          goalContribution: node.goalContribution,
          evaluationScores: node.evaluationScores,
          metadata: node.metadata || {},
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
          vectorEmbedding: [] as number[], // 벡터는 필요할 때만 로드
          purposeEmbedding: [] as number[], // 목적 임베딩은 필요할 때만 생성
          parentIds: parents.map(parent => parent.id),
          childIds: children.map(child => child.id),
          versionHistory: [] as string[], // 버전 관리는 별도로 구현 필요
        }
      }),
    )

    return thoughts
  }

  async findSimilarThoughts(embedding: number[], limit: number = 10): Promise<ThoughtNode[]> {
    // 벡터 저장소에서 유사한 문서 검색
    const similarVectors = await this.vectorRepository.findSimilar(embedding, limit)

    // 각 유사 문서의 메타데이터 로드
    const thoughts = await Promise.all(
      similarVectors.map(async ({ id }) => {
        const metadata = await this.graphRepository.getNode(id)
        if (!metadata)
          return null

        const [parents, children] = await Promise.all([
          this.graphRepository.getParentNodes(id),
          this.graphRepository.getChildNodes(id),
        ])

        return {
          id: metadata.id,
          content: metadata.content,
          goalId: metadata.goalId,
          activationScore: metadata.activationScore,
          goalContribution: metadata.goalContribution,
          evaluationScores: metadata.evaluationScores,
          metadata: metadata.metadata || {},
          createdAt: metadata.createdAt,
          updatedAt: metadata.updatedAt,
          vectorEmbedding: embedding,
          purposeEmbedding: [] as number[],
          parentIds: parents.map(parent => parent.id),
          childIds: children.map(child => child.id),
          versionHistory: [] as string[],
        } as ThoughtNode
      }),
    )

    return thoughts.filter((thought): thought is ThoughtNode => thought !== null)
  }

  async saveEdge(edge: ThoughtEdge): Promise<void> {
    await this.graphRepository.createEdge(edge)
  }

  async findCycles(thoughtId: string, maxDepth: number): Promise<string[][]> {
    return this.graphRepository.findCycles(thoughtId, maxDepth)
  }
}
