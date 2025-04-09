import * as process from 'node:process'
import { config } from 'dotenv'

config({ path: '../.env' })

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL as string
export const DATABASE_URL = process.env.DATABASE_URL as string

export const CHROMA_URL = process.env.CHROMA_URL as string
export const CHROMA_COLLECTION_NAME = process.env.CHROMA_COLLECTION_NAME ?? 'thoughts'

export const NEO4J_URI = process.env.NEO4J_URI as string
export const NEO4J_USER = process.env.NEO4J_USER as string
export const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD as string

export const DEFAULT_SESSION_ID = 'default'
