// @aibg/engine-dashboard — Dashboard Engine
// 헌법: "Everything is Metadata", "Configuration over Customization"
// JSON 스키마 하나로 대시보드 전체를 자동 생성.

export type {
  DashboardSchema, Widget, WidgetType, WidgetSize, DataSource,
  KPIWidget, ChartWidget, TableWidget, ListWidget,
  ProgressWidget, AlertWidget, SpacerWidget,
} from './schema';
export { restaurantOwnerDashboard } from './schema';
export { DashboardRenderer } from './renderer';
export { fetchWidgetData, formatValue, calculateTrend } from './data-fetcher';
