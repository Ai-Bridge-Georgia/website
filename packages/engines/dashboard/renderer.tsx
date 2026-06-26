'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DashboardSchema, Widget, KPIWidget, ChartWidget,
  TableWidget, ListWidget, ProgressWidget, AlertWidget,
} from './schema';
import { fetchWidgetData, formatValue, calculateTrend } from './data-fetcher';

// ============================================================
// Dashboard Engine — Renderer
// JSON 스키마 → React 대시보드 자동 생성
// 헌법: "Everything is Metadata"
// 사장님 취향: Apple 톤 미니멀, 여백 96px+, 8px 간격
// ============================================================

// --- Design Tokens (제1계층 고정) ---
const STYLE = {
  container: {
    fontFamily: 'Pretendard, Inter, -apple-system, sans-serif',
    color: '#0A0A0A',
  },
  header: {
    marginBottom: '32px' as const,
  },
  title: {
    fontSize: '28px' as const,
    fontWeight: 700,
    margin: 0,
  },
  description: {
    fontSize: '16px',
    color: '#525252',
    marginTop: '4px',
  },
  grid: {
    display: 'grid',
    gap: '16px',                 // 8px 기반 (md)
  },
  widget: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '12px',        // 사장님: 카드 12px
    padding: '24px',
  },
  widgetTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#525252',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  trendUp: { color: '#16A34A' },
  trendDown: { color: '#DC2626' },
  trendFlat: { color: '#A3A3A3' },
  loading: {
    fontSize: '14px',
    color: '#A3A3A3',
    padding: '24px',
    textAlign: 'center' as const,
  },
  error: {
    fontSize: '13px',
    color: '#DC2626',
    padding: '12px',
    backgroundColor: '#FEF2F2',
    borderRadius: '8px',
  },
  alert: {
    warning: { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
    critical: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
    info: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  },
};

// --- 위젯 사이즈 → grid span ---
const SIZE_MAP: Record<string, string> = {
  '1x1': 'span 1 / span 1',
  '2x1': 'span 1 / span 2',
  '1x2': 'span 2 / span 1',
  '2x2': 'span 2 / span 2',
  '3x1': 'span 1 / span 3',
  'full': 'span 1 / span 4',
};

// --- KPI Widget ---
function KPIRender({ widget, color }: { widget: KPIWidget; color?: string }) {
  const { data, loading, error } = useWidgetData(widget.id, widget.dataSource);

  if (loading) return <div style={STYLE.loading}>로딩 중...</div>;
  if (error) return <div style={STYLE.error}>{error}</div>;

  const value = (data as Record<string, number>)?.value ?? 0;
  const previous = (data as Record<string, number>)?.previous;
  const trend = previous !== undefined ? calculateTrend(value, previous) : null;

  const trendColor = trend?.direction === 'up' ? STYLE.trendUp
    : trend?.direction === 'down' ? STYLE.trendDown : STYLE.trendFlat;
  const arrow = trend?.direction === 'up' ? '▲' : trend?.direction === 'down' ? '▼' : '—';

  return (
    <div>
      <div style={STYLE.widgetTitle}>{widget.title}</div>
      <div style={{ ...STYLE.kpiValue, color: color ?? '#0A0A0A' }}>
        {formatValue(value, widget.format ?? 'number', widget.currency)}
      </div>
      {trend && widget.showTrend && (
        <div style={{ ...trendColor, fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
          {arrow} {trend.percent.toFixed(1)}% (전일 대비)
        </div>
      )}
    </div>
  );
}

// --- Chart Widget (간소화 — SVG 기반) ---
function ChartRender({ widget }: { widget: ChartWidget }) {
  const { data, loading, error } = useWidgetData(widget.id, widget.dataSource);

  if (loading) return <div style={STYLE.loading}>로딩 중...</div>;
  if (error) return <div style={STYLE.error}>{error}</div>;

  const rows = (data as Record<string, unknown>[]) ?? [];
  if (rows.length === 0) return <div style={STYLE.loading}>데이터 없음</div>;

  // 간단한 막대 차트 (SVG)
  const maxVal = Math.max(...rows.map(r => Number(r[widget.yKeys?.[0] ?? 'value'] ?? 0)));
  const barWidth = 100 / rows.length;

  return (
    <div>
      <div style={STYLE.widgetTitle}>{widget.title}</div>
      <svg viewBox="0 0 100 40" style={{ width: '100%', height: widget.height ?? 240 }}>
        {rows.map((row, i) => {
          const val = Number(row[widget.yKeys?.[0] ?? 'value'] ?? 0);
          const h = maxVal > 0 ? (val / maxVal) * 35 : 0;
          return (
            <rect
              key={i}
              x={i * barWidth + 1}
              y={38 - h}
              width={barWidth - 2}
              height={h}
              fill={widget.colors?.[0] ?? '#0A0A0A'}
              rx="0.5"
            />
          );
        })}
      </svg>
      {widget.showLegend && widget.yKeys && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          {widget.yKeys.map((key, i) => (
            <span key={key} style={{ fontSize: '12px', color: '#525252', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: widget.colors?.[i] ?? '#0A0A0A', borderRadius: '2px' }} />
              {key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Table Widget ---
function TableRender({ widget }: { widget: TableWidget }) {
  const { data, loading, error } = useWidgetData(widget.id, widget.dataSource);

  if (loading) return <div style={STYLE.loading}>로딩 중...</div>;
  if (error) return <div style={STYLE.error}>{error}</div>;

  const rows = (data as Record<string, unknown>[]) ?? [];
  if (rows.length === 0) return <div style={STYLE.loading}>{widget.emptyMessage ?? '데이터 없음'}</div>;

  return (
    <div>
      <div style={STYLE.widgetTitle}>{widget.title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {widget.columns.map(col => (
              <th key={col.key} style={{
                textAlign: 'left', padding: '8px',
                borderBottom: '1px solid #E5E5E5',
                fontWeight: 600, color: '#525252',
                fontSize: '12px', textTransform: 'uppercase',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, widget.pageSize ?? 10).map((row, i) => (
            <tr key={i}>
              {widget.columns.map(col => {
                const val = row[col.key];
                return (
                  <td key={col.key} style={{
                    padding: '8px',
                    borderBottom: '1px solid #F5F5F5',
                  }}>
                    {col.format === 'badge' && val ? (
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 600,
                        backgroundColor: val === 'completed' ? '#F0FDF4' : '#FEF2F2',
                        color: val === 'completed' ? '#16A34A' : '#DC2626',
                      }}>
                        {String(val)}
                      </span>
                    ) : col.format === 'currency' ? (
                      formatValue(Number(val), 'currency')
                    ) : col.format === 'date' ? (
                      formatValue(String(val), 'date')
                    ) : (
                      String(val ?? '')
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- List Widget ---
function ListRender({ widget }: { widget: ListWidget }) {
  const { data, loading, error } = useWidgetData(widget.id, widget.dataSource);

  if (loading) return <div style={STYLE.loading}>로딩 중...</div>;
  if (error) return <div style={STYLE.error}>{error}</div>;

  const items = (data as Record<string, unknown>[]) ?? [];
  if (items.length === 0) return <div style={STYLE.loading}>데이터 없음</div>;

  const tpl = widget.itemTemplate ?? {};

  return (
    <div>
      <div style={STYLE.widgetTitle}>{widget.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.slice(0, widget.maxItems ?? 5).map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px', borderRadius: '8px',
            backgroundColor: '#FAFAFA',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {tpl.primary && (
                <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {String(item[tpl.primary] ?? '')}
                </div>
              )}
              {tpl.secondary && (
                <div style={{ fontSize: '13px', color: '#525252' }}>
                  {String(item[tpl.secondary] ?? '')}
                </div>
              )}
            </div>
            {tpl.badge && item[tpl.badge] ? (
              <span style={{
                padding: '2px 8px', borderRadius: '8px',
                fontSize: '12px', fontWeight: 600,
                backgroundColor: '#F5F5F5',
              }}>
                {String(item[tpl.badge])}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Progress Widget ---
function ProgressRender({ widget }: { widget: ProgressWidget }) {
  const { data, loading, error } = useWidgetData(widget.id, widget.dataSource);

  if (loading) return <div style={STYLE.loading}>로딩 중...</div>;
  if (error) return <div style={STYLE.error}>{error}</div>;

  const d = data as Record<string, number> | null;
  const current = d?.[widget.current ?? 'current'] ?? 0;
  const target = d?.[widget.target ?? 'target'] ?? 1;
  const percent = Math.min(100, (current / target) * 100);

  return (
    <div>
      <div style={STYLE.widgetTitle}>{widget.title}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        {formatValue(percent, 'percent')}
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: percent + '%', height: '100%',
          backgroundColor: widget.color ?? '#0A0A0A',
          borderRadius: '4px', transition: 'width 400ms ease',
        }} />
      </div>
      <div style={{ fontSize: '13px', color: '#525252', marginTop: '4px' }}>
        {formatValue(current, widget.format ?? 'number')} / {formatValue(target, widget.format ?? 'number')}
      </div>
    </div>
  );
}

// --- Alert Widget ---
function AlertRender({ widget }: { widget: AlertWidget }) {
  const { data, loading, error } = useWidgetData(widget.id, widget.dataSource);

  if (loading) return null;
  if (error) return null;

  const items = (data as unknown[]) ?? [];
  if (items.length === 0) return null;

  const alertStyle = STYLE.alert[widget.severity ?? 'info'];

  return (
    <div style={{
      ...STYLE.widget,
      ...alertStyle,
      borderWidth: '1px',
      borderStyle: 'solid',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
        {widget.severity === 'critical' ? '🚨' : widget.severity === 'warning' ? '⚠️' : 'ℹ️'} {widget.title}
      </div>
      <div style={{ fontSize: '13px', color: '#525252' }}>
        {widget.message ?? `${items.length}개 항목`}
      </div>
    </div>
  );
}

// --- 데이터 페칭 훅 ---
function useWidgetData(widgetId: string, source: import('./schema').DataSource) {
  const [state, setState] = useState<{ data: unknown | null; loading: boolean; error: string | null }>({
    data: null, loading: true, error: null,
  });

  const loadData = useCallback(async () => {
    const result = await fetchWidgetData(source, widgetId);
    setState(result);
  }, [widgetId, source.endpoint, source.type]);

  useEffect(() => {
    loadData();
    // 자동 새로고침
    if (source.refreshInterval) {
      const interval = setInterval(loadData, source.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [loadData, source.refreshInterval]);

  return state;
}

// --- Widget 디스패처 ---
function renderWidget(widget: Widget, primaryColor?: string): React.ReactNode {
  switch (widget.type) {
    case 'kpi': return <KPIRender widget={widget} color={primaryColor} />;
    case 'chart-line':
    case 'chart-bar':
    case 'chart-pie': return <ChartRender widget={widget} />;
    case 'table': return <TableRender widget={widget} />;
    case 'list': return <ListRender widget={widget} />;
    case 'progress': return <ProgressRender widget={widget} />;
    case 'alert': return <AlertRender widget={widget} />;
    case 'spacer': return <div />;
    default: return null;
  }
}

// --- 메인 대시보드 ---
interface DashboardRendererProps {
  schema: DashboardSchema;
  primaryColor?: string;
}

export function DashboardRenderer({ schema, primaryColor }: DashboardRendererProps) {
  const cols = schema.layout?.columns ?? 3;
  const gap = schema.layout?.gap === 'sm' ? '8px' : schema.layout?.gap === 'lg' ? '24px' : '16px';

  return (
    <div style={STYLE.container}>
      <div style={STYLE.header}>
        <h1 style={STYLE.title}>{schema.title}</h1>
        {schema.description && <p style={STYLE.description}>{schema.description}</p>}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap,
      }}>
        {schema.widgets.map(widget => (
          <div key={widget.id} style={{
            ...STYLE.widget,
            gridColumn: SIZE_MAP[widget.size]?.split(' / ')[1]
              ? `span ${widget.size === 'full' ? cols : parseInt(widget.size.split('x')[1])}`
              : undefined,
          }}>
            {renderWidget(widget, primaryColor)}
          </div>
        ))}
      </div>
    </div>
  );
}
