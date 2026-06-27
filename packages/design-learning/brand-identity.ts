// ============================================================
// Brand Identity Engine — Brand가 분위기와 감정을 결정한다
// Brand는 구조를 바꾸지 않는다. 경험을 결정한다.
// ============================================================

// --- 12개 Brand 속성 (1-10 강도) ---
export interface BrandAttributes {
  premium: number;       // 고급스러움
  minimal: number;       // 미니멀함
  technical: number;     // 기술적/전문적
  human: number;         // 인간적/따뜻함
  calm: number;          // 차분함
  bold: number;          // 대담함
  luxury: number;        // 사치/럭셔리
  friendly: number;      // 친근함
  corporate: number;     // 기업적/격식
  mission: number;       // 미션/사명감
  innovative: number;    // 혁신적
  traditional: number;   // 전통적
}

// --- Brand Visual Profile (Generator가 사용하는 구체적 수치) ---
export interface BrandVisualProfile {
  // Color Tone
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  colorTemperature: 'warm' | 'cool' | 'neutral';

  // Typography
  fontFamily: string;
  headingWeight: number;      // 400-900
  bodyWeight: number;
  letterSpacing: string;      // '-0.02em' | '0' | '0.05em'
  lineHeight: number;         // 1.3-1.8

  // Whitespace
  sectionGapMultiplier: number;  // 1.0 = standard 96px, 1.5 = 144px
  cardPaddingMultiplier: number; // 1.0 = 24px, 1.5 = 36px
  density: 'comfortable' | 'spacious' | 'compact';

  // Motion
  motionIntensity: 'subtle' | 'moderate' | 'dynamic' | 'none';
  hoverEffect: 'color-shift' | 'shadow-lift' | 'scale' | 'none';
  transitionSpeed: number;  // ms

  // Border Style
  borderRadius: number;     // 0-16
  borderStyle: 'sharp' | 'soft' | 'rounded' | 'pill';
  shadowLevel: 'flat' | 'subtle' | 'medium' | 'elevated';

  // Copy Tone
  copyTone: 'formal' | 'casual' | 'luxury' | 'playful' | 'mission' | 'technical';
  ctaStyle: 'action' | 'invitation' | 'command' | 'suggestion';
}

// --- Brand Presets (검증용 3개) ---
export const brandPresets: Record<string, { attributes: BrandAttributes; visual: BrandVisualProfile }> = {

  // Brand A: Premium Korean (신뢰 + 미니멀 + 기술적)
  'premium-korean': {
    attributes: {
      premium: 8, minimal: 8, technical: 5, human: 5,
      calm: 7, bold: 4, luxury: 6, friendly: 4,
      corporate: 7, mission: 3, innovative: 6, traditional: 4,
    },
    visual: {
      primaryColor: '#111827',
      accentColor: '#003478',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F9FAFB',
      textColor: '#111827',
      textSecondaryColor: '#6B7280',
      borderColor: '#E5E7EB',
      colorTemperature: 'cool',
      fontFamily: 'Pretendard',
      headingWeight: 700,
      bodyWeight: 400,
      letterSpacing: '-0.02em',
      lineHeight: 1.6,
      sectionGapMultiplier: 1.0,
      cardPaddingMultiplier: 1.0,
      density: 'comfortable',
      motionIntensity: 'subtle',
      hoverEffect: 'color-shift',
      transitionSpeed: 150,
      borderRadius: 8,
      borderStyle: 'soft',
      shadowLevel: 'subtle',
      copyTone: 'formal',
      ctaStyle: 'action',
    },
  },

  // Brand B: Street Food (친근 + 캐주얼 + 인간적)
  'street-food': {
    attributes: {
      premium: 3, minimal: 5, technical: 2, human: 9,
      calm: 4, bold: 7, luxury: 1, friendly: 9,
      corporate: 1, mission: 2, innovative: 4, traditional: 6,
    },
    visual: {
      primaryColor: '#D97706',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFBEB',
      surfaceColor: '#FEF3C7',
      textColor: '#78350F',
      textSecondaryColor: '#92400E',
      borderColor: '#FDE68A',
      colorTemperature: 'warm',
      fontFamily: 'Pretendard',
      headingWeight: 800,
      bodyWeight: 400,
      letterSpacing: '0',
      lineHeight: 1.5,
      sectionGapMultiplier: 0.8,
      cardPaddingMultiplier: 0.9,
      density: 'compact',
      motionIntensity: 'moderate',
      hoverEffect: 'shadow-lift',
      transitionSpeed: 200,
      borderRadius: 12,
      borderStyle: 'rounded',
      shadowLevel: 'medium',
      copyTone: 'casual',
      ctaStyle: 'invitation',
    },
  },

  // Brand C: Luxury Fine Dining (고급 + 사치 + 전통)
  'luxury-fine-dining': {
    attributes: {
      premium: 10, minimal: 7, technical: 3, human: 4,
      calm: 8, bold: 3, luxury: 10, friendly: 2,
      corporate: 5, mission: 2, innovative: 3, traditional: 8,
    },
    visual: {
      primaryColor: '#1C1917',
      accentColor: '#B8860B',
      backgroundColor: '#FAFAF9',
      surfaceColor: '#F5F5F4',
      textColor: '#1C1917',
      textSecondaryColor: '#57534E',
      borderColor: '#E7E5E4',
      colorTemperature: 'neutral',
      fontFamily: 'Pretendard',
      headingWeight: 600,   // 더 얇게 — 럭셔리는 얇은 헤딩
      bodyWeight: 300,      // Light body — 럭셔리
      letterSpacing: '-0.01em',
      lineHeight: 1.8,      // 더 넓은 행간
      sectionGapMultiplier: 1.5,  // 더 과감한 여백
      cardPaddingMultiplier: 1.3,
      density: 'spacious',
      motionIntensity: 'subtle',
      hoverEffect: 'shadow-lift',
      transitionSpeed: 300,       // 더 느린 모션
      borderRadius: 4,            // 더 날카로운 — 럭셔리
      borderStyle: 'sharp',
      shadowLevel: 'flat',        // 거의 그림자 없음 — 럭셔리
      copyTone: 'luxury',
      ctaStyle: 'invitation',
    },
  },
};

// --- Brand 해석 함수 ---
export function resolveBrand(brandKey?: string): { attributes: BrandAttributes; visual: BrandVisualProfile } {
  if (brandKey && brandPresets[brandKey]) {
    return brandPresets[brandKey];
  }
  // 기본값 = premium-korean
  return brandPresets['premium-korean'];
}

// --- CSS 변수 생성 (Generator가 사용) ---
export function brandToCssVars(visual: BrandVisualProfile): string {
  return `:root {
  --color-primary: ${visual.primaryColor};
  --color-accent: ${visual.accentColor};
  --color-bg: ${visual.backgroundColor};
  --color-surface: ${visual.surfaceColor};
  --color-text: ${visual.textColor};
  --color-text-secondary: ${visual.textSecondaryColor};
  --color-border: ${visual.borderColor};
  --font-family: "${visual.fontFamily}", sans-serif;
  --heading-weight: ${visual.headingWeight};
  --body-weight: ${visual.bodyWeight};
  --letter-spacing: ${visual.letterSpacing};
  --line-height: ${visual.lineHeight};
  --section-gap: ${Math.round(96 * visual.sectionGapMultiplier)}px;
  --card-padding: ${Math.round(24 * visual.cardPaddingMultiplier)}px;
  --radius: ${visual.borderRadius}px;
  --transition-speed: ${visual.transitionSpeed}ms;
}`;
}
