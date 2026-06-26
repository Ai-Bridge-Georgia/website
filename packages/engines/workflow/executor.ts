// ============================================================
// Workflow Engine — Executor
// 헌법: "Everything is an Engine", "Event First"
// 이벤트 수신 → 조건 검사 → 상태 전이 → 액션 실행
// ============================================================

import type {
  WorkflowSchema, WorkflowContext, WorkflowTransition,
  WorkflowCondition, WorkflowAction, TransitionResult,
} from './schema';

// --- 조건 검사 ---
function checkCondition(
  cond: WorkflowCondition,
  data: Record<string, unknown>,
): { passed: boolean; message?: string } {
  const val = data[cond.field];
  const target = cond.value;

  let passed = false;
  switch (cond.operator) {
    case 'eq': passed = val === target; break;
    case 'neq': passed = val !== target; break;
    case 'gt': passed = Number(val) > Number(target); break;
    case 'lt': passed = Number(val) < Number(target); break;
    case 'gte': passed = Number(val) >= Number(target); break;
    case 'lte': passed = Number(val) <= Number(target); break;
    case 'in': passed = Array.isArray(target) && target.includes(val); break;
    case 'contains':
      passed = Array.isArray(val) ? val.includes(target) : String(val).includes(String(target));
      break;
  }

  return { passed, message: passed ? undefined : (cond.message ?? '조건을 만족하지 않습니다') };
}

// --- 액션 실행 ---
async function executeAction(
  action: WorkflowAction,
  ctx: WorkflowContext,
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (action.type) {
      case 'send_notification':
        // Notification Engine 연동
        // 실제 구현: import { processEvent } from '@aibg/engine-notification'
        console.log(`[Workflow] Notification: ${action.rule} for ${ctx.entityId}`);
        return { success: true };

      case 'emit_event':
        // Event Bus 연동
        // 실제 구현: Supabase events 테이블 INSERT
        console.log(`[Workflow] Event: ${action.eventType} for ${ctx.entityId}`);
        return { success: true };

      case 'update_field':
        // 엔티티 필드 업데이트
        console.log(`[Workflow] Update: ${action.field} = ${action.value}`);
        return { success: true };

      case 'webhook':
        // 외부 webhook 호출
        console.log(`[Workflow] Webhook: ${action.url}`);
        return { success: true };

      case 'delay':
        // 지연 (스케줄러 연동 — Phase 2)
        console.log(`[Workflow] Delay: ${action.duration}`);
        return { success: true };

      case 'custom':
        // 커스텀 핸들러 (DI)
        console.log(`[Workflow] Custom: ${action.handler}`);
        return { success: true };

      default:
        return { success: false, error: '알 수 없는 액션 타입' };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '액션 실행 실패',
    };
  }
}

// --- 전이 실행 ---
export async function executeTransition(
  workflow: WorkflowSchema,
  ctx: WorkflowContext,
  event: string,
): Promise<TransitionResult> {
  const emptyResult: TransitionResult = {
    success: false,
    fromState: ctx.currentState,
    toState: ctx.currentState,
    actions: [],
    error: '전이를 찾을 수 없습니다',
  };

  // 매칭되는 전이 찾기
  const transition = workflow.transitions.find(
    (t) => t.from === ctx.currentState && t.event === event,
  );

  if (!transition) {
    return {
      ...emptyResult,
      error: `상태 '${ctx.currentState}'에서 이벤트 '${event}'에 대한 전이가 없습니다`,
    };
  }

  // 권한 확인
  if (transition.roleRequired && ctx.userRole) {
    const roleLevel = { customer: 0, staff: 10, owner: 50, admin: 100 };
    const requiredLevel = roleLevel[transition.roleRequired as keyof typeof roleLevel] ?? 0;
    const userLevel = roleLevel[ctx.userRole as keyof typeof roleLevel] ?? 0;
    if (userLevel < requiredLevel) {
      return {
        ...emptyResult,
        error: `권한이 부족합니다 (필요: ${transition.roleRequired})`,
      };
    }
  }

  // 조건 검사
  if (transition.conditions) {
    for (const cond of transition.conditions) {
      const result = checkCondition(cond, ctx.data);
      if (!result.passed) {
        return {
          ...emptyResult,
          error: result.message ?? '조건 불만족',
        };
      }
    }
  }

  // 전이 실행
  const actions: TransitionResult['actions'] = [];

  // before 액션
  if (transition.before) {
    for (const action of transition.before) {
      const result = await executeAction(action, ctx);
      actions.push({ type: action.type, success: result.success, error: result.error });
    }
  }

  // 상태 변경
  const targetState = workflow.states.find((s) => s.name === transition.to);
  if (!targetState) {
    return {
      ...emptyResult,
      error: `대상 상태 '${transition.to}'를 찾을 수 없습니다`,
    };
  }

  // 현재 상태 onExit
  const currentState = workflow.states.find((s) => s.name === ctx.currentState);
  if (currentState?.onExit) {
    for (const action of currentState.onExit) {
      const result = await executeAction(action, ctx);
      actions.push({ type: action.type, success: result.success, error: result.error });
    }
  }

  // 새 상태 onEnter
  if (targetState.onEnter) {
    for (const action of targetState.onEnter) {
      const result = await executeAction(action, ctx);
      actions.push({ type: action.type, success: result.success, error: result.error });
    }
  }

  // after 액션
  if (transition.after) {
    for (const action of transition.after) {
      const result = await executeAction(action, ctx);
      actions.push({ type: action.type, success: result.success, error: result.error });
    }
  }

  return {
    success: true,
    fromState: ctx.currentState,
    toState: transition.to,
    actions,
  };
}

// --- 가능한 전이 조회 (UI용: "다음 액션" 버튼 표시) ---
export function getAvailableTransitions(
  workflow: WorkflowSchema,
  currentState: string,
  userRole?: string,
): WorkflowTransition[] {
  return workflow.transitions.filter((t) => {
    if (t.from !== currentState) return false;

    // 권한 필터
    if (t.roleRequired && userRole) {
      const roleLevel = { customer: 0, staff: 10, owner: 50, admin: 100 };
      const required = roleLevel[t.roleRequired as keyof typeof roleLevel] ?? 0;
      const user = roleLevel[userRole as keyof typeof roleLevel] ?? 0;
      if (user < required) return false;
    }

    return true;
  });
}

// --- 상태 조회 ---
export function getStateInfo(
  workflow: WorkflowSchema,
  stateName: string,
) {
  return workflow.states.find((s) => s.name === stateName);
}
