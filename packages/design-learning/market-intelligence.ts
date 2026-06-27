// ============================================================
// Market Intelligence Engine
// 실제 시장 데이터를 학습하여 다음 세대 제품을 개선한다.
// Factory의 마지막 교사는 AI가 아니라, 실제 사용자와 시장이다.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// SIGNAL DEFINITIONS
// ============================================================

export interface MarketSignal {
  timestamp: string;
  projectId: string;
  platform: string;
  category: SignalCategory;
  metrics: Partial<UserBehaviorMetrics & BusinessMetrics & UXMetrics & CustomerFeedback>;
}

export type SignalCategory = 'user-behavior' | 'business' | 'ux' | 'feedback';

// --- User Behavior ---
export interface UserBehaviorMetrics {
  visits: number;
  clickThroughRate: number;     // CTA 클릭률 (%)
  topSearchTerms: string[];
  reservationCompletionRate: number;  // 예약 완료율 (%)
  orderCompletionRate: number;
  bounceRate: number;           // 이탈률 (%)
  returnVisitorRate: number;    // 재방문율 (%)
  avgSessionDuration: number;   // 평균 체류 시간 (초)
}

// --- Business ---
export interface BusinessMetrics {
  revenue: number;
  reservations: number;
  conversionRate: number;       // 전환율 (%)
  avgOrderValue: number;        // 객단가
  cancellationRate: number;
  repeatPurchaseRate: number;
}

// --- UX ---
export interface UXMetrics {
  avgClicks: number;
  scrollDepth: number;          // 스크롤 깊이 (%)
  searchSuccessRate: number;    // 검색 성공률 (%)
  formCompletionRate: number;
  errorRate: number;
  pageLoadTime: number;         // 페이지 응답 시간 (ms)
}

// --- Customer Feedback ---
export interface CustomerFeedback {
  avgRating: number;            // 평점 (1-5)
  reviewCount: number;
  topComplaints: string[];
  topPraises: string[];
  nps: number;                  // Net Promoter Score
}

// ============================================================
// SIGNAL COLLECTOR (데이터 수집)
// ============================================================

const signalsFile = path.resolve(process.cwd(), '.knowledge', 'market-signals.json');

export function recordSignal(signal: MarketSignal): void {
  let signals: MarketSignal[] = [];
  try {
    if (fs.existsSync(signalsFile)) {
      signals = JSON.parse(fs.readFileSync(signalsFile, 'utf-8'));
    }
  } catch { /* empty */ }

  signals.push(signal);

  fs.mkdirSync(path.dirname(signalsFile), { recursive: true });
  fs.writeFileSync(signalsFile, JSON.stringify(signals, null, 2));
}

export function loadSignals(projectId?: string): MarketSignal[] {
  try {
    if (!fs.existsSync(signalsFile)) return [];
    const signals: MarketSignal[] = JSON.parse(fs.readFileSync(signalsFile, 'utf-8'));
    return projectId ? signals.filter(s => s.projectId === projectId) : signals;
  } catch {
    return [];
  }
}

// ============================================================
// LEARNING ENGINE (시장 데이터 → 학습 규칙)
// ============================================================

export interface MarketLearning {
  category: string;
  finding: string;
  recommendation: string;
  confidence: number;           // 0-100
  dataPoints: number;
  impactLevel: 'high' | 'medium' | 'low';
}

export function deriveMarketLearnings(signals: MarketSignal[]): MarketLearning[] {
  const learnings: MarketLearning[] = [];

  if (signals.length === 0) return learnings;

  // 1. CTA 성과 분석
  const ctaRates = signals
    .filter(s => s.metrics.clickThroughRate !== undefined)
    .map(s => s.metrics.clickThroughRate as number);
  if (ctaRates.length > 0) {
    const avgCTA = ctaRates.reduce((a, b) => a + b, 0) / ctaRates.length;
    learnings.push({
      category: 'cta-performance',
      finding: `평균 CTA 클릭률: ${avgCTA.toFixed(1)}%`,
      recommendation: avgCTA < 5
        ? 'CTA가 너무 아래에 있음 — 첫 화면에 배치 필요'
        : avgCTA < 15
          ? 'CTA 위치 양호 — 색상/카피 개선 여지'
          : 'CTA 성과 우수 — 현재 패턴 유지',
      confidence: Math.min(100, 40 + ctaRates.length * 20),
      dataPoints: ctaRates.length,
      impactLevel: avgCTA < 5 ? 'high' : 'medium',
    });
  }

  // 2. 전환율 분석
  const conversions = signals
    .filter(s => s.metrics.conversionRate !== undefined)
    .map(s => s.metrics.conversionRate as number);
  if (conversions.length > 0) {
    const avgConv = conversions.reduce((a, b) => a + b, 0) / conversions.length;
    learnings.push({
      category: 'conversion',
      finding: `평균 전환율: ${avgConv.toFixed(1)}%`,
      recommendation: avgConv < 10
        ? '전환율 낮음 — 폼 단순화 또는 단계 축소 필요'
        : avgConv < 30
          ? '전환율 보통 — CTA 카피 또는 인센티브 검토'
          : '전환율 우수 — 현재 폼 구조 유지',
      confidence: Math.min(100, 40 + conversions.length * 20),
      dataPoints: conversions.length,
      impactLevel: avgConv < 10 ? 'high' : 'medium',
    });
  }

  // 3. 이탈률 분석
  const bounces = signals
    .filter(s => s.metrics.bounceRate !== undefined)
    .map(s => s.metrics.bounceRate as number);
  if (bounces.length > 0) {
    const avgBounce = bounces.reduce((a, b) => a + b, 0) / bounces.length;
    learnings.push({
      category: 'bounce-rate',
      finding: `평균 이탈률: ${avgBounce.toFixed(1)}%`,
      recommendation: avgBounce > 60
        ? '이탈률 높음 — 첫 화면 가치 제안 재검토'
        : avgBounce > 40
          ? '이탈률 보통 — 로딩 속도 또는 콘텐츠 개선'
          : '이탈률 양호',
      confidence: Math.min(100, 40 + bounces.length * 20),
      dataPoints: bounces.length,
      impactLevel: avgBounce > 60 ? 'high' : 'low',
    });
  }

  // 4. 검색 사용률
  const searchRates = signals
    .filter(s => s.metrics.searchSuccessRate !== undefined)
    .map(s => s.metrics.searchSuccessRate as number);
  if (searchRates.length > 0) {
    const avgSearch = searchRates.reduce((a, b) => a + b, 0) / searchRates.length;
    learnings.push({
      category: 'search-usage',
      finding: `검색 성공률: ${avgSearch.toFixed(1)}%`,
      recommendation: avgSearch < 50
        ? '검색이 잘 안 됨 — 자동완성 또는 인기 검색어 추가'
        : '검색 기능 양호',
      confidence: Math.min(100, 40 + searchRates.length * 20),
      dataPoints: searchRates.length,
      impactLevel: avgSearch < 50 ? 'high' : 'low',
    });
  }

  // 5. 재방문율
  const returns = signals
    .filter(s => s.metrics.returnVisitorRate !== undefined)
    .map(s => s.metrics.returnVisitorRate as number);
  if (returns.length > 0) {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    learnings.push({
      category: 'retention',
      finding: `재방문율: ${avgReturn.toFixed(1)}%`,
      recommendation: avgReturn < 20
        ? '재방문율 낮음 — 첫 경험 후 재방문 동기 부족'
        : avgReturn < 40
          ? '재방문율 보통 — 개인화 또는 알림 검토'
          : '재방문율 우수',
      confidence: Math.min(100, 40 + returns.length * 20),
      dataPoints: returns.length,
      impactLevel: avgReturn < 20 ? 'high' : 'medium',
    });
  }

  // 6. NPS / 만족도
  const npsScores = signals
    .filter(s => s.metrics.nps !== undefined)
    .map(s => s.metrics.nps as number);
  if (npsScores.length > 0) {
    const avgNps = npsScores.reduce((a, b) => a + b, 0) / npsScores.length;
    learnings.push({
      category: 'satisfaction',
      finding: `NPS: ${avgNps.toFixed(0)}`,
      recommendation: avgNps < 0
        ? 'NPS 음수 — 제품 경험 전면 재검토'
        : avgNps < 30
          ? 'NPS 보통 — 주요 불만 분석 필요'
          : 'NPS 양호 — 현재 경험 유지',
      confidence: Math.min(100, 40 + npsScores.length * 20),
      dataPoints: npsScores.length,
      impactLevel: avgNps < 0 ? 'high' : 'medium',
    });
  }

  // 7. 검색어 분석
  const allSearchTerms = signals
    .filter(s => s.metrics.topSearchTerms)
    .flatMap(s => s.metrics.topSearchTerms as string[]);
  if (allSearchTerms.length > 0) {
    const termCounts = new Map<string, number>();
    for (const t of allSearchTerms) {
      termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
    }
    const top = Array.from(termCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    learnings.push({
      category: 'search-terms',
      finding: `인기 검색어: ${top.map(([t, c]) => t + '(' + c + ')').join(', ')}`,
      recommendation: '인기 검색어를 추천 메뉴/카테고리로 승격',
      confidence: Math.min(100, 30 + allSearchTerms.length * 5),
      dataPoints: allSearchTerms.length,
      impactLevel: 'medium',
    });
  }

  return learnings;
}

// ============================================================
// PRODUCT DIRECTOR AI 2.0 (Market 질문 추가)
// ============================================================

export interface MarketDirectorReview {
  productScore: number;
  marketScore: number;
  overallScore: number;
  findings: { question: string; answer: string; pass: boolean }[];
  blockers: string[];
  approved: boolean;
}

const marketQuestions = [
  '실제 사용자가 이 CTA를 클릭했는가?',
  '실제 예약 전환율은 얼마인가?',
  '사용자가 어디에서 이탈하는가?',
  '검색이 실제로 사용되는가?',
  '첫 화면이 목표 달성에 도움이 되었는가?',
  '사용자가 추천했는가? (NPS)',
  '브랜드 경험이 실제 만족도로 이어졌는가?',
];

export function reviewWithMarketData(
  learnings: MarketLearning[],
  hasRealData: boolean,
): MarketDirectorReview {
  const findings: MarketDirectorReview['findings'] = [];
  const blockers: string[] = [];

  if (!hasRealData || learnings.length === 0) {
    // 실제 데이터 없음 — 모든 질문이 "미검증"
    for (const q of marketQuestions) {
      findings.push({ question: q, answer: '미검증 (실제 시장 데이터 없음)', pass: false });
      blockers.push(q + ': 미검증');
    }
    return {
      productScore: 88, // 이전 Product Director 점수
      marketScore: 0,
      overallScore: 44,
      findings,
      blockers,
      approved: false,
    };
  }

  // CTA 성과
  const ctaLearning = learnings.find(l => l.category === 'cta-performance');
  const ctaOk = ctaLearning ? !ctaLearning.recommendation.includes('너무 아래') : true;
  findings.push({
    question: marketQuestions[0],
    answer: ctaLearning ? ctaLearning.finding : '데이터 없음',
    pass: ctaOk,
  });
  if (!ctaOk) blockers.push('CTA 클릭률 낮음');

  // 전환율
  const convLearning = learnings.find(l => l.category === 'conversion');
  const convOk = convLearning ? !convLearning.recommendation.includes('낮음') : true;
  findings.push({
    question: marketQuestions[1],
    answer: convLearning ? convLearning.finding : '데이터 없음',
    pass: convOk,
  });
  if (!convOk) blockers.push('전환율 낮음');

  // 이탈률
  const bounceLearning = learnings.find(l => l.category === 'bounce-rate');
  const bounceOk = bounceLearning ? !bounceLearning.recommendation.includes('높음') : true;
  findings.push({
    question: marketQuestions[2],
    answer: bounceLearning ? bounceLearning.finding : '데이터 없음',
    pass: bounceOk,
  });
  if (!bounceOk) blockers.push('이탈률 높음');

  // 검색
  const searchLearning = learnings.find(l => l.category === 'search-usage');
  const searchOk = searchLearning ? !searchLearning.recommendation.includes('잘 안 됨') : true;
  findings.push({
    question: marketQuestions[3],
    answer: searchLearning ? searchLearning.finding : '데이터 없음',
    pass: searchOk,
  });

  // 첫 화면
  findings.push({
    question: marketQuestions[4],
    answer: bounceOk ? '첫 화면 유지율 양호' : '첫 화면에서 이탈 다수',
    pass: bounceOk,
  });

  // NPS
  const npsLearning = learnings.find(l => l.category === 'satisfaction');
  const npsOk = npsLearning ? npsLearning.finding.includes('NPS:') && !npsLearning.recommendation.includes('음수') : true;
  findings.push({
    question: marketQuestions[5],
    answer: npsLearning ? npsLearning.finding : 'NPS 데이터 없음',
    pass: npsOk,
  });
  if (!npsOk) blockers.push('NPS 부진');

  // 브랜드 경험
  const retLearning = learnings.find(l => l.category === 'retention');
  const brandOk = retLearning ? !retLearning.recommendation.includes('낮음') : true;
  findings.push({
    question: marketQuestions[6],
    answer: brandOk ? '재방문율 양호 — 경험이 만족도로 이어짐' : '재방문율 낮음 — 경험 개선 필요',
    pass: brandOk,
  });

  const passed = findings.filter(f => f.pass).length;
  const marketScore = Math.round((passed / findings.length) * 100);
  const overallScore = Math.round(88 * 0.4 + marketScore * 0.6);

  return {
    productScore: 88,
    marketScore,
    overallScore,
    findings,
    blockers,
    approved: blockers.length === 0,
  };
}

// ============================================================
// REPORT
// ============================================================

export function printMarketReport(
  learnings: MarketLearning[],
  review: MarketDirectorReview,
): void {
  console.log();
  console.log('  ── Market Learnings ────────────────────────');
  for (const l of learnings) {
    const icon = l.impactLevel === 'high' ? '🔴' : l.impactLevel === 'medium' ? '🟡' : '🟢';
    console.log('  ' + icon + ' [' + l.category + '] ' + l.finding);
    console.log('     → ' + l.recommendation + ' (confidence: ' + l.confidence + '%)');
  }
  console.log();
  console.log('  ── Product Director AI 2.0 (Market) ───────');
  console.log('  Product Score:  ' + review.productScore + '/100');
  console.log('  Market Score:   ' + review.marketScore + '/100');
  console.log('  Overall Score:  ' + review.overallScore + '/100');
  console.log('  Approved:       ' + (review.approved ? '✅ YES' : '❌ NO'));
  console.log();
  for (const f of review.findings) {
    console.log('  ' + (f.pass ? '✅' : '🔴') + ' ' + f.question);
    console.log('     → ' + f.answer);
  }
  if (review.blockers.length > 0) {
    console.log();
    console.log('  ── Blockers ────────────────────────────────');
    for (const b of review.blockers) console.log('  🔴 ' + b);
  }
  console.log();
}
