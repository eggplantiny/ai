import type { ThoughtNode } from '@runtime/mastra/schemas'
import { genUUID } from '@runtime/mastra/libs'
import { embedding, ollamaChatModel } from '@runtime/mastra/plugins/ai.plugin'
import { generateObject } from 'ai'
import { z } from 'zod'

interface ThoughtGenerationContext {
  goal: string
  parentThoughts: ThoughtNode[]
  constraints: string[]
  metadata?: Record<string, any>
}

const THOUGHT_GENERATION_TEMPLATE = `
Generate a thought that contributes to the following goal:

GOAL:
{goal}

CONTEXT:
Previous thoughts: {parentThoughts}
Constraints: {constraints}

Generate a thought that:
1. Advances toward the goal
2. Considers previous thoughts
3. Follows given constraints
4. Is specific and actionable

Provide a structured response following the schema.
`

const GenerationOutputSchema = z.object({
  thought: z.string(),
  rationale: z.string(),
  purposeVector: z.array(z.number()),
})

function thoughtGenerationTemplate(goal: string, parentThoughts: string, constraints: string) {
  return THOUGHT_GENERATION_TEMPLATE
    .replace('{goal}', goal)
    .replace('{parentThoughts}', parentThoughts)
    .replace('{constraints}', constraints)
}

async function createThought(content: string, context: ThoughtGenerationContext): Promise<ThoughtNode> {
  const vectorEmbedding = await embedding(content)
  const purposeEmbedding = await embedding(context.goal)

  return {
    id: genUUID(),
    content,
    goalId: context.goal,
    vectorEmbedding,
    purposeEmbedding,
    activationScore: 1.0,
    goalContribution: 0.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    evaluationScores: {},
    parentIds: context.parentThoughts.map(t => t.id),
    childIds: [],
    versionHistory: [],
    metadata: context.metadata || {},
  }
}

async function generateThought(context: ThoughtGenerationContext): Promise<ThoughtNode> {
  const template = thoughtGenerationTemplate(
    context.goal,
    context.parentThoughts.map(t => t.content).join('\n'),
    context.constraints.join('\n'),
  )

  const { object: result } = await generateObject({
    messages: [
      { role: 'system', content: template },
    ],
    model: ollamaChatModel,
    schema: GenerationOutputSchema,
  })

  return createThought(result.thought, {
    ...context,
    metadata: {
      ...context.metadata,
      rationale: result.rationale,
      purposeVector: result.purposeVector,
    },
  })
}
