// ============================================================
// Reference Catalog — 세계 최고 제품에서 추출한 디자인 원리
// 복사가 아닌 원리(principle)의 일반화
// ============================================================

export interface ReferencePattern {
  id: string;
  product: string;
  category: string;
  principles: { principle: string; howToApply: string }[];
}

// --- Apple ---
export const apple: ReferencePattern = {
  id: 'ref-apple',
  product: 'Apple',
  category: 'premium-hardware',
  principles: [
    { principle: 'Hero = single focal point', howToApply: '랜딩 상단에 1개의 핵심 메시지 + 1개의 제품 이미지만. 다른 요소는 제거.' },
    { principle: 'Whitespace = luxury', howToApply: '섹션 간 96-128px. 콘텐츠 너비는 1024px 이하. 여백이 곧 가치.' },
    { principle: 'Typography hierarchy via weight', howToApply: '같은 폰트군에서 weight(700→400→300)로 계층. 폰트 패밀리 늘리지 않음.' },
    { principle: 'Product image > description', howToApply: '텍스트 3문장 대신 1장의 고품질 이미지. 이미지가 설명한다.' },
    { principle: 'CTA = quiet confidence', howToApply: '과도한 색상/크기 ❌. 단정한 버튼, 명확한 라벨. "Buy" > "GET AMAZING DEAL NOW!!!"' },
    { principle: 'Dark mode parity', howToApply: '다크모드 = 단순 반전이 아님. 대비/채도 미세 조정.' },
  ],
};

// --- Stripe ---
export const stripe: ReferencePattern = {
  id: 'ref-stripe',
  product: 'Stripe',
  category: 'saas-fintech',
  principles: [
    { principle: 'Developer-first clarity', howToApply: '코드 예시가 곧 UI. 문서=제품. copy 버튼 필수.' },
    { principle: 'Subtle gradient backgrounds', howToApply: '배경에 미세한 그라데이션(blend mode). 텍스트에는 절대 ❌.' },
    { principle: 'Animation explains value', howToApply: '애니메이션이 기능을 설명 (결제 흐름 시각화). 장식이 아닌 교육.' },
    { principle: 'Dashboard = progressive disclosure', howToApply: '핵심 3개 지표 먼저. "자세히" 클릭 시 펼쳐짐. 한 번에 전부 ❌.' },
    { principle: 'Color = semantic', howToApply: '보라(brand) + 녹색(success) + 빨강(error). 의미 없는 색상 ❌.' },
  ],
};

// --- Linear ---
export const linear: ReferencePattern = {
  id: 'ref-linear',
  product: 'Linear',
  category: 'saas-project-management',
  principles: [
    { principle: 'Speed = design', howToApply: '페이지 전환 100ms 이내. 빠름이 곧 디자인 품질.' },
    { principle: 'Keyboard-first', howToApply: '모든 액션에 단축키. Cmd+K 명령 팔레트 필수.' },
    { principle: 'Dense but scannable', howToApply: '정보 밀도는 높지만, 색상 대비와 간격으로 스캔 가능.' },
    { principle: 'Contextual side panel', howToApply: '상세 정보는 모달이 아닌 우측 패널. 메인 컨텍스트 유지.' },
    { principle: 'Subtle motion only', howToApply: '상태 전환은 100-150ms. 모션이 보이면 안 됨. 자연스러움.' },
  ],
};

// --- Notion ---
export const notion: ReferencePattern = {
  id: 'ref-notion',
  product: 'Notion',
  category: 'saas-productivity',
  principles: [
    { principle: 'Content-first UI', howToApply: 'UI 크롬(테두리/버튼) 최소화. 콘텐츠가 UI.' },
    { principle: 'Block-based layout', howToApply: '모든 것은 블록. 드래그로 재배열. 유연성 = 핵심 가치.' },
    { principle: 'Progressive toolbar', howToApply: '모든 버튼을 보여주지 않음. / 명령으로 필요 시 등장.' },
    { principle: 'Calm typography', howToApply: '기본 폰트, 충분한 line-height(1.6+). 읽는 것이 편안해야.' },
  ],
};

// --- Airbnb ---
export const airbnb: ReferencePattern = {
  id: 'ref-airbnb',
  product: 'Airbnb',
  category: 'marketplace-travel',
  principles: [
    { principle: 'Image-driven search', howToApply: '텍스트 설명보다 이미지가 결정. 카드 이미지가 곧 상품.' },
    { principle: 'Search-first IA', howToApply: '검색바가 가장 큰 UI 요소. 필터는 검색 다음.' },
    { principle: 'Trust through profiles', howToApply: '호스트 프로필 + 리뷰. 신뢰 = 거래 전환.' },
    { principle: 'Map + list synergy', howToApply: '지도와 리스트가 동기화. 공간적 이해 + 상세 정보.' },
    { principle: 'Microcopy = warmth', howToApply: '"예약 가능" > "Available". 인간적, 따뜻한 언어.' },
  ],
};

// --- Shopify ---
export const shopify: ReferencePattern = {
  id: 'ref-shopify',
  product: 'Shopify',
  category: 'ecommerce-saas',
  principles: [
    { principle: 'Admin = data density', howToApply: '관리자는 정보 밀도 높게. 주문/재고/고객 한 화면.' },
    { principle: 'Setup = guided checklist', howToApply: '온보딩 = 체크리스트. 단계별 진행. 완료율 표시.' },
    { principle: 'Empty states = actionable', howToApply: '"주문 없음" + "첫 제품 추가" 버튼. 빈 상태 = 첫 액션 유도.' },
    { principle: 'Polaris consistency', howToApply: '디자인 시스템(Polaris)의 절대적 일관성. 예외 ❌.' },
  ],
};

// --- Figma ---
export const figma: ReferencePattern = {
  id: 'ref-figma',
  product: 'Figma',
  category: 'saas-design-tool',
  principles: [
    { principle: 'Canvas = infinite', howToApply: '고정 페이지 ❌. 캔버스 패러다임. 줌/팬이 자연스러움.' },
    { principle: 'Panel system', howToApply: '좌측(레이어) + 우측(속성) + 하단(액션). 패널 접기/펼치기.' },
    { principle: 'Real-time collaboration', howToApply: '다른 사용자 커서 실시간 표시. 협업이 보임.' },
    { principle: 'Toolbar = contextual', howToApply: '선택한 객체에 따라 툴바 변경. 필요할 때만 등장.' },
  ],
};

// --- GitHub ---
export const github: ReferencePattern = {
  id: 'ref-github',
  product: 'GitHub',
  category: 'saas-developer',
  principles: [
    { principle: 'Code = first-class content', howToApply: '코드 블록이 monospace로 명확히. 라인 번호 + 신택스 하이라이트.' },
    { principle: 'Tab navigation', howToApply: 'Code/Issues/PR/Actions 탭. 각 탭 = 독립 컨텍스트.' },
    { principle: 'Diff visualization', howToApply: '변경 사항이 색상(green/red)으로 명확히. 줄 단위 비교.' },
    { principle: 'Status badges', howToApply: 'CI/CD 상태가 배지로 표시. 빌드 상태가 한눈에.' },
  ],
};

// --- 전체 카탈로그 ---
export const referenceCatalog: ReferencePattern[] = [
  apple, stripe, linear, notion, airbnb, shopify, figma, github,
];
