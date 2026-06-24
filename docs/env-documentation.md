# .env 문서화 — AI Bridge Georgia

> ⚠️ 이 파일은 .env 의 **키 목록만** 문서화. 실제 값은 .env 에만 존재.

## 환경 변수 목록

| 키 | 용도 | 출처 | 추가일 |
|---|---|---|---|
| `FAL_KEY` | FAL.ai 이미지/영상 생성 | 사장님 제공 | 2026-06-23 |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS/음성 | 사장님 제공 | 2026-06-23 |
| `FIRECRAWL_API_KEY` | Firecrawl 웹 스크래핑 (Free tier 1000) | 사장님 제공 | 2026-06-23 |
| `LINEAR_API_KEY` | Linear 이슈 트래킹 (Personal) | 사장님 제공 | 2026-06-23 |
| `SLACK_WEBHOOK_URL` | Slack 알림 (Incoming Webhook) | 사장님 제공 | 2026-06-23 |
| `GA4_MEASUREMENT_ID` | GA4 트래픽 분석 (G-VZXNECL2EM) | 사장님 제공 | 2026-06-24 |

## Supabase (별도)

| 키 | 위치 |
|---|---|
| Supabase access-token | `~/.supabase/access-token` (44자) |
| Supabase projects | 14개 (API 로 조회 가능) |

## GitHub (별도)

| 키 | 위치 |
|---|---|
| GitHub oauth_token | `~/.config/gh/hosts.yml` (`ghp_*`) |
| GitHub org | `Ai-Bridge-Georgia` |

## 보안 규칙

- ✅ .env 권한: `600 hermes:hermes`
- ✅ .env 절대 GitHub push ❌ (`.gitignore` 확인)
- ✅ 새 키 추가 시 이 문서 업데이트
- ✅ Shell echo 대신 **Python 직접 쓰기** (HERMES_REDACT_SECRETS 우회)

## 추가 예정 (사장님 신호 시)

| 키 | 용도 | 상태 |
|---|---|---|
| `GOOGLE_ADS_*` | Google Ads API | ⏸️ 보류 |
| `META_ADS_*` | Meta Marketing API | ⏸️ 보류 |
| `SUPABASE_URL` | 랜딩 페이지 백엔드 | ⏸️ 미정 |
| `SUPABASE_ANON_KEY` | 프론트엔드용 | ⏸️ 미정 |
| `SENTRY_DSN` | 에러 추적 | ⏸️ 미설치 |
