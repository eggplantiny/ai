import { ThoughtNodeSchema } from '@runtime/mastra/schemas'
import { z } from 'zod'

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus]

export const TaskSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  content: z.string(),
  status: z.enum([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.FAILED]),
  thoughts: z.array(z.string().uuid()), // ThoughtNode IDs
  evaluationScores: z.record(z.string(), z.number()), // Agent ID -> Score
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type Task = z.infer<typeof TaskSchema>

export const TaskEvaluationSchema = z.object({
  agentId: z.string().uuid(),
  score: z.number().min(0).max(20),
  rationale: z.string(),
})

export type TaskEvaluation = z.infer<typeof TaskEvaluationSchema>

export const TaskResultSchema = z.object({
  task: TaskSchema,
  evaluations: z.array(TaskEvaluationSchema),
  thoughts: z.array(ThoughtNodeSchema),
  success: z.boolean(),
})

export type TaskResult = z.infer<typeof TaskResultSchema>
