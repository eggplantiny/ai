import type { GraphMemoryRepositoryType, GraphRepository } from '@runtime/mastra/repositories'
import type { GraphNodeMetadata, RelationType, Thought, ThoughtEdge, ThoughtRelation } from '@runtime/mastra/schemas'
import type { Driver } from 'neo4j-driver'
import { auth, driver } from 'neo4j-driver'

export class Neo4jGraphRepository implements GraphRepository {
  private driver: Driver

  constructor(uri: string, username: string, password: string) {
    this.driver = driver(uri, auth.basic(username, password))
  }

  async initialize(): Promise<void> {
    const session = this.driver.session()
    try {
      await session.run(`
        CREATE CONSTRAINT thought_id IF NOT EXISTS
        FOR (t:Thought) REQUIRE t.id IS UNIQUE
      `)
    }
    finally {
      await session.close()
    }
  }

  async createNode(id: string, metadata: GraphNodeMetadata): Promise<void> {
    const session = this.driver.session()
    try {
      const query = `
        MERGE (t:Thought {id: $id})
        SET t += $properties
      `
      const params = {
        id,
        properties: {
          content: metadata.content,
          activationScore: metadata.activationScore,
          evaluationScores: JSON.stringify(metadata.evaluationScores),
          metadata: JSON.stringify(metadata.metadata),
          createdAt: metadata.createdAt.toISOString(),
          updatedAt: metadata.updatedAt.toISOString(),
        },
      }
      await session.run(query, params)
    }
    finally {
      await session.close()
    }
  }

  async updateNode(id: string, metadata: GraphNodeMetadata): Promise<void> {
    await this.createNode(id, metadata)
  }

  async deleteNode(id: string): Promise<void> {
    const session = this.driver.session()
    try {
      const query = `
        MATCH (t:Thought {id: $id})
        DETACH DELETE t
      `
      await session.run(query, { id })
    }
    finally {
      await session.close()
    }
  }

  async getNode(id: string): Promise<GraphNodeMetadata | null> {
    const session = this.driver.session()
    try {
      const query = `
        MATCH (t:Thought {id: $id})
        RETURN t
      `
      const result = await session.run(query, { id })
      if (result.records.length === 0) {
        return null
      }

      return this.mapNodeToMetadata(result.records[0].get('t'))
    }
    finally {
      await session.close()
    }
  }

  async createEdge(edge: ThoughtEdge): Promise<void> {
    const session = this.driver.session()
    try {
      const query = `
        MATCH (from:Thought {id: $fromId})
        MATCH (to:Thought {id: $toId})
        MERGE (from)-[r:CONNECTS {id: $id}]->(to)
        SET r += $properties
      `
      const params = {
        id: edge.id,
        fromId: edge.fromNodeId,
        toId: edge.toNodeId,
        properties: {
          connectionStrength: edge.connectionStrength,
          connectionType: edge.connectionType,
          createdAt: edge.createdAt.toISOString(),
        },
      }
      await session.run(query, params)
    }
    finally {
      await session.close()
    }
  }

  async deleteEdge(edgeId: string): Promise<void> {
    const session = this.driver.session()
    try {
      const query = `
        MATCH ()-[r:CONNECTS {id: $edgeId}]->()
        DELETE r
      `
      await session.run(query, { edgeId })
    }
    finally {
      await session.close()
    }
  }

  async getParentNodes(id: string): Promise<GraphNodeMetadata[]> {
    const session = this.driver.session()
    try {
      const query = `
      MATCH (child:Thought {id: $id})<-[:CONNECTS]-(parent:Thought)
      RETURN parent
    `
      const result = await session.run(query, { id })
      return result.records.map(record => this.mapNodeToMetadata(record.get('parent')))
    }
    finally {
      await session.close()
    }
  }

  async getChildNodes(id: string): Promise<GraphNodeMetadata[]> {
    const session = this.driver.session()
    try {
      const query = `
      MATCH (t:Thought {id: $id})-[:CONNECTS]->(child:Thought)
      RETURN child
    `
      const result = await session.run(query, { id })
      return result.records.map(record => this.mapNodeToMetadata(record.get('child')))
    }
    finally {
      await session.close()
    }
  }

  async getNodesByGoal(goalId: string): Promise<GraphNodeMetadata[]> {
    const session = this.driver.session()
    try {
      const query = `
        MATCH (t:Thought {goalId: $goalId})
        RETURN t
      `
      const result = await session.run(query, { goalId })
      return result.records.map(record => this.mapNodeToMetadata(record.get('t')))
    }
    finally {
      await session.close()
    }
  }

  async findCycles(thoughtId: string, maxDepth: number): Promise<string[][]> {
    const session = this.driver.session()
    try {
      const query = `
        MATCH path = (start:Thought {id: $thoughtId})-[:CONNECTS*2..${maxDepth}]->(start)
        WHERE length(path) > 1
        WITH [node IN nodes(path) | node.id] as cycle
        RETURN DISTINCT cycle AS cycle
      `
      const result = await session.run(query, { thoughtId })
      return result.records.map((record: any) => record.get('cycle'))
    }
    finally {
      await session.close()
    }
  }

  private mapNodeToMetadata(node: any): GraphNodeMetadata {
    const props = node.properties
    return {
      id: props.id,
      content: props.content,
      activationScore: props.activationScore,
      evaluationScores: props.evaluationScores ? JSON.parse(props.evaluationScores) : {},
      metadata: props.metadata ? JSON.parse(props.metadata) : {},
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    }
  }

  async close(): Promise<void> {
    await this.driver.close()
  }
}

export class Neo4jGraphMemoryRepository implements GraphMemoryRepositoryType {
  private driver: Driver

  constructor(uri: string, username: string, password: string) {
    this.driver = driver(uri, auth.basic(username, password))
  }

  async initialize(): Promise<void> {
    const session = this.driver.session()
    try {
      await session.run(`
        CREATE CONSTRAINT thought_id IF NOT EXISTS
        FOR (t:Thought) REQUIRE t.id IS UNIQUE
      `)
    }
    finally {
      await session.close()
    }
  }

  async close(): Promise<void> {
    await this.driver.close()
  }

  async storeThought(thought: Thought): Promise<void> {
    const session = this.driver.session()
    try {
      await session.executeWrite(tx =>
        tx.run(
          `
          CREATE (t:Thought {
            id: $id,
            content: $content,
            timestamp: $timestamp,
            sessionId: $sessionId,
            metadata: $metadata
          })
          `,
          {
            id: thought.id,
            content: thought.content,
            timestamp: thought.timestamp.toISOString(),
            sessionId: thought.sessionId,
            metadata: JSON.stringify(thought.metadata || {}),
          },
        ),
      )
    }
    catch (error) {
      console.error('Error storing thought:', error)
      throw new Error('Failed to store thought')
    }
    finally {
      await session.close()
    }
  }

  async createRelation(relation: ThoughtRelation): Promise<void> {
    const session = this.driver.session()
    try {
      await session.executeWrite(tx =>
        tx.run(
          `
          MATCH (source:Thought {id: $sourceId})
          MATCH (target:Thought {id: $targetId})
          CREATE (source)-[r:${relation.relationType} {strength: $strength}]->(target)
          RETURN r
          `,
          {
            sourceId: relation.sourceId,
            targetId: relation.targetId,
            strength: relation.strength || 1.0,
          },
        ),
      )
    }
    catch (error) {
      console.error('Error creating relation:', error)
      throw new Error('Failed to create relation')
    }
    finally {
      await session.close()
    }
  }

  async getThoughtById(id: string): Promise<Thought> {
    const session = this.driver.session()
    try {
      const result = await session.executeRead(tx =>
        tx.run(
          `
          MATCH (t:Thought {id: $id})
          RETURN t
          `,
          { id },
        ),
      )

      if (result.records.length === 0) {
        throw new Error(`Thought with ID ${id} not found`)
      }

      const record = result.records[0].get('t')
      return {
        id: record.properties.id,
        content: record.properties.content,
        timestamp: new Date(record.properties.timestamp),
        sessionId: record.properties.sessionId,
        metadata: JSON.parse(record.properties.metadata || '{}'),
      }
    }
    catch (error) {
      console.error('Error retrieving thought:', error)
      throw new Error('Failed to retrieve thought')
    }
    finally {
      await session.close()
    }
  }

  async getRelatedThoughts(thoughtId: string, relationType?: RelationType): Promise<Thought[]> {
    const session = this.driver.session()
    try {
      const result = await session.executeRead(tx =>
        tx.run(
          `
          MATCH (t:Thought {id: $thoughtId})-[r:${relationType}]->(related:Thought)
          RETURN related
          `,
          { thoughtId },
        ),
      )

      return result.records.map(record => ({
        id: record.get('related').properties.id,
        content: record.get('related').properties.content,
        timestamp: new Date(record.get('related').properties.timestamp),
        sessionId: record.get('related').properties.sessionId,
        metadata: JSON.parse(record.get('related').properties.metadata || '{}'),
      }))
    }
    catch (error) {
      console.error('Error retrieving related thoughts:', error)
      throw new Error('Failed to retrieve related thoughts')
    }
    finally {
      await session.close()
    }
  }
}
