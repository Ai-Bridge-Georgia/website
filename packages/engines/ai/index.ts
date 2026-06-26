// ============================================================
// AI Engine — Natural Language Query, Copilot, Predictions
// 헌법: "AI FIRST — AI is part of the operating system"
// 모든 모듈이 AI 기능을 노출할 수 있도록 지원
// ============================================================

// --- AI Capability ---
export type AICapability =
  | 'nl_query'          // 자연어 쿼리 ("오늘 매출 어때?")
  | 'copilot'           // 작업 보조 ("이 메뉴 설명 작성해줘")
  | 'recommendation'    // 추천 ("이 메뉴와 잘 어울리는 음료는?")
  | 'prediction'        // 예측 ("내일 주문량 예측해줘")
  | 'automation'        // 자동화 ("리뷰에 자동 답글 작성")
  | 'insight'           // 인사이트 ("이번 주 특이사항?")
  | 'classification'    // 분류 ("이 리뷰는 긍정/부정?")
  | 'translation';      // 번역

// --- AI Request ---
export interface AIRequest {
  capability: AICapability;
  tenantId: string;
  prompt: string;
  // 컨텍스트
  context?: {
    entity?: string;           // 'menu' | 'orders'
    entityId?: string;
    data?: Record<string, unknown>;
    locale?: string;
  };
  // 제약
  maxTokens?: number;
  temperature?: number;
}

// --- AI Response ---
export interface AIResponse {
  success: boolean;
  text?: string;
  data?: unknown;
  structured?: Record<string, unknown>;
  error?: string;
  took?: number;               // ms
}

// --- AI Provider Interface ---
export interface AIProvider {
  name: string;
  query(request: AIRequest): Promise<AIResponse>;
}

// --- Provider Registry ---
const providers = new Map<string, AIProvider>();

export function registerAIProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function getAIProvider(name?: string): AIProvider | undefined {
  if (name) return providers.get(name);
  // 기본: 첫 번째 등록된 provider
  return providers.values().next().value;
}

// --- 자연어 쿼리 → SQL/API 변환 ---
export interface NLQueryResult {
  sql?: string;               // 생성된 SQL
  endpoint?: string;          // 또는 API 엔드포인트
  params?: Record<string, unknown>;
  explanation?: string;       // 사용자에게 보여줄 설명
}

// --- 미리 정의된 쿼리 패턴 (Phase 1: 룰 기반) ---
const queryPatterns: { pattern: RegExp; sql: string; explanation: string }[] = [
  {
    pattern: /오늘.*매출|today.*sales/i,
    sql: `SELECT SUM(total) as total_sales, COUNT(*) as order_count FROM orders WHERE DATE(created_at) = CURRENT_DATE AND tenant_id = $1`,
    explanation: '오늘의 매출과 주문 수를 조회합니다',
  },
  {
    pattern: /이번\s*주|this\s*week/i,
    sql: `SELECT DATE(created_at) as date, SUM(total) as daily_total FROM orders WHERE created_at >= date_trunc('week', now()) AND tenant_id = $1 GROUP BY DATE(created_at) ORDER BY date`,
    explanation: '이번 주 일별 매출을 조회합니다',
  },
  {
    pattern: /인기.*메뉴|popular|best.?selling/i,
    sql: `SELECT m.name, SUM(oi.quantity) as total_ordered FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN menus m ON oi.menu_id = m.id WHERE o.tenant_id = $1 GROUP BY m.name ORDER BY total_ordered DESC LIMIT 10`,
    explanation: '가장 많이 팔린 메뉴 TOP 10',
  },
  {
    pattern: /평점|리뷰|rating|review/i,
    sql: `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE tenant_id = $1`,
    explanation: '평균 평점과 리뷰 수',
  },
  {
    pattern: /예약|reservation/i,
    sql: `SELECT DATE(date) as date, COUNT(*) as count, SUM(party_size) as total_guests FROM reservations WHERE tenant_id = $1 AND date >= now() GROUP BY DATE(date) ORDER BY date LIMIT 7`,
    explanation: '향후 7일간 예약 현황',
  },
];

// --- 자연어 쿼리 처리 (Phase 1: 룰 기반) ---
export function parseNaturalQuery(text: string): NLQueryResult {
  for (const { pattern, sql, explanation } of queryPatterns) {
    if (pattern.test(text)) {
      return { sql, explanation };
    }
  }
  return { explanation: '이 질문은 아직 지원하지 않습니다. 매출, 주문, 메뉴, 예약, 리뷰에 대해 물어보세요.' };
}

// --- Copilot: 메뉴 설명 자동 작성 ---
export function generateMenuDescription(params: {
  name: string;
  category: string;
  price: number;
  cuisine: string;
  locale?: string;
}): string {
  const { name, category, price, cuisine, locale = 'ko' } = params;

  if (locale === 'ka') {
    return `${cuisine} სამზარეულოს ნამდვილი ${category}. ${name} — მზადდება ახალი ინგრედიენტებით. ფასი: ${price} ₾`;
  }
  if (locale === 'en') {
    return `Authentic ${cuisine} ${category}. ${name} — made with fresh ingredients. Price: ${price} GEL`;
  }

  return `정통 ${cuisine} ${category}. ${name} — 신선한 재료로 정성껏 만들었습니다. 가격: ${price.toLocaleString()} ₾`;
}

// --- Copilot: 리뷰 자동 답글 ---
export function generateReviewReply(params: {
  rating: number;
  reviewText: string;
  customerName: string;
  locale?: string;
}): string {
  const { rating, customerName, locale = 'ko' } = params;

  if (locale === 'ka') {
    if (rating >= 4) return `${customerName}ნ, შეფასებისთვის მადლობა! კვლავ მობრძანდით ჩვენთან 🙏`;
    if (rating >= 3) return `${customerName}ნ, თქვენი აზრი მნიშვნელოვანია. გთხოვთ, მოგვწეროთ რა გაუმჯობესება შეგვიძლია.`;
    return `${customerName}ნ, უკმაყოფილებისთვის ვწუხვართ. გთხოვთ დაგვიკავშირდეთ — პრობლემას აუცილებლად მოვაგვარებთ.`;
  }

  if (rating >= 4) return `${customerName}님, 좋은 리뷰 감사합니다! 다음에 또 오세요 🙏`;
  if (rating >= 3) return `${customerName}님, 소중한 의견 감사합니다. 더 나아질 수 있도록 노력하겠습니다.`;
  return `${customerName}님, 불편을 드려 죄송합니다. 문제를 파악하고 개선하겠습니다. 직접 연락 주시면 더 빠르게 도와드리겠습니다.`;
}

// --- Copilot: 주문량 예측 (간단한 이동평균) ---
export function predictOrderVolume(history: number[]): {
  predicted: number;
  confidence: 'low' | 'medium' | 'high';
  trend: 'up' | 'down' | 'flat';
} {
  if (history.length < 3) {
    return { predicted: 0, confidence: 'low', trend: 'flat' };
  }

  // 7일 이동평균
  const recent = history.slice(-7);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

  // 이전 7일과 비교
  const previous = history.slice(-14, -7);
  const prevAvg = previous.length > 0
    ? previous.reduce((a, b) => a + b, 0) / previous.length
    : avg;

  const diff = prevAvg > 0 ? ((avg - prevAvg) / prevAvg) * 100 : 0;
  const trend = Math.abs(diff) < 5 ? 'flat' : diff > 0 ? 'up' : 'down';
  const confidence = history.length >= 14 ? 'high' : history.length >= 7 ? 'medium' : 'low';

  return {
    predicted: Math.round(avg),
    confidence,
    trend,
  };
}

// --- 기본 AI 기능 정의 ---
export const defaultAICapabilities = [
  { id: 'nl-query', name: '자연어 쿼리', capability: 'nl_query' as AICapability },
  { id: 'menu-description', name: '메뉴 설명 자동 작성', capability: 'copilot' as AICapability },
  { id: 'review-reply', name: '리뷰 자동 답글', capability: 'automation' as AICapability },
  { id: 'order-prediction', name: '주문량 예측', capability: 'prediction' as AICapability },
  { id: 'menu-translation', name: '메뉴 번역', capability: 'translation' as AICapability },
];
