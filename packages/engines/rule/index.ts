// @aibg/engine-rule — Rule Engine
// 헌법: "Everything is Metadata", "Configuration over Customization"
// 비즈니스 규칙을 메타데이터로 정의 → 코드 없이 규칙 관리.

export type {
  BusinessRule, RuleType, RuleCondition, ConditionOperator,
  TimeCheck, DayCheck, RuleResult, RuleResultAction,
} from './schema';
export {
  businessHoursRule, minOrderRule, lunchDiscountRule,
  maxPartySizeRule, lateNightSurchargeRule, defaultRules,
} from './schema';
export {
  evaluateRule, evaluateAllRules, calculatePrice,
} from './evaluator';
export type { RuleEvaluationResult } from './evaluator';
