# Architecture — AI Bridge Georgia

## 시스템 구조

```
aibridgegeorgia.tech (Vercel)
         │
    ┌────┴────┐
    │ Next.js │ (FE — Felix)
    │ + Hono  │ (BE — Beck)
    └────┬────┘
         │
    ┌────┴────┐
    │Supabase │ (PostgreSQL + Auth + Storage)
    └─────────┘

External APIs:
  - FAL.ai (이미지)
  - ElevenLabs (음성)
  - Linear (이슈 트래킹)
  - Slack (알림)
  - GA4 (분석)
```

## 디렉토리 구조

```
/
├── app/              # Next.js App Router (FE)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── src/
│   └── api/          # Hono API routes (BE)
│       ├── routes/
│       ├── middleware/
│       └── schema/
├── docs/             # 개발 문서
├── .claude/
│   └── skills/       # 8개 Claude Code 스킬
├── AGENTS.md         # 헌법
├── next.config.js
└── package.json
```
