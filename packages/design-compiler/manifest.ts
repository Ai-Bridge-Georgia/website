// ============================================================
// UI Manifest — 입력 스키마
// 사람이 이것만 작성하면 AI 프롬프트 4개가 자동 생성됨
// ============================================================

export interface UIManifest {
  industry: string;
  brand: {
    name: string;
    tagline?: string;
    primaryColor?: string;   // #003478
    accentColor?: string;    // #FF0000
    font?: string;           // Pretendard
    language: string;        // 'ko' | 'en' | 'ka'
  };
  dna: {
    premium?: number;   // 1-10
    warm?: number;
    calm?: number;
    minimal?: number;
    precise?: number;
    bold?: number;
  };
  target: {
    country: string;
    audience: string;
  };
  screens: string[];         // ['landing', 'menu', 'reservation']
  style: {
    darkMode?: boolean;
    radius?: number;         // 8-12
    spacing?: number;        // 8
  };
  tech?: {
    framework?: string;      // 'next' | 'react' | 'html'
    css?: string;            // 'tailwind' | 'css'
  };
}

// --- 기본값 ---
export const defaultManifest: UIManifest = {
  industry: 'restaurant',
  brand: {
    name: '한국의 맛',
    primaryColor: '#111827',
    accentColor: '#003478',
    font: 'Pretendard',
    language: 'ko',
  },
  dna: {
    premium: 8,
    warm: 5,
    calm: 7,
    minimal: 8,
    precise: 8,
    bold: 4,
  },
  target: {
    country: 'Georgia',
    audience: 'Local Georgian and Korean expats',
  },
  screens: ['landing', 'menu', 'reservation'],
  style: {
    darkMode: false,
    radius: 8,
    spacing: 8,
  },
  tech: {
    framework: 'next',
    css: 'tailwind',
  },
};
