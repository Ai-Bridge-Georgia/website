// ============================================================
// Form Engine — Submit Handler
// 헌법: "API First", "Event First"
// 제출 → API 호출 → 이벤트 발생
// ============================================================

import type { FormSchema } from './schema';

export interface SubmitConfig {
  label: string;
  method: 'POST' | 'PATCH';
  endpoint: string;
  onSuccess?: 'redirect' | 'message' | 'reset';
  successMessage?: string;
  redirectUrl?: string;
}

export interface SubmitResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

// --- API 제출 ---
export async function submitForm(
  config: SubmitConfig,
  data: Record<string, unknown>,
): Promise<SubmitResult> {
  try {
    const response = await fetch(config.endpoint, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const json = await response.json().catch(() => ({}));
      return { ok: true, data: json };
    } else {
      const errorBody = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: errorBody?.error?.message ?? `서버 오류 (${response.status})`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '네트워크 오류',
    };
  }
}
