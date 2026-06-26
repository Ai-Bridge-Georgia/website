// @aibg/engine-form — Form Engine
// 헌법: "Everything is Metadata"
// JSON 스키마 하나로 폼 전체를 자동 생성/검증/제출.

export type { FormSchema, FormField, FieldType } from './schema';
export { reservationFormSchema } from './schema';
export { FormRenderer } from './renderer';
export { validateField, validateForm } from './validator';
export type { ValidationResult } from './validator';
export { submitForm } from './submit';
export type { SubmitConfig, SubmitResult } from './submit';
