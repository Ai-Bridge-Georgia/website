// ============================================================
// Report Engine — PDF/Excel/HTML 자동 생성
// 헌법: "Everything is Metadata", "Configuration over Customization"
// 리포트를 메타데이터로 정의 → 코드 없이 리포트 생성
// ============================================================

// --- Report Format ---
export type ReportFormat = 'pdf' | 'excel' | 'html' | 'csv' | 'json';

// --- Report Section ---
export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'text';
  // 데이터 소스
  dataSource?: {
    endpoint?: string;
    staticData?: unknown;
  };
  // 표시 설정
  display?: {
    columns?: { key: string; label: string; format?: 'text' | 'currency' | 'percent' | 'date' }[];
    // chart
    chartType?: 'bar' | 'line' | 'pie';
    xKey?: string;
    yKey?: string;
    // summary
    metrics?: { label: string; key: string; format?: string }[];
  };
}

// --- Report Definition ---
export interface ReportDefinition {
  id: string;
  title: string;
  description?: string;
  format: ReportFormat;
  // 페이지 크기 (PDF)
  pageSize?: 'A4' | 'Letter' | 'A3';
  orientation?: 'portrait' | 'landscape';
  // 섹션
  sections: ReportSection[];
  // 헤더/푸터
  header?: {
    logo?: string;                 // SVG 경로
    title?: string;
    subtitle?: string;
    dateRange?: boolean;
  };
  footer?: {
    text?: string;
    pageNumbers?: boolean;
  };
  // 파라미터 (런타임 입력)
  parameters?: ReportParameter[];
  // 권한
  roleRequired?: string;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'date_range' | 'select' | 'text';
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
}

// --- Report Result ---
export interface ReportResult {
  format: ReportFormat;
  data: string | Blob;
  filename: string;
  generatedAt: string;
}

// --- 포맷터 ---
function formatCell(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '—';
  switch (format) {
    case 'currency': return Number(value).toLocaleString() + ' ₾';
    case 'percent': return Number(value).toFixed(1) + '%';
    case 'date': return new Date(String(value)).toLocaleDateString('ko-KR');
    default: return String(value);
  }
}

// --- HTML 리포트 생성 (PDF/Excel 기반) ---
export function generateHTMLReport(
  report: ReportDefinition,
  data: Record<string, unknown>,
  tenantName?: string,
): string {
  const sections = report.sections.map((section) => {
    if (section.type === 'summary' && section.display?.metrics) {
      const metrics = section.display.metrics.map((m) => {
        const val = data[m.key] ?? 0;
        return `<div style="display:inline-block;margin-right:32px;text-align:center;">
          <div style="font-size:28px;font-weight:700;">${formatCell(val, m.format)}</div>
          <div style="font-size:13px;color:#525252;margin-top:4px;">${m.label}</div>
        </div>`;
      }).join('');
      return `<div style="margin-bottom:32px;">
        <h3 style="font-size:16px;font-weight:600;color:#525252;">${section.title}</h3>
        <div style="padding:16px 0;">${metrics}</div>
      </div>`;
    }

    if (section.type === 'table' && section.display?.columns) {
      const rows = (data[section.id] as Record<string, unknown>[]) ?? [];
      const header = section.display.columns.map((c) =>
        `<th style="padding:8px;border-bottom:2px solid #0A0A0A;font-size:12px;font-weight:600;text-align:left;">${c.label}</th>`
      ).join('');
      const body = rows.map((row) =>
        '<tr>' + section.display!.columns!.map((c) =>
          `<td style="padding:8px;border-bottom:1px solid #E5E5E5;font-size:14px;">${formatCell(row[c.key], c.format)}</td>`
        ).join('') + '</tr>'
      ).join('');
      return `<div style="margin-bottom:32px;">
        <h3 style="font-size:16px;font-weight:600;color:#525252;">${section.title}</h3>
        <table style="width:100%;border-collapse:collapse;">${header}${body}</table>
      </div>`;
    }

    return `<div style="margin-bottom:32px;"><h3>${section.title}</h3></div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${report.title}</title>
<style>
  @page { size: ${report.pageSize ?? 'A4'} ${report.orientation ?? 'portrait'}; margin: 2cm; }
  body { font-family: Pretendard, Inter, sans-serif; color: #0A0A0A; margin: 0; padding: 32px; }
  h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
  h2 { font-size: 14px; font-weight: 400; color: #525252; margin: 0 0 32px 0; }
</style>
</head>
<body>
  <h1>${report.header?.title ?? report.title}</h1>
  ${report.header?.dateRange ? `<h2>${new Date().toLocaleDateString('ko-KR')} | ${tenantName ?? ''}</h2>` : ''}
  ${sections}
  ${report.footer?.pageNumbers ? '<p style="font-size:12px;color:#A3A3A3;margin-top:48px;">Page 1</p>' : ''}
</body>
</html>`;
}

// --- 기본 리포트 정의 ---
export const dailySalesReport: ReportDefinition = {
  id: 'daily-sales',
  title: '일일 매출 리포트',
  format: 'pdf',
  pageSize: 'A4',
  orientation: 'portrait',
  header: { title: '일일 매출 리포트', dateRange: true },
  footer: { pageNumbers: true },
  sections: [
    {
      id: 'summary',
      title: '요약',
      type: 'summary',
      display: {
        metrics: [
          { label: '총 매출', key: 'total_sales', format: 'currency' },
          { label: '주문 수', key: 'order_count' },
          { label: '객단가', key: 'avg_order_value', format: 'currency' },
        ],
      },
    },
    {
      id: 'top-items',
      title: '인기 메뉴 TOP 10',
      type: 'table',
      dataSource: { endpoint: '/api/v1/analytics/top-items' },
      display: {
        columns: [
          { key: 'rank', label: '순위' },
          { key: 'name', label: '메뉴명' },
          { key: 'count', label: '주문 수' },
          { key: 'revenue', label: '매출', format: 'currency' },
        ],
      },
    },
  ],
  roleRequired: 'owner',
};
