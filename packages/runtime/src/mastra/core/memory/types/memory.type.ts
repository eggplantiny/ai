// 메모리 아이템 타입 정의 (모든 키는 any 허용)
import { z } from 'zod'

export const MemoryItemSchema = z.record(z.any())
export type MemoryItem = z.infer<typeof MemoryItemSchema>
