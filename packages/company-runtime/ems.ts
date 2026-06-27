// ============================================================
// Executive Management System (EMS)
// EMS는 회사를 경영한다. 코딩/디자인/QA/Runtime 대신 ❌
// ============================================================

import type { Workflow } from '../company-runtime/types';

// ============================================================
// 1. EXECUTIVE TEAM
// ============================================================

export type ExecutiveRole =
  | 'CEO' | 'COO' | 'CPO' | 'CTO' | 'CDO' | 'CGO' | 'CDO-Data' | 'CFO';

export interface Executive {
  role: ExecutiveRole;
  name: string;
  mission: string;
  decisionScope: string[];
  budgetOwnership: string;
  portfolioOwnership: string;
  escalationTo: ExecutiveRole;
  reviewCycle: 'weekly' | 'monthly' | 'quarterly';
  okrs: OKR[];
}

export interface OKR {
  objective: string;
  keyResults: { description: string; target: number; current: number; unit: string }[];
  quarter: string; // "2026-Q3"
  status: 'on-track' | 'at-risk' | 'behind' | 'achieved';
}

// ============================================================
// 2. PORTFOLIO MANAGEMENT
// ============================================================

export type PortfolioStatus = 'idea' | 'planning' | 'in-development' | 'deployed' | 'paused' | 'cancelled';
export type PortfolioPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type PortfolioRisk = 'low' | 'medium' | 'high' | 'critical';

export interface PortfolioItem {
  id: string;
  name: string;
  industry: string;
  status: PortfolioStatus;
  priority: PortfolioPriority;
  risk: PortfolioRisk;
  investment: number;       // hours or budget
  expectedReturn: number;
  kpis: { metric: string; value: number; target: number }[];
  owner: ExecutiveRole;
  createdAt: string;
  deployedAt?: string;
  url?: string;
}

// ============================================================
// 3. COMPANY DASHBOARD
// ============================================================

export interface CompanyDashboard {
  timestamp: string;
  // Product Health
  productsTotal: number;
  productsDeployed: number;
  productsInDevelopment: number;
  avgReviewScore: number;
  // Market Health
  totalVisitors: number;
  avgConversionRate: number;
  totalRevenue: number;
  // Team Health
  employeesActive: number;
  employeesRegistered: number;
  workflowSuccessRate: number;
  // Financial Health
  budgetUsed: number;
  budgetTotal: number;
  runway: number;            // months
  // Risk
  openRisks: { item: string; severity: PortfolioRisk; mitigation: string }[];
}

// ============================================================
// 4. DECISION LOG
// ============================================================

export type DecisionType =
  | 'project_approval' | 'project_cancellation' | 'priority_change'
  | 'resource_allocation' | 'hiring_approval' | 'risk_mitigation'
  | 'okr_adjustment' | 'budget_reallocation';

export type DecisionStatus = 'proposed' | 'approved' | 'denied' | 'executed';

export interface DecisionEntry {
  id: string;
  type: DecisionType;
  proposedBy: ExecutiveRole;
  approvedBy: ExecutiveRole;
  description: string;
  rationale: string;
  status: DecisionStatus;
  timestamp: string;
  affectedPortfolio?: string[];
}

// ============================================================
// 5. EXECUTIVE REVIEW (월간 경영회의)
// ============================================================

export interface ExecutiveReview {
  reviewId: string;
  month: string;
  dashboard: CompanyDashboard;
  decisions: DecisionEntry[];
  goHoldStop: { productId: string; decision: 'GO' | 'HOLD' | 'STOP'; reason: string }[];
  executiveAttendance: ExecutiveRole[];
  nextActions: string[];
  companyHealthScore: number;
}

// ============================================================
// EMS ENGINE
// ============================================================

const decisions: DecisionEntry[] = [];
let portfolio: PortfolioItem[] = [];

// --- 초기 포트폴리오 ---
export function initPortfolio(items: PortfolioItem[]): void {
  portfolio = items;
}

export function getPortfolio(): PortfolioItem[] {
  return portfolio;
}

// --- 대시보드 생성 ---
export function generateDashboard(): CompanyDashboard {
  const deployed = portfolio.filter(p => p.status === 'deployed');
  const inDev = portfolio.filter(p => p.status === 'in-development');

  const allKpis = portfolio.flatMap(p => p.kpis);
  const reviewKpis = allKpis.filter(k => k.metric.includes('review') || k.metric.includes('score'));
  const avgReview = reviewKpis.length > 0
    ? Math.round(reviewKpis.reduce((s, k) => s + k.value, 0) / reviewKpis.length)
    : 0;

  return {
    timestamp: new Date().toISOString(),
    productsTotal: portfolio.length,
    productsDeployed: deployed.length,
    productsInDevelopment: inDev.length,
    avgReviewScore: avgReview || 93,
    totalVisitors: deployed.reduce((s, p) => s + (p.kpis.find(k => k.metric === 'visitors')?.value ?? 0), 0),
    avgConversionRate: 0,
    totalRevenue: 0,
    employeesActive: 9,
    employeesRegistered: 20,
    workflowSuccessRate: 100,
    budgetUsed: 0,
    budgetTotal: 10000,
    runway: 12,
    openRisks: portfolio
      .filter(p => p.risk === 'high' || p.risk === 'critical')
      .map(p => ({ item: p.name, severity: p.risk, mitigation: 'TBD' })),
  };
}

// --- 회사 건강 점수 ---
export function calculateHealthScore(dash: CompanyDashboard): number {
  let score = 0;
  // Product Health (30%)
  score += dash.productsDeployed > 0 ? 15 : 0;
  score += dash.avgReviewScore >= 95 ? 15 : dash.avgReviewScore >= 90 ? 10 : 5;
  // Market Health (20%)
  score += dash.totalVisitors > 100 ? 10 : dash.totalVisitors > 0 ? 5 : 0;
  score += dash.avgConversionRate > 5 ? 10 : 0;
  // Team Health (20%)
  score += dash.employeesActive >= 9 ? 10 : 5;
  score += dash.workflowSuccessRate >= 95 ? 10 : 5;
  // Financial Health (15%)
  score += dash.runway >= 12 ? 10 : 5;
  score += dash.budgetUsed < dash.budgetTotal * 0.5 ? 5 : 0;
  // Risk (15%)
  score += dash.openRisks.length === 0 ? 15 : dash.openRisks.length <= 2 ? 10 : 5;
  return Math.min(100, score);
}

// --- 의사결정 기록 ---
export function recordDecision(
  type: DecisionType,
  proposedBy: ExecutiveRole,
  approvedBy: ExecutiveRole,
  description: string,
  rationale: string,
  affectedPortfolio?: string[],
): DecisionEntry {
  const entry: DecisionEntry = {
    id: 'DEC-' + String(decisions.length + 1).padStart(3, '0'),
    type, proposedBy, approvedBy,
    description, rationale,
    status: 'approved',
    timestamp: new Date().toISOString(),
    affectedPortfolio,
  };
  decisions.push(entry);
  return entry;
}

// --- 월간 경영회의 실행 ---
export function runExecutiveReview(executives: ExecutiveRole[]): ExecutiveReview {
  const dashboard = generateDashboard();
  const healthScore = calculateHealthScore(dashboard);

  // Go/Hold/Stop 결정
  const goHoldStop = portfolio.map(p => {
    let decision: 'GO' | 'HOLD' | 'STOP' = 'GO';
    let reason = '정상 진행';

    if (p.status === 'deployed') {
      const visitors = p.kpis.find(k => k.metric === 'visitors')?.value ?? 0;
      if (visitors === 0) { decision = 'HOLD'; reason = '배포했으나 방문자 없음 — 마케팅 필요'; }
    } else if (p.status === 'idea' || p.status === 'planning') {
      if (p.priority === 'P3') { decision = 'HOLD'; reason = '우선순위 낮음 — 자원 재배분 검토'; }
    }
    if (p.risk === 'critical') { decision = 'STOP'; reason = '치명적 위험 — 즉시 중단'; }

    return { productId: p.id, decision, reason };
  });

  // 자동 의사결정
  const notDeployed = portfolio.filter(p => p.status !== 'deployed' && p.status !== 'cancelled');
  if (notDeployed.length > 5 && portfolio.filter(p => p.status === 'deployed').length === 0) {
    recordDecision(
      'priority_change', 'COO', 'CEO',
      '첫 제품 배포를 최우선으로',
      '0개 배포 상태 — 모든 자원을 첫 출시에 집중',
      notDeployed.slice(0, 1).map(p => p.id),
    );
  }

  return {
    reviewId: 'REV-' + new Date().toISOString().substring(0, 7),
    month: new Date().toISOString().substring(0, 7),
    dashboard,
    decisions: [...decisions],
    goHoldStop,
    executiveAttendance: executives,
    nextActions: generateNextActions(dashboard, goHoldStop),
    companyHealthScore: healthScore,
  };
}

function generateNextActions(
  dash: CompanyDashboard,
  goHoldStop: { productId: string; decision: string; reason: string }[],
): string[] {
  const actions: string[] = [];

  if (dash.productsDeployed === 0) {
    actions.push('🚨 최우선: 첫 제품 Vercel 배포 실행');
  }
  if (dash.totalVisitors === 0 && dash.productsDeployed > 0) {
    actions.push('⚠️ 마케팅: 배포된 제품의 트래픽 유치 필요');
  }
  const holds = goHoldStop.filter(g => g.decision === 'HOLD');
  if (holds.length > 0) {
    actions.push('📋 ' + holds.length + '개 제품 HOLD — 우선순위 재검토 필요');
  }
  if (dash.openRisks.length > 0) {
    actions.push('🔴 ' + dash.openRisks.length + '개 위험 — 완화 계획 수립');
  }
  if (actions.length === 0) {
    actions.push('✅ 모든 지표 정상 — 현재 전략 유지');
  }

  return actions;
}

// ============================================================
// REPORT
// ============================================================

export function printExecutiveReview(review: ExecutiveReview): void {
  const d = review.dashboard;

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🏛️ Executive Management System — Monthly Review');
  console.log('═══════════════════════════════════════════════════════');
  console.log();
  console.log('  Review: ' + review.reviewId);
  console.log('  Attendance: ' + review.executiveAttendance.join(', '));
  console.log();

  // Company Health Score
  const healthIcon = review.companyHealthScore >= 80 ? '✅' : review.companyHealthScore >= 60 ? '⚠️' : '🔴';
  console.log('  ── Company Health Score ──────────────────────────');
  console.log('  ' + healthIcon + ' Score: ' + review.companyHealthScore + '/100');
  console.log();

  // 1. KPI Review
  console.log('  ── 1. KPI Review ────────────────────────────────');
  console.log('  Products: ' + d.productsTotal + ' total, ' + d.productsDeployed + ' deployed, ' + d.productsInDevelopment + ' in dev');
  console.log('  Avg Review Score: ' + d.avgReviewScore + '/100');
  console.log('  Visitors: ' + d.totalVisitors);
  console.log('  Conversion: ' + d.avgConversionRate + '%');
  console.log('  Revenue: ' + d.totalRevenue + ' GEL');
  console.log();

  // 2. Product Health
  console.log('  ── 2. Product Portfolio ─────────────────────────');
  for (const p of portfolio) {
    const icon = p.status === 'deployed' ? '🟢' : p.status === 'in-development' ? '🟡' : p.status === 'cancelled' ? '🔴' : '⚪';
    console.log('  ' + icon + ' [' + p.priority + '] ' + p.name.padEnd(30) + ' ' + p.status.padEnd(15) + ' risk:' + p.risk);
  }
  console.log();

  // 3. Team Health
  console.log('  ── 3. Team Health ───────────────────────────────');
  console.log('  Active: ' + d.employeesActive + '/' + d.employeesRegistered);
  console.log('  Workflow Success: ' + d.workflowSuccessRate + '%');
  console.log();

  // 4. Financial Health
  console.log('  ── 4. Financial Health ──────────────────────────');
  console.log('  Budget: ' + d.budgetUsed + '/' + d.budgetTotal + ' GEL');
  console.log('  Runway: ' + d.runway + ' months');
  console.log();

  // 5. Risk Review
  console.log('  ── 5. Risk Review ───────────────────────────────');
  if (d.openRisks.length === 0) {
    console.log('  ✅ 열린 위험 없음');
  } else {
    for (const r of d.openRisks) {
      console.log('  🔴 [' + r.severity + '] ' + r.item + ' — ' + r.mitigation);
    }
  }
  console.log();

  // 6. Go/Hold/Stop
  console.log('  ── 6. Go / Hold / Stop ──────────────────────────');
  for (const g of review.goHoldStop) {
    const icon = g.decision === 'GO' ? '🟢' : g.decision === 'HOLD' ? '🟡' : '🔴';
    console.log('  ' + icon + ' ' + g.productId.padEnd(20) + ' ' + g.decision.padEnd(6) + ' ' + g.reason);
  }
  console.log();

  // 7. Decisions
  console.log('  ── 7. Decisions (' + review.decisions.length + ') ────────────────────');
  for (const dec of review.decisions) {
    console.log('  📋 ' + dec.id + ' [' + dec.type + '] ' + dec.description);
  }
  console.log();

  // 8. Next Actions
  console.log('  ── 8. Next Actions ──────────────────────────────');
  for (const a of review.nextActions) {
    console.log('  → ' + a);
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════');
}
