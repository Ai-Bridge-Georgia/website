// @aibg/engine-import-export — Import/Export Engine
// 헌법: "Everything is Metadata", "Configuration over Customization"
// CSV/JSON ↔ DB 변환을 메타데이터로 정의.

export type {
  ImportExportSchema, ColumnMapping,
  ImportResult, ImportError, ExportResult,
} from './schema';
export { menuImportSchema, menuExportSchema, reservationExportSchema } from './schema';
export {
  registerTransformer, getTransformer, applyTransform,
  setNestedValue, getNestedValue,
} from './transformer';
export {
  importFromCSV, importFromJSON,
  exportToCSV, exportToJSON,
} from './io';
