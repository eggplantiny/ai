import type { ZodTypeAny } from 'zod'
import { printNode, zodToTs } from 'zod-to-ts'

export function zodToTsInterface(zod: ZodTypeAny): string {
  const { node } = zodToTs(zod)

  return printNode(node)
}
