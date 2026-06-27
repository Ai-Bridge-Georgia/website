// ============================================================
// Pattern Library — 재사용 가능한 디자인 패턴
// 특정 제품이 아닌 일반화된 패턴
// ============================================================

export interface DesignPattern {
  id: string;
  name: string;
  category: string;          // 'layout' | 'flow' | 'component' | 'state'
  problem: string;           // 이 패턴이 해결하는 문제
  solution: string;          // 어떻게 해결하는가
  structure: string[];       // 구조 (섹션/단계)
  references: string[];      // 참조한 제품
  industries: string[];      // 적용 가능 산업
}

// --- 1. Pricing Layout Pattern ---
export const pricingLayout: DesignPattern = {
  id: 'pat-pricing',
  name: 'Pricing Layout',
  category: 'layout',
  problem: '요금제를 명확하게 비교하기 어려움',
  solution: '3열 카드 + 중간 강조(Highlight) + 기능 비교표',
  structure: [
    '헤더 (요금제 종류: 월간/연간 토글)',
    '3개 카드 (Basic / Pro / Enterprise) — 중간(Pro)이 시각적 강조',
    '각 카드: 가격(대형) + 기능 목록(checkmark) + CTA 버튼',
    '하단: 상세 비교표 (collapsible)',
  ],
  references: ['stripe', 'linear', 'shopify'],
  industries: ['saas', 'it'],
};

// --- 2. Dashboard Navigation Pattern ---
export const dashboardNav: DesignPattern = {
  id: 'pat-dashboard-nav',
  name: 'Dashboard Navigation',
  category: 'layout',
  problem: '관리자 대시보드에서 길을 잃음',
  solution: '좌측 고정 사이드바 + 상단 페이지 타이틀 + 브레드크럼',
  structure: [
    '좌측 사이드바 (240px, 고정): 메뉴 그룹 (핵심/설정)',
    '상단: 현재 페이지 타이틀 + 액션 버튼(+新建)',
    '메인 영역: 데이터 테이블 or 카드 그리드',
    '사이드바 = 모바일에서 햄버거 메뉴',
  ],
  references: ['linear', 'shopify', 'github'],
  industries: ['saas', 'ecommerce', 'restaurant', 'hotel'],
};

// --- 3. Reservation Flow Pattern ---
export const reservationFlow: DesignPattern = {
  id: 'pat-reservation',
  name: 'Reservation Flow',
  category: 'flow',
  problem: '예약 과정이 복잡해서 이탈',
  solution: '단계 축소 (1페이지) + 명확한 필드 + 즉시 확인',
  structure: [
    '단일 페이지 폼 (다단계 ❌ — 이탈 증가)',
    '필수 필드만: 이름 / 날짜 / 인원 (3개 이하)',
    '날짜 선택: 달력(datepicker) + 시간 슬롯 버튼',
    '인원: +/- 스텝퍼 (드롭다운 ❌)',
    '제출 후: 즉시 성공 화면 (전환, 메시지 아님)',
  ],
  references: ['airbnb', 'shopify'],
  industries: ['restaurant', 'hotel', 'hospital'],
};

// --- 4. Search Result Pattern ---
export const searchResult: DesignPattern = {
  id: 'pat-search',
  name: 'Search Result',
  category: 'component',
  problem: '검색 결과가 많을 때 스캔이 어려움',
  solution: '대형 서치바 + 필터 칩 + 카드 그리드 + 빈 상태',
  structure: [
    '서치바 (48px, 중앙, 아마존 스타일)',
    '필터 칩 (pill button, 카테고리별)',
    '결과 그리드 (3col 데스크톱 / 1col 모바일)',
    '카드: 이미지(4:3) + 타이틀 + 가격 + 배지',
    '빈 상태: 아이콘 + "결과 없음" + 검색어 초기화 버튼',
  ],
  references: ['airbnb', 'shopify'],
  industries: ['restaurant', 'ecommerce', 'marketplace'],
};

// --- 5. Admin Table Pattern ---
export const adminTable: DesignPattern = {
  id: 'pat-admin-table',
  name: 'Admin Table',
  category: 'component',
  problem: '관리자 테이블 정보가 너무 많아 혼란',
  solution: '핵심 컬럼만 + 행 액션 + 페이지네이션 + 일괄 삭제',
  structure: [
    '헤더: 페이지 타이틀 + "새 항목" 버튼',
    '필터 바: 검색 + 상태 필터 (드롭다운)',
    '테이블: 체크박스 + 핵심 컬럼(3-5개) + 액션(수정/삭제)',
    '행 hover: bg-surface',
    '빈 상태: "데이터 없음" + "첫 항목 추가"',
    '페이지네이션 또는 "더 보기"',
  ],
  references: ['shopify', 'github', 'linear'],
  industries: ['saas', 'restaurant', 'hotel', 'ecommerce'],
};

// --- 6. Detail Page Pattern ---
export const detailPage: DesignPattern = {
  id: 'pat-detail',
  name: 'Detail Page',
  category: 'layout',
  problem: '상세 정보가 많을 때 구조가 흐트러짐',
  solution: '이미지 헤로 + 구조화 정보 + 관련 추천',
  structure: [
    '상단: 풀너비 이미지 (16:9) + 뒤로 링크',
    '제목 + 가격 + 상태 배지',
    '설명 (body text, 최대 3문단)',
    '정보 테이블 (키-값 쌍)',
    'CTA (예약/주문 버튼)',
    '관련 항목 (같은 카테고리 3개 카드)',
  ],
  references: ['airbnb', 'shopify'],
  industries: ['restaurant', 'hotel', 'ecommerce'],
};

// --- 7. Empty State Pattern ---
export const emptyState: DesignPattern = {
  id: 'pat-empty',
  name: 'Empty State',
  category: 'state',
  problem: '데이터가 없을 때 빈 화면 = 포기',
  solution: '일러스트 + 명확한 메시지 + 다음 액션 버튼',
  structure: [
    '아이콘/일러스트 (48-64px, 차분한 톤)',
    '제목 (h3): 상황 설명 ("아직 메뉴가 없습니다")',
    '설명 (body secondary): 이유 + 안내',
    '액션 버튼: "첫 메뉴 추가하기" / "다시 검색"',
  ],
  references: ['shopify', 'linear', 'notion'],
  industries: ['all'],
};

// --- 8. Onboarding Checklist Pattern ---
export const onboardingChecklist: DesignPattern = {
  id: 'pat-onboarding',
  name: 'Onboarding Checklist',
  category: 'flow',
  problem: '신규 사용자가 무엇을 해야 할지 모름',
  solution: '단계별 체크리스트 + 진행률 + 즉각적 보상',
  structure: [
    '진행률 바 (0% → 100%)',
    '체크리스트 (4-6개 항목): 매장 정보 / 메뉴 추가 / 예약 설정 / 디자인 선택',
    '각 항목: 완료 시 체크 + 약간의 애니메이션',
    '완료 시: 축하 메시지 + 다음 단계',
  ],
  references: ['shopify', 'linear'],
  industries: ['saas', 'restaurant', 'hotel'],
};

// --- 전체 패턴 ---
export const allPatterns: DesignPattern[] = [
  pricingLayout, dashboardNav, reservationFlow, searchResult,
  adminTable, detailPage, emptyState, onboardingChecklist,
];
