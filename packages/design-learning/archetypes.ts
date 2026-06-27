// ============================================================
// Product Archetype Engine — Industry → Archetype 매핑 + Profile
// Generator는 Archetype에 따라 서로 다른 UI/UX 규칙을 적용한다.
// Restaurant 원리가 Universal로 승격되지 않도록 보호한다.
// ============================================================

// --- 6개 Archetype ---
export type Archetype =
  | 'consumer-app'      // Restaurant, Hotel, Travel, Fitness, Mission
  | 'enterprise-dashboard' // ERP, CRM, Manufacturing, HR, Finance
  | 'marketplace'       // Marketplace, E-commerce, Auction
  | 'cms-admin'         // Blog, Portfolio, Documentation
  | 'realtime-platform' // Trading, Chat, Live Streaming, IoT
  | 'mission-ngo';      // Non-profit, Volunteer, Charity, Education (underfunded)

// --- Archetype Profile ---
export interface ArchetypeProfile {
  archetype: Archetype;
  description: string;

  // Navigation
  navPattern: 'bottom-nav' | 'sidebar' | 'tabbar' | 'minimal';
  navItems: number;          // 권장 탭/메뉴 수

  // Layout
  primaryLayout: 'card-grid' | 'data-table' | 'split-view' | 'feed' | 'dashboard';
  gridColumns: number;       // 기본 그리드 열 수
  density: 'comfortable' | 'compact' | 'dense';

  // Content
  placeholderIcon: string;   // 🍽️ ❌ → 산업별
  ctaVerb: string;           // '예약하기' | '승인' | '주문' | '봉사신청'
  currencyDisplay: 'fixed' | 'multi' | 'none';

  // Form
  formStyle: 'wizard' | 'single-page' | 'inline' | 'modal';

  // Interaction
  realtimeUpdates: boolean;  // 실시간 데이터 갱신 (Trading/Chat)
  offlineSupport: boolean;   // 오프라인 모드 (Logistics/Manufacturing)
  batchActions: boolean;     // 일괄 작업 (ERP/Admin)
  searchRequired: boolean;   // 목록 검색 필수 여부

  // Visual
  motionIntensity: 'subtle' | 'moderate' | 'dynamic';
  dataVisualization: boolean; // 차트/그래프 (Trading/ERP)
  imageHeaviness: 'high' | 'medium' | 'low'; // 이미지 중심도
}

// --- Archetype Profiles ---
export const archetypeProfiles: Record<Archetype, ArchetypeProfile> = {
  // 1. Consumer App (Restaurant, Hotel, Travel, Fitness)
  'consumer-app': {
    archetype: 'consumer-app',
    description: 'B2C 소비자 앱 — 이미지 중심, 간단한 플로우, 감성적',
    navPattern: 'bottom-nav',
    navItems: 3,
    primaryLayout: 'card-grid',
    gridColumns: 2,
    density: 'comfortable',
    placeholderIcon: '🍽️',     // Archetype 기본값, Industry가 덮어씀
    ctaVerb: '예약하기',
    currencyDisplay: 'fixed',
    formStyle: 'single-page',
    realtimeUpdates: false,
    offlineSupport: false,
    batchActions: false,
    searchRequired: true,
    motionIntensity: 'subtle',
    dataVisualization: false,
    imageHeaviness: 'high',
  },

  // 2. Enterprise Dashboard (ERP, CRM, Manufacturing, HR)
  'enterprise-dashboard': {
    archetype: 'enterprise-dashboard',
    description: 'B2B 엔터프라이즈 — 데이터 중심, 복잡한 폼, 효율성',
    navPattern: 'sidebar',
    navItems: 5,
    primaryLayout: 'data-table',
    gridColumns: 4,
    density: 'compact',
    placeholderIcon: '📄',
    ctaVerb: '승인',
    currencyDisplay: 'multi',
    formStyle: 'wizard',
    realtimeUpdates: false,
    offlineSupport: true,      // Manufacturing은 오프라인 필수
    batchActions: true,
    searchRequired: true,
    motionIntensity: 'subtle',
    dataVisualization: true,
    imageHeaviness: 'low',
  },

  // 3. Marketplace (E-commerce, Auction, Bazaar)
  'marketplace': {
    archetype: 'marketplace',
    description: '양면 시장 — 검색 중심, 풍부한 필터, 리뷰/평점',
    navPattern: 'bottom-nav',
    navItems: 4,
    primaryLayout: 'card-grid',
    gridColumns: 3,
    density: 'comfortable',
    placeholderIcon: '📦',
    ctaVerb: '구매하기',
    currencyDisplay: 'multi',
    formStyle: 'single-page',
    realtimeUpdates: false,
    offlineSupport: false,
    batchActions: false,
    searchRequired: true,
    motionIntensity: 'moderate',
    dataVisualization: false,
    imageHeaviness: 'high',
  },

  // 4. CMS/Admin (Blog, Portfolio, Documentation)
  'cms-admin': {
    archetype: 'cms-admin',
    description: '콘텐츠 관리 — 텍스트 중심, 에디터, 카테고리',
    navPattern: 'sidebar',
    navItems: 4,
    primaryLayout: 'split-view',
    gridColumns: 1,
    density: 'comfortable',
    placeholderIcon: '📝',
    ctaVerb: '저장',
    currencyDisplay: 'none',
    formStyle: 'inline',
    realtimeUpdates: false,
    offlineSupport: false,
    batchActions: true,
    searchRequired: true,
    motionIntensity: 'subtle',
    dataVisualization: false,
    imageHeaviness: 'low',
  },

  // 5. Realtime Platform (Trading, Chat, Live, IoT)
  'realtime-platform': {
    archetype: 'realtime-platform',
    description: '실시간 — WebSocket, 빠른 갱신, 차트/그래프',
    navPattern: 'tabbar',
    navItems: 3,
    primaryLayout: 'dashboard',
    gridColumns: 3,
    density: 'dense',
    placeholderIcon: '📈',
    ctaVerb: '주문',
    currencyDisplay: 'multi',
    formStyle: 'inline',
    realtimeUpdates: true,
    offlineSupport: false,
    batchActions: false,
    searchRequired: true,
    motionIntensity: 'dynamic',
    dataVisualization: true,
    imageHeaviness: 'low',
  },

  // 6. Mission/NGO (Non-profit, Volunteer, Charity, Education)
  'mission-ngo': {
    archetype: 'mission-ngo',
    description: '비영리/미션 — 감성적, 스토리텔링, 기부/봉사',
    navPattern: 'minimal',
    navItems: 3,
    primaryLayout: 'feed',
    gridColumns: 1,
    density: 'comfortable',
    placeholderIcon: '🤝',
    ctaVerb: '참여하기',
    currencyDisplay: 'fixed',
    formStyle: 'single-page',
    realtimeUpdates: false,
    offlineSupport: false,
    batchActions: false,
    searchRequired: false,
    motionIntensity: 'subtle',
    dataVisualization: false,
    imageHeaviness: 'medium',
  },
};

// --- Industry → Archetype 자동 매핑 ---
const industryToArchetype: Record<string, Archetype> = {
  // Consumer
  restaurant: 'consumer-app',
  hotel: 'consumer-app',
  travel: 'consumer-app',
  fitness: 'consumer-app',
  healthcare: 'consumer-app',
  education: 'consumer-app',

  // Enterprise
  erp: 'enterprise-dashboard',
  crm: 'enterprise-dashboard',
  manufacturing: 'enterprise-dashboard',
  hr: 'enterprise-dashboard',
  finance: 'enterprise-dashboard',

  // Marketplace
  marketplace: 'marketplace',
  ecommerce: 'marketplace',
  retail: 'marketplace',

  // CMS
  blog: 'cms-admin',
  portfolio: 'cms-admin',
  documentation: 'cms-admin',

  // Realtime
  trading: 'realtime-platform',
  chat: 'realtime-platform',
  streaming: 'realtime-platform',
  iot: 'realtime-platform',

  // Mission
  mission: 'mission-ngo',
  nonprofit: 'mission-ngo',
  charity: 'mission-ngo',
  volunteer: 'mission-ngo',
};

// --- 조회 함수 ---
export function resolveArchetype(industry: string): Archetype {
  return industryToArchetype[industry] ?? 'consumer-app';
}

export function getArchetypeProfile(industry: string): ArchetypeProfile {
  const arch = resolveArchetype(industry);
  return archetypeProfiles[arch];
}

// --- Industry가 Archetype 기본값을 덮어쓸 수 있는지 ---
export function resolveWithOverrides(
  industry: string,
  overrides?: Partial<ArchetypeProfile>,
): ArchetypeProfile {
  const base = getArchetypeProfile(industry);
  return { ...base, ...overrides };
}
