// ============================================================
// Experience Language Engine
// 브랜드가 사용자와 대화하는 방식 — Voice, Copy, States, Story
// ============================================================

import type { BrandVisualProfile } from './brand-identity';

// --- Experience Profile ---
export interface ExperienceProfile {
  voice: VoiceProfile;
  microCopy: MicroCopyProfile;
  states: StateExperience;
  story: StoryProfile;
  photography: PhotographyProfile;
  motion: MotionPersonality;
}

// --- Voice ---
export interface VoiceProfile {
  tone: 'formal' | 'casual' | 'luxury' | 'playful' | 'mission' | 'technical';
  formality: number;       // 1-10 (1=캐주얼, 10=격식)
  warmth: number;          // 1-10 (1=차가움, 10=따뜻함)
  brevity: number;         // 1-10 (1=장황, 10=간결)
  pronoun: '격식체' | '친근체' | '존경어';
}

// --- Micro Copy ---
export interface MicroCopyProfile {
  success: string;         // 예약 성공 메시지
  error: string;           // 에러 메시지 템플릿
  empty: string;           // 빈 상태 메시지
  loading: string;         // 로딩 메시지
  confirm: string;         // 삭제/취소 확인
  ctaPrimary: string;      // 주 CTA 버튼
  ctaSecondary: string;    // 보조 CTA
  placeholder: string;     // 검색 placeholder
  footer: string;          // 푸터 카피
  hero: string;            // 히어로 카피
}

// --- State Experience ---
export interface StateExperience {
  loadingStyle: 'skeleton' | 'spinner' | 'shimmer' | 'progress-bar';
  loadingSpeed: 'instant' | 'fast' | 'patient' | 'slow';
  successStyle: 'quiet' | 'celebrating' | 'formal' | 'warm';
  errorStyle: 'apologetic' | 'helpful' | 'technical' | 'calm';
  emptyStyle: 'minimal' | 'encouraging' | 'luxury' | 'actionable';
}

// --- Story ---
export interface StoryProfile {
  heroHeadline: string;
  heroSubtitle: string;
  valueProps: string[];
  aboutCopy: string;
}

// --- Photography ---
export interface PhotographyProfile {
  style: 'editorial' | 'documentary' | 'product' | 'natural' | 'minimal';
  lighting: 'bright' | 'moody' | 'natural' | 'high-contrast';
  tone: 'warm' | 'cool' | 'neutral' | 'vibrant';
  subject: 'close-up' | 'wide' | 'lifestyle' | 'detail';
}

// --- Motion Personality ---
export interface MotionPersonality {
  character: 'elegant' | 'snappy' | 'gentle' | 'stable' | 'playful';
  speed: number;           // ms 기준 (100=빠름, 400=느림)
  easingCurve: string;
  hoverResponse: 'subtle' | 'lift' | 'glow' | 'bounce';
  pageTransition: 'fade' | 'slide' | 'scale' | 'none';
}

// ============================================================
// BRAND → EXPERIENCE MAPPING
// ============================================================

export function resolveExperience(brandKey: string): ExperienceProfile {
  const map: Record<string, ExperienceProfile> = {
    // --- Premium Korean ---
    'premium-korean': {
      voice: { tone: 'formal', formality: 7, warmth: 5, brevity: 8, pronoun: '격식체' },
      microCopy: {
        success: '예약이 완료되었습니다.',
        error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        empty: '표시할 내용이 없습니다.',
        loading: '불러오는 중...',
        confirm: '정말 삭제하시겠습니까?',
        ctaPrimary: '예약하기',
        ctaSecondary: '더 알아보기',
        placeholder: '검색어를 입력하세요',
        footer: '© 2026 한국의 맛. All rights reserved.',
        hero: '정통 한국 요리를 만나보세요',
      },
      states: {
        loadingStyle: 'skeleton', loadingSpeed: 'fast',
        successStyle: 'quiet', errorStyle: 'helpful', emptyStyle: 'minimal',
      },
      story: {
        heroHeadline: '한국의 맛',
        heroSubtitle: '신선한 재료, 정성껏 만든 음식',
        valueProps: ['신선한 재료', '정통 레시피', '합리적인 가격'],
        aboutCopy: '정통 한국 요리를 조지아에 소개합니다.',
      },
      photography: { style: 'natural', lighting: 'natural', tone: 'neutral', subject: 'lifestyle' },
      motion: { character: 'stable', speed: 150, easingCurve: 'ease', hoverResponse: 'subtle', pageTransition: 'fade' },
    },

    // --- Street Food ---
    'street-food': {
      voice: { tone: 'playful', formality: 2, warmth: 9, brevity: 7, pronoun: '친근체' },
      microCopy: {
        success: '자리 잡았어요! 곧 뵐게요 🔥',
        error: '앗, 뭔가 꼬였어요! 다시 한 번만요?',
        empty: '앗, 아직 메뉴가 없네요! 곧 추가될 거예요.',
        loading: '금방 가져올게요!',
        confirm: '진짜 지울 거예요?',
        ctaPrimary: '자리 잡기',
        ctaSecondary: '메뉴 구경하기',
        placeholder: '뭐 드시고 싶으세요?',
        footer: '© 2026 우리 가게. 맛있게 드세요!',
        hero: '진짜 한국 맛, 지금 바로!',
      },
      states: {
        loadingStyle: 'shimmer', loadingSpeed: 'instant',
        successStyle: 'celebrating', errorStyle: 'helpful', emptyStyle: 'encouraging',
      },
      story: {
        heroHeadline: '진짜 한국 맛!',
        heroSubtitle: '부담 없이 즐기는 정통 길거리 음식',
        valueProps: ['빠르고 맛있게', '진짜 한국 맛', '가격도 착해요'],
        aboutCopy: '한국의 길거리 음식을 트빌리시에!',
      },
      photography: { style: 'documentary', lighting: 'bright', tone: 'warm', subject: 'close-up' },
      motion: { character: 'snappy', speed: 200, easingCurve: 'cubic-bezier(0.34, 1.56, 0.64, 1)', hoverResponse: 'bounce', pageTransition: 'slide' },
    },

    // --- Luxury Fine Dining ---
    'luxury-fine-dining': {
      voice: { tone: 'luxury', formality: 9, warmth: 4, brevity: 9, pronoun: '존경어' },
      microCopy: {
        success: '예약이 준비되었습니다. 귀하를 모시겠습니다.',
        error: '서비스에 불편을 드려 대단히 죄송합니다. 잠시 후 다시 이용해 주시기 바랍니다.',
        empty: '현재 표시할 정보가 없습니다.',
        loading: '준비 중입니다...',
        confirm: '삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        ctaPrimary: '예약 요청하기',
        ctaSecondary: '더 알아보기',
        placeholder: '검색',
        footer: '© 2026. 모든 권리 보유.',
        hero: '한국 요리의 정수',
      },
      states: {
        loadingStyle: 'shimmer', loadingSpeed: 'patient',
        successStyle: 'formal', errorStyle: 'apologetic', emptyStyle: 'luxury',
      },
      story: {
        heroHeadline: '한국 요리의 정수',
        heroSubtitle: '전통을 현대적으로 재해석하다',
        valueProps: ['엄선된 식재료', '장인의 솜씨', '잊지 못할 경험'],
        aboutCopy: '한국 전통 요리의 깊은 맛을 현대적으로 재해석합니다.',
      },
      photography: { style: 'editorial', lighting: 'moody', tone: 'cool', subject: 'detail' },
      motion: { character: 'elegant', speed: 300, easingCurve: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', hoverResponse: 'lift', pageTransition: 'fade' },
    },
  };

  return map[brandKey] ?? map['premium-korean'];
}
