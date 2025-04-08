import type { Task } from '@runtime/mastra/schemas'
import { genUUID } from '@runtime/mastra/libs'
import { TaskStatus } from '@runtime/mastra/schemas'

export function createTask(goalId: string, content: string): Task {
  return {
    id: genUUID(),
    goalId,
    content,
    status: TaskStatus.PENDING,
    thoughts: [],
    evaluationScores: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  }
}
