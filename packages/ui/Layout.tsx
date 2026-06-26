'use client';

import { CSSProperties, ReactNode } from 'react';
import { tokens } from './tokens';

// ============================================================
// Section Layout — 7섹션 구조 (제1계층 고정)
// 사장님 취향: 여백 96px+, Apple 톤, max-width 1200px
// ============================================================

export interface SectionProps {
  children: ReactNode;
  background?: string;
  maxWidth?: string;
  id?: string;
}

export function Section({ children, background = 'transparent', maxWidth = tokens.layout.maxWidth, id }: SectionProps) {
  return (
    <section
      id={id}
      style={{
        width: '100%',
        padding: `${tokens.spacing['4xl']} ${tokens.spacing.lg}`,
        backgroundColor: background,
      }}
    >
      <div style={{ maxWidth, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

// ============================================================
// Container — 기본 컨테이너
// ============================================================

export interface ContainerProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Container({ children, style }: ContainerProps) {
  return (
    <div style={{
      maxWidth: tokens.layout.maxWidth,
      margin: '0 auto',
      padding: `0 ${tokens.spacing.lg}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ============================================================
// 7 Section Structure (제1계층 고정)
// ============================================================

export const SEVEN_SECTIONS = [
  'navigation',
  'hero',
  'social-proof',
  'features',
  'deep-dive',
  'cta',
  'footer',
] as const;

export type SectionId = typeof SEVEN_SECTIONS[number];
