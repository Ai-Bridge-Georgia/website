// ============================================================
// Form Engine — Validator
// 헌법: "Everything is Metadata"
// 필드 메타데이터 → 검증 규칙 자동 적용
// ============================================================

import type { FormField, FormSchema } from './schema';

// --- 단일 필드 검증 ---
export function validateField(field: FormField, value: unknown): string | null {
  // required 검증
  if (field.required) {
    if (value === undefined || value === null || value === '') {
      return `${field.label}은(는) 필수입니다.`;
    }
  }

  // 값이 없으면 통과
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const strValue = String(value);

  // 타입별 검증
  switch (field.type) {
    case 'email':
    case 'text':
      if (field.validate?.email || field.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
          return '올바른 이메일 형식이 아닙니다.';
        }
      }
      break;

    case 'url':
      if (field.validate?.url || field.type === 'url') {
        try {
          new URL(strValue);
        } catch {
          return '올바른 URL이 아닙니다.';
        }
      }
      break;

    case 'tel':
      if (!/^[\d\s+\-()]+$/.test(strValue)) {
        return '올바른 전화번호 형식이 아닙니다.';
      }
      break;

    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        return '숫자를 입력해주세요.';
      }
      if (field.validate?.positive && num <= 0) {
        return '0보다 큰 값을 입력해주세요.';
      }
      if (field.validate?.integer && !Number.isInteger(num)) {
        return '정수를 입력해주세요.';
      }
      if (field.min !== undefined && num < field.min) {
        return `${field.min} 이상 입력해주세요.`;
      }
      if (field.max !== undefined && num > field.max) {
        return `${field.max} 이하로 입력해주세요.`;
      }
      break;
    }

    case 'textarea':
    case 'text':
      if (field.minLength !== undefined && strValue.length < field.minLength) {
        return `최소 ${field.minLength}자 이상 입력해주세요.`;
      }
      if (field.maxLength !== undefined && strValue.length > field.maxLength) {
        return `최대 ${field.maxLength}자까지 입력 가능합니다.`;
      }
      if (field.pattern) {
        try {
          const regex = new RegExp(field.pattern);
          if (!regex.test(strValue)) {
            return `형식이 올바르지 않습니다.`;
          }
        } catch {
          // invalid regex, skip
        }
      }
      break;

    case 'image':
    case 'file':
      // 사장님 규칙: 이미지는 WebP/SVG 만 허용 (guardrails #21-22)
      if (field.accept && typeof value === 'string') {
        if (!value.match(/\.(webp|svg)$/i)) {
          return 'WebP 또는 SVG 파일만 업로드 가능합니다.';
        }
      }
      break;
  }

  return null;
}

// --- 전체 폼 검증 ---
export interface ValidationResult {
  valid: boolean;
  data: Record<string, unknown>;
  errors: Record<string, string>;
}

export function validateForm(
  schema: FormSchema,
  values: Record<string, unknown>,
): ValidationResult {
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  for (const field of schema.fields) {
    if (field.hidden) continue;

    const value = values[field.name] ?? field.defaultValue;
    const error = validateField(field, value);

    if (error) {
      errors[field.name] = error;
    } else {
      // 정제된 값 저장
      data[field.name] = value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    data,
    errors,
  };
}
