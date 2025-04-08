import * as process from 'node:process'
import { config } from 'dotenv'

config({ path: '../../.env' })

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL as string
export const DATABASE_URL = process.env.DATABASE_URL as string
export const CHROMA_URL = process.env.CHROMA_URL as string
