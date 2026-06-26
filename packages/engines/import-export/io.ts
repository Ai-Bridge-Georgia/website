// ============================================================
// Import/Export Engine — Importer & Exporter
// 헌법: "Everything is an Engine", "API First"
// ============================================================

import type { ImportExportSchema, ImportResult, ImportError, ExportResult, ColumnMapping } from './schema';
import { applyTransform, setNestedValue, getNestedValue } from './transformer';

// ============================================================
// IMPORTER
// ============================================================

// --- CSV 파서 ---
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    // 간단한 CSV 파서 (따옴표 처리 포함)
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return { headers, rows };
}

// --- 행 → 객체 변환 ---
function rowToObject(
  headers: string[],
  row: string[],
  columns: ColumnMapping[],
): { data: Record<string, unknown>; errors: ImportError[] } {
  const data: Record<string, unknown> = {};
  const errors: ImportError[] = [];

  for (const col of columns) {
    const colIndex = headers.indexOf(col.source);
    let value: unknown = colIndex >= 0 ? row[colIndex] : col.defaultValue;

    // 필수 검증
    if (col.required && (value === undefined || value === '')) {
      errors.push({
        row: 0, // caller sets
        column: col.source,
        message: `${col.source}은(는) 필수입니다`,
      });
      continue;
    }

    // 패턴 검증
    if (col.pattern && value && !new RegExp(col.pattern).test(String(value))) {
      errors.push({
        row: 0,
        column: col.source,
        value,
        message: `${col.source} 형식이 올바르지 않습니다`,
      });
      continue;
    }

    // 변환
    if (col.transform) {
      value = applyTransform(col.transform, value);
    }

    // 타입 변환
    switch (col.type) {
      case 'number': value = Number(value) || 0; break;
      case 'boolean': value = Boolean(value); break;
      case 'json': value = typeof value === 'string' ? JSON.parse(value).catch?.(() => value) : value; break;
      default: break;
    }

    // 중첩 필드 처리 (metadata.spicy → setNestedValue)
    setNestedValue(data, col.target, value);
  }

  return { data, errors };
}

// --- 메인 Import 함수 ---
export function importFromCSV(
  csvText: string,
  schema: ImportExportSchema,
): { records: Record<string, unknown>[]; result: ImportResult } {
  const startTime = Date.now();
  const { headers, rows } = parseCSV(csvText);
  const records: Record<string, unknown>[] = [];
  const allErrors: ImportError[] = [];

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const { data, errors } = rowToObject(headers, rows[i], schema.columns);

    if (errors.length > 0) {
      errors.forEach((e) => allErrors.push({ ...e, row: i + 2 })); // +2: 헤더 + 1-indexed
      skipped++;
      continue;
    }

    records.push(data);
    inserted++;
  }

  const result: ImportResult = {
    total: rows.length,
    inserted,
    updated,
    skipped,
    errors: allErrors,
    took: Date.now() - startTime,
  };

  return { records, result };
}

// --- JSON Import ---
export function importFromJSON(
  jsonText: string,
  schema: ImportExportSchema,
): { records: Record<string, unknown>[]; result: ImportResult } {
  const startTime = Date.now();
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      records: [],
      result: { total: 0, inserted: 0, updated: 0, skipped: 1, errors: [{ row: 0, message: 'JSON 파싱 실패' }], took: 0 },
    };
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  const records: Record<string, unknown>[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    let hasError = false;

    for (const col of schema.columns) {
      let value = item[col.source] ?? col.defaultValue;

      if (col.required && (value === undefined || value === null)) {
        errors.push({ row: i + 1, column: col.source, message: `${col.source} 필수` });
        hasError = true;
        continue;
      }

      if (col.transform) {
        value = applyTransform(col.transform, value);
      }

      setNestedValue(data, col.target, value);
    }

    if (!hasError) records.push(data);
  }

  return {
    records,
    result: {
      total: items.length,
      inserted: records.length,
      updated: 0,
      skipped: items.length - records.length,
      errors,
      took: Date.now() - startTime,
    },
  };
}

// ============================================================
// EXPORTER
// ============================================================

// --- Export to CSV ---
export function exportToCSV(
  data: Record<string, unknown>[],
  schema: ImportExportSchema,
): ExportResult {
  const headers = schema.columns.map((c) => c.target);
  const csvHeader = headers.join(',');

  const csvRows = data.map((row) => {
    return schema.columns.map((col) => {
      let value = getNestedValue(row, col.source);

      if (col.transform) {
        value = applyTransform(col.transform, value);
      }

      // CSV 이스케이프
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });

  const csv = [csvHeader, ...csvRows].join('\n');

  return {
    data: csv,
    total: data.length,
    format: 'csv',
    filename: `${schema.entity}-export-${new Date().toISOString().split('T')[0]}.csv`,
  };
}

// --- Export to JSON ---
export function exportToJSON(
  data: Record<string, unknown>[],
  schema: ImportExportSchema,
): ExportResult {
  const mapped = data.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of schema.columns) {
      let value = getNestedValue(row, col.source);
      if (col.transform) {
        value = applyTransform(col.transform, value);
      }
      obj[col.target] = value;
    }
    return obj;
  });

  return {
    data: JSON.stringify(mapped, null, 2),
    total: data.length,
    format: 'json',
    filename: `${schema.entity}-export-${new Date().toISOString().split('T')[0]}.json`,
  };
}
