// ============================================================
// Industry Profiles — 산업별 디자인 기본값
// 새 산업 추가 시 이 파일만 확장하면 됨
// ============================================================

export interface IndustryProfile {
  id: string;
  industry: string;
  dna: {
    premium: number;
    warm: number;
    calm: number;
    minimal: number;
    precise: number;
    bold: number;
  };
  recommendedScreens: string[];
  recommendedPatterns: string[];   // pattern-library IDs
  uxFlow: string[];
  keyComponents: string[];
  colorOverride?: {
    primary?: string;
    accent?: string;
  };
}

// --- Restaurant ---
export const restaurant: IndustryProfile = {
  id: 'ind-restaurant',
  industry: 'restaurant',
  dna: { premium: 6, warm: 7, calm: 6, minimal: 8, precise: 8, bold: 5 },
  recommendedScreens: ['landing', 'menu', 'reservation', 'admin'],
  recommendedPatterns: ['pat-search', 'pat-reservation', 'pat-detail', 'pat-admin-table', 'pat-empty'],
  uxFlow: [
    '랜딩 → 메뉴 보기 → 상세 → 예약',
    '랜딩 → 예약 (직접)',
    '관리자 → 메뉴 관리 → 예약 확인',
  ],
  keyComponents: ['menu-grid', 'reservation-form', 'category-filter', 'search-bar'],
  colorOverride: { primary: '#111827', accent: '#003478' },
};

// --- Hotel ---
export const hotel: IndustryProfile = {
  id: 'ind-hotel',
  industry: 'hotel',
  dna: { premium: 9, warm: 6, calm: 8, minimal: 8, precise: 8, bold: 3 },
  recommendedScreens: ['landing', 'rooms', 'booking', 'admin'],
  recommendedPatterns: ['pat-search', 'pat-reservation', 'pat-detail', 'pat-admin-table', 'pat-empty'],
  uxFlow: [
    '랜딩 → 객실 목록 → 객실 상세 → 예약',
    '랜딩 → 체크 인/아웃 날짜 → 객실 선택 → 예약',
  ],
  keyComponents: ['room-grid', 'booking-form', 'date-picker', 'gallery'],
  colorOverride: { primary: '#0F172A', accent: '#B8860B' },
};

// --- Healthcare ---
export const healthcare: IndustryProfile = {
  id: 'ind-healthcare',
  industry: 'healthcare',
  dna: { premium: 7, warm: 8, calm: 9, minimal: 9, precise: 8, bold: 2 },
  recommendedScreens: ['landing', 'doctors', 'appointment', 'patient-portal'],
  recommendedPatterns: ['pat-reservation', 'pat-detail', 'pat-admin-table', 'pat-empty', 'pat-dashboard-nav'],
  uxFlow: [
    '랜딩 → 의료진 → 예약 → 사전 문진',
    '환자 포털 → 예약 확인 → 처방전 확인',
  ],
  keyComponents: ['doctor-card', 'appointment-form', 'patient-dashboard'],
  colorOverride: { primary: '#0F4C5C', accent: '#5F8B95' },
};

// --- SaaS ---
export const saas: IndustryProfile = {
  id: 'ind-saas',
  industry: 'saas',
  dna: { premium: 8, warm: 3, calm: 7, minimal: 8, precise: 8, bold: 6 },
  recommendedScreens: ['landing', 'pricing', 'docs', 'dashboard'],
  recommendedPatterns: ['pat-pricing', 'pat-dashboard-nav', 'pat-onboarding', 'pat-admin-table', 'pat-empty'],
  uxFlow: [
    '랜딩 → 기능 → 요금제 → 가입',
    '가입 → 온보딩 체크리스트 → 대시보드',
  ],
  keyComponents: ['feature-grid', 'pricing-table', 'dashboard', 'command-palette'],
};

// --- Education ---
export const education: IndustryProfile = {
  id: 'ind-education',
  industry: 'education',
  dna: { premium: 6, warm: 8, calm: 7, minimal: 7, precise: 7, bold: 5 },
  recommendedScreens: ['landing', 'courses', 'enrollment', 'student-portal'],
  recommendedPatterns: ['pat-search', 'pat-detail', 'pat-onboarding', 'pat-admin-table', 'pat-empty'],
  uxFlow: [
    '랜딩 → 강의 목록 → 강의 상세 → 수강 신청',
  ],
  keyComponents: ['course-card', 'enrollment-form', 'progress-tracker'],
};

// --- Marketplace ---
export const marketplace: IndustryProfile = {
  id: 'ind-marketplace',
  industry: 'marketplace',
  dna: { premium: 7, warm: 6, calm: 6, minimal: 7, precise: 8, bold: 5 },
  recommendedScreens: ['landing', 'search', 'detail', 'cart', 'seller'],
  recommendedPatterns: ['pat-search', 'pat-detail', 'pat-admin-table', 'pat-empty'],
  uxFlow: [
    '랜딩 → 검색 → 상세 → 장바구니 → 결제',
    '판매자 → 상품 등록 → 주문 관리',
  ],
  keyComponents: ['search-bar', 'product-grid', 'cart', 'checkout', 'review'],
};

// --- Travel ---
export const travel: IndustryProfile = {
  id: 'ind-travel',
  industry: 'travel',
  dna: { premium: 8, warm: 7, calm: 6, minimal: 7, precise: 8, bold: 6 },
  recommendedScreens: ['landing', 'search', 'tour-detail', 'booking', 'admin'],
  recommendedPatterns: ['pat-search', 'pat-reservation', 'pat-detail', 'pat-admin-table', 'pat-empty'],
  uxFlow: [
    '랜딩 → 투어 검색 → 상세 → 예약 → 결제',
  ],
  keyComponents: ['search-bar', 'tour-card', 'gallery', 'booking-form'],
};

// --- 전체 프로파일 ---
export const allProfiles: IndustryProfile[] = [
  restaurant, hotel, healthcare, saas, education, marketplace, travel,
];

// --- 조회 함수 ---
export function getProfile(industry: string): IndustryProfile | undefined {
  return allProfiles.find((p) => p.industry === industry);
}
