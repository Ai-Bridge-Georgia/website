// ============================================================
// Import/Export Engine — Transformer
// 헌법: "Everything is Metadata"
// 사전 등록된 변환기로 타입 변환 수행
// ============================================================

// --- 변환기 레지스트리 ---
type TransformFn = (value: unknown) => unknown;

const transformers = new Map<string, TransformFn>();

// --- 기본 변환기 등록 ---
transformers.set('currency_to_number', (v) => {
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/[^0-9.\-]/g, '')) || 0;
});

transformers.set('number_to_currency', (v) => {
  const num = Number(v);
  return isNaN(num) ? '0' : num.toLocaleString() + ' GEL';
});

transformers.set('yes_no_to_bool', (v) => {
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  return s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === '예';
});

transformers.set('bool_to_yes_no', (v) => {
  return v ? 'Yes' : 'No';
});

transformers.set('format_date', (v) => {
  try {
    const d = new Date(String(v));
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().slice(0, 5);
  } catch {
    return String(v);
  }
});

transformers.set('parse_json', (v) => {
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return {};
  }
});

// --- API ---
export function registerTransformer(name: string, fn: TransformFn): void {
  transformers.set(name, fn);
}

export function getTransformer(name: string): TransformFn | undefined {
  return transformers.get(name);
}

export function applyTransform(name: string, value: unknown): unknown {
  const fn = transformers.get(name);
  return fn ? fn(value) : value;
}

// --- 중첩 필드 처리 (metadata.spicy → { metadata: { spicy: ... } }) ---
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

export function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}
