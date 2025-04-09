import { z } from 'zod'

export const ConnectionTypeEnum = z.enum([
  'semantic',
  'purpose',
  'emotional',
  'temporal',
  'reinforcing',
  'contradictory',
  'evolving',
])

export const ThoughtNodeSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  activationScore: z.number().min(0).max(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  vectorEmbedding: z.array(z.number()),
  evaluationScores: z.record(z.string(), z.number()),
  parentIds: z.array(z.string().uuid()),
  childIds: z.array(z.string().uuid()),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const ThoughtEdgeSchema = z.object({
  id: z.string().uuid(),
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  connectionStrength: z.number().min(0).max(1),
  connectionType: ConnectionTypeEnum,
  createdAt: z.date(),
})

export type ThoughtNode = z.infer<typeof ThoughtNodeSchema>
export type ThoughtEdge = z.infer<typeof ThoughtEdgeSchema>
export type ConnectionType = z.infer<typeof ConnectionTypeEnum>

export const ThoughtMetadataSchema = z.object({
  importance: z.number().min(0).max(1).optional(),
  topic: z.string().optional(),
  source: z.enum(['user', 'assistant']).optional(),
})

export const ThoughtSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  timestamp: z.date(),
  sessionId: z.string(),
  metadata: ThoughtMetadataSchema.optional(),
})

export type Thought = z.infer<typeof ThoughtSchema>

export const RelationTypeEnum = z.enum([
  'NEXT',
  'SIMILAR_TO',
  'REFERENCES',
])

export const ThoughtRelationSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  relationType: RelationTypeEnum,
  strength: z.number().min(0).max(1).optional(),
})

export type ThoughtMetadata = z.infer<typeof ThoughtMetadataSchema>
export type RelationType = z.infer<typeof RelationTypeEnum>
export type ThoughtRelation = z.infer<typeof ThoughtRelationSchema>
