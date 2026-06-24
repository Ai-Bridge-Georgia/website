# Analytics Rules — AI Bridge Georgia

## GA4 설정 (완료)

| 항목 | 값 |
|---|---|
| 측정 ID | G-VZXNECL2EM |
| 도메인 | aibridgegeorgia.tech |
| Property | AI Bridge Georgia Website |

## 추적 이벤트

| 이벤트 | 트리거 | 용도 |
|---|---|---|
| `page_view` | 자동 | 모든 페이지 |
| `cta_click` | Contact 버튼 클릭 | 전환 |
| `service_inquiry` | 서비스 문의 제출 | 리드 |
| `contact_submit` | 폼 제출 | 전환 |
| `blog_read` | 블로그 50% 스크롤 | 콘텐츠 성과 |

## 보고 주기

| 주기 | 채널 | 내용 |
|---|---|---|
| 주간 | Slack + Telegram | 핵심 3가지 |
| 월간 | Slack + Telegram | KPI 리포트 |
| 이상 시 | Slack 즉시 | 급감/급증 알림 |

## Ana Python 사용법 (GA4 API)

```python
import os
from google.analytics.data import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange

client = BetaAnalyticsDataClient()
property_id = os.environ["GA4_MEASUREMENT_ID"].replace("G-", "")
request = RunReportRequest(
    property=f"properties/{property_id}",
    date_ranges=[DateRange(start_date="7daysAgo", end_date="today")],
    metrics=[{"name": "sessions"}, {"name": "totalUsers"}],
)
response = client.run_report(request)
```

## PostHog (사장님 신호 시)
- Cloud Free: 1M events/월
- 설치: `<script src="https://us.i.posthog.com/array.js">` + API key
- 용도: 제품 분석 (페이지별 체류시간, 클릭 히트맵)

## ElevenLabs 음성 인사이트

```python
import os
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
audio = client.text_to_speech.convert(
    text="사장님, 이번 주 방문자 20% 증가했습니다.",
    voice_id="EXAVITQu4vr4xnSDxMaL",
    model_id="eleven_multilingual_v2",
)
```
