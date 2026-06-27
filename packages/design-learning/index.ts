// @aibg/design-learning — Reference Learning Factory

import { referenceCatalog } from './reference-catalog';
import type { ReferencePattern } from './reference-catalog';
import { allPatterns } from './pattern-library';
import type { DesignPattern } from './pattern-library';
import { allProfiles, getProfile } from './industry-profiles';
import type { IndustryProfile } from './industry-profiles';

export { referenceCatalog, allPatterns, allProfiles, getProfile };
export type { ReferencePattern, DesignPattern, IndustryProfile };

// --- Pattern을 프롬프트 텍스트로 변환 ---
export function patternsToPromptText(industry: string): string {
  const profile = getProfile(industry);
  if (!profile) return '';

  let text = `# Pattern Library (Industry: ${industry})\n\n`;
  text += `This product should follow these verified design patterns:\n\n`;

  for (const patId of profile.recommendedPatterns) {
    const pat = allPatterns.find((p) => p.id === patId);
    if (pat) {
      text += `## ${pat.name}\n`;
      text += `- **Problem**: ${pat.problem}\n`;
      text += `- **Solution**: ${pat.solution}\n`;
      text += `- **Structure**:\n`;
      for (const s of pat.structure) {
        text += `  - ${s}\n`;
      }
      text += `\n`;
    }
  }

  text += `# Recommended UX Flow\n\n`;
  for (const flow of profile.uxFlow) {
    text += `- ${flow}\n`;
  }
  text += `\n`;

  text += `# Industry-Specific DNA\n\n`;
  text += `| Attribute | Value |\n|---|---|\n`;
  for (const [key, val] of Object.entries(profile.dna)) {
    text += `| ${key} | ${val} |\n`;
  }

  return text;
}

// --- Reference Principles를 프롬프트 텍스트로 변환 ---
export function referencesToPromptText(): string {
  // 모든 reference에서 핵심 원칙 추출 (상위 10개)
  const allPrinciples = referenceCatalog.flatMap((r) =>
    r.principles.map((p) => ({
      product: r.product,
      ...p,
    })),
  );

  // 중복 제거
  const seen = new Set<string>();
  const unique = allPrinciples.filter((p) => {
    const key = p.principle.toLowerCase().slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let text = `# Reference Principles (Verified by World-Class Products)\n\n`;
  text += `Apply these principles (sourced from Apple, Stripe, Linear, Airbnb, Shopify):\n\n`;
  for (const p of unique.slice(0, 10)) {
    text += `- **${p.principle}**: ${p.howToApply} (from ${p.product})\n`;
  }

  return text;
}
