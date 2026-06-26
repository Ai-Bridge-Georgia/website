// ============================================================
// Search Engine — Query Builder
// 헌법: "API First", "Everything is Metadata"
// SearchQuery → Supabase 쿼리 / API URL 자동 생성
// ============================================================

import type { SearchSchema, SearchQuery, SortOption } from './schema';

// --- Supabase Query Builder ---
// SearchQuery를 Supabase 클라이언트 체인으로 변환
export function buildSupabaseQuery(
  schema: SearchSchema,
  query: SearchQuery,
): {
  select: string;
  filter: Record<string, unknown>;
  order?: { column: string; ascending: boolean };
  range: { from: number; to: number };
} {
  // SELECT
  const select = '*';

  // FILTER
  const filter: Record<string, unknown> = {};
  if (query.text) {
    // 전문 검색 (PostgreSQL FTS — Phase 2에서 DB 함수 사용)
    filter._search = query.text;
  }
  if (query.filters) {
    Object.assign(filter, query.filters);
  }

  // ORDER
  let order: { column: string; ascending: boolean } | undefined;
  const sortName = query.sort ?? schema.defaultSort ?? 'relevance';
  const sortOpt = schema.sortOptions?.find((s) => s.name === sortName);
  if (sortOpt?.field) {
    order = { column: sortOpt.field, ascending: sortOpt.direction !== 'desc' };
  }

  // RANGE (페이지네이션)
  const pageSize = query.pageSize ?? schema.resultDisplay.pageSize ?? 20;
  const page = query.page ?? 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { select, filter, order, range: { from, to } };
}

// --- API URL Builder ---
// SearchQuery를 REST API URL로 변환
export function buildApiUrl(
  schema: SearchSchema,
  query: SearchQuery,
): string {
  if (!schema.endpoint) return '';

  const params = new URLSearchParams();

  if (query.text) {
    params.set('q', query.text);
  }

  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    }
  }

  if (query.sort && query.sort !== schema.defaultSort) {
    params.set('sort', query.sort);
  }

  const pageSize = query.pageSize ?? schema.resultDisplay.pageSize ?? 20;
  const page = query.page ?? 1;
  params.set('page', String(page));
  params.set('limit', String(pageSize));

  return `${schema.endpoint}?${params.toString()}`;
}

// --- 하이라이트 ---
export function highlightText(
  text: string,
  query: string,
): { text: string; match: boolean } {
  if (!query.trim()) return { text, match: false };
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const match = regex.test(text);
  return {
    text: match ? text.replace(regex, '<mark>$1</mark>') : text,
    match,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
