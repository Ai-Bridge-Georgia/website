// ============================================================
// Employee Dispatcher — Runtime이 직원을 깨운다
// 직원은 EmployeeHandler로 등록된다. Runtime은 호출만 한다.
// ============================================================

import type { Role, EmployeeHandler, TaskInput, TaskOutput } from './types';

// --- Employee Registry ---
const employees = new Map<Role, EmployeeHandler>();

// --- 직원 등록 ---
export function registerEmployee(role: Role, handler: EmployeeHandler): void {
  if (employees.has(role)) {
    throw new Error('Employee already registered: ' + role);
  }
  employees.set(role, handler);
}

// --- 직원 등록 해제 ---
export function unregisterEmployee(role: Role): void {
  employees.delete(role);
}

// --- 직원 호출 ---
export async function dispatchToEmployee(
  role: Role,
  input: TaskInput,
): Promise<TaskOutput> {
  const handler = employees.get(role);

  if (!handler) {
    return {
      success: false,
      artifact: 'error',
      data: { error: 'Employee not registered: ' + role },
      nextDecision: 'escalate',
    };
  }

  try {
    const output = await handler(input);
    return output;
  } catch (error: any) {
    return {
      success: false,
      artifact: 'error',
      data: { error: error.message, role },
      nextDecision: 'retry',
    };
  }
}

// --- 등록된 직원 목록 ---
export function getRegisteredEmployees(): Role[] {
  return Array.from(employees.keys());
}

// --- 직원 등록 여부 ---
export function isEmployeeRegistered(role: Role): boolean {
  return employees.has(role);
}
