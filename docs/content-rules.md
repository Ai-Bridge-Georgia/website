# Content Rules — AI Bridge Georgia

## 발행 캘린더 (주간)

| 요일 | 채널 | 내용 |
|---|---|---|
| 월 | Instagram | 주간 인사 + 비하인드 |
| 화 | Blog (MDX) | 딥다이브 아티클 (2000-3000단어) |
| 수 | LinkedIn | 비즈니스 인사이트 |
| 목 | Instagram | 프로젝트 쇼케이스 |
| 금 | Blog (MDX) | 라이트 아티클 + 사장님 칼럼 |

## SNS 톤 가이드 (sajagnim-voice)

### Instagram (브랜드)
- 톤: 따뜻함 (Nouwen) + 시각적
- 예: "트빌리시에서 만나는 진짜 한국의 따뜻함."

### LinkedIn (비즈니스)
- 톤: 단단함 (Stott) + 데이터
- 예: "AI 자동화가 선교 현장에서 어떻게 쓰이는가."

### Facebook (커뮤니티)
- 톤: 중간 (Stott + Nouwen)
- 예: "9명 AI 직원이 24/7 일합니다. 그 이야기."

## 댓글 응대 규칙

| 타입 | 응대 | 에스컬레이션 |
|---|---|---|
| 긍정 ("좋아요!") | ✅ 자동 감사 | ❌ |
| 질문 (FAQ) | ✅ 자동 답변 | ❌ |
| 부정 (불만) | ⚠️ 1차 응대 + 사과 | 사장님 (24h) |
| 민감 (종교/정치) | ❌ 자동 ❌ | **즉시 사장님** |
| 스팸/악성 | 🚫 차단 + 삭제 | 기록 |

## Buffer 셋업 (사장님 신호 시)

1. https://buffer.com 가입 (Free — 3 채널)
2. 채널 연결: Instagram + Facebook + LinkedIn
3. API key 발급 (사장님)
4. .env 에 `BUFFER_API_KEY` 추가
5. Cara 가 주간 예약 자동화

## 블로그 시스템 (Next.js MDX)

```
app/blog/
├── [slug]/
│   └── page.tsx
├── page.tsx (목록)
└── content/
    ├── ai-bridge-georgia-story.mdx
    ├── vibecoding-survival.mdx
    └── ...
```

### MDX Frontmatter
```yaml
---
title: "제목"
description: "설명 (160자)"
date: "2026-06-24"
tags: ["AI", "조지아"]
image: "/images/blog/xxx.jpg"
---
```
