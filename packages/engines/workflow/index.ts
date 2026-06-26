// @aibg/engine-workflow — Workflow Engine
// 헌법: "Everything is an Engine", "Configuration over Customization"
// 상태 머신을 메타데이터로 정의 → 코드 없이 워크플로우 구축.

export type {
  WorkflowSchema, WorkflowState, WorkflowTransition,
  WorkflowCondition, WorkflowAction, WorkflowContext, TransitionResult,
} from './schema';
export { reservationWorkflow, orderWorkflow } from './schema';
export {
  executeTransition, getAvailableTransitions, getStateInfo,
} from './executor';
