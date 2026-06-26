// ============================================================
// Import/Export Engine — Schema Definition
// 헌법: "Everything is Metadata", "Configuration over Customization"
// CSV/JSON ↔ DB 변환을 메타데이터로 정의
// ============================================================

// --- Column Mapping ---
export interface ColumnMapping {
  // 소스 (CSV/JSON 컬럼)
  source: string;                 // 'Menu Name' (CSV 헤더)
  // 대상 (DB 필드)
  target: string;                 // 'name' (DB 컬럼)
  // 타입 변환
  type?: 'string' | 'number' | 'boolean' | 'date' | 'json';
  // 필수 여부
  required?: boolean;
  // 기본값 (소스에 없을 때)
  defaultValue?: unknown;
  // 변환 함수 ID (사전 등록된 변환기)
  transform?: string;             // 'currency_to_number' | 'yes_no_to_bool'
  // 검증 (정규식)
  pattern?: string;
}

// --- Import/Export Schema ---
export interface ImportExportSchema {
  id: string;                     // 'menu-import' | 'order-export'
  name: string;
  entity: string;                 // 'menus' (DB 테이블)
  // 컬럼 매핑
  columns: ColumnMapping[];
  // 파일 형식
  format: 'csv' | 'json' | 'xlsx';
  // 중복 처리
  onConflict?: 'skip' | 'update' | 'error';
  conflictKey?: string;           // 'name' (중복 판단 필드)
  // 검증
  validateBeforeImport?: boolean;
  // 배치 사이즈
  batchSize?: number;             // 기본: 100
  // Import 전/후 액션
  beforeImport?: string[];        // handler IDs
  afterImport?: string[];         // handler IDs
}

// --- Import Result ---
export interface ImportResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  took: number;                   // ms
}

export interface ImportError {
  row: number;                    // CSV 행 번호
  column?: string;
  value?: unknown;
  message: string;
}

// --- Export Result ---
export interface ExportResult {
  data: string;                   // CSV/JSON 문자열
  total: number;
  format: 'csv' | 'json';
  filename: string;
}

// ============================================================
// 실제 Import/Export 스키마
// ============================================================

// --- Menu Import (CSV) ---
export const menuImportSchema: ImportExportSchema = {
  id: 'menu-import',
  name: '메뉴 일괄 등록',
  entity: 'menus',
  format: 'csv',
  columns: [
    { source: 'Category', target: 'category', type: 'string', required: true },
    { source: 'Menu Name', target: 'name', type: 'string', required: true },
    { source: 'Description', target: 'description', type: 'string' },
    { source: 'Price', target: 'price', type: 'number', required: true, transform: 'currency_to_number' },
    { source: 'Available', target: 'is_available', type: 'boolean', defaultValue: true, transform: 'yes_no_to_bool' },
    { source: 'Spicy', target: 'metadata.spicy', type: 'number', defaultValue: 0 },
    { source: 'Image URL', target: 'image_url', type: 'string' },
  ],
  onConflict: 'update',
  conflictKey: 'name',
  validateBeforeImport: true,
  batchSize: 50,
  afterImport: ['recalculate-categories', 'notify-owner'],
};

// --- Menu Export (CSV) ---
export const menuExportSchema: ImportExportSchema = {
  id: 'menu-export',
  name: '메뉴 내보내기',
  entity: 'menus',
  format: 'csv',
  columns: [
    { source: 'category', target: 'Category' },
    { source: 'name', target: 'Menu Name' },
    { source: 'description', target: 'Description' },
    { source: 'price', target: 'Price', transform: 'number_to_currency' },
    { source: 'is_available', target: 'Available', transform: 'bool_to_yes_no' },
    { source: 'image_url', target: 'Image URL' },
  ],
  format_old: 'csv' as any, // override
};

// --- Reservation Export (CSV) ---
export const reservationExportSchema: ImportExportSchema = {
  id: 'reservation-export',
  name: '예약 내역 내보내기',
  entity: 'reservations',
  format: 'csv',
  columns: [
    { source: 'customer_name', target: 'Customer Name' },
    { source: 'customer_phone', target: 'Phone' },
    { source: 'date', target: 'Date', transform: 'format_date' },
    { source: 'party_size', target: 'Party Size' },
    { source: 'status', target: 'Status' },
    { source: 'notes', target: 'Notes' },
  ],
};
