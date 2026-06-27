// ============================================================
// Platform Adapter Interface — Universal Contract
// 모든 플랫폼(Web/Android/iOS/Flutter/RN/Desktop)이 구현해야 하는 계약.
// Business Grammar는 이 Interface만 안다. 플랫폼 구현을 모른다.
// ============================================================

// --- Business Input (단위 없음 — 순수 수치) ---
export interface BusinessTokens {
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number; '3xl': number; '4xl': number };
  radius: { button: number; card: number; input: number; badge: number };
  typography: {
    display: { size: number; weight: number; lineHeight: number; letterSpacing: number };
    h1: { size: number; weight: number; lineHeight: number; letterSpacing: number };
    h2: { size: number; weight: number; lineHeight: number; letterSpacing: number };
    h3: { size: number; weight: number; lineHeight: number; letterSpacing: number };
    body: { size: number; weight: number; lineHeight: number; letterSpacing: number };
    small: { size: number; weight: number; lineHeight: number; letterSpacing: number };
    caption: { size: number; weight: number; lineHeight: number; letterSpacing: number };
  };
  color: {
    bg: string; surface: string; textPrimary: string; textSecondary: string;
    textTertiary: string; border: string; accent: string; danger: string; success: string;
  };
  motion: {
    hover: number; tap: number; transition: number; reveal: number; toast: number;
  };
  layout: { sectionGap: number; maxContentWidth: number; gridColumns: number };
  touchTarget: { min: number };
}

// --- Platform Adapter Interface (37개 계약) ---
export interface PlatformAdapter {
  readonly platform: 'web' | 'android' | 'ios' | 'flutter' | 'react-native' | 'desktop' | 'kiosk';

  // 1. Typography
  spacing(value: number): string;              // 8 → "8px" | "8.dp" | "8"
  radius(scope: 'button' | 'card' | 'input' | 'badge'): string;  // → "rounded-lg" | "RoundedCornerShape(8.dp)"
  fontDisplay(role: string): string;           // "56px/700" | ".font(.system(size: 56, weight: .bold))"
  fontFamily(): string;                         // "'Pretendard'" | "FontFamily(Font('Pretendard'))"

  // 2. Color
  color(token: string): string;                // accent → "#111827" | "Color(0xFF111827)"
  colorPalette(): Record<string, string>;

  // 3. Layout
  flex(direction: 'row' | 'column', align?: string, justify?: string): string;
  grid(columns: number, gap: number): string;
  container(maxWidth: number): string;

  // 4. Shadow / Elevation
  shadow(level: 'sm' | 'md' | 'lg' | 'xl'): string;

  // 5. Motion
  transition(duration: number, easing: string): string;
  animation(type: 'fade' | 'slide' | 'scale' | 'spring', duration: number): string;

  // 6. Interaction
  hover(styles: string): string;               // Web: hover: → Android: N/A → return ""
  focus(): string;                              // Web: focus-visible → iOS: @FocusState
  tapFeedback(): string;                        // Web: active:scale-[.98] → Android: clickable{}
  pressState(): string;

  // 7. Navigation
  navBar(title: string, actions?: string[]): string;
  bottomNav(items: { label: string; icon: string }[]): string;
  backButton(): string;
  // 8. Gesture
  swipe(direction: 'left' | 'right' | 'up' | 'down', action: string): string;
  longPress(action: string): string;

  // 9. Accessibility
  a11yLabel(text: string): string;             // Web: aria-label → Android: contentDescription → iOS: accessibilityLabel
  a11yRole(role: string): string;
  a11yHidden(): string;
  semanticGroup(role: string): string;

  // 10. Responsive
  breakpoint(size: 'sm' | 'md' | 'lg' | 'xl'): string | null;  // Web: md: → Mobile: null
  responsive(prop: string, sizes: Record<string, string>): string;

  // 11. Image
  image(src: string, alt: string, ratio: string): string;

  // 12. Components
  button(label: string, variant?: 'primary' | 'secondary' | 'ghost' | 'danger', action?: string): string;
  input(label: string, placeholder: string, type?: string): string;
  card(content: string, imageUrl?: string): string;
  table(headers: string[], rows: string[][]): string;
  dialog(title: string, body: string, actions: string[]): string;
  toast(message: string, type: 'success' | 'error' | 'info'): string;
  bottomSheet(title: string, content: string): string;
  tabView(tabs: { label: string; content: string }[]): string;
  searchBar(placeholder: string): string;
  list(items: string[]): string;
  skeleton(ratio: string): string;

  // 13. States
  loadingState(): string;
  emptyState(icon: string, title: string, desc: string, actionLabel: string): string;
  errorState(message: string, retryAction: string): string;
  successState(title: string, message: string): string;

  // 14. Platform Meta
  platformInfo(): { name: string; version: string; framework: string; cssFramework: string };
}
