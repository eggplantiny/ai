import { z } from 'zod'

export const ConnectionType = z.enum([
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
  goalId: z.string().uuid(),
  activationScore: z.number().min(0).max(1),
  goalContribution: z.number().min(0).max(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  vectorEmbedding: z.array(z.number()),
  purposeEmbedding: z.array(z.number()),
  evaluationScores: z.record(z.string(), z.number()),
  parentIds: z.array(z.string().uuid()),
  childIds: z.array(z.string().uuid()),
  versionHistory: z.array(z.string().uuid()),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const ThoughtEdgeSchema = z.object({
  id: z.string().uuid(),
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  connectionStrength: z.number().min(0).max(1),
  connectionType: ConnectionType,
  createdAt: z.date(),
})

export type ThoughtNode = z.infer<typeof ThoughtNodeSchema>
export type ThoughtEdge = z.infer<typeof ThoughtEdgeSchema>
export type ConnectionType = z.infer<typeof ConnectionType>
