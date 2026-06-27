// ============================================================
// Workflow Engine — 제품 출시/버그수정/기능추가 워크플로우 실행
// Runtime의 핵심: Task를 순서대로 실행하고 Handoff를 기록한다
// ============================================================

import type {
  Workflow, WorkflowStep, Task, TaskOutput, TaskInput,
  Role, WorkflowType, AuditEntry, HandoffRecord,
  RuntimeConfig, WorkflowStatus,
} from './types';
import { dispatchToEmployee } from './dispatcher';

// --- 기본 설정 ---
const DEFAULT_CONFIG: RuntimeConfig = {
  defaultTimeoutMs: 60_000,
  defaultMaxRetries: 2,
  retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
  escalationPolicy: { onTimeout: 'COO', onFailure: 'COO', onBlocked: 'COO' },
};

// --- 워크플로우 정의 ---
const workflowTemplates: Record<WorkflowType, WorkflowStep[]> = {
  'product-launch': [
    { index: 0, name: 'CEO 승인', role: 'CEO', action: 'approve_project',
      dependsOn: [], approvalRequired: 'CEO', timeoutMs: 30_000, maxRetries: 0 },
    { index: 1, name: 'COO 분해', role: 'COO', action: 'decompose_project',
      dependsOn: [0], timeoutMs: 10_000, maxRetries: 1 },
    { index: 2, name: 'CPO 제품 정의', role: 'CPO', action: 'define_product',
      dependsOn: [1], timeoutMs: 30_000, maxRetries: 1 },
    { index: 3, name: 'CDO 브랜드 정의', role: 'CDO', action: 'define_brand',
      dependsOn: [2], timeoutMs: 30_000, maxRetries: 1 },
    { index: 4, name: 'CTO-Eng 코드 생성', role: 'CTO-Eng', action: 'generate_code',
      dependsOn: [3], timeoutMs: 120_000, maxRetries: 2 },
    { index: 5, name: 'QA 품질 평가', role: 'QA', action: 'review_quality',
      dependsOn: [4], timeoutMs: 60_000, maxRetries: 1 },
    { index: 6, name: 'DevOps 배포', role: 'DevOps', action: 'deploy',
      dependsOn: [5], timeoutMs: 120_000, maxRetries: 2 },
    { index: 7, name: 'Data KPI 수집', role: 'Data', action: 'collect_kpi',
      dependsOn: [6], timeoutMs: 10_000, maxRetries: 0 },
    { index: 8, name: 'Knowledge 학습', role: 'Knowledge', action: 'capture_learning',
      dependsOn: [7], timeoutMs: 10_000, maxRetries: 0 },
  ],
  'bug-fix': [
    { index: 0, name: 'QA 이슈 감지', role: 'QA', action: 'detect_bug',
      dependsOn: [], timeoutMs: 30_000, maxRetries: 1 },
    { index: 1, name: 'CTO-Eng 수정', role: 'CTO-Eng', action: 'fix_bug',
      dependsOn: [0], timeoutMs: 60_000, maxRetries: 2 },
    { index: 2, name: 'QA 재검증', role: 'QA', action: 're_verify',
      dependsOn: [1], timeoutMs: 30_000, maxRetries: 1 },
    { index: 3, name: 'DevOps 배포', role: 'DevOps', action: 'deploy_hotfix',
      dependsOn: [2], timeoutMs: 60_000, maxRetries: 2 },
  ],
  'feature-add': [
    { index: 0, name: 'CPO 스펙', role: 'CPO', action: 'write_spec',
      dependsOn: [], timeoutMs: 30_000, maxRetries: 1 },
    { index: 1, name: 'CDO 디자인', role: 'CDO', action: 'design_feature',
      dependsOn: [0], timeoutMs: 30_000, maxRetries: 1 },
    { index: 2, name: 'CTO-Eng 구현', role: 'CTO-Eng', action: 'implement_feature',
      dependsOn: [1], timeoutMs: 120_000, maxRetries: 2 },
    { index: 3, name: 'QA 검증', role: 'QA', action: 'review_feature',
      dependsOn: [2], timeoutMs: 60_000, maxRetries: 1 },
    { index: 4, name: 'DevOps 배포', role: 'DevOps', action: 'deploy_feature',
      dependsOn: [3], timeoutMs: 120_000, maxRetries: 2 },
  ],
  'design-review': [
    { index: 0, name: 'CDO 리뷰', role: 'CDO', action: 'review_design',
      dependsOn: [], timeoutMs: 30_000, maxRetries: 1 },
    { index: 1, name: 'QA 점수', role: 'QA', action: 'score_design',
      dependsOn: [0], timeoutMs: 30_000, maxRetries: 1 },
  ],
  'market-analysis': [
    { index: 0, name: 'Data 수집', role: 'Data', action: 'collect_market_data',
      dependsOn: [], timeoutMs: 30_000, maxRetries: 1 },
    { index: 1, name: 'Research 분석', role: 'Research', action: 'analyze_market',
      dependsOn: [0], timeoutMs: 30_000, maxRetries: 1 },
    { index: 2, name: 'Knowledge 기록', role: 'Knowledge', action: 'store_insight',
      dependsOn: [1], timeoutMs: 10_000, maxRetries: 0 },
  ],
};

// --- 워크플로우 생성 ---
export function createWorkflow(
  project: string,
  type: WorkflowType,
): Workflow {
  const steps = workflowTemplates[type] ?? [];
  const id = 'wf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

  return {
    id, project, type, status: 'created',
    steps, currentStep: 0,
    createdAt: new Date().toISOString(),
    auditLog: [],
    handoffs: [],
  };
}

// --- 감사 로그 추가 ---
function audit(wf: Workflow, event: AuditEntry['event'], detail: string, role?: Role, taskId?: string): void {
  wf.auditLog.push({
    timestamp: new Date().toISOString(),
    event, detail, role, taskId,
  });
}

// --- 핸드오프 기록 ---
function recordHandoff(wf: Workflow, from: Role, to: Role, artifact: string, taskId: string): void {
  wf.handoffs.push({
    timestamp: new Date().toISOString(),
    from, to, artifact, taskId,
  });
}

// --- 단일 스텝 실행 ---
async function executeStep(
  wf: Workflow,
  step: WorkflowStep,
  config: RuntimeConfig,
  context: Record<string, unknown>,
): Promise<TaskOutput> {
  const taskId = 'task-' + wf.id + '-' + step.index;
  const fromRole: Role = step.index === 0 ? 'CEO' : (wf.steps[step.index - 1]?.role ?? 'COO');

  const taskInput: TaskInput = {
    from: fromRole,
    artifact: step.name,
    data: { ...context, project: wf.project, action: step.action },
  };

  audit(wf, 'task_dispatched', 'Dispatching to ' + step.role, step.role, taskId);

  let attempt = 0;
  const maxAttempts = step.maxRetries + 1;
  let lastOutput: TaskOutput | null = null;

  while (attempt < maxAttempts) {
    try {
      // 타임아웃 래퍼
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), step.timeoutMs),
      );

      const output = await Promise.race([
        dispatchToEmployee(step.role, taskInput),
        timeoutPromise,
      ]);

      lastOutput = output;

      if (output.success) {
        audit(wf, 'task_completed', step.role + ' completed: ' + output.artifact, step.role, taskId);
        recordHandoff(wf, step.role, wf.steps[step.index + 1]?.role ?? 'COO', output.artifact, taskId);
        return output;
      }

      // 실패 — 재시도 가능?
      if (attempt < maxAttempts - 1 && output.nextDecision === 'retry') {
        attempt++;
        audit(wf, 'task_retried', step.role + ' retry ' + attempt + '/' + step.maxRetries, step.role, taskId);
        const backoff = config.retryPolicy.backoffMs * Math.pow(config.retryPolicy.backoffMultiplier, attempt - 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      // 재시도 불가 — 에스컬레이션
      audit(wf, 'escalation', step.role + ' failed — escalate to ' + config.escalationPolicy.onFailure, step.role, taskId);
      return output;

    } catch (error: any) {
      attempt++;
      if (attempt < maxAttempts) {
        audit(wf, 'task_timeout', step.role + ' timeout — retry ' + attempt, step.role, taskId);
        const backoff = config.retryPolicy.backoffMs * Math.pow(config.retryPolicy.backoffMultiplier, attempt - 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      audit(wf, 'task_timeout', step.role + ' timeout — no more retries', step.role, taskId);
      lastOutput = {
        success: false,
        artifact: 'timeout',
        data: { error: error.message, role: step.role },
        nextDecision: 'escalate',
      };
    }
  }

  return lastOutput ?? {
    success: false,
    artifact: 'unknown_failure',
    data: {},
    nextDecision: 'escalate',
  };
}

// --- 워크플로우 실행 ---
export async function runWorkflow(
  wf: Workflow,
  config: RuntimeConfig = DEFAULT_CONFIG,
  initialContext: Record<string, unknown> = {},
): Promise<Workflow> {
  wf.status = 'running';
  wf.startedAt = new Date().toISOString();
  audit(wf, 'workflow_created', 'Workflow ' + wf.type + ' for ' + wf.project);

  const context = { ...initialContext };

  for (let i = 0; i < wf.steps.length; i++) {
    const step = wf.steps[i];
    wf.currentStep = i;

    // 의존성 확인
    for (const dep of step.dependsOn) {
      const depStep = wf.steps[dep];
      if (!context['step_' + dep + '_success']) {
        audit(wf, 'workflow_failed', 'Dependency step ' + dep + ' (' + depStep.name + ') not satisfied');
        wf.status = 'failed';
        wf.completedAt = new Date().toISOString();
        return wf;
      }
    }

    // 승인 필요?
    if (step.approvalRequired && step.approvalRequired === 'CEO') {
      audit(wf, 'approval_requested', 'Requesting CEO approval for ' + step.name);
      // CEO가 등록되어 있으면 자동 실행
      // 아니면 paused 상태로 대기
    }

    // 스텝 실행
    const output = await executeStep(wf, step, config, context);

    // 결과를 컨텍스트에 저장
    context['step_' + i] = output;
    context['step_' + i + '_success'] = output.success;
    context['lastArtifact'] = output.artifact;
    context['lastRole'] = step.role;

    // 실패 처리
    if (!output.success) {
      if (output.nextDecision === 'escalate') {
        wf.status = 'failed';
        audit(wf, 'workflow_failed', step.role + ' escalated — stopping');
        wf.completedAt = new Date().toISOString();
        return wf;
      }
      // 다른 실패도 중단
      wf.status = 'failed';
      audit(wf, 'workflow_failed', step.role + ' failed: ' + (output.data.error ?? 'unknown'));
      wf.completedAt = new Date().toISOString();
      return wf;
    }

    // QA 특수 처리: PASS 아니면 중단
    if (step.role === 'QA') {
      const gatePassed = output.metrics?.productionGate === 1 || output.data?.productionGate === 'PASS';
      if (!gatePassed) {
        wf.status = 'failed';
        audit(wf, 'workflow_failed', 'QA Production Gate: FAIL — deployment blocked');
        wf.completedAt = new Date().toISOString();
        return wf;
      }
    }
  }

  wf.status = 'completed';
  wf.completedAt = new Date().toISOString();
  audit(wf, 'workflow_completed', 'Workflow completed successfully');
  return wf;
}

// --- 워크플로우 리포트 ---
export function printWorkflowReport(wf: Workflow): void {
  console.log('');
  console.log('=======================================================');
  console.log('  🏭 Company Runtime — Workflow Report');
  console.log('=======================================================');
  console.log();
  console.log('  Workflow: ' + wf.id);
  console.log('  Project:  ' + wf.project);
  console.log('  Type:     ' + wf.type);
  console.log('  Status:   ' + getStatusIcon(wf.status) + ' ' + wf.status.toUpperCase());
  console.log('  Steps:    ' + (wf.currentStep + 1) + '/' + wf.steps.length);
  console.log();

  // Audit Log
  console.log('  ── Audit Log (' + wf.auditLog.length + ' events) ──────────');
  for (const entry of wf.auditLog) {
    const time = entry.timestamp.substring(11, 19);
    console.log('  ' + time + ' ' + entry.event.padEnd(22) + ' ' + entry.detail.substring(0, 70));
  }

  // Handoffs
  console.log();
  console.log('  ── Handoffs (' + wf.handoffs.length + ') ──────────────────');
  for (const h of wf.handoffs) {
    console.log('  ' + h.from.padEnd(10) + ' → ' + h.to.padEnd(10) + ' ' + h.artifact.substring(0, 50));
  }

  console.log();
  console.log('=======================================================');
}

function getStatusIcon(status: WorkflowStatus): string {
  switch (status) {
    case 'completed': return '✅';
    case 'running': return '🔄';
    case 'paused': return '⏸️';
    case 'failed': return '🔴';
    case 'aborted': return '⛔';
    default: return '📋';
  }
}
