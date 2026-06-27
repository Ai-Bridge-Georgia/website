// ============================================================
// Company Runtime — Types
// Runtime은 직원을 대신하지 않는다. 오케스트레이션만 한다.
// ============================================================

// --- Employee Role ---
export type Role =
  | 'CEO' | 'COO' | 'CPO' | 'CDO' | 'CTO-Eng'
  | 'PM' | 'Designer' | 'Frontend' | 'Backend'
  | 'QA' | 'DevOps' | 'Data' | 'Marketing' | 'Sales'
  | 'Knowledge' | 'Research' | 'Finance' | 'Legal' | 'HR' | 'CS';

// --- Task Status ---
export type TaskStatus =
  | 'pending'      // 대기 중
  | 'dispatched'   // 직원에게 전달됨
  | 'running'      // 직원이 작업 중
  | 'completed'    // 완료
  | 'failed'       // 실패
  | 'timeout'      // 시간 초과
  | 'blocked';     // 승인 대기

// --- Task ---
export interface Task {
  id: string;
  workflowId: string;
  stepIndex: number;
  role: Role;
  action: string;
  input: TaskInput;
  output?: TaskOutput;
  status: TaskStatus;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
  blocked?: string;  // 차단 이유
}

// --- Task Input ---
export interface TaskInput {
  from: Role;
  artifact: string;
  data: Record<string, unknown>;
}

// --- Task Output ---
export interface TaskOutput {
  success: boolean;
  artifact: string;
  data: Record<string, unknown>;
  metrics?: Record<string, number | string>;
  nextDecision?: 'continue' | 'block' | 'retry' | 'escalate';
}

// --- Workflow Status ---
export type WorkflowStatus =
  | 'created'
  | 'running'
  | 'paused'      // 승인 대기
  | 'completed'
  | 'failed'
  | 'aborted';

// --- Workflow ---
export interface Workflow {
  id: string;
  project: string;
  type: WorkflowType;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStep: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  auditLog: AuditEntry[];
  handoffs: HandoffRecord[];
}

// --- Workflow Type ---
export type WorkflowType =
  | 'product-launch'
  | 'bug-fix'
  | 'feature-add'
  | 'design-review'
  | 'market-analysis';

// --- Workflow Step ---
export interface WorkflowStep {
  index: number;
  name: string;
  role: Role;
  action: string;
  dependsOn: number[];     // 이전 단계 인덱스
  approvalRequired?: Role; // 승인이 필요한 경우
  timeoutMs: number;
  maxRetries: number;
}

// --- Audit Entry ---
export interface AuditEntry {
  timestamp: string;
  event: AuditEventType;
  taskId?: string;
  role?: Role;
  detail: string;
}

// --- Audit Event Type ---
export type AuditEventType =
  | 'workflow_created'
  | 'task_dispatched'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'task_timeout'
  | 'task_retried'
  | 'handoff'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied'
  | 'workflow_paused'
  | 'workflow_resumed'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'escalation'
  | 'recovery_attempted';

// --- Handoff Record ---
export interface HandoffRecord {
  timestamp: string;
  from: Role;
  to: Role;
  artifact: string;
  taskId: string;
}

// --- Employee Handler (각 직원이 구현) ---
export type EmployeeHandler = (input: TaskInput) => Promise<TaskOutput>;

// --- Retry Policy ---
export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;     // 재시도 간격
  backoffMultiplier: number;
}

// --- Escalation Policy ---
export interface EscalationPolicy {
  onTimeout: Role;       // 시간 초과 시 에스컬레이션 대상
  onFailure: Role;       // 실패 시 에스컬레이션 대상
  onBlocked: Role;       // 차단 시 에스컬레이션 대상
}

// --- Runtime Config ---
export interface RuntimeConfig {
  defaultTimeoutMs: number;
  defaultMaxRetries: number;
  retryPolicy: RetryPolicy;
  escalationPolicy: EscalationPolicy;
}
