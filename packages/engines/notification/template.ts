// ============================================================
// Notification Engine — Template Renderer
// 헌법: "Everything is Metadata"
// {{variable}} → 실제 값으로 치환
// ============================================================

import type { NotificationTemplate } from './schema';

// --- 변수 치환 ---
export function renderTemplate(
  text: string,
  context: Record<string, unknown>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = context[key];
    if (value === undefined || value === null) {
      return match; // 치환 불가 → 원본 유지
    }
    return String(value);
  });
}

// --- 템플릿 렌더링 ---
export function renderNotification(
  template: NotificationTemplate,
  context: Record<string, unknown>,
  locale?: string,
): { title: string; body: string } {
  // 다국어 지원
  let tpl = template;
  if (locale && template.locale && template.locale[locale]) {
    tpl = { ...template, ...template.locale[locale] };
  }

  return {
    title: renderTemplate(tpl.title, context),
    body: renderTemplate(tpl.body, context),
  };
}
