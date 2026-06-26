// ============================================================
// Dashboard Engine — Schema Definition
// 헌법: "Everything is Metadata", "Configuration over Customization"
// JSON 스키마 하나로 대시보드 전체를 자동 생성.
// ============================================================

// --- Widget Types ---
export type WidgetType =
  | 'kpi'           // 숫자 + 변화율 (예: 오늘 매출 ₩1,200,000 ▲12%)
  | 'chart-line'    // 선형 차트 (매출 추이)
  | 'chart-bar'     // 막대 차트 (월별 비교)
  | 'chart-pie'     // 파이 차트 (비율)
  | 'table'         // 데이터 테이블 (주문 목록)
  | 'list'          // 리스트 (최근 리뷰)
  | 'progress'      // 진행률 (목표 대비)
  | 'alert'         // 알림 (이상 징후)
  | 'spacer'        // 빈 공간 (사장님: 여백)
  | 'custom';       // 커스텀 컴포넌트

// --- Widget Size (그리드 기반) ---
export type WidgetSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | 'full';

// --- Data Source ---
export interface DataSource {
  type: 'api' | 'static' | 'realtime';
  endpoint?: string;             // '/api/v1/analytics/sales'
  data?: Record<string, unknown>; // static 데이터
  realtimeChannel?: string;      // Supabase Realtime 채널
  refreshInterval?: number;      // 초 단위 (자동 새로고침)
  params?: Record<string, string>;
}

// --- KPI Widget ---
export interface KPIWidget {
  type: 'kpi';
  id: string;
  title: string;                 // "오늘 매출"
  icon?: string;
  size: WidgetSize;
  dataSource: DataSource;
  // 표시 설정
  format?: 'number' | 'currency' | 'percent' | 'duration';
  currency?: string;             // 'GEL', 'KRW', 'USD'
  // 변화율
  showTrend?: boolean;
  trendCompare?: 'yesterday' | 'last_week' | 'last_month';
  // 색상 (제3계층 오버라이드)
  positiveColor?: string;        // 기본: 초록
  negativeColor?: string;        // 기본: 빨강
}

// --- Chart Widget ---
export interface ChartWidget {
  type: 'chart-line' | 'chart-bar' | 'chart-pie';
  id: string;
  title: string;
  size: WidgetSize;
  dataSource: DataSource;
  // 차트 설정
  xKey?: string;                 // 'date'
  yKeys?: string[];              // ['revenue', 'orders']
  colors?: string[];
  // 사장님 취향: 미니멀
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;               // 기본: 240px
}

// --- Table Widget ---
export interface TableWidget {
  type: 'table';
  id: string;
  title: string;
  size: WidgetSize;
  dataSource: DataSource;
  // 컬럼 정의
  columns: {
    key: string;
    label: string;
    format?: 'text' | 'currency' | 'date' | 'badge' | 'image';
    width?: string;              // '120px', 'auto'
    sortable?: boolean;
  }[];
  // 표시 설정
  pageSize?: number;             // 기본: 10
  emptyMessage?: string;
}

// --- List Widget ---
export interface ListWidget {
  type: 'list';
  id: string;
  title: string;
  size: WidgetSize;
  dataSource: DataSource;
  // 표시 설정
  itemTemplate?: {
    primary?: string;            // 필드명
    secondary?: string;
    badge?: string;
    avatar?: string;
  };
  maxItems?: number;
}

// --- Progress Widget ---
export interface ProgressWidget {
  type: 'progress';
  id: string;
  title: string;
  size: WidgetSize;
  dataSource: DataSource;
  current?: string;              // 필드명
  target?: string;               // 필드명
  format?: 'number' | 'currency' | 'percent';
  color?: string;
}

// --- Alert Widget ---
export interface AlertWidget {
  type: 'alert';
  id: string;
  title: string;
  size: WidgetSize;
  dataSource: DataSource;
  // 조건
  condition?: {
    field: string;
    operator: '<' | '>' | '=' | '!=' ;
    value: unknown;
  };
  severity?: 'info' | 'warning' | 'critical';
  message?: string;
}

// --- Spacer Widget (사장님: 여백) ---
export interface SpacerWidget {
  type: 'spacer';
  id: string;
  size: WidgetSize;
}

// --- Widget Union ---
export type Widget =
  | KPIWidget
  | ChartWidget
  | TableWidget
  | ListWidget
  | ProgressWidget
  | AlertWidget
  | SpacerWidget;

// --- Dashboard Definition ---
export interface DashboardSchema {
  id: string;
  title: string;
  description?: string;
  // 위젯 배치
  widgets: Widget[];
  // 레이아웃 (사장님 취향)
  layout?: {
    columns: 1 | 2 | 3 | 4;      // 그리드 컬럼 수
    gap: 'sm' | 'md' | 'lg';     // 8px / 16px / 24px
    sectionGap?: 'md' | 'lg' | 'xl'; // 섹션 간 (사장님: 96px)
  };
  // 권한
  roleRequired?: string;         // 'admin' | 'owner' | 'staff'
  // 자동 새로고침
  autoRefresh?: number;          // 초 단위
}

// --- Example: Restaurant Owner Dashboard ---
export const restaurantOwnerDashboard: DashboardSchema = {
  id: 'restaurant-owner',
  title: '내 매장 대시보드',
  description: '오늘 현황 한눈에',
  widgets: [
    // Row 1: KPI 4개
    {
      type: 'kpi', id: 'today-sales', title: '오늘 매출',
      size: '1x1',
      dataSource: { type: 'api', endpoint: '/api/v1/analytics/sales-today', refreshInterval: 60 },
      format: 'currency', currency: 'GEL',
      showTrend: true, trendCompare: 'yesterday',
    },
    {
      type: 'kpi', id: 'today-orders', title: '오늘 주문',
      size: '1x1',
      dataSource: { type: 'api', endpoint: '/api/v1/analytics/orders-today', refreshInterval: 60 },
      format: 'number',
      showTrend: true, trendCompare: 'yesterday',
    },
    {
      type: 'kpi', id: 'today-reservations', title: '오늘 예약',
      size: '1x1',
      dataSource: { type: 'api', endpoint: '/api/v1/analytics/reservations-today' },
      format: 'number',
    },
    {
      type: 'kpi', id: 'avg-rating', title: '평점',
      size: '1x1',
      dataSource: { type: 'api', endpoint: '/api/v1/analytics/rating' },
      format: 'number',
    },
    // Row 2: 차트 + 테이블
    {
      type: 'chart-line', id: 'weekly-sales', title: '주간 매출 추이',
      size: '2x2',
      dataSource: { type: 'api', endpoint: '/api/v1/analytics/sales-weekly' },
      xKey: 'date', yKeys: ['revenue', 'orders'],
      colors: ['#0A0A0A', '#A3A3A3'],
      showGrid: true, showLegend: true, height: 240,
    },
    {
      type: 'table', id: 'recent-orders', title: '최근 주문',
      size: '1x2',
      dataSource: { type: 'api', endpoint: '/api/v1/orders?limit=10' },
      columns: [
        { key: 'id', label: '주문번호', width: '80px' },
        { key: 'customer_name', label: '고객', width: 'auto' },
        { key: 'total', label: '금액', format: 'currency', width: '100px', sortable: true },
        { key: 'status', label: '상태', format: 'badge', width: '80px' },
      ],
      pageSize: 5,
    },
    // Row 3: 진행률 + 알림
    {
      type: 'progress', id: 'monthly-goal', title: '이번 달 목표',
      size: '1x1',
      dataSource: { type: 'api', endpoint: '/api/v1/analytics/monthly-goal' },
      current: 'current', target: 'target',
      format: 'currency',
    },
    {
      type: 'alert', id: 'low-stock', title: '재고 알림',
      size: '1x1',
      dataSource: { type: 'api', endpoint: '/api/v1/inventory/low-stock' },
      severity: 'warning',
      message: '재고가 부족한 메뉴가 있습니다',
    },
  ],
  layout: {
    columns: 4,
    gap: 'md',
    sectionGap: 'xl',
  },
  roleRequired: 'owner',
  autoRefresh: 60,
};
