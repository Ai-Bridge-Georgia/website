// ============================================================
// iOS Adapter — SwiftUI + Apple Human Interface Guidelines
// HIG 원칙 준수
// ============================================================

import type { PlatformAdapter } from '../interface';

export const iosAdapter: PlatformAdapter = {
  platform: 'ios',

  // 1. Typography / Spacing / Radius
  spacing(v: number) { return String(v); }, // SwiftUI points are unitless
  radius(scope) {
    const map = { button: '8', card: '12', input: '8', badge: '4' };
    return map[scope];
  },
  fontDisplay(role) {
    const map: Record<string, string> = {
      display: '.system(size: 56, weight: .bold)',
      h1: '.system(size: 40, weight: .bold)',
      h2: '.system(size: 28, weight: .semibold)',
      h3: '.system(size: 22, weight: .semibold)',
      body: '.body',
      small: '.subheadline',
      caption: '.caption',
    };
    return `.font(${map[role] ?? '.body'})`;
  },
  fontFamily() { return '.font(.custom("Pretendard", size: 16))'; },

  // 2. Color — SwiftUI Color
  color(token) {
    const palette: Record<string, string> = {
      bg: 'Color(.systemBackground)', surface: 'Color(.secondarySystemBackground)',
      textPrimary: 'Color.primary', textSecondary: 'Color.secondary',
      textTertiary: 'Color(.tertiaryLabel)', border: 'Color(.separator)',
      accent: 'Color(.label)', danger: 'Color.red', success: 'Color.green',
    };
    return palette[token] ?? 'Color.primary';
  },
  colorPalette() {
    return {
      bg: 'Color(.systemBackground)', surface: 'Color(.secondarySystemBackground)',
      textPrimary: 'Color.primary', textSecondary: 'Color.secondary',
      textTertiary: 'Color(.tertiaryLabel)', border: 'Color(.separator)',
      accent: 'Color.accentColor', danger: 'Color.red', success: 'Color.green',
    };
  },

  // 3. Layout — SwiftUI stacks
  flex(direction, align = 'center', justify = 'center') {
    const stack = direction === 'row' ? 'HStack' : 'VStack';
    const a: Record<string, string> = { center: '.center', start: '.leading', end: '.trailing' };
    const j: Record<string, string> = { center: '.center', start: '.leading', end: '.trailing', between: '.spaced' };
    return `${stack}(alignment: ${a[align] ?? '.center'}) { } `;
  },
  grid(columns, gap) {
    // SwiftUI: LazyVGrid
    return `LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: ${gap}), count: ${columns}), spacing: ${gap}) { }`;
  },
  container(maxWidth) {
    return `.frame(maxWidth: ${maxWidth}).padding(.horizontal, 16)`;
  },

  // 4. Shadow — SwiftUI shadow
  shadow(level) {
    const map = { sm: '.shadow(color: .black.opacity(0.05), radius: 2)', md: '.shadow(color: .black.opacity(0.08), radius: 4)', lg: '.shadow(color: .black.opacity(0.1), radius: 10)', xl: '.shadow(color: .black.opacity(0.1), radius: 20)' };
    return map[level];
  },

  // 5. Motion
  transition(duration, _easing) { return `.animation(.easeInOut(duration: ${duration / 1000}))`; },
  animation(type, duration) {
    const map: Record<string, string> = {
      fade: `.transition(.opacity)`,
      slide: `.transition(.move(edge: .bottom))`,
      scale: `.transition(.scale(scale: 0.95))`,
      spring: `.animation(.spring(response: ${duration / 1000}))`,
    };
    return map[type] ?? '';
  },

  // 6. Interaction — iOS has NO hover, uses gestures
  hover(_styles) { return ''; /* iOS: no hover */ },
  focus() { return '@FocusState private var isFocused: Bool'; },
  tapFeedback() { return '.buttonStyle(.plain)'; }, // SwiftUI handles tap animations natively
  pressState() { return '.gesture(LongPressGesture().onEnded { _ in })'; },

  // 7. Navigation — HIG NavigationStack
  navBar(title, _actions = []) {
    return `NavigationStack { }.navigationTitle("${title}")`;
  },
  bottomNav(items) {
    const tabs = items.map(i => `${i.label.charAt(0).toUpperCase() + i.label.slice(1)}View()`).join(', ');
    return `TabView { ${tabs} }.tabViewStyle(.automatic)`;
  },
  backButton() { return '// iOS handles back automatically via NavigationStack'; },

  // 8. Gesture
  swipe(direction, action) {
    return `.gesture(DragGesture().onEnded { value in if value.translation.${direction === 'left' || direction === 'right' ? 'width' : 'height'} > 50 { ${action} } })`;
  },
  longPress(action) { return `.onLongPressGesture { ${action} }`; },

  // 9. Accessibility — HIG
  a11yLabel(text) { return `.accessibilityLabel("${text}")`; },
  a11yRole(role) {
    const map: Record<string, string> = { button: '.accessibilityAddTraits(.isButton)', header: '.accessibilityAddTraits(.isHeader)' };
    return map[role] ?? '';
  },
  a11yHidden() { return '.accessibilityHidden(true)'; },
  semanticGroup(_role) { return '.accessibilityElement(children: .contain)'; },

  // 10. Responsive — iOS uses size classes
  breakpoint(_size) { return null; },
  responsive(_prop, _sizes) { return 'if horizontalSizeClass == .compact { } else { }'; },

  // 11. Image
  image(src, alt, ratio) {
    return `AsyncImage(url: URL(string: "${src}")) { image in image.resizable().aspectRatio(contentMode: .fill) } placeholder: { Color.gray.opacity(0.1) }.accessibilityLabel("${alt}")`;
  },

  // 12. Components — SwiftUI
  button(label, variant = 'primary', _action) {
    const styles: Record<string, string> = {
      primary: `Button("${label}") { }.buttonStyle(.borderedProminent).controlSize(.large)`,
      secondary: `Button("${label}") { }.buttonStyle(.bordered).controlSize(.large)`,
      ghost: `Button("${label}") { }.buttonStyle(.plain)`,
      danger: `Button("${label}") { }.buttonStyle(.borderedProminent).tint(.red)`,
    };
    return styles[variant];
  },
  input(label, placeholder, _type = 'text') {
    return `VStack(alignment: .leading) { Text("${label}").font(.subheadline).foregroundColor(.secondary) TextField("${placeholder}", text: $input).textFieldStyle(.roundedBorder) }`;
  },
  card(content, imageUrl) {
    const img = imageUrl ? `AsyncImage(url: URL(string: "${imageUrl}")) { image in image.resizable().aspectRatio(4/3, contentMode: .fill) } placeholder: { Color.gray.opacity(0.1) }` : '';
    return `VStack(alignment: .leading, spacing: 0) { ${img} Text("${content}").padding() }.background(Color(.secondarySystemBackground)).cornerRadius(12)`;
  },
  table(headers, rows) {
    // iOS: use List instead of table
    return `List { Section { ${headers.map(h => `Text("${h}").font(.caption)`).join(' ')} } ForEach(items) { item in ${rows[0]?.map(c => `Text("${c}")`).join(' ')} } }`;
  },
  dialog(title, body, _actions) {
    return `.alert("${title}", isPresented: $showAlert) { Button("OK") { } } message: { Text("${body}") }`;
  },
  toast(message, type) {
    // iOS: use banner, not toast (HIG)
    const color = type === 'error' ? '.red' : type === 'success' ? '.green' : '.gray';
    return `.overlay(alignment: .top) { Text("${message}").padding().background(${color}.opacity(0.1)).cornerRadius(8).transition(.move(edge: .top)) }`;
  },
  bottomSheet(title, content) {
    return `.sheet(isPresented: $showSheet) { VStack { Text("${title}").font(.headline) ${content} }.presentationDetents([.medium, .large]) }`;
  },
  tabView(tabs) {
    return `TabView(selection: $selectedTab) { ${tabs.map((t, i) => `${t.label}View().tabItem { Text("${t.label}") }.tag(${i})`).join(' ')} }`;
  },
  searchBar(placeholder) {
    return `.searchable(text: $searchText, prompt: "${placeholder}")`;
  },
  list(items) {
    return `List { ForEach(${JSON.stringify(items)}, id: \\.self) { item in Text(item) } }`;
  },
  skeleton(ratio) {
    return `Rectangle().fill(Color.gray.opacity(0.1)).aspectRatio(${ratio === '4:3' ? '4/3' : '1'}, contentMode: .fit).redacted(reason: .placeholder)`;
  },

  // 13. States
  loadingState() { return 'ProgressView().padding(32)'; },
  emptyState(icon, title, desc, actionLabel) {
    return `ContentUnavailableView { Label("${title}", systemImage: "${icon}").font(.title) } description: { Text("${desc}").foregroundColor(.secondary) } actions: { Button("${actionLabel}") { } }`;
  },
  errorState(message, retryAction) {
    return `VStack { Text("${message}").foregroundColor(.red) Button("재시도") { ${retryAction} } }`;
  },
  successState(title, message) {
    return `VStack(spacing: 8) { Image(systemName: "checkmark.circle.fill").font(.system(size: 48)).foregroundColor(.green) Text("${title}").font(.title) Text("${message}").foregroundColor(.secondary) }`;
  },

  // 14. Meta
  platformInfo() {
    return { name: 'iOS', version: '1.0', framework: 'SwiftUI', cssFramework: 'Apple HIG' };
  },
};
