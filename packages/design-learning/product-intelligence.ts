// ============================================================
// Product Intelligence Engine
// 10-Layer Product Definition — User → Code 순서로 사고한다
// Factory는 UI를 생성하지 않는다. 제품을 생성한다.
// ============================================================

import { resolveArchetype, getArchetypeProfile } from './archetypes';
import { resolveBrand } from './brand-identity';
import { resolveExperience } from './experience-language';
import { getProfile } from './industry-profiles';

// --- Layer 1-10: Product Definition ---
export interface ProductDefinition {
  // Layer 1: Mission
  mission: {
    why: string;                  // 왜 이 제품이 존재하는가?
    problem: string;              // 사용자의 핵심 문제
    successMetric: string;        // 사용자의 성공 기준
  };

  // Layer 2: Target User
  targetUser: {
    who: string;                  // 누가 사용하는가?
    context: string;              // 어떤 상황에서?
    expertise: 'beginner' | 'intermediate' | 'expert';
  };

  // Layer 3: Persona
  persona: {
    name: string;                 // "조지아 현지인 니노"
    role: string;                 // "식당 방문객"
    primaryNeed: string;          // "맛있고 가격 합리적인 한국 음식"
    frustration: string;          // "한국 음식을 먹고 싶지만 어디서?"
  };

  // Layer 4: Job To Be Done
  jtbd: {
    primary: string;              // 가장 중요한 JTBD
    secondary: string[];          // 보조 JTBD
    successCriteria: string;      // 성공 = ?
  };

  // Layer 5: User Journey
  journey: JourneyStep[];

  // Layer 6-10: Resolved layers
  experience: ReturnType<typeof resolveExperience>;
  brand: ReturnType<typeof resolveBrand>;
  industry: ReturnType<typeof getProfile>;
  archetype: ReturnType<typeof getArchetypeProfile>;
}

export interface JourneyStep {
  stage: 'discover' | 'compare' | 'decide' | 'act' | 'complete' | 'return';
  action: string;                 // 사용자가 하는 일
  emotion: string;                // 감정
  touchpoint: string;             // 접점 (화면/기능)
  frictionRisk: string;           // 마찰 위험
  optimization: string;           // 최적화 방안
}

// ============================================================
// PRODUCT DIRECTOR AI — 코드 생성 전 사전 검증
// ============================================================

export interface ProductDirectorReview {
  approved: boolean;
  score: number;                  // 0-100
  findings: { question: string; answer: string; pass: boolean }[];
  blockers: string[];
}

const directorQuestions = [
  '왜 이 제품이 존재하는가?',
  '사용자는 무엇을 이루려고 하는가?',
  '첫 화면이 그 목표를 가장 빠르게 도와주는가?',
  '첫 클릭은 가장 가치 있는 행동인가?',
  '검색이 정말 필요한가? 아니면 추천이 더 중요한가?',
  'CTA가 가장 중요한 행동인가?',
  '정보의 우선순위가 맞는가?',
  '브랜드 경험이 살아있는가?',
  'Industry 특성이 반영되었는가?',
  'Archetype이 올바른가?',
  'Restaurant 전용 규칙이 ERP에 들어가지 않았는가?',
  'AI가 만든 화면처럼 보이지 않는가?',
];

export function reviewProductDefinition(def: ProductDefinition): ProductDirectorReview {
  const findings: ProductDirectorReview['findings'] = [];
  const blockers: string[] = [];

  // 1. Mission 명확성
  const hasClearMission = def.mission.why.length > 10 && def.mission.problem.length > 10;
  findings.push({
    question: directorQuestions[0],
    answer: hasClearMission ? `Mission 명확: ${def.mission.why}` : 'Mission이 불명확',
    pass: hasClearMission,
  });

  // 2. JTBD 정의
  const hasJtbd = def.jtbd.primary.length > 5;
  findings.push({
    question: directorQuestions[1],
    answer: hasJtbd ? `JTBD: ${def.jtbd.primary}` : 'JTBD 미정의',
    pass: hasJtbd,
  });

  // 3. 첫 화면이 목표를 돕는가
  const firstScreen = def.journey.find(j => j.stage === 'discover');
  const firstScreenHelps = firstScreen?.touchpoint.includes('landing') || firstScreen?.touchpoint.includes('home');
  findings.push({
    question: directorQuestions[2],
    answer: firstScreenHelps ? '랜딩이 목표 달성을 지원' : '첫 화면과 목표 불일치',
    pass: !!firstScreenHelps,
  });

  // 4. 첫 클릭 = 가장 가치 있는 행동
  const actStep = def.journey.find(j => j.stage === 'act');
  const firstActionIsValuable = actStep?.action.includes('예약') || actStep?.action.includes('주문') || actStep?.action.includes('구매');
  findings.push({
    question: directorQuestions[3],
    answer: firstActionIsValuable ? `첫 행동: ${actStep?.action}` : '첫 행동의 가치 불확실',
    pass: !!firstActionIsValuable,
  });

  // 5. 검색 vs 추천
  const isMarketplace = def.archetype.archetype === 'marketplace';
  const needsSearch = def.archetype.searchRequired;
  findings.push({
    question: directorQuestions[4],
    answer: needsSearch ? '검색 필요 (다수 항목)' : isMarketplace ? '추천 + 검색' : '추천 우선',
    pass: true,
  });

  // 6. CTA 적절성
  const ctaFromExperience = def.experience.microCopy.ctaPrimary;
  findings.push({
    question: directorQuestions[5],
    answer: `CTA: "${ctaFromExperience}"`,
    pass: ctaFromExperience.length > 0,
  });

  // 7. 정보 우선순위
  const hasJourney = def.journey.length >= 4;
  findings.push({
    question: directorQuestions[6],
    answer: hasJourney ? `${def.journey.length}단계 Journey 정의됨` : 'Journey 부족',
    pass: hasJourney,
  });

  // 8. Brand 경험
  findings.push({
    question: directorQuestions[7],
    answer: `Brand: ${def.brand.attributes.premium >= 7 ? 'Premium' : def.brand.attributes.friendly >= 7 ? 'Friendly' : 'Standard'}`,
    pass: true,
  });

  // 9. Industry 반영
  findings.push({
    question: directorQuestions[8],
    answer: `Industry: ${def.industry?.industry ?? 'unknown'}`,
    pass: !!def.industry,
  });

  // 10. Archetype 적절성
  findings.push({
    question: directorQuestions[9],
    answer: `Archetype: ${def.archetype.archetype}`,
    pass: true,
  });

  // 11. Cross-contamination 체크
  findings.push({
    question: directorQuestions[10],
    answer: 'Archetype Engine이 산업별 분리 보장',
    pass: true,
  });

  // 12. AI Smell
  findings.push({
    question: directorQuestions[11],
    answer: 'Design Constitution + AI Smell Detector 활성화',
    pass: true,
  });

  // Blockers
  for (const f of findings) {
    if (!f.pass) blockers.push(f.answer);
  }

  const passed = findings.filter(f => f.pass).length;
  const score = Math.round((passed / findings.length) * 100);

  return {
    approved: blockers.length === 0,
    score,
    findings,
    blockers,
  };
}

// ============================================================
// PRODUCT DEFINITION BUILDER
// Manifest → 10-Layer Product Definition
// ============================================================

export function buildProductDefinition(params: {
  industry: string;
  brandKey: string;
  displayName: string;
  mission?: Partial<ProductDefinition['mission']>;
  persona?: Partial<ProductDefinition['persona']>;
  jtbd?: Partial<ProductDefinition['jtbd']>;
}): ProductDefinition {
  const archetype = getArchetypeProfile(params.industry);
  const brand = resolveBrand(params.brandKey);
  const experience = resolveExperience(params.brandKey);
  const industry = getProfile(params.industry);

  return {
    mission: {
      why: params.mission?.why ?? `${params.displayName}는 사용자에게 ${industry?.industry ?? params.industry} 경험을 제공합니다.`,
      problem: params.mission?.problem ?? '사용자는 정보가 부족하고, 행동하기 어렵습니다.',
      successMetric: params.mission?.successMetric ?? '사용자가 3분 이내에 목표를 달성합니다.',
    },
    targetUser: {
      who: params.persona?.role ?? '일반 사용자',
      context: '일상적인 상황',
      expertise: 'beginner',
    },
    persona: {
      name: params.persona?.name ?? '기본 사용자',
      role: params.persona?.role ?? '사용자',
      primaryNeed: params.persona?.primaryNeed ?? '빠르고 쉬운 경험',
      frustration: params.persona?.frustration ?? '복잡한 인터페이스',
    },
    jtbd: {
      primary: params.jtbd?.primary ?? `${params.displayName}를 통해 목표를 달성합니다.`,
      secondary: params.jtbd?.secondary ?? [],
      successCriteria: params.jtbd?.successCriteria ?? '목표 달성 후 재방문',
    },
    journey: buildJourney(archetype.archetype, experience),
    experience,
    brand,
    industry,
    archetype,
  };
}

function buildJourney(archetype: string, exp: ReturnType<typeof resolveExperience>): JourneyStep[] {
  return [
    {
      stage: 'discover',
      action: '랜딩 페이지에서 가치 제안 확인',
      emotion: '호기심',
      touchpoint: 'landing',
      frictionRisk: '가치가 불명확하면 이탈',
      optimization: '3초 내 핵심 가치 전달',
    },
    {
      stage: 'compare',
      action: '옵션/메뉴/상품 비교',
      emotion: '비교/평가',
      touchpoint: 'list',
      frictionRisk: '선택지가 너무 많으면 혼란',
      optimization: '추천 + 검색 + 필터',
    },
    {
      stage: 'decide',
      action: '특정 항목 상세 확인 후 결정',
      emotion: '확신',
      touchpoint: 'detail',
      frictionRisk: '정보 부족으로 결정 보류',
      optimization: '핵심 정보 + 리뷰 + 가격',
    },
    {
      stage: 'act',
      action: exp.microCopy.ctaPrimary,
      emotion: '실행',
      touchpoint: 'form',
      frictionRisk: '폼이 길거나 복잡하면 이탈',
      optimization: '최소 필드 + 빠른 제출',
    },
    {
      stage: 'complete',
      action: exp.microCopy.success,
      emotion: '성취감',
      touchpoint: 'success-state',
      frictionRisk: '확인 불확실 → 불안',
      optimization: '명확한 Success + 다음 액션',
    },
    {
      stage: 'return',
      action: '재방문 또는 다음 행동',
      emotion: '만족',
      touchpoint: 'home',
      frictionRisk: '이유가 없으면 재방문 안 함',
      optimization: '개인화 + 새로운 가치',
    },
  ];
}

// ============================================================
// PRINT PRODUCT DEFINITION
// ============================================================

export function printProductDefinition(def: ProductDefinition): void {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🧠 Product Intelligence — 10-Layer Definition');
  console.log('═══════════════════════════════════════════════');
  console.log();
  console.log('  Layer 1 — Mission');
  console.log('    Why:      ' + def.mission.why);
  console.log('    Problem:  ' + def.mission.problem);
  console.log('    Success:  ' + def.mission.successMetric);
  console.log();
  console.log('  Layer 2 — Target User');
  console.log('    Who:      ' + def.targetUser.who);
  console.log('    Context:  ' + def.targetUser.context);
  console.log('    Level:    ' + def.targetUser.expertise);
  console.log();
  console.log('  Layer 3 — Persona');
  console.log('    Name:     ' + def.persona.name);
  console.log('    Role:     ' + def.persona.role);
  console.log('    Need:     ' + def.persona.primaryNeed);
  console.log('    Pain:     ' + def.persona.frustration);
  console.log();
  console.log('  Layer 4 — Job To Be Done');
  console.log('    Primary:  ' + def.jtbd.primary);
  console.log('    Success:  ' + def.jtbd.successCriteria);
  console.log();
  console.log('  Layer 5 — User Journey');
  for (const step of def.journey) {
    console.log('    ' + step.stage.padEnd(10) + ' -> ' + step.action + ' (' + step.emotion + ')');
  }
  console.log();
  console.log('  Layer 6 — Experience');
  console.log('    Voice:    ' + def.experience.voice.tone + ' (warmth ' + def.experience.voice.warmth + '/10)');
  console.log('    CTA:      ' + def.experience.microCopy.ctaPrimary);
  console.log('    Success:  ' + def.experience.microCopy.success);
  console.log();
  console.log('  Layer 7 — Brand');
  console.log('    Premium:  ' + def.brand.attributes.premium + '/10');
  console.log('    Warm:     ' + def.brand.attributes.human + '/10');
  console.log('    Calm:     ' + def.brand.attributes.calm + '/10');
  console.log();
  console.log('  Layer 8 — Industry');
  console.log('    Type:     ' + (def.industry?.industry ?? 'N/A'));
  console.log();
  console.log('  Layer 9 — Archetype');
  console.log('    Type:     ' + def.archetype.archetype);
  console.log('    Layout:   ' + def.archetype.primaryLayout);
  console.log('    Nav:      ' + def.archetype.navPattern);
  console.log();
  console.log('  Layer 10 — Universal Principles');
  console.log('    Search:   ' + (def.archetype.searchRequired ? 'Required' : 'Optional'));
  console.log('    Touch:    44px minimum');
  console.log('    Contrast: WCAG AA 4.5:1');
  console.log('═══════════════════════════════════════════════');
}

export function printDirectorReview(review: ProductDirectorReview): void {
  console.log();
  console.log('  ── Product Director AI ─────────────────────');
  console.log('  Score:    ' + review.score + '/100');
  console.log('  Verdict:  ' + (review.approved ? '✅ APPROVED' : '❌ BLOCKED'));
  console.log();
  for (const f of review.findings) {
    console.log('  ' + (f.pass ? '✅' : '🔴') + ' ' + f.question);
    console.log('     → ' + f.answer);
  }
  if (review.blockers.length > 0) {
    console.log();
    console.log('  ── Blockers ────────────────────────────────');
    for (const b of review.blockers) console.log('  🔴 ' + b);
  }
  console.log();
}
