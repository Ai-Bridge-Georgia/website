// ============================================================
// Web Adapter — Next.js + Tailwind CSS
// 기존 Design Grammar를 Web Platform 구현으로 번역
// ============================================================

import type { PlatformAdapter } from '../interface';

export const webAdapter: PlatformAdapter = {
  platform: 'web',

  // 1. Typography / Spacing / Radius
  spacing(v: number) { return `${v}px`; },
  radius(scope) {
    const map = { button: '8px', card: '12px', input: '8px', badge: '4px' };
    return map[scope];
  },
  fontDisplay(role) {
    const map: Record<string, string> = { display: '56px', h1: '40px', h2: '28px', h3: '22px', body: '16px', small: '14px', caption: '13px' };
    return map[role] ?? '16px';
  },
  fontFamily() { return "'Pretendard', 'Inter', sans-serif"; },

  // 2. Color
  color(token) {
    const palette: Record<string, string> = {
      bg: '#FFFFFF', surface: '#F9FAFB', textPrimary: '#111827', textSecondary: '#6B7280',
      textTertiary: '#9CA3AF', border: '#E5E7EB', accent: '#111827', danger: '#DC2626', success: '#059669',
    };
    return palette[token] ?? '#000000';
  },
  colorPalette() {
    return {
      bg: '#FFFFFF', surface: '#F9FAFB', textPrimary: '#111827', textSecondary: '#6B7280',
      textTertiary: '#9CA3AF', border: '#E5E7EB', accent: '#111827', danger: '#DC2626', success: '#059669',
    };
  },

  // 3. Layout
  flex(direction, align = 'center', justify = 'center') {
    return `flex flex-${direction} items-${align} justify-${justify}`;
  },
  grid(columns, gap) {
    return `grid grid-cols-${columns} gap-${gap / 4}`;
  },
  container(maxWidth) {
    return `max-w-[${maxWidth}px] mx-auto px-4`;
  },

  // 4. Shadow
  shadow(level) {
    const map = {
      sm: 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
      md: 'shadow-[0_4px_6px_rgba(0,0,0,0.07)]',
      lg: 'shadow-[0_10px_15px_rgba(0,0,0,0.08)]',
      xl: 'shadow-[0_20px_25px_rgba(0,0,0,0.08)]',
    };
    return map[level];
  },

  // 5. Motion
  transition(duration, _easing) { return `transition-colors duration-${duration}`; },
  animation(type, duration) {
    const map: Record<string, string> = {
      fade: `animate-fade-in ${duration}ms`,
      slide: `animate-slide-up ${duration}ms`,
      scale: `animate-scale-in ${duration}ms`,
      spring: `transition-transform duration-${duration}`,
    };
    return map[type] ?? '';
  },

  // 6. Interaction
  hover(styles) { return `hover:${styles}`; },
  focus() { return 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900'; },
  tapFeedback() { return 'active:scale-[0.98]'; },
  pressState() { return 'active:opacity-70'; },

  // 7. Navigation
  navBar(title, _actions = []) {
    return `<nav class="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10"><div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between"><span class="text-lg font-bold">${title}</span></div></nav>`;
  },
  bottomNav(items) {
    const tabs = items.map(i => `<a class="flex flex-col items-center text-xs"><span>${i.icon}</span><span>${i.label}</span></a>`).join('');
    return `<nav class="fixed bottom-0 w-full bg-white border-t flex justify-around py-2">${tabs}</nav>`;
  },
  backButton() { return `<a href="javascript:history.back()" class="text-sm text-gray-600">← 뒤로</a>`; },

  // 8. Gesture (Web — limited)
  swipe(_dir, _action) { return ''; /* Web: JS library needed */ },
  longPress(_action) { return ''; /* Web: JS needed */ },

  // 9. Accessibility
  a11yLabel(text) { return `aria-label="${text}"`; },
  a11yRole(role) { return `role="${role}"`; },
  a11yHidden() { return 'aria-hidden="true"'; },
  semanticGroup(role) {
    const map: Record<string, string> = { nav: '<nav>', main: '<main>', header: '<header>', footer: '<footer>', article: '<article>' };
    return map[role] ?? '<section>';
  },

  // 10. Responsive
  breakpoint(size) {
    const map: Record<string, string> = { sm: 'sm:', md: 'md:', lg: 'lg:', xl: 'xl:' };
    return map[size] ?? null;
  },
  responsive(_prop, sizes) {
    return Object.entries(sizes).map(([bp, val]) => `${bp}:${val}`).join(' ');
  },

  // 11. Image
  image(src, alt, ratio) {
    const ratioClass = ratio === '4:3' ? 'aspect-[4/3]' : ratio === '16:9' ? 'aspect-video' : '';
    return `<img src="${src}" alt="${alt}" class="${ratioClass} w-full object-cover" />`;
  },

  // 12. Components
  button(label, variant = 'primary', _action) {
    const styles: Record<string, string> = {
      primary: 'bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:scale-[0.98]',
      secondary: 'border border-gray-200 rounded-lg hover:bg-gray-50',
      ghost: 'text-gray-600',
      danger: 'bg-red-600 text-white rounded-lg hover:bg-red-700',
    };
    return `<button class="px-6 py-3.5 font-medium transition-colors duration-150 min-h-[44px] ${styles[variant]}">${label}</button>`;
  },
  input(label, placeholder, type = 'text') {
    return `<div><label class="block text-sm font-medium text-gray-700 mb-1.5">${label}</label><input type="${type}" placeholder="${placeholder}" class="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors min-h-[48px]" /></div>`;
  },
  card(content, imageUrl) {
    const img = imageUrl ? `<div class="aspect-[4/3] bg-gray-50"><img src="${imageUrl}" alt="" class="w-full h-full object-cover" /></div>` : '';
    return `<div class="rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-150">${img}<div class="p-5">${content}</div></div>`;
  },
  table(headers, rows) {
    const thead = `<thead class="bg-gray-50 border-b"><tr>${headers.map(h => `<th class="text-left px-4 py-3 text-xs font-medium text-gray-500">${h}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody class="divide-y">${rows.map(r => `<tr class="hover:bg-gray-50">${r.map(c => `<td class="px-4 py-3 text-sm">${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table class="w-full">${thead}${tbody}</table>`;
  },
  dialog(title, body, actions) {
    return `<div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center"><div class="bg-white rounded-2xl p-8 max-w-md"><h2 class="text-xl font-bold mb-4">${title}</h2><p class="text-gray-600 mb-6">${body}</p><div class="flex gap-3 justify-end">${actions.join('')}</div></div></div>`;
  },
  toast(message, type) {
    const colors = { success: 'bg-green-50 text-green-600', error: 'bg-red-50 text-red-600', info: 'bg-gray-50 text-gray-600' };
    return `<div class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${colors[type]}">${message}</div>`;
  },
  bottomSheet(title, content) {
    return `<div class="fixed inset-0 bg-black/40 z-40 flex items-end"><div class="bg-white w-full rounded-t-2xl p-6"><h3 class="font-semibold mb-4">${title}</h3>${content}</div></div>`;
  },
  tabView(tabs) {
    const labels = tabs.map((t, i) => `<button class="px-4 py-2 ${i === 0 ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}">${t.label}</button>`).join('');
    return `<div><div class="flex border-b">${labels}</div><div class="py-4">${tabs[0]?.content ?? ''}</div></div>`;
  },
  searchBar(placeholder) {
    return `<div class="relative"><input type="text" placeholder="${placeholder}" class="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg min-h-[48px]" /><svg class="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /></div>`;
  },
  list(items) {
    return `<ul class="divide-y">${items.map(i => `<li class="py-3">${i}</li>`).join('')}</ul>`;
  },
  skeleton(ratio) {
    return `<div class="aspect-[${ratio.replace(':', '/')}] bg-gray-100 animate-pulse rounded-lg"></div>`;
  },

  // 13. States
  loadingState() { return `<div class="py-20 text-center"><div class="inline-block w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div></div>`; },
  emptyState(icon, title, desc, actionLabel) {
    return `<div class="text-center py-20"><div class="text-5xl mb-4">${icon}</div><h3 class="text-xl font-semibold mb-2">${title}</h3><p class="text-gray-500 mb-6">${desc}</p><button class="px-5 py-2.5 bg-gray-900 text-white rounded-lg">${actionLabel}</button></div>`;
  },
  errorState(message, retryAction) {
    return `<div class="px-4 py-3 bg-red-50 rounded-lg text-sm text-red-600 flex items-center justify-between"><span>${message}</span><button onclick="${retryAction}" class="font-medium">재시도</button></div>`;
  },
  successState(title, message) {
    return `<div class="text-center py-20"><div class="text-5xl mb-4">✅</div><h2 class="text-2xl font-bold mb-3">${title}</h2><p class="text-gray-500">${message}</p></div>`;
  },

  // 14. Meta
  platformInfo() {
    return { name: 'Web', version: '1.0', framework: 'Next.js 15 (App Router)', cssFramework: 'Tailwind CSS v4' };
  },
};
