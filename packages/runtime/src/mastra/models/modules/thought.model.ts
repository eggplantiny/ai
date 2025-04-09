import type { ConnectionType, Thought, ThoughtEdge, ThoughtMetadata, ThoughtNode } from '@runtime/mastra/schemas'
import { genUUID } from '@runtime/mastra/libs'
import { ThoughtEdgeSchema, ThoughtNodeSchema, ThoughtSchema } from '@runtime/mastra/schemas'

export class ThoughtNodeBuilder {
  private node: Partial<ThoughtNode> = {}

  constructor() {
    this.node.id = genUUID()
    this.node.createdAt = new Date()
    this.node.updatedAt = new Date()
    this.node.parentIds = []
    this.node.childIds = []
    this.node.evaluationScores = {}
  }

  withContent(content: string): ThoughtNodeBuilder {
    this.node.content = content
    return this
  }

  withVectorEmbedding(embedding: number[]): ThoughtNodeBuilder {
    this.node.vectorEmbedding = embedding
    return this
  }

  withActivationScore(score: number): ThoughtNodeBuilder {
    this.node.activationScore = score
    return this
  }

  withParentIds(ids: string[]): ThoughtNodeBuilder {
    this.node.parentIds = ids
    return this
  }

  withMetadata(metadata: Record<string, any>): ThoughtNodeBuilder {
    this.node.metadata = metadata
    return this
  }

  build(): ThoughtNode {
    const node = this.node as ThoughtNode
    return ThoughtNodeSchema.parse(node)
  }
}

export class ThoughtEdgeBuilder {
  private edge: Partial<ThoughtEdge> = {}

  constructor() {
    this.edge.id = genUUID()
    this.edge.createdAt = new Date()
    this.edge.connectionStrength = 0.5
  }

  withFromNodeId(id: string): ThoughtEdgeBuilder {
    this.edge.fromNodeId = id
    return this
  }

  withToNodeId(id: string): ThoughtEdgeBuilder {
    this.edge.toNodeId = id
    return this
  }

  withConnectionStrength(strength: number): ThoughtEdgeBuilder {
    this.edge.connectionStrength = strength
    return this
  }

  withConnectionType(type: ConnectionType): ThoughtEdgeBuilder {
    this.edge.connectionType = type
    return this
  }

  build(): ThoughtEdge {
    const edge = this.edge as ThoughtEdge
    return ThoughtEdgeSchema.parse(edge)
  }
}

export function createThoughtNode() {
  return new ThoughtNodeBuilder()
    .build()
}

export function createThoughtEdge(
  fromNode: ThoughtNode,
  toNode: ThoughtNode,
  connectionStrength: number,
  connectionType: ConnectionType,
) {
  return new ThoughtEdgeBuilder()
    .withFromNodeId(fromNode.id)
    .withToNodeId(toNode.id)
    .withConnectionStrength(connectionStrength)
    .withConnectionType(connectionType)
    .build()
}

export class ThoughtBuilder {
  private thought: Partial<Thought> = {}

  constructor() {
    this.thought.id = genUUID()
    this.thought.timestamp = new Date()
  }

  withContent(content: string): ThoughtBuilder {
    this.thought.content = content
    return this
  }

  withSessionId(sessionId: string): ThoughtBuilder {
    this.thought.sessionId = sessionId
    return this
  }

  withMetadata(metadata: Partial<ThoughtMetadata>): ThoughtBuilder {
    this.thought.metadata = metadata
    return this
  }

  build(): Thought {
    const thought = this.thought as Thought
    return ThoughtSchema.parse(thought)
  }
}

export function createThought(sessionId: string, content: string) {
  return new ThoughtBuilder()
    .withContent(content)
    .withSessionId(sessionId)
    .build()
}
