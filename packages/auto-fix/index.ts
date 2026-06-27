// @aibg/auto-fix — Self-Healing Auto Fix Pipeline

export { detectStaticIssues, parseBuildErrors, parseWebErrors, parseAndroidErrors, parseIOSErrors } from './error-parser';
export type { ParsedError, Platform, ErrorCategory, FixAction } from './error-parser';

export { runAutoFix, recordFixes, getRecurringFixes, printAutoFixReport } from './pipeline';
export type { ConfidenceDecision, RegressionResult, AutoFixResult } from './pipeline';

// Re-export from fix-engine
export { generateFixes, applyFixes } from './fix-engine';
export type { FixSuggestion, ApplyResult } from './fix-engine';
