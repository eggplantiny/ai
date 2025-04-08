import type { EmbeddingModel } from 'ai'
import { OLLAMA_BASE_URL } from '@runtime/mastra/constants/modules/app.constant'
import { embed, embedMany } from 'ai'
import { createOllama } from 'ollama-ai-provider'

const ollamaProvider = createOllama({
  baseURL: OLLAMA_BASE_URL,
})

export const ollamaChatModel = ollamaProvider.chat('gemma3:12b', {
  simulateStreaming: true,
})
export const ollamaToolCallingModel = ollamaProvider.chat('qwen2.5:14b', {
  simulateStreaming: true,
})
export const ollamaEmbeddingModel = ollamaProvider.embedding('nomic-embed-text') as EmbeddingModel<string>

export async function embedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: ollamaEmbeddingModel,
    value: text,
  })

  return embedding
}

export async function embeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: ollamaEmbeddingModel,
    values: texts,
  })

  return embeddings
}
