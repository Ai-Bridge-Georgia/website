# Coding Standards

## TypeScript
- `strict: true` 필수
- `any` 사용 금지 → 구체적 타입 정의
- 인터페이스优于 type alias (객체)

## Naming
- 변수: `camelCase`
- 컴포넌트/클래스: `PascalCase`
- 상수: `SCREAMING_SNAKE_CASE`
- 파일: `kebab-case.ts` 또는 `PascalCase.tsx`

## 한국어 주석
- 복잡한 로직에만 한국어 주석 허용
- 단순한 코드는 주석 ❌

## Error Handling
- 모든 async 함수에 try-catch
- 에러는 Sentry 로 로깅
- 사용자에게 친화적 메시지

## sajagnim-voice
- 코드 톤도 사장님 톤 (단단함 + 따뜻함)
- PR 설명은 사장님이 이해할 수 있게
