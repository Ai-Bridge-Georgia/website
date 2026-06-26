// ============================================================
// Search Engine — Schema Definition
// 헌법: "Everything is Metadata", "API First"
// 검색을 메타데이터로 정의 → 코드 없이 검색 구축
// 사장님 취향: 아마존 스타일 서치바
// ============================================================

// --- Search Field ---
export interface SearchField {
  name: string;                  // 'name' | 'description' | 'category'
  weight?: number;               // 검색 가중치 (1.0 기본, 높을수록 우선)
  highlight?: boolean;           // 결과에서 하이라이트 여부
}

// --- Filter Definition ---
export interface SearchFilter {
  name: string;                  // 'category' | 'price_range' | 'is_available'
  label: string;                 // UI 라벨
  type: 'select' | 'multiselect' | 'range' | 'toggle' | 'rating';
  // select / multiselect
  options?: { label: string; value: string }[];
  // range
  min?: number;
  max?: number;
  step?: number;
  // 기본값
  defaultValue?: unknown;
  // 사장님 취향: UI 위치
  placement?: 'sidebar' | 'topbar' | 'dropdown';
}

// --- Sort Option ---
export interface SortOption {
  name: string;                  // 'relevance' | 'price_asc' | 'price_desc' | 'rating'
  label: string;                 // '관련도순' | '가격 낮은순'
  field?: string;
  direction?: 'asc' | 'desc';
}

// --- Search Schema (엔티티별 검색 정의) ---
export interface SearchSchema {
  id: string;                    // 'menu-search' | 'product-search'
  name: string;
  entity: string;                // 'menus' | 'products' (DB 테이블)
  // 검색 대상 필드
  fields: SearchField[];
  // 필터
  filters?: SearchFilter[];
  // 정렬
  sortOptions?: SortOption[];
  defaultSort?: string;
  // 결과 표시
  resultDisplay: {
    // 사장님 취향: 네이버 쇼핑 그리드
    layout: 'grid' | 'list';
    columns?: 2 | 3 | 4;
    // 카드 표시 필드
    card: {
      image?: string;            // 필드명 ('image_url')
      title: string;             // 필드명 ('name')
      subtitle?: string;         // 필드명 ('description')
      price?: string;            // 필드명 ('price')
      badge?: string;            // 필드명 ('is_popular')
      rating?: string;           // 필드명 ('avg_rating')
    };
    // 페이지네이션
    pageSize?: number;           // 기본: 20
  };
  // 자동완성
  autocomplete?: {
    enabled: boolean;
    fields: string[];            // ['name', 'category']
    minChars?: number;           // 기본: 2
  };
  // 검색 API
  endpoint?: string;             // '/api/v1/search/menu'
}

// --- Search Query (런타임) ---
export interface SearchQuery {
  text?: string;                 // 검색어
  filters?: Record<string, unknown>;
  sort?: string;                 // sortOption.name
  page?: number;                 // 기본: 1
  pageSize?: number;             // 기본: schema.resultDisplay.pageSize
}

// --- Search Response ---
export interface SearchResponse<T = Record<string, unknown>> {
  results: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: Record<string, { label: string; count: number }[]>;
  took?: number;                 // ms
}

// ============================================================
// 실제 검색 스키마 정의
// ============================================================

// --- Restaurant Menu Search ---
export const menuSearchSchema: SearchSchema = {
  id: 'menu-search',
  name: '메뉴 검색',
  entity: 'menus',
  fields: [
    { name: 'name', weight: 3.0, highlight: true },
    { name: 'description', weight: 1.0 },
    { name: 'category', weight: 2.0 },
  ],
  filters: [
    {
      name: 'category',
      label: '카테고리',
      type: 'multiselect',
      options: [
        { label: '메인', value: 'main' },
        { label: '사이드', value: 'side' },
        { label: '음료', value: 'drink' },
        { label: '디저트', value: 'dessert' },
      ],
      placement: 'sidebar',
    },
    {
      name: 'price_range',
      label: '가격대',
      type: 'range',
      min: 0,
      max: 100,
      step: 5,
      placement: 'sidebar',
    },
    {
      name: 'is_available',
      label: '판매 중만',
      type: 'toggle',
      defaultValue: true,
      placement: 'topbar',
    },
    {
      name: 'is_spicy',
      label: '맵기',
      type: 'select',
      options: [
        { label: '전체', value: '' },
        { label: '맵지 않음', value: '0' },
        { label: '약간 매움', value: '1' },
        { label: '매움', value: '2' },
      ],
      placement: 'dropdown',
    },
  ],
  sortOptions: [
    { name: 'relevance', label: '관련도순' },
    { name: 'price_asc', label: '가격 낮은순', field: 'price', direction: 'asc' },
    { name: 'price_desc', label: '가격 높은순', field: 'price', direction: 'desc' },
    { name: 'name_asc', label: '가나다순', field: 'name', direction: 'asc' },
  ],
  defaultSort: 'relevance',
  resultDisplay: {
    layout: 'grid',
    columns: 3,
    card: {
      image: 'image_url',
      title: 'name',
      subtitle: 'description',
      price: 'price',
      badge: 'category',
    },
    pageSize: 18,
  },
  autocomplete: {
    enabled: true,
    fields: ['name', 'category'],
    minChars: 2,
  },
  endpoint: '/api/v1/search/menu',
};

// --- Hotel Room Search ---
export const roomSearchSchema: SearchSchema = {
  id: 'room-search',
  name: '객실 검색',
  entity: 'rooms',
  fields: [
    { name: 'room_type', weight: 3.0, highlight: true },
    { name: 'name', weight: 2.0 },
    { name: 'description', weight: 1.0 },
  ],
  filters: [
    {
      name: 'capacity',
      label: '수용 인원',
      type: 'select',
      options: [
        { label: '1인', value: '1' },
        { label: '2인', value: '2' },
        { label: '4인 이상', value: '4' },
      ],
      placement: 'sidebar',
    },
    {
      name: 'price_range',
      label: '가격대',
      type: 'range',
      min: 20,
      max: 500,
      step: 10,
      placement: 'sidebar',
    },
  ],
  sortOptions: [
    { name: 'relevance', label: '관련도순' },
    { name: 'price_asc', label: '가격 낮은순', field: 'price_per_night', direction: 'asc' },
    { name: 'price_desc', label: '가격 높은순', field: 'price_per_night', direction: 'desc' },
  ],
  defaultSort: 'price_asc',
  resultDisplay: {
    layout: 'grid',
    columns: 3,
    card: {
      image: 'image_url',
      title: 'name',
      subtitle: 'room_type',
      price: 'price_per_night',
    },
    pageSize: 9,
  },
  endpoint: '/api/v1/search/rooms',
};
