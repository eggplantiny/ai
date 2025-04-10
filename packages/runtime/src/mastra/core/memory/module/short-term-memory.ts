import type { MemoryItem } from '@runtime/mastra/core/memory'
import { Memory } from '@runtime/mastra/core/memory/module/memory'
import { genUUID } from '@runtime/mastra/libs'

export class ShortTermMemory extends Memory {
  private capacity: number
  private ttl: number // Time To Live (초 단위)
  private items: Record<string, MemoryItem> = {}
  private accessTimes: Record<string, number> = {}
  private creationTimes: Record<string, number> = {}
  private lruQueue: Array<[number, string]> = [] // [accessTime, identifier]

  // 웃긴 메모리 관련 메시지 (클래스 내부 상수)
  private static readonly _memoryMessages: string[] = [
    'ANUS short-term memory retaining item...',
    'Storing this for quick retrieval from your ANUS...',
    'This item is now tightly held in ANUS memory...',
    'Squeezing this into ANUS short-term storage...',
    'ANUS will remember this, at least for a little while...',
  ]

  constructor(capacity: number = 1000, ttl: number = 3600, config: Record<string, any> = {}) {
    super(config)
    this.capacity = capacity
    this.ttl = ttl

    if (capacity < 100) {
      console.warn(`ANUS short-term memory capacity of ${capacity} is quite small. Performance may suffer.`)
    }
    else if (capacity > 10000) {
      console.warn(`ANUS short-term memory capacity of ${capacity} is unusually large. Hope you have enough RAM!`)
    }

    console.info(`ANUS short-term memory initialized with capacity for ${capacity} items and ${ttl}s retention`)
  }

  public add(item: MemoryItem): string {
    this._pruneExpired()

    const identifier = genUUID()
    const currentTime = Date.now() / 1000
    this.items[identifier] = item
    this.accessTimes[identifier] = currentTime
    this.creationTimes[identifier] = currentTime

    // LRU 큐에 추가
    this.lruQueue.push([currentTime, identifier])

    // 용량 초과시 LRU 방식으로 아이템 삭제
    if (Object.keys(this.items).length > this.capacity) {
      this._evictLru()
    }

    // 5% 확률로 웃긴 메시지 출력
    if (Math.random() < 0.05) {
      const randomIndex = Math.floor(Math.random() * ShortTermMemory._memoryMessages.length)
      console.debug(ShortTermMemory._memoryMessages[randomIndex])
    }

    const capacityPct = (Object.keys(this.items).length / this.capacity) * 100
    if (capacityPct > 90) {
      console.warn(`ANUS short-term memory is ${capacityPct.toFixed(1)}% full. Starting to feel tight in here!`)
    }

    return identifier
  }

  public get(identifier: string): MemoryItem | null {
    this._pruneExpired()

    if (!(identifier in this.items)) {
      console.debug(`ANUS has no recollection of item ${identifier.slice(0, 8)}...`)
      return null
    }

    // 접근시간 갱신
    this.accessTimes[identifier] = Date.now() / 1000
    console.debug('ANUS recalls this item perfectly!')
    return this.items[identifier]
  }

  public search(
    query: MemoryItem,
    limit: number = 10,
  ): Array<{ id: string, item: MemoryItem, created_at: number }> {
    this._pruneExpired()

    console.debug('ANUS is probing deeply for matching items...')
    const results: Array<{ id: string, item: MemoryItem, created_at: number }> = []

    for (const identifier in this.items) {
      const item = this.items[identifier]
      let isMatch = true
      // 모든 query 필드에 대해 정확히 일치하는지 확인
      for (const key in query) {
        if (!(key in item) || item[key] !== query[key]) {
          isMatch = false
          break
        }
      }
      if (isMatch) {
        // 접근시간 갱신
        this.accessTimes[identifier] = Date.now() / 1000
        results.push({
          id: identifier,
          item,
          created_at: this.creationTimes[identifier],
        })
        if (results.length >= limit)
          break
      }
    }

    results.sort((a, b) => b.created_at - a.created_at)

    if (results.length === 0) {
      console.debug('ANUS found nothing that matches. How disappointing.')
    }
    else {
      console.debug(`ANUS successfully extracted ${results.length} matching items!`)
    }

    return results
  }

  public update(identifier: string, item: MemoryItem): boolean {
    this._pruneExpired()

    if (!(identifier in this.items)) {
      console.debug(`ANUS can't update what it doesn't have (identifier: ${identifier.slice(0, 8)})`)
      return false
    }

    this.items[identifier] = item
    this.accessTimes[identifier] = Date.now() / 1000
    console.debug('ANUS memory successfully updated with fresh content')
    return true
  }

  public delete(identifier: string): boolean {
    if (!(identifier in this.items)) {
      return false
    }

    delete this.items[identifier]
    delete this.accessTimes[identifier]
    delete this.creationTimes[identifier]
    // lruQueue에는 남아있으나, 삭제된 아이템은 _evictLru() 시 건너뜁니다.
    console.debug('ANUS has purged this item from its memory')
    return true
  }

  public clear(): void {
    const oldCount = Object.keys(this.items).length
    this.items = {}
    this.accessTimes = {}
    this.creationTimes = {}
    this.lruQueue = []
    console.info(`ANUS memory has been completely flushed of ${oldCount} items. Fresh and clean!`)
  }

  public getStats(): Record<string, any> {
    const currentSize = Object.keys(this.items).length
    const utilization = this.capacity > 0 ? currentSize / this.capacity : 0
    let status: string
    if (utilization > 0.9) {
      status = 'ANUS memory is nearly full! Things are getting tight in here.'
    }
    else if (utilization > 0.7) {
      status = 'ANUS memory is filling up nicely.'
    }
    else if (utilization > 0.4) {
      status = 'ANUS memory has plenty of room for more.'
    }
    else {
      status = 'ANUS memory is mostly empty. Feed me more data!'
    }

    return {
      type: 'short_term',
      capacity: this.capacity,
      ttl: this.ttl,
      current_size: currentSize,
      utilization,
      status,
    }
  }

  // --- 내부 헬퍼 메서드 ---

  // TTL 초과된 아이템 제거
  private _pruneExpired(): void {
    const currentTime = Date.now() / 1000
    const expiredIdentifiers: string[] = []

    for (const identifier in this.creationTimes) {
      if (currentTime - this.creationTimes[identifier] > this.ttl) {
        expiredIdentifiers.push(identifier)
      }
    }

    if (expiredIdentifiers.length > 0) {
      for (const id of expiredIdentifiers) {
        this.delete(id)
      }
      console.debug(`ANUS has expelled ${expiredIdentifiers.length} expired items from memory`)
    }
  }

  // LRU 기반으로 가장 오래된 아이템을 제거
  private _evictLru(): void {
    while (this.lruQueue.length > 0) {
      // lruQueue를 타임스탬프 기준으로 오름차순 정렬
      this.lruQueue.sort((a, b) => a[0] - b[0])
      const [_, identifier] = this.lruQueue.shift()!
      if (!(identifier in this.items)) {
        continue // 이미 삭제된 항목이면 건너뜀
      }
      const itemName = (this.items[identifier] as any).name || 'unknown'
      this.delete(identifier)
      console.debug(`ANUS had to push out '${itemName}' to make room for new content`)
      break
    }
  }
}
