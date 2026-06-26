// ============================================================
// Business OS — Design Tokens (제1계층: 고정)
// 사장님 친필: "AI 뻔한 디자인 ❌, 항상 $10,000 수준"
// guardrails #17-18, #21-22
// ============================================================

export const tokens = {
  // --- Spacing (8px 기반) ---
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',   // 사장님: 섹션 간격
  },

  // --- Radius (사각 둥근 모서리만, 원형 ❌) ---
  radius: {
    button: '8px',     // sm/md 버튼
    buttonLg: '12px',  // lg 버튼
    card: '12px',
    input: '8px',
    // ❌ "circle" 절대 없음
  },

  // --- Typography (뻔한 폰트 ❌) ---
  font: {
    sans: 'Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'Pretendard, Inter, sans-serif',
    mono: 'SF Mono, Fira Code, monospace',
  },

  // --- Layout ---
  layout: {
    maxWidth: '1200px',
    sectionGap: '96px',        // 사장님: 여백
    sectionGapMobile: '48px',
    lineHeight: '1.6',         // 사장님: line-height
  },

  // --- Colors (기본값, 테마로 덮어쓰기 가능 = 제3계층) ---
  color: {
    primary: 'var(--theme-primary, #0A0A0A)',
    accent: 'var(--theme-accent, #3B82F6)',
    neutral: {
      0: '#FFFFFF',
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      400: '#A3A3A3',
      600: '#525252',
      800: '#262626',
      900: '#0A0A0A',
    },
  },

  // --- Transitions (의도적 모션) ---
  transition: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease',
  },

  // --- Image Rules ---
  image: {
    format: 'webp',   // JPG/PNG ❌ (guardrail #21)
    logoFormat: 'svg', // PNG/JPG ❌ (guardrail #22)
  },
} as const;

// --- AI 뻔한 디자인 금지 (guardrails #17-18) ---
export const DESIGN_BANS = [
  'gradient-text',
  'ai-palette',
  'glassmorphism-abuse',
  'circular-buttons',
  'boost-productivity-copy',
  'meaningless-numbering',
] as const;
