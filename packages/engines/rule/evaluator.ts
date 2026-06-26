// ============================================================
// Rule Engine — Evaluator
// 헌법: "Everything is an Engine", "Everything is Metadata"
// 데이터 → 규칙 매칭 → 결과 (통과/거부/할인/할증)
// ============================================================

import type {
  BusinessRule, RuleCondition, ConditionOperator,
  TimeCheck, DayCheck, RuleResult, RuleResultAction,
} from './schema';

// --- 현재 시간 가져오기 ---
function getCurrentTime(dynamic?: string, context?: Record<string, unknown>): Date {
  if (dynamic === 'order_time' && context?.['order_time']) {
    return new Date(String(context['order_time']));
  }
  if (dynamic === 'reservation_time' && context?.['reservation_time']) {
    return new Date(String(context['reservation_time']));
  }
  return new Date(); // 'now'
}

// --- 시간 비교 헬퍼 ---
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// --- 시간 체크 ---
function checkTime(check: TimeCheck, context?: Record<string, unknown>): boolean {
  const now = getCurrentTime(check.dynamic, context);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const startMin = check.startTime ? timeToMinutes(check.startTime) : 0;
  const endMin = check.endTime ? timeToMinutes(check.endTime) : 1440;
  const compareMin = check.compareTime ? timeToMinutes(check.compareTime) : 0;

  switch (check.type) {
    case 'within_range': return nowMin >= startMin && nowMin <= endMin;
    case 'outside_range': return nowMin < startMin || nowMin > endMin;
    case 'before': return nowMin < compareMin;
    case 'after': return nowMin > compareMin;
    default: return true;
  }
}

// --- 요일 체크 ---
function checkDay(check: DayCheck): boolean {
  const today = new Date().getDay(); // 0=일 ~ 6=토
  const isInDay = check.days.includes(today);
  return check.type === 'is' ? isInDay : !isInDay;
}

// --- 조건 연산자 평가 ---
function evaluateOperator(
  fieldValue: unknown,
  operator: ConditionOperator,
  target: unknown,
): boolean {
  switch (operator) {
    case 'eq': return fieldValue === target;
    case 'neq': return fieldValue !== target;
    case 'gt': return Number(fieldValue) > Number(target);
    case 'lt': return Number(fieldValue) < Number(target);
    case 'gte': return Number(fieldValue) >= Number(target);
    case 'lte': return Number(fieldValue) <= Number(target);
    case 'in': return Array.isArray(target) && target.includes(fieldValue);
    case 'not_in': return Array.isArray(target) && !target.includes(fieldValue);
    case 'contains':
      return Array.isArray(fieldValue)
        ? fieldValue.includes(target)
        : String(fieldValue).includes(String(target));
    case 'starts_with': return String(fieldValue).startsWith(String(target));
    case 'ends_with': return String(fieldValue).endsWith(String(target));
    case 'between': {
      if (Array.isArray(target) && target.length === 2) {
        const num = Number(fieldValue);
        return num >= Number(target[0]) && num <= Number(target[1]);
      }
      return false;
    }
    default: return false;
  }
}

// --- 단일 조건 평가 ---
function evaluateCondition(
  condition: RuleCondition,
  data: Record<string, unknown>,
): boolean {
  // 논리 조합
  if (condition.all) {
    return condition.all.every((c) => evaluateCondition(c, data));
  }
  if (condition.any) {
    return condition.any.some((c) => evaluateCondition(c, data));
  }
  if (condition.not) {
    return !evaluateCondition(condition.not, data);
  }

  // 시간 체크
  if (condition.timeCheck) {
    return checkTime(condition.timeCheck, data);
  }

  // 요일 체크
  if (condition.dayCheck) {
    return checkDay(condition.dayCheck);
  }

  // 필드 비교
  if (condition.field && condition.operator) {
    const fieldValue = data[condition.field];
    return evaluateOperator(fieldValue, condition.operator, condition.value);
  }

  return true; // 조건이 없으면 통과
}

// --- 규칙 평가 ---
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  result: RuleResult;
  appliedActions: RuleResultAction[];
}

// --- 단일 규칙 평가 ---
export function evaluateRule(
  rule: BusinessRule,
  data: Record<string, unknown>,
): RuleEvaluationResult {
  // 비활성 규칙은 통과
  if (!rule.enabled) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: true,
      result: { pass: true },
      appliedActions: [],
    };
  }

  // 모든 조건이 만족하는지
  const conditionsMet = rule.conditions.every((c) => evaluateCondition(c, data));

  // 조건이 만족하면 result 발동
  if (conditionsMet) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: rule.result.pass,
      result: rule.result,
      appliedActions: rule.result.actions ?? [],
    };
  }

  // 조건이 만족하지 않으면 규칙 미발동 (통과)
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    passed: true,
    result: { pass: true },
    appliedActions: [],
  };
}

// --- 모든 규칙 평가 (우선순위 순) ---
export function evaluateAllRules(
  rules: BusinessRule[],
  data: Record<string, unknown>,
): {
  allPassed: boolean;
  blockers: RuleEvaluationResult[];
  discounts: RuleResultAction[];
  surcharges: RuleResultAction[];
  results: RuleEvaluationResult[];
} {
  // 우선순위 높은 순 정렬
  const sorted = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const results = sorted.map((rule) => evaluateRule(rule, data));

  const blockers = results.filter((r) => !r.passed);

  const discounts: RuleResultAction[] = [];
  const surcharges: RuleResultAction[] = [];

  for (const r of results) {
    for (const action of r.appliedActions) {
      if (action.type === 'apply_discount') discounts.push(action);
      if (action.type === 'add_surcharge') surcharges.push(action);
    }
  }

  return {
    allPassed: blockers.length === 0,
    blockers,
    discounts,
    surcharges,
    results,
  };
}

// --- 최종 가격 계산 ---
export function calculatePrice(
  basePrice: number,
  discounts: RuleResultAction[],
  surcharges: RuleResultAction[],
): { finalPrice: number; breakdown: string[] } {
  let price = basePrice;
  const breakdown: string[] = [`기본 금액: ${basePrice}`];

  for (const d of discounts) {
    if (d.discountType === 'percent') {
      const amount = Math.round(price * (d.discountValue ?? 0) / 100);
      price -= amount;
      breakdown.push(`${d.label ?? '할인'}: -${amount}`);
    } else if (d.discountType === 'fixed') {
      price -= d.discountValue ?? 0;
      breakdown.push(`${d.label ?? '할인'}: -${d.discountValue}`);
    }
  }

  for (const s of surcharges) {
    if (s.discountType === 'percent') {
      const amount = Math.round(price * (s.discountValue ?? 0) / 100);
      price += amount;
      breakdown.push(`${s.label ?? '할증'}: +${amount}`);
    } else if (s.discountType === 'fixed') {
      price += s.discountValue ?? 0;
      breakdown.push(`${s.label ?? '할증'}: +${s.discountValue}`);
    }
  }

  return { finalPrice: Math.max(0, price), breakdown };
}
