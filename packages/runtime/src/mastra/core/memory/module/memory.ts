/**
 * Memory 모듈 (추상 클래스)
 * 메모리 시스템의 공통 인터페이스를 정의합니다.
 */
import type { MemoryItem } from '@runtime/mastra/core/memory'

export abstract class Memory {
  protected config: { [key: string]: any }

  /**
   * 생성자: 추가 설정값을 config에 저장합니다.
   * @param config 메모리 시스템 설정 정보
   */
  constructor(config: { [key: string]: any } = {}) {
    this.config = config
  }

  /**
   * 아이템을 메모리에 추가하고 식별자를 반환합니다.
   * @param item 메모리에 추가할 아이템
   * @returns 추가된 아이템의 식별자 (문자열)
   */
  abstract add(item: MemoryItem): string

  /**
   * 식별자를 기반으로 아이템을 조회합니다.
   * @param identifier 아이템 식별자
   * @returns 조회된 아이템 또는 없으면 null
   */
  abstract get(identifier: string): MemoryItem | null

  /**
   * 쿼리 조건에 맞는 아이템들을 검색합니다.
   * @param query 검색 조건 (객체 형태)
   * @param limit 최대 반환 개수 (기본값: 10)
   * @returns 검색 결과로 매칭된 아이템들의 배열
   */
  abstract search(query: MemoryItem, limit?: number): MemoryItem[]

  /**
   * 식별자를 기준으로 아이템을 업데이트합니다.
   * @param identifier 업데이트할 아이템 식별자
   * @param item 업데이트할 내용이 담긴 객체
   * @returns 업데이트 성공 여부
   */
  abstract update(identifier: string, item: MemoryItem): boolean

  /**
   * 식별자를 기반으로 아이템을 삭제합니다.
   * @param identifier 삭제할 아이템 식별자
   * @returns 삭제 성공 여부
   */
  abstract delete(identifier: string): boolean

  /**
   * 메모리 내의 모든 아이템을 제거합니다.
   */
  abstract clear(): void

  /**
   * 메모리 시스템의 통계 정보를 반환합니다.
   * @returns 통계 정보를 담은 객체
   */
  abstract getStats(): { [key: string]: any }
}
