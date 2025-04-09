import { z } from 'zod'

export const GraphNodeMetadataSchema = z.object({
  id: z.string(),
  content: z.string(),
  activationScore: z.number(),
  evaluationScores: z.record(z.number()),
  metadata: z.record(z.any()),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type GraphNodeMetadata = z.infer<typeof GraphNodeMetadataSchema>
