import type { GraphNodeMetadata, ThoughtEdge } from '@runtime/mastra/schemas'

export interface Repository {
  initialize: () => Promise<void>
  close: () => Promise<void>
}

export interface VectorQueryResponse {
  id: string
  distance: number
}

export interface VectorRepository extends Repository {
  upsertVector: (id: string, content: string, vector: number[]) => Promise<void>
  deleteVector: (id: string) => Promise<void>
  findSimilar: (vector: number[], limit?: number) => Promise<VectorQueryResponse[]>
}

export interface GraphRepository extends Repository {
  createNode: (id: string, metadata: GraphNodeMetadata) => Promise<void>
  updateNode: (id: string, metadata: GraphNodeMetadata) => Promise<void>
  deleteNode: (id: string) => Promise<void>
  getNode: (id: string) => Promise<GraphNodeMetadata | null>

  createEdge: (edge: ThoughtEdge) => Promise<void>
  deleteEdge: (edgeId: string) => Promise<void>

  getParentNodes: (id: string) => Promise<GraphNodeMetadata[]>
  getChildNodes: (id: string) => Promise<GraphNodeMetadata[]>
  findCycles: (thoughtId: string, maxDepth: number) => Promise<string[][]>
  getNodesByGoal: (goalId: string) => Promise<GraphNodeMetadata[]>
}
