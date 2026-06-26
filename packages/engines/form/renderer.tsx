'use client';

import { useState, useCallback } from 'react';
import type { FormSchema, FormField } from './schema';
import { validateField, validateForm } from './validator';
import { submitForm } from './submit';

// ============================================================
// Form Engine — Renderer
// JSON 스키마 → React 폼 자동 생성
// 헌법: "Everything is Metadata", "Configuration over Customization"
// 사장님 취향: 사각 버튼 8-12px, 8px 간격, WebP/SVG
// ============================================================

// --- Design Tokens (제1계층 고정) ---
const STYLE = {
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#262626',
    fontFamily: 'Pretendard, Inter, sans-serif',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    fontFamily: 'Pretendard, Inter, sans-serif',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',           // 사장님: 사각 둥근 모서리
    outline: 'none',
    transition: 'border-color 150ms ease',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: '#0A0A0A',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: '13px',
    color: '#DC2626',
    marginTop: '4px',
    fontFamily: 'Pretendard, Inter, sans-serif',
  },
  hint: {
    fontSize: '13px',
    color: '#A3A3A3',
    marginTop: '4px',
    fontFamily: 'Pretendard, Inter, sans-serif',
  },
  button: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 600,
    fontFamily: 'Pretendard, Inter, sans-serif',
    backgroundColor: '#0A0A0A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',         // 사장님: lg 버튼 12px
    cursor: 'pointer',
    transition: 'opacity 150ms ease',
  },
  sectionGap: '96px',             // 사장님: 여백
  fieldGap: '16px',               // 8px 기반
};

// --- Width 매핑 ---
const WIDTH_MAP = {
  full: '100%',
  half: 'calc(50% - 8px)',
  third: 'calc(33.333% - 11px)',
};

// --- 단일 필드 렌더링 ---
function renderField(
  field: FormField,
  value: unknown,
  error: string | null,
  onChange: (name: string, value: unknown) => void,
) {
  const inputStyle = {
    ...STYLE.input,
    ...(error ? STYLE.inputError : {}),
  };

  // 숨김 필드
  if (field.hidden || field.type === 'hidden') {
    return <input key={field.name} type="hidden" name={field.name} value={String(value ?? '')} />;
  }

  // 라벨
  const labelEl = (
    <label style={STYLE.label}>
      {field.label}
      {field.required && <span style={{ color: '#DC2626' }}> *</span>}
    </label>
  );

  // 필드 타입별 렌더링
  let inputEl: React.ReactNode;

  if (field.type === 'textarea') {
    inputEl = (
      <textarea
        name={field.name}
        placeholder={field.placeholder}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.name, e.target.value)}
        maxLength={field.maxLength}
        style={inputStyle}
        rows={3}
      />
    );
  } else if (field.type === 'select') {
    inputEl = (
      <select
        name={field.name}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.name, e.target.value)}
        style={inputStyle}
      >
        <option value="">{field.placeholder ?? '선택하세요'}</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  } else if (field.type === 'checkbox') {
    inputEl = (
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          name={field.name}
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
        <span style={{ fontSize: '16px', fontFamily: 'Pretendard, Inter, sans-serif' }}>
          {field.hint ?? field.label}
        </span>
      </label>
    );
    return (
      <div key={field.name} style={{ width: WIDTH_MAP[field.width ?? 'full'] }}>
        {inputEl}
        {error && <p style={STYLE.errorText}>{error}</p>}
      </div>
    );
  } else if (field.type === 'radio') {
    inputEl = (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {field.options?.map((opt) => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name={field.name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(field.name, e.target.value)}
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontSize: '16px', fontFamily: 'Pretendard, Inter, sans-serif' }}>{opt.label}</span>
          </label>
        ))}
      </div>
    );
  } else {
    inputEl = (
      <input
        type={field.type}
        name={field.name}
        placeholder={field.placeholder}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.name, e.target.value)}
        min={field.min}
        max={field.max}
        step={field.step}
        maxLength={field.maxLength}
        accept={field.accept}
        disabled={field.disabled}
        style={inputStyle}
      />
    );
  }

  return (
    <div key={field.name} style={{ width: WIDTH_MAP[field.width ?? 'full'] }}>
      {labelEl}
      {inputEl}
      {field.hint && field.type !== 'checkbox' && <p style={STYLE.hint}>{field.hint}</p>}
      {error && <p style={STYLE.errorText}>{error}</p>}
    </div>
  );
}

// --- 메인 폼 컴포넌트 ---
interface FormRendererProps {
  schema: FormSchema;
  // 테마 오버라이드 (제3계층)
  primaryColor?: string;
}

export function FormRenderer({ schema, primaryColor }: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 값 변경
  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // 에러 초기화
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // 필드별 실시간 검증 (blur 시)
  const handleBlur = useCallback((name: string) => {
    const field = schema.fields.find((f) => f.name === name);
    if (!field) return;
    const error = validateField(field, values[name]);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [schema.fields, values]);

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // 전체 검증
    const validation = validateForm(schema, values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // API 제출
    setSubmitting(true);
    try {
      const result = await submitForm(schema.submit, validation.data);
      if (result.ok) {
        setSuccess(true);
        if (schema.submit.onSuccess === 'reset') {
          setValues({});
        }
      } else {
        setServerError(result.error ?? '제출 중 오류가 발생했습니다.');
      }
    } catch {
      setServerError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 성공 화면
  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '96px 24px', fontFamily: 'Pretendard, Inter, sans-serif' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          ✅ {schema.submit.successMessage ?? '완료되었습니다!'}
        </h2>
      </div>
    );
  }

  const btnStyle = {
    ...STYLE.button,
    backgroundColor: primaryColor ?? STYLE.button.backgroundColor,
    opacity: submitting ? 0.5 : 1,
    cursor: submitting ? 'not-allowed' : 'pointer',
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Pretendard, Inter, sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{schema.title}</h2>
      {schema.description && (
        <p style={{ fontSize: '16px', color: '#525252', marginBottom: '24px' }}>{schema.description}</p>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: STYLE.fieldGap,
        marginBottom: '24px',
      }}>
        {schema.fields.map((field) =>
          renderField(field, values[field.name], errors[field.name] ?? null, handleChange),
        )}
      </div>

      {serverError && (
        <p style={{ ...STYLE.errorText, marginBottom: '16px' }}>⚠️ {serverError}</p>
      )}

      <button type="submit" disabled={submitting} style={btnStyle}>
        {submitting ? '처리 중...' : schema.submit.label}
      </button>
    </form>
  );
}
