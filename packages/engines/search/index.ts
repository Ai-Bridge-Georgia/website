// @aibg/engine-search — Search Engine
// 헌법: "Everything is Metadata", "API First"
// 검색을 메타데이터로 정의 → 코드 없이 검색 구축.
// 사장님 취향: 아마존 서치바 + 네이버 쇼핑 그리드.

export type {
  SearchSchema, SearchField, SearchFilter, SortOption,
  SearchQuery, SearchResponse,
} from './schema';
export { menuSearchSchema, roomSearchSchema } from './schema';
export {
  buildSupabaseQuery, buildApiUrl, highlightText,
} from './query-builder';
export { SearchRenderer } from './renderer';
