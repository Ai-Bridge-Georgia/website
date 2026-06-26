// ============================================================
// Dashboard Engine — Data Fetcher
// 헌법: "API First", "Event First"
// DataSource 메타데이터 → 자동 데이터 페칭 + 새로고침
// ============================================================

import type { DataSource } from './schema';

// --- 캐시 (메모리) ---
const cache = new Map<string, { data: unknown; timestamp: number }>();

// --- 데이터 페칭 ---
export async function fetchWidgetData(
  source: DataSource,
  widgetId: string,
): Promise<{ data: unknown | null; loading: boolean; error: string | null }> {
  // static 데이터
  if (source.type === 'static') {
    return { data: source.data ?? null, loading: false, error: null };
  }

  // realtime (Supabase Realtime — Phase 2)
  if (source.type === 'realtime') {
    // TODO: Supabase Realtime 구독
    return { data: null, loading: false, error: 'Realtime은 Phase 2에서 구현' };
  }

  // API
  if (source.type === 'api' && source.endpoint) {
    // 캐시 확인 (5초)
    const cached = cache.get(widgetId);
    if (cached && Date.now() - cached.timestamp < 5000) {
      return { data: cached.data, loading: false, error: null };
    }

    try {
      const url = source.params
        ? source.endpoint + '?' + new URLSearchParams(source.params).toString()
        : source.endpoint;

      const response = await fetch(url);

      if (!response.ok) {
        return { data: null, loading: false, error: `API 오류 (${response.status})` };
      }

      const json = await response.json();
      const data = json.data ?? json;
      cache.set(widgetId, { data, timestamp: Date.now() });

      return { data, loading: false, error: null };
    } catch (err) {
      return {
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '데이터 로딩 실패',
      };
    }
  }

  return { data: null, loading: false, error: '알 수 없는 데이터 소스' };
}

// --- 포맷터 ---
export function formatValue(
  value: number | string | null | undefined,
  format: 'number' | 'currency' | 'percent' | 'duration' | 'text' | 'date',
  currency?: string,
): string {
  if (value === null || value === undefined || value === '') return '—';

  switch (format) {
    case 'currency': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      const symbols: Record<string, string> = { KRW: '₩', USD: '$', GEL: '₾' };
      const symbol = symbols[currency ?? 'GEL'] ?? '';
      return symbol + num.toLocaleString();
    }
    case 'percent': {
      const num = Number(value);
      return isNaN(num) ? String(value) : num.toFixed(1) + '%';
    }
    case 'number': {
      const num = Number(value);
      return isNaN(num) ? String(value) : num.toLocaleString();
    }
    case 'duration': {
      const sec = Number(value);
      if (isNaN(sec)) return String(value);
      if (sec < 60) return sec + '초';
      const min = Math.floor(sec / 60);
      return min + '분 ' + (sec % 60) + '초';
    }
    case 'date': {
      try {
        return new Date(String(value)).toLocaleDateString('ko-KR');
      } catch {
        return String(value);
      }
    }
    default:
      return String(value);
  }
}

// --- 변화율 계산 ---
export function calculateTrend(
  current: number,
  previous: number,
): { direction: 'up' | 'down' | 'flat'; percent: number } {
  if (previous === 0) return { direction: 'flat', percent: 0 };
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.1) return { direction: 'flat', percent: 0 };
  return { direction: diff > 0 ? 'up' : 'down', percent: Math.abs(diff) };
}
