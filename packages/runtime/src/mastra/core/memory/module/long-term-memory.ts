import type { MemoryItem } from '@runtime/mastra/core/memory'
import * as fs from 'node:fs'
import * as os from 'node:os'

import * as path from 'node:path'
import { Memory } from '@runtime/mastra/core/memory'
import { genUUID } from '@runtime/mastra/libs'

// LongTermMemory 구현 클래스
export class LongTermMemory extends Memory {
  private storagePath: string
  private indexInMemory: boolean
  private index: Record<string, MemoryItem> = {}

  constructor(
    storagePath?: string,
    indexInMemory: boolean = true,
    config: Record<string, any> = {},
  ) {
    super(config)
    // storagePath가 없으면 기본 경로 사용
    if (!storagePath) {
      storagePath = path.join(os.homedir(), '.anus', 'memory')
    }
    this.storagePath = storagePath
    this.indexInMemory = indexInMemory

    // 스토리지 디렉토리 생성
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true })
    }

    // 메모리 인덱스 로드
    if (this.indexInMemory) {
      this._loadIndex()
    }
  }

  public add(item: MemoryItem): string {
    const identifier = genUUID()
    const timestamp = Date.now() / 1000
    const itemWithMeta = {
      ...item,
      _meta: {
        id: identifier,
        created_at: timestamp,
        updated_at: timestamp,
      },
    }

    this._saveItem(identifier, itemWithMeta)
    if (this.indexInMemory) {
      this.index[identifier] = itemWithMeta
    }
    return identifier
  }

  public get(identifier: string): MemoryItem | null {
    if (this.indexInMemory && this.index[identifier]) {
      return this.index[identifier]
    }
    const itemPath = this._getItemPath(identifier)
    if (!fs.existsSync(itemPath)) {
      return null
    }
    try {
      const data = fs.readFileSync(itemPath, 'utf-8')
      return JSON.parse(data)
    }
    catch (e) {
      console.error(`Error loading item ${identifier}:`, e)
      return null
    }
  }

  public search(query: MemoryItem, limit: number = 10): Array<{ id: string, item: MemoryItem, created_at: number }> {
    const results: Array<{ id: string, item: MemoryItem, created_at: number }> = []
    if (this.indexInMemory) {
      for (const [id, item] of Object.entries(this.index)) {
        if (this._matchesQuery(item, query)) {
          results.push({
            id,
            item,
            created_at: item._meta?.created_at || 0,
          })
          if (results.length >= limit)
            break
        }
      }
    }
    else {
      const files = fs.readdirSync(this.storagePath)
      for (const file of files) {
        if (!file.endsWith('.json'))
          continue
        const id = file.slice(0, -5)
        const item = this.get(id)
        if (item && this._matchesQuery(item, query)) {
          results.push({
            id,
            item,
            created_at: item._meta?.created_at || 0,
          })
          if (results.length >= limit)
            break
        }
      }
    }
    results.sort((a, b) => b.created_at - a.created_at)
    return results
  }

  public update(identifier: string, item: MemoryItem): boolean {
    const existing = this.get(identifier)
    if (!existing)
      return false
    const timestamp = Date.now() / 1000
    const updatedItem = {
      ...item,
      _meta: {
        ...existing._meta,
        updated_at: timestamp,
      },
    }
    this._saveItem(identifier, updatedItem)
    if (this.indexInMemory) {
      this.index[identifier] = updatedItem
    }
    return true
  }

  public delete(identifier: string): boolean {
    const itemPath = this._getItemPath(identifier)
    if (!fs.existsSync(itemPath)) {
      return false
    }
    try {
      fs.unlinkSync(itemPath)
      if (this.indexInMemory && this.index[identifier]) {
        delete this.index[identifier]
      }
      return true
    }
    catch (e) {
      console.error(`Error deleting item ${identifier}:`, e)
      return false
    }
  }

  public clear(): void {
    const files = fs.readdirSync(this.storagePath)
    for (const file of files) {
      if (!file.endsWith('.json'))
        continue
      try {
        fs.unlinkSync(path.join(this.storagePath, file))
      }
      catch (e) {
        console.error(`Error deleting file ${file}:`, e)
      }
    }
    if (this.indexInMemory) {
      this.index = {}
    }
  }

  public getStats(): Record<string, any> {
    let itemCount = 0
    if (this.indexInMemory) {
      itemCount = Object.keys(this.index).length
    }
    else {
      itemCount = fs.readdirSync(this.storagePath).filter(file => file.endsWith('.json')).length
    }
    let totalSize = 0
    const files = fs.readdirSync(this.storagePath)
    for (const file of files) {
      const filePath = path.join(this.storagePath, file)
      if (fs.statSync(filePath).isFile() && file.endsWith('.json')) {
        totalSize += fs.statSync(filePath).size
      }
    }
    return {
      type: 'long_term',
      storage_path: this.storagePath,
      index_in_memory: this.indexInMemory,
      item_count: itemCount,
      total_size_bytes: totalSize,
    }
  }

  // --- 내부 헬퍼 메서드 ---

  // 아이템 파일 경로 반환
  private _getItemPath(identifier: string): string {
    return path.join(this.storagePath, `${identifier}.json`)
  }

  // 아이템을 디스크에 저장
  private _saveItem(identifier: string, item: MemoryItem): void {
    const itemPath = this._getItemPath(identifier)
    try {
      fs.writeFileSync(itemPath, JSON.stringify(item, null, 2), 'utf-8')
    }
    catch (e) {
      console.error(`Error saving item ${identifier}:`, e)
    }
  }

  // 인메모리 인덱스 로드
  private _loadIndex(): void {
    this.index = {}
    const files = fs.readdirSync(this.storagePath)
    for (const file of files) {
      if (!file.endsWith('.json'))
        continue
      const id = file.slice(0, -5)
      try {
        const data = fs.readFileSync(path.join(this.storagePath, file), 'utf-8')
        this.index[id] = JSON.parse(data)
      }
      catch (e) {
        console.error(`Error loading index for ${id}:`, e)
      }
    }
  }

  // 쿼리 조건과 아이템이 일치하는지 확인 (점 표기법 지원)
  private _matchesQuery(item: MemoryItem, query: MemoryItem): boolean {
    for (const key in query) {
      if (Object.prototype.hasOwnProperty.call(query, key)) {
        const queryValue = query[key]
        if (key.includes('.')) {
          const parts = key.split('.')
          let current: any = item
          for (const part of parts) {
            if (typeof current === 'object' && current !== null && part in current) {
              current = current[part]
            }
            else {
              return false
            }
          }
          if (current !== queryValue)
            return false
        }
        else if (!(key in item) || item[key] !== queryValue) {
          return false
        }
      }
    }
    return true
  }
}
