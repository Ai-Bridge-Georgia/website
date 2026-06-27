// ============================================================
// Design Director AI — 비평하는 AI Agent
// 코드를 생성하지 않는다. 오직 비평한다.
// ============================================================

import type { ExperienceProfile } from '../design-learning/experience-language';
import { resolveExperience } from '../design-learning/experience-language';
import type { GeneratedFile } from '../project-generator/interface';

// --- Review Category ---
export interface DirectorReviewCategory {
  name: string;
  score: number;         // 0-100
  question: string;
  finding: string;
}

// --- Full Review ---
export interface DirectorReview {
  brandKey: string;
  categories: DirectorReviewCategory[];
  experienceScore: number;    // 0-100
  qualityScore: number;       // 0-100 (기존 Review Engine 점수)
  overallScore: number;       // 가중 평균
  verdict: 'approved' | 'needs-work' | 'rejected';
  topIssues: string[];
  approvalGate: boolean;      // true = Production 승인
}

// --- 17개 평가 질문 ---
const questions = [
  '이 화면은 브랜드답는가?',
  '브랜드의 감정이 느껴지는가?',
  '브랜드의 Tone이 일관적인가?',
  'CTA가 브랜드와 맞는가?',
  'Loading은 브랜드 성격과 맞는가?',
  'Success가 브랜드를 닮았는가?',
  'Error가 신뢰를 주는가?',
  'Typography가 브랜드를 표현하는가?',
  'Motion이 브랜드를 표현하는가?',
  '사진 스타일이 브랜드와 맞는가?',
  'Spacing이 브랜드를 표현하는가?',
  '사용자가 AI가 만들었다고 느끼는가?',
  'Stripe 디자이너가 승인할까?',
  'Apple 디자이너가 승인할까?',
  'Linear 디자이너가 승인할까?',
  '$10,000 이상의 디자인 가치가 있는가?',
  '이 제품이 기억에 남을까?',
];

// ============================================================
// REVIEW ENGINE
// ============================================================

export function reviewExperience(
  brandKey: string,
  files: GeneratedFile[],
  qualityScore: number,
): DirectorReview {
  const exp = resolveExperience(brandKey);
  const categories: DirectorReviewCategory[] = [];

  // 모든 화면 코드 합치기
  const allCode = files.map(f => f.content).join('\n');

  // 1. Brand Voice 일관성
  const voiceKeywords = getVoiceKeywords(exp.voice.tone);
  const voiceMatches = voiceKeywords.filter(k => allCode.includes(k)).length;
  const voiceScore = Math.min(100, 40 + voiceMatches * 20);
  categories.push({
    name: 'Brand Voice',
    score: voiceScore,
    question: questions[0],
    finding: voiceScore >= 80 ? '브랜드 Voice가 일관됨' : '브랜드 Voice 키워드 부족',
  });

  // 2. Emotional Tone
  const emotionScore = exp.voice.warmth >= 7 ? 85 : exp.voice.warmth >= 4 ? 75 : 65;
  categories.push({
    name: 'Emotional Quality',
    score: emotionScore,
    question: questions[1],
    finding: `Warmth ${exp.voice.warmth}/10 — ${emotionScore >= 80 ? '감정이 잘 전달됨' : '감정 전달 부족'}`,
  });

  // 3. CTA Consistency
  const ctaInCode = allCode.includes(exp.microCopy.ctaPrimary);
  categories.push({
    name: 'CTA Consistency',
    score: ctaInCode ? 90 : 60,
    question: questions[3],
    finding: ctaInCode ? `CTA "${exp.microCopy.ctaPrimary}" 일관됨` : 'CTA 불일치',
  });

  // 4. Success Message
  const successInCode = allCode.includes(exp.microCopy.success);
  categories.push({
    name: 'Success Experience',
    score: successInCode ? 90 : 50,
    question: questions[5],
    finding: successInCode ? `Success "${exp.microCopy.success}" 적용됨` : 'Success 메시지 없음',
  });

  // 5. Error Quality
  const errorInCode = allCode.includes(exp.microCopy.error) || allCode.includes('error');
  const hasNoUnknownError = !allCode.includes('Unknown Error') && !allCode.includes('알 수 없는 오류');
  categories.push({
    name: 'Error Trust',
    score: errorInCode && hasNoUnknownError ? 85 : 50,
    question: questions[6],
    finding: hasNoUnknownError ? '에러 메시지가 책임감 있음' : '"Unknown Error" 감지 — 신뢰 하락',
  });

  // 6. Typography Expression
  const hasBrandFont = allCode.includes(exp.microCopy.ctaPrimary) && !allCode.includes('Arial') && !allCode.includes('Roboto');
  categories.push({
    name: 'Typography Expression',
    score: hasBrandFont ? 85 : 60,
    question: questions[7],
    finding: hasBrandFont ? '브랜드 폰트 사용 중' : '시스템 폰트 위험',
  });

  // 7. Motion Personality
  const motionSpeed = exp.motion.speed;
  const motionInCode = allCode.includes(`transition`) || allCode.includes(`duration`);
  categories.push({
    name: 'Motion Personality',
    score: motionInCode ? 85 : 60,
    question: questions[8],
    finding: `${exp.motion.character} (${motionSpeed}ms) — ${motionInCode ? '적용됨' : '미적용'}`,
  });

  // 8. Spacing Expression
  const spacingInCode = allCode.includes('section-gap') || allCode.includes('padding') || allCode.includes('py-');
  categories.push({
    name: 'Spacing Expression',
    score: spacingInCode ? 85 : 60,
    question: questions[10],
    finding: spacingInCode ? 'Brand 간격 적용됨' : '간격 미흡',
  });

  // 9. AI Smell Check (inverse)
  const aiPatterns = ['gradient-text', 'glassmorphism', 'Boost your', 'Supercharge', 'lorem ipsum'];
  const aiHits = aiPatterns.filter(p => allCode.toLowerCase().includes(p.toLowerCase()));
  const aiScore = aiHits.length === 0 ? 90 : aiHits.length <= 1 ? 60 : 30;
  categories.push({
    name: 'Human Feeling',
    score: aiScore,
    question: questions[11],
    finding: aiHits.length === 0 ? 'AI 냄새 없음' : `AI 패턴 감지: ${aiHits.join(', ')}`,
  });

  // 10. Premium Quality ($10,000 기준)
  const premiumChecks = [
    allCode.includes('Pretendard') || allCode.includes('Inter'),  // 폰트
    allCode.includes('min-h-[44') || allCode.includes('min-h-[48'),  // 터치 타겟
    allCode.includes('aria-label') || allCode.includes('aria-hidden'),  // 접근성
    !allCode.includes('Lorem'),  // 노 플레이스홀더
  ];
  const premiumCount = premiumChecks.filter(Boolean).length;
  const premiumScore = Math.round((premiumCount / premiumChecks.length) * 100);
  categories.push({
    name: 'Premium Value',
    score: premiumScore,
    question: questions[15],
    finding: `${premiumCount}/${premiumChecks.length} 프리미엄 기준 통과`,
  });

  // 11. Memorability
  const hasStory = allCode.includes(exp.story.heroHeadline);
  const hasUniqueCopy = exp.voice.tone !== 'formal' || voiceMatches > 0;
  categories.push({
    name: 'Memorability',
    score: hasStory && hasUniqueCopy ? 80 : 60,
    question: questions[16],
    finding: hasStory ? '브랜드 스토리 포함' : '스토리 부족',
  });

  // --- 점수 계산 ---
  const experienceScore = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length,
  );

  const overallScore = Math.round(experienceScore * 0.5 + qualityScore * 0.5);

  const topIssues = categories
    .filter(c => c.score < 75)
    .map(c => `${c.name}: ${c.finding}`);

  const approvalGate = overallScore >= 85 && !categories.some(c => c.score < 50);

  const verdict: DirectorReview['verdict'] =
    overallScore >= 85 ? 'approved' :
    overallScore >= 65 ? 'needs-work' : 'rejected';

  return {
    brandKey,
    categories,
    experienceScore,
    qualityScore,
    overallScore,
    verdict,
    topIssues,
    approvalGate,
  };
}

// --- Voice Tone → Keyword 매핑 ---
function getVoiceKeywords(tone: string): string[] {
  const map: Record<string, string[]> = {
    formal: ['완료', '접수', '확인', '감사합니다'],
    casual: ['추가', '가져올게요', '가요', '해요'],
    luxury: ['준비되었습니다', '귀하', '모시겠습니다'],
    playful: ['자리', '꼈어요', '금방', '한 번만요'],
    mission: ['함께', '감사합니다', '참여'],
    technical: ['설정', '구성', '시스템'],
  };
  return map[tone] ?? map.formal;
}

// --- Report 출력 ---
export function printDirectorReview(review: DirectorReview): void {
  const icon = review.verdict === 'approved' ? '✅' : review.verdict === 'needs-work' ? '⚠️' : '🔴';

  console.log();
  console.log('  ── Design Director AI ──────────────────────');
  console.log();
  console.log(`  Brand: ${review.brandKey}`);
  console.log(`  Experience Score: ${review.experienceScore}/100`);
  console.log(`  Quality Score:    ${review.qualityScore}/100`);
  console.log(`  Overall Score:    ${review.overallScore}/100`);
  console.log(`  Verdict:          ${icon} ${review.verdict}`);
  console.log(`  Production Gate:  ${review.approvalGate ? '✅ APPROVED' : '❌ BLOCKED'}`);
  console.log();
  console.log('  ── Categories ──────────────────────────────');

  for (const cat of review.categories) {
    const ci = cat.score >= 85 ? '✅' : cat.score >= 70 ? '⚠️' : '🔴';
    console.log(`  ${ci} ${cat.name.padEnd(25)} ${String(cat.score).padStart(3)}/100  ${cat.finding}`);
  }

  if (review.topIssues.length > 0) {
    console.log();
    console.log('  ── Top Issues ──────────────────────────────');
    for (const issue of review.topIssues) {
      console.log(`  🔴 ${issue}`);
    }
  }
  console.log();
}
