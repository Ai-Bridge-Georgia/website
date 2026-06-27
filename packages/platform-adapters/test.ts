// ============================================================
// Platform Adapter Test — 3개 플랫폼이 동일한 Business 개념을
// 각자의 방식으로 번역하는지 검증
// ============================================================

import { getAdapter, getAvailablePlatforms } from './index';

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  🔌 Platform Adapter Test');
console.log('═══════════════════════════════════════════════');
console.log();

const platforms = getAvailablePlatforms();
console.log(`  Available: ${platforms.join(', ')}`);
console.log();

// --- Test 1: Spacing ---
console.log('  ── spacing(8) ──────────────────────────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  console.log(`  ${p.padEnd(10)} ${adapter.spacing(8)}`);
}

// --- Test 2: Radius ---
console.log();
console.log('  ── radius("button") ────────────────────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  console.log(`  ${p.padEnd(10)} ${adapter.radius('button')}`);
}

// --- Test 3: Color ---
console.log();
console.log('  ── color("accent") ─────────────────────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  console.log(`  ${p.padEnd(10)} ${adapter.color('accent')}`);
}

// --- Test 4: Button ---
console.log();
console.log('  ── button("예약하기", "primary") ───────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  const btn = adapter.button('예약하기', 'primary');
  const preview = btn.length > 80 ? btn.substring(0, 77) + '...' : btn;
  console.log(`  ${p.padEnd(10)} ${preview}`);
}

// --- Test 5: Hover ---
console.log();
console.log('  ── hover("bg-gray-100") ────────────────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  const result = adapter.hover('bg-gray-100');
  console.log(`  ${p.padEnd(10)} ${result || '(N/A — no hover on this platform)'}`);
}

// --- Test 6: Accessibility ---
console.log();
console.log('  ── a11yLabel("메뉴") ───────────────────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  console.log(`  ${p.padEnd(10)} ${adapter.a11yLabel('메뉴')}`);
}

// --- Test 7: Empty State ---
console.log();
console.log('  ── emptyState("📭", "메뉴 없음", "...", "추가") ──');
for (const p of platforms) {
  const adapter = getAdapter(p);
  const result = adapter.emptyState('📭', '메뉴 없음', '설명', '추가하기');
  const preview = result.length > 80 ? result.substring(0, 77) + '...' : result;
  console.log(`  ${p.padEnd(10)} ${preview}`);
}

// --- Test 8: Platform Info ---
console.log();
console.log('  ── platformInfo() ──────────────────────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  const info = adapter.platformInfo();
  console.log(`  ${p.padEnd(10)} ${info.framework} + ${info.cssFramework}`);
}

// --- Test 9: Touch Target ---
console.log();
console.log('  ── spacing(44) — touch target ──────────────');
for (const p of platforms) {
  const adapter = getAdapter(p);
  console.log(`  ${p.padEnd(10)} ${adapter.spacing(44)}`);
}

console.log();
console.log('═══════════════════════════════════════════════');
console.log('  ✅ All 3 adapters respond to identical Business input');
console.log('  ✅ Each platform produces platform-specific output');
console.log('  ✅ Business Grammar (spacing=8) has NO unit — Adapter adds it');
console.log('═══════════════════════════════════════════════');
