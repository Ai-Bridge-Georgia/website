// ============================================================
// Prompt Compiler — Manifest → AI Prompt 4개 생성
// 결정론적: 동일 Manifest = 동일 Prompt
// ============================================================

import type { UIManifest } from './manifest';
import { patternsToPromptText, referencesToPromptText } from '../design-learning';
import * as crypto from 'crypto';

// --- Prompt Layer (7-Layer) ---
function buildRoleLayer(ai: string): string {
  const roles: Record<string, string> = {
    claude: 'You are Claude, acting as a Principal Product Designer at Apple, Stripe, and Linear.',
    gpt: 'You are GPT-4, acting as a Principal Product Designer at Apple, Stripe, and Linear.',
    gemini: 'You are Gemini, acting as a Principal Product Designer at Apple, Stripe, and Linear.',
    cursor: 'You are an AI Coding Assistant in Cursor, following Apple/Stripe/Linear design standards.',
  };
  return `# Role\n\n${roles[ai] ?? roles.claude}\n\nGenerate production-ready UI code. No placeholders. No "TODO". No generic templates.`;
}

function buildDNALayer(m: UIManifest): string {
  const d = m.dna;
  return `# Design DNA

This product has the following personality (1-10 scale):

| Attribute | Value | Design Meaning |
|---|---|---|
| Premium | ${d.premium ?? 8} | ${dnaDesc('premium', d.premium ?? 8)} |
| Warm | ${d.warm ?? 5} | ${dnaDesc('warm', d.warm ?? 5)} |
| Calm | ${d.calm ?? 7} | ${dnaDesc('calm', d.calm ?? 7)} |
| Minimal | ${d.minimal ?? 8} | ${dnaDesc('minimal', d.minimal ?? 8)} |
| Precise | ${d.precise ?? 8} | ${dnaDesc('precise', d.precise ?? 8)} |
| Bold | ${d.bold ?? 4} | ${dnaDesc('bold', d.bold ?? 4)} |

**Emotional goal**: The user must feel ${d.calm && d.calm >= 7 ? 'calm, ' : ''}${d.warm && d.warm >= 7 ? 'welcomed, ' : ''}and ${d.premium && d.premium >= 8 ? 'they are using a premium product' : 'they can trust this product'}.`;
}

function dnaDesc(attr: string, val: number): string {
  const desc: Record<string, [string, string]> = {
    premium: ['Budget-friendly, dense layout', 'Luxurious whitespace, fine details, premium fonts'],
    warm: ['Cool, professional, distant', 'Warm, friendly, inviting'],
    calm: ['Energetic, fast-paced, stimulating', 'Calm, slow transitions, low saturation'],
    minimal: ['Information-dense, many elements', 'Minimal elements, generous whitespace'],
    precise: ['Organic, fluid, irregular', 'Mathematical, 8px grid, geometric'],
    bold: ['Quiet, understated, muted', 'Bold, high contrast, assertive'],
  };
  const [low, high] = desc[attr] ?? ['', ''];
  return val >= 7 ? high : low;
}

function buildVisualGrammarLayer(m: UIManifest): string {
  const r = m.style.radius ?? 8;
  const s = m.style.spacing ?? 8;
  const dark = m.style.darkMode;
  return `# Visual Grammar (EXACT VALUES — do NOT approximate)

## Spacing (${s}px base)
- All spacing must be multiples of ${s}px: ${s}, ${s * 2}, ${s * 3}, ${s * 4}, ${s * 6}, ${s * 8}, ${s * 12}px
- Section gap: ${s * 12}px (desktop), ${s * 8}px (mobile)
- Card padding: ${s * 3}px
- Container max-width: 1200px

## Border Radius
- Buttons: ${r}px
- Cards: ${r + 4}px
- Inputs: ${r}px
- Badges: 4px
- NEVER use 50% radius on buttons (circular = forbidden)

## Color (Named hex only — ${m.brand.primaryColor ?? '#111827'} brand)
- bg: ${dark ? '#0A0A0A' : '#FFFFFF'}
- surface: ${dark ? '#171717' : '#F9FAFB'}
- text-primary: ${dark ? '#FAFAFA' : '#111827'}
- text-secondary: ${dark ? '#A3A3A3' : '#6B7280'}
- border: ${dark ? '#262626' : '#E5E7EB'}
- accent: ${m.brand.primaryColor ?? '#111827'}
- danger: #DC2626
- success: #059669
- Max 6 named colors. NO rainbow palettes.

## Typography
- Font: ${m.brand.font ?? 'Pretendard'} (KO), Inter (EN)
- Display: 56px / weight 700 / line-height 1.1 / letter-spacing -0.02em
- H1: 40px / 700 / 1.2
- H2: 28px / 600 / 1.3
- H3: 22px / 600 / 1.4
- Body: 16px / 400 / 1.6
- Small: 14px / 400 / 1.5
- Caption: 13px / 300 / 1.4
- word-break: keep-all (Korean), font-display: swap
- NEVER use default system fonts (Arial, Roboto, Georgia)

## Shadow
- Card: 0 1px 3px rgba(0,0,0,0.08)
- Card hover: 0 4px 6px rgba(0,0,0,0.07)
- Modal: 0 20px 25px rgba(0,0,0,0.08)

## Z-Index
- Content: 0 | Sticky: 10 | Dropdown: 20 | Drawer: 30 | Modal: 40 | Toast: 50`;
}

function buildInteractionLayer(): string {
  return `# Interaction Grammar

## Motion Tokens
- Hover: 150ms ease (color/shadow change)
- Click: scale(0.98) 100ms ease
- Page transition: 200ms ease-out (fade)
- Scroll reveal: fade-up 20px, 400ms ease-out
- Toast: slide-up 300ms spring

## State Patterns (MUST implement all)
- Loading: Skeleton screen (pulse animation), NEVER empty screen
- Empty: Icon + title + description + action button
- Error: Clear message + retry button
- Success: Toast (3s) + checkmark
- Submitting: Button shows spinner inside, text persists, disabled

## Scroll
- scroll-behavior: smooth
- Sticky header: bg-white/95 backdrop-blur-sm
- prefers-reduced-motion: DISABLE all animations`;
}

function buildComponentLayer(m: UIManifest): string {
  const r = m.style.radius ?? 8;
  return `# Component Grammar

## Button
- Shape: rectangular, ${r}px radius (NEVER circular)
- Sizes: sm 36px / md 44px / lg 52px height
- Primary: bg-accent text-white | Hover: brightness-110 | Active: scale(0.98) | Disabled: opacity-50
- Secondary: border border-border text-text-primary | Hover: bg-surface

## Card
- Shape: ${r + 4}px radius, 1px border, shadow-sm
- Hover: darker border + shadow-md
- Image: top, full-width, 4:3 ratio
- Content: ${m.style.spacing ? m.style.spacing * 3 : 24}px padding

## Input
- Height: 44px (mobile: 48px minimum touch target)
- ${r}px radius, 1px border
- Focus: border-accent (color change, no glow)
- Placeholder: text-tertiary color

## Table
- Header: bg-surface, text-xs font-medium
- Rows: hover:bg-surface, divide-y
- Cells: px-4 py-3 text-sm

## Modal
- Overlay: bg-black/40 backdrop-blur-sm
- Shape: ${r + 8}px radius, max-width 480-640px
- Close: X button + Escape key + overlay click

## Navigation
- Height: 64px, sticky, bg-white/95 backdrop-blur
- Border-bottom: 1px
- Mobile: hamburger menu

## Search
- Height: 48px (Amazon style — large)
- Left icon (magnifying glass 20px)
- ${r}px radius (NOT pill shape)

## Toast
- Position: bottom-right (desktop), bottom (mobile)
- ${r + 4}px radius, shadow-lg, max 3 simultaneous

## Empty State
- Centered, py-20
- Icon (48px) + Title (h3) + Description (secondary) + Action button`;
}

function buildScreenLayer(m: UIManifest): string {
  const screens = m.screens;
  let output = '# Screen Grammar\n\nGenerate the following screens:\n\n';

  const templates: Record<string, string> = {
    landing: `## Landing Page Structure
1. Sticky Header (logo left, nav center/right, CTA button right)
2. Hero (centered, max-w-3xl): Label(small, accent) → H1(display) → Subtitle(body) → 2 CTAs
3. Featured/Popular (3-card grid): Card(image + title + price + badge)
4. Value Propositions (3 items, text-centered): icon + title + desc
5. CTA Section (bg inverted, single centered button)
6. Footer (minimal: copyright + address)`,
    menu: `## Menu Page Structure
1. Sticky Header
2. Title (centered, H1)
3. Search Bar (centered, max-w-md, 48px height, left icon)
4. Category Filter (pill buttons, centered, gap 8px)
5. Menu Grid (3 col desktop / 1 col mobile, gap 24px)
6. Menu Card (image 4:3 + name + price + category badge)
7. Empty State (if no results: icon + text + action)
8. Footer`,
    reservation: `## Reservation Page Structure
1. Header (with back link)
2. Title + subtitle (centered, max-w-xl)
3. Form fields: Name* / Phone / DateTime* / Party Size(stepper) / Notes(textarea)
4. Submit button (full width, primary)
5. Success State (replace form: checkmark + message + 2 actions)`,
    admin: `## Admin Dashboard Structure
1. Sidebar (240px, left: menu items)
2. Main content: Header (title + action button)
3. Data table (sortable columns, hover rows)
4. CRUD Modal (form inside modal)`,
    detail: `## Detail Page Structure
1. Hero image (full-width, 16:9)
2. Title + price + badges
3. Description (body text)
4. Details table (info rows)
5. CTA button (reserve/order)
6. Related items (3 cards, same category)`,
  };

  for (const screen of screens) {
    output += templates[screen] ?? `\n## ${screen} page\n(Generate based on Screen Grammar)\n`;
    output += '\n';
  }

  return output;
}

function buildProhibitionLayer(): string {
  return `# ABSOLUTE PROHIBITIONS (AI Tells — instant disqualification)

If ANY of these appear, the design is REJECTED:

❌ gradient-text (background-clip: text + gradient)
❌ glassmorphism on every surface
❌ purple/teal/acid-green default palettes
❌ "Boost / Supercharge / Unleash / Elevate" copy
❌ cream background (#F4F1EA) + terracotta (#E2725B)
❌ all elements same border-radius
❌ decorative 01/02/03 numbers without context
❌ circular buttons (border-radius: 50%)
❌ shadows without purpose
❌ system fonts (Arial, Roboto, Georgia)
❌ dense layouts without whitespace
❌ hover effects on mobile
❌ tables on mobile (use cards instead)
❌ lorem ipsum or placeholder text
❌ emoji as primary icons (use Heroicons/Lucide)
❌ "Lorem" or "TODO" in any text

## Coco Chanel Rule
"Before leaving the house, look in the mirror and remove one accessory."
After building, review and REMOVE one decorative element.`;
}

function buildTechLayer(m: UIManifest): string {
  const fw = m.tech?.framework ?? 'next';
  const css = m.tech?.css ?? 'tailwind';
  const lang = m.brand.language;

  const frameworks: Record<string, string> = {
    next: 'Next.js 15 (App Router) + TypeScript',
    react: 'React 19 + TypeScript (Vite)',
    html: 'Semantic HTML5 + Vanilla JS',
  };

  const cssFrameworks: Record<string, string> = {
    tailwind: 'Tailwind CSS v4 (utility classes)',
    css: 'CSS Modules / plain CSS',
  };

  return `# Tech Stack & Constraints

## Framework
${frameworks[fw] ?? frameworks.next}

## Styling
${cssFrameworks[css] ?? cssFrameworks.tailwind}

## Language
- Primary: ${lang}
- Use semantic HTML5 tags: <main>, <nav>, <section>, <article>, <button>
- All images MUST have alt attribute
- All forms MUST have <label>
- Mobile-first responsive (min-width media queries)

## Code Quality
- Production-ready (no placeholders, no TODO)
- TypeScript strict mode
- self-contained components (props in, JSX out)`;
}

function buildBrandLayer(m: UIManifest): string {
  return `# Brand Context

## Brand Name
${m.brand.name}

${m.brand.tagline ? `## Tagline\n${m.brand.tagline}\n` : ''}
## Target Audience
${m.target.audience} in ${m.target.country}

## Industry
${m.industry}

## Language
Primary language: ${m.brand.language}
${m.brand.language === 'ko' ? '- word-break: keep-all for natural Korean line breaks' : ''}
${m.brand.language === 'ka' ? '- Ensure Georgian script renders correctly' : ''}`;
}

// ============================================================
// MAIN COMPILE
// ============================================================

export interface CompiledPrompt {
  ai: string;
  content: string;
  hash: string;
}

export function compilePrompt(m: UIManifest, ai: string): CompiledPrompt {
  const layers = [
    buildRoleLayer(ai),
    buildBrandLayer(m),
    buildDNALayer(m),
    buildVisualGrammarLayer(m),
    buildInteractionLayer(),
    buildComponentLayer(m),
    buildScreenLayer(m),
    // NEW: Pattern Library (산업별 검증된 패턴)
    patternsToPromptText(m.industry),
    // NEW: Reference Principles (세계 최고 제품 원칙)
    referencesToPromptText(),
    buildProhibitionLayer(),
    buildTechLayer(m),
  ];

  const content = layers.join('\n\n---\n\n');

  // Deterministic hash
  const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);

  return { ai, content, hash };
}

export function compileAll(m: UIManifest): CompiledPrompt[] {
  return ['claude', 'gpt', 'gemini', 'cursor'].map((ai) => compilePrompt(m, ai));
}
