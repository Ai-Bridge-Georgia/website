// ============================================================
// Business OS — Entity Registry (Factory Core)
// 도메인 지식 ❌ — 플러그인이 registerEntity()로 등록
// ============================================================

import type { EntitySchemaMeta } from './boundary';

const entities = new Map<string, EntitySchemaMeta>();

export function registerEntity(entity: EntitySchemaMeta): void {
  entities.set(entity.name, entity);
}

export function getEntity(name: string): EntitySchemaMeta | undefined {
  return entities.get(name);
}

export function listEntities(): EntitySchemaMeta[] {
  return Array.from(entities.values());
}

export function clearEntities(): void {
  entities.clear();
}
