// ============================================================
// Scheduling Engine — Schema + Executor
// 헌법: "Everything is an Engine", "Configuration over Customization"
// 반복 작업/예약 실행/자동화를 메타데이터로 정의
// ============================================================

// --- Schedule Type ---
export type ScheduleType = 'once' | 'recurring' | 'cron';

// --- Recurrence Pattern ---
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'hourly' | 'custom';

// --- Schedule Definition ---
export interface ScheduleDefinition {
  id: string;
  name: string;
  type: ScheduleType;
  enabled: boolean;
  // 실행 시점
  schedule: {
    // once: 특정 시간
    runAt?: string;                // ISO datetime
    // recurring: 반복 패턴
    pattern?: RecurrencePattern;
    interval?: number;             // 매 N시간/일/주/월
    time?: string;                 // '09:00' (daily/weekly/monthly)
    dayOfWeek?: number;            // 0-6 (weekly)
    dayOfMonth?: number;           // 1-31 (monthly)
    // cron: 크론 표현식
    cronExpression?: string;       // '0 9 * * *' (매일 9시)
  };
  // 실행할 작업
  task: ScheduleTask;
  // 타임존
  timezone?: string;               // 'Asia/Seoul' (기본)
  // 메타데이터
  tenantId?: string;
  createdBy?: string;
  createdAt?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount?: number;
}

// --- Schedule Task ---
export interface ScheduleTask {
  handler: string;                 // 'send_daily_report' | 'sync_inventory'
  params?: Record<string, unknown>;
  // 실패 시
  retryCount?: number;             // 기본: 3
  retryDelay?: number;             // 초 (기본: 60)
  // 타임아웃
  timeout?: number;                // 초 (기본: 300)
}

// --- Task Handler Registry ---
type TaskHandler = (params: Record<string, unknown>) => Promise<{ success: boolean; result?: unknown; error?: string }>;

const taskHandlers = new Map<string, TaskHandler>();

export function registerTaskHandler(name: string, handler: TaskHandler): void {
  taskHandlers.set(name, handler);
}

export function getTaskHandler(name: string): TaskHandler | undefined {
  return taskHandlers.get(name);
}

// --- 다음 실행 시간 계산 ---
export function calculateNextRun(schedule: ScheduleDefinition): string | undefined {
  if (!schedule.enabled) return undefined;
  const now = new Date();
  const tz = schedule.timezone ?? 'UTC';

  switch (schedule.type) {
    case 'once':
      return schedule.schedule.runAt;

    case 'recurring': {
      const pattern = schedule.schedule.pattern ?? 'daily';
      const interval = schedule.schedule.interval ?? 1;

      if (pattern === 'hourly') {
        const next = new Date(now.getTime() + interval * 3600000);
        return next.toISOString();
      }
      if (pattern === 'daily') {
        const next = new Date(now);
        next.setDate(next.getDate() + interval);
        if (schedule.schedule.time) {
          const [h, m] = schedule.schedule.time.split(':').map(Number);
          next.setHours(h ?? 9, m ?? 0, 0, 0);
        }
        return next.toISOString();
      }
      if (pattern === 'weekly') {
        const next = new Date(now);
        const targetDay = schedule.schedule.dayOfWeek ?? 1;
        const currentDay = next.getDay();
        let daysUntil = (targetDay - currentDay + 7) % 7;
        if (daysUntil === 0) daysUntil = 7;
        next.setDate(next.getDate() + daysUntil);
        if (schedule.schedule.time) {
          const [h, m] = schedule.schedule.time.split(':').map(Number);
          next.setHours(h ?? 9, m ?? 0, 0, 0);
        }
        return next.toISOString();
      }
      if (pattern === 'monthly') {
        const next = new Date(now);
        next.setMonth(next.getMonth() + interval);
        if (schedule.schedule.dayOfMonth) {
          next.setDate(schedule.schedule.dayOfMonth);
        }
        if (schedule.schedule.time) {
          const [h, m] = schedule.schedule.time.split(':').map(Number);
          next.setHours(h ?? 9, m ?? 0, 0, 0);
        }
        return next.toISOString();
      }
      return undefined;
    }

    case 'cron':
      // Phase 2: cron-parser 라이브러리 사용
      return undefined;

    default:
      return undefined;
  }
}

// --- 작업 실행 ---
export async function executeScheduledTask(
  schedule: ScheduleDefinition,
): Promise<{ success: boolean; error?: string }> {
  const handler = getTaskHandler(schedule.task.handler);
  if (!handler) {
    return { success: false, error: `핸들러 '${schedule.task.handler}'를 찾을 수 없습니다` };
  }

  const maxRetries = schedule.task.retryCount ?? 3;
  const timeout = schedule.task.timeout ?? 300;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 타임아웃 래퍼
      const result = await Promise.race([
        handler(schedule.task.params ?? {}),
        new Promise<{ success: boolean; error: string }>((_, reject) =>
          setTimeout(() => reject({ success: false, error: '타임아웃' }), timeout * 1000)
        ),
      ]);

      if ((result as any).success) {
        return { success: true };
      }
      throw new Error((result as any).error ?? '실패');
    } catch (err) {
      if (attempt === maxRetries) {
        return {
          success: false,
          error: err instanceof Error ? err.message : `${attempt + 1}회 재시도 후 실패`,
        };
      }
      // 재시도 대기
      const delay = (schedule.task.retryDelay ?? 60) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: '알 수 없는 오류' };
}

// --- 기본 스케줄 정의 ---
export const defaultSchedules: ScheduleDefinition[] = [
  {
    id: 'daily-sales-report',
    name: '일일 매출 리포트',
    type: 'recurring',
    enabled: true,
    schedule: { pattern: 'daily', time: '22:00' },
    task: {
      handler: 'send_daily_report',
      params: { type: 'sales', channels: ['slack'] },
      retryCount: 3,
      retryDelay: 60,
    },
    timezone: 'Asia/Tbilisi',
  },
  {
    id: 'weekly-performance-summary',
    name: '주간 실적 요약',
    type: 'recurring',
    enabled: true,
    schedule: { pattern: 'weekly', dayOfWeek: 1, time: '09:00' }, // 매주 월요일
    task: {
      handler: 'send_weekly_summary',
      params: { channels: ['slack', 'email'] },
    },
    timezone: 'Asia/Tbilisi',
  },
  {
    id: 'reservation-reminder',
    name: '예약 리마인더 (1시간 전)',
    type: 'recurring',
    enabled: true,
    schedule: { pattern: 'hourly', interval: 1 },
    task: {
      handler: 'send_reservation_reminders',
      params: { hoursBefore: 1 },
    },
    timezone: 'Asia/Tbilisi',
  },
];
