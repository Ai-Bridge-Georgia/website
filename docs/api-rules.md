# API Rules — AI Bridge Georgia

## 엔드포인트 명명 규칙

| 규칙 | 예시 |
|---|---|
| 버저닝 | `/api/v1/` prefix 필수 |
| 리소스 중심 | `/api/v1/contacts`, `/api/v1/services` |
| 복수형 | `/api/v1/reservations` (단수 ❌) |
| ID | `/api/v1/contacts/:id` |
| 액션 | `/api/v1/contacts/:id/archive` (커스텀 액션) |

## HTTP 메서드

| 메서드 | 용도 | 예시 |
|---|---|---|
| GET | 조회 | `GET /api/v1/contacts` |
| POST | 생성 | `POST /api/v1/contacts` |
| PATCH | 부분 수정 | `PATCH /api/v1/contacts/:id` |
| PUT | 전체 수정 | `PUT /api/v1/contacts/:id` |
| DELETE | 삭제 | `DELETE /api/v1/contacts/:id` |

## 응답 형식

### 성공 (200/201)
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

### 에러 (4xx/5xx)
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "이메일은 필수입니다",
    "field": "email"
  }
}
```

## 인증

| 엔드포인트 | 인증 |
|---|---|
| 공개 (GET 서비스 등) | Anon Key |
| 사용자 (문의 등록) | Anon Key + RLS |
| 관리자 (전체 조회) | Service Role Key (서버만) |

## Rate Limiting
- 공개 API: 100 req/min (IP 기준)
- 인증 API: 1000 req/min (사용자 기준)

## 페이지네이션
- 기본: `?page=1&limit=20`
- Cursor 기반 권장: `?cursor=abc123&limit=20`

## Validation (Zod)
- 모든 request body 는 Zod schema 로 검증
- Validation 실패 시 400 + field 별 에러 메시지
