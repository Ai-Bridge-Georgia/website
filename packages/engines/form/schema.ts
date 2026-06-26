// ============================================================
// Form Engine — Schema Definition
// 헌법: "Everything is Metadata"
// 헌법: "Configuration over Customization"
//
// JSON 스키마 하나로 폼 전체를 자동 생성/검증/제출한다.
// 코딩 없이 새 폼을 만들 수 있다 = 소프트웨어 공장.
// ============================================================

// --- Field Types ---
export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'image'
  | 'file'
  | 'url'
  | 'password'
  | 'hidden'
  | 'color';

// --- Field Definition (메타데이터) ---
export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;

  // select / radio / multiselect
  options?: { label: string; value: string }[];

  // number
  min?: number;
  max?: number;
  step?: number;

  // text
  maxLength?: number;
  minLength?: number;
  pattern?: string;           // regex string

  // image / file
  accept?: string;            // 'image/webp', 'image/svg+xml'
  maxSize?: number;           // bytes

  // UI 힌트 (사장님 취향 반영)
  hint?: string;
  width?: 'full' | 'half' | 'third';

  // 검증 (Zod 스키마로 변환됨)
  validate?: {
    email?: boolean;
    url?: boolean;
    positive?: boolean;       // number > 0
    integer?: boolean;
    nonEmpty?: boolean;
  };
}

// --- Form Definition (메타데이터) ---
export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];

  // 제출 설정
  submit: {
    label: string;            // 버튼 텍스트 (사각 8-12px)
    method: 'POST' | 'PATCH';
    endpoint: string;         // '/api/v1/reservations'

    // 제출 후 동작
    onSuccess?: 'redirect' | 'message' | 'reset';
    successMessage?: string;
    redirectUrl?: string;
  };

  // 레이아웃 (사장님 취향)
  layout?: {
    columns?: 1 | 2 | 3;      // 그리드 컬럼
    gap?: 'sm' | 'md' | 'lg'; // 8px / 16px / 24px
  };
}

// --- Example: Restaurant Reservation Form (메타데이터만으로 정의) ---
export const reservationFormSchema: FormSchema = {
  id: 'reservation',
  title: '예약하기',
  description: '3클릭 안에 예약 완료',
  fields: [
    {
      name: 'customer_name',
      label: '이름',
      type: 'text',
      placeholder: '홍길동',
      required: true,
      width: 'half',
    },
    {
      name: 'customer_phone',
      label: '전화번호',
      type: 'tel',
      placeholder: '+995 599 12 34 56',
      required: true,
      width: 'half',
    },
    {
      name: 'date',
      label: '날짜',
      type: 'date',
      required: true,
      width: 'third',
    },
    {
      name: 'time',
      label: '시간',
      type: 'select',
      required: true,
      width: 'third',
      options: [
        { label: '12:00', value: '12:00' },
        { label: '14:00', value: '14:00' },
        { label: '18:00', value: '18:00' },
        { label: '19:00', value: '19:00' },
        { label: '20:00', value: '20:00' },
      ],
    },
    {
      name: 'party_size',
      label: '인원',
      type: 'number',
      defaultValue: 2,
      min: 1,
      max: 20,
      required: true,
      width: 'third',
    },
    {
      name: 'notes',
      label: '요청사항',
      type: 'textarea',
      placeholder: '알레르기, 특별 요구사항 등',
      width: 'full',
    },
  ],
  submit: {
    label: '예약 확정',
    method: 'POST',
    endpoint: '/api/v1/reservations',
    onSuccess: 'message',
    successMessage: '예약이 완료되었습니다!',
  },
  layout: {
    columns: 3,
    gap: 'md',
  },
};
