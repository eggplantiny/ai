import { z } from 'zod'

export enum RoleEnum {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}

export enum ToolChoiceEnum {
  NONE = 'none',
  AUTO = 'auto',
  REQUIRED = 'required',
}

export enum AgentStateEnum {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR',
}

export type ToolChoiceValue = typeof TOOL_CHOICE_VALUES[number]
export type TOOL_CHOICE_TYPE = keyof typeof ToolChoiceEnum

export const TOOL_CHOICE_VALUES: readonly string[] = Object.values(ToolChoiceEnum)

export const RoleEnumSchema = z.nativeEnum(RoleEnum)
export const ToolChoiceEnumSchema = z.nativeEnum(ToolChoiceEnum)
export const AgentStateEnumSchema = z.nativeEnum(AgentStateEnum)
