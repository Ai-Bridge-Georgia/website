// ============================================================
// Android Adapter — Jetpack Compose + Material Design 3
// Material Design 원칙 준수
// ============================================================

import type { PlatformAdapter } from '../interface';

export const androidAdapter: PlatformAdapter = {
  platform: 'android',

  // 1. Typography / Spacing / Radius
  spacing(v: number) { return `${v}.dp`; },
  radius(scope) {
    const map = { button: '8.dp', card: '12.dp', input: '8.dp', badge: '4.dp' };
    return map[scope];
  },
  fontDisplay(role) {
    const map: Record<string, string> = { display: '56.sp', h1: '40.sp', h2: '28.sp', h3: '22.sp', body: '16.sp', small: '14.sp', caption: '13.sp' };
    return map[role] ?? '16.sp';
  },
  fontFamily() { return 'FontFamily(Font(R.font.pretendard))'; },

  // 2. Color
  color(token) {
    const palette: Record<string, string> = {
      bg: 'Color(0xFFFFFFFF)', surface: 'Color(0xFFF9FAFB)', textPrimary: 'Color(0xFF111827)',
      textSecondary: 'Color(0xFF6B7280)', textTertiary: 'Color(0xFF9CA3AF)', border: 'Color(0xFFE5E7EB)',
      accent: 'Color(0xFF111827)', danger: 'Color(0xFFDC2626)', success: 'Color(0xFF059669)',
    };
    return palette[token] ?? 'Color.Black';
  },
  colorPalette() {
    return {
      bg: 'MaterialTheme.colorScheme.surface', surface: 'MaterialTheme.colorScheme.surfaceVariant',
      textPrimary: 'MaterialTheme.colorScheme.onSurface', textSecondary: 'MaterialTheme.colorScheme.onSurfaceVariant',
      border: 'DividerDefaults.color', accent: 'MaterialTheme.colorScheme.primary',
      danger: 'MaterialTheme.colorScheme.error', success: 'Color(0xFF059669)',
    };
  },

  // 3. Layout
  flex(direction, align = 'Center', justify = 'Center') {
    const dir = direction === 'row' ? 'Row' : 'Column';
    return `${dir}(horizontalAlignment = Alignment.${direction === 'row' ? 'CenterVertically' : 'CenterHorizontally'}, verticalArrangement = Arrangement.${justify})`;
  },
  grid(columns, gap) {
    return `LazyVerticalGrid(columns = GridCells.Fixed(${columns}), contentPadding = PaddingValues(${gap}.dp))`;
  },
  container(maxWidth) {
    return `Box(Modifier.width(${maxWidth}.dp).padding(horizontal = 16.dp))`;
  },

  // 4. Shadow — Material Elevation
  shadow(level) {
    const map = { sm: '1.dp', md: '3.dp', lg: '6.dp', xl: '12.dp' };
    return `Modifier.shadow(elevation = ${map[level]})`;
  },

  // 5. Motion
  transition(duration, _easing) { return `tween(durationMillis = ${duration})`; },
  animation(type, duration) {
    const map: Record<string, string> = {
      fade: `fadeIn(animationSpec = tween(${duration}))`,
      slide: `slideInVertically(animationSpec = tween(${duration}))`,
      scale: `scaleIn(animationSpec = tween(${duration}))`,
      spring: `spring(dampingRatio = Spring.DampingRatioMediumBouncy)`,
    };
    return map[type] ?? '';
  },

  // 6. Interaction — Android has NO hover
  hover(_styles) { return ''; /* Android: no hover */ },
  focus() { return 'Modifier.focusRequester(focusRequester)'; },
  tapFeedback() { return 'Modifier.clickable { /* action */ }'; },
  pressState() { return 'interactionSource.collectIsPressedAsState()'; },

  // 7. Navigation — Material 3
  navBar(title, _actions = []) {
    return `Scaffold(topBar = { TopAppBar(title = { Text("${title}") }) }) { padding -> }`;
  },
  bottomNav(items) {
    const navItems = items.map(i =>
      `NavigationItem(selectedIcon = Icons.Default.${i.icon}, label = "${i.label}")`
    ).join(', ');
    return `NavigationBar { ${navItems} }`;
  },
  backButton() { return 'IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }'; },

  // 8. Gesture — Material Design gestures
  swipe(direction, action) {
    return `Modifier.swipeable(anchors = mapOf(0 to ${direction}), thresholds = { _, _ -> }) { ${action} }`;
  },
  longPress(action) { return `Modifier.combinedClickable(onLongClick = { ${action} }) {}`; },

  // 9. Accessibility
  a11yLabel(text) { return `Modifier.semantics { contentDescription = "${text}" }`; },
  a11yRole(role) { return `Modifier.semantics { this.role = Role.${role.charAt(0).toUpperCase() + role.slice(1)} }`; },
  a11yHidden() { return 'Modifier.semantics { invisibleToUser() }'; },
  semanticGroup(role) {
    const map: Record<string, string> = { nav: 'Modifier.semantics { traversalGroup = true }', main: '', header: '', footer: '' };
    return map[role] ?? '';
  },

  // 10. Responsive — Android doesn't use CSS breakpoints
  breakpoint(_size) { return null; /* Android: use windowSizeClass */ },
  responsive(_prop, _sizes) { return 'when (windowSizeClass) { WindowSizeClass.Compact -> {} }'; },

  // 11. Image
  image(src, alt, ratio) {
    return `AsyncImage(model = "${src}", contentDescription = "${alt}", contentScale = ContentScale.Crop, modifier = Modifier.aspectRatio(${ratio === '4:3' ? '4f/3f' : '16f/9f'}))`;
  },

  // 12. Components — Compose
  button(label, variant = 'primary', _action) {
    const styles: Record<string, string> = {
      primary: `Button(onClick = {}) { Text("${label}") }`,
      secondary: `OutlinedButton(onClick = {}) { Text("${label}") }`,
      ghost: `TextButton(onClick = {}) { Text("${label}") }`,
      danger: `Button(onClick = {}, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("${label}") }`,
    };
    return styles[variant];
  },
  input(label, placeholder, _type = 'text') {
    return `OutlinedTextField(value = "", onValueChange = {}, label = { Text("${label}") }, placeholder = { Text("${placeholder}") })`;
  },
  card(content, imageUrl) {
    const img = imageUrl ? `AsyncImage(model = "${imageUrl}", contentDescription = null, modifier = Modifier.fillMaxWidth().aspectRatio(4f/3f))` : '';
    return `Card(modifier = Modifier.fillMaxWidth()) { Column { ${img} Text("${content}", modifier = Modifier.padding(16.dp)) } }`;
  },
  table(headers, rows) {
    // Android: use LazyColumn instead of table
    const headerRow = headers.map(h => `Text("${h}", style = MaterialTheme.typography.labelMedium)`).join(', ');
    const dataRows = rows.map(r => `Row { ${r.map(c => `Text("${c}")`).join(', ')} }`).join('\n');
    return `LazyColumn { item { Row { ${headerRow} } } items(list) { ${dataRows} } }`;
  },
  dialog(title, body, actions) {
    return `AlertDialog(onDismissRequest = {}, title = { Text("${title}") }, text = { Text("${body}") }, confirmButton = { ${actions.join(' ')} })`;
  },
  toast(message, type) {
    const variant = type === 'error' ? 'SnackbarHostState().showSnackbar("${message}", duration = SnackbarDuration.Long)' : 'SnackbarHostState().showSnackbar("${message}")';
    return variant;
  },
  bottomSheet(title, content) {
    return `ModalBottomSheet(onDismissRequest = {}) { Column(modifier = Modifier.padding(24.dp)) { Text("${title}", style = MaterialTheme.typography.titleLarge) ${content} } }`;
  },
  tabView(tabs) {
    const tabList = tabs.map((t, i) => `Tab(selected = selectedIndex == ${i}, onClick = {}, text = { Text("${t.label}") })`).join(' ');
    return `Column { TabRow(selectedTabIndex = selectedIndex) { ${tabList} } when(selectedIndex) { ${tabs.map((t, i) => `${i} -> ${t.content}`).join(' ')} } }`;
  },
  searchBar(placeholder) {
    return `OutlinedTextField(value = "", onValueChange = {}, placeholder = { Text("${placeholder}") }, leadingIcon = { Icon(Icons.Default.Search, "Search") }, modifier = Modifier.fillMaxWidth().height(48.dp))`;
  },
  list(items) {
    return `LazyColumn { items(listOf(${items.map(i => `"${i}"`).join(', ')})) { item -> Text(item, modifier = Modifier.padding(vertical = 12.dp)) } }`;
  },
  skeleton(ratio) {
    return `Box(Modifier.aspectRatio(${ratio === '4:3' ? '4f/3f' : '1f'}).fillMaxWidth().shimmerEffect())`;
  },

  // 13. States
  loadingState() { return 'CircularProgressIndicator(modifier = Modifier.padding(32.dp))'; },
  emptyState(icon, title, desc, actionLabel) {
    return `Column(Modifier.fillMaxSize().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.${icon}, contentDescription = null, modifier = Modifier.size(48.dp)) Text("${title}", style = MaterialTheme.typography.titleMedium) Text("${desc}", color = MaterialTheme.colorScheme.onSurfaceVariant) Button(onClick = {}) { Text("${actionLabel}") } }`;
  },
  errorState(message, retryAction) {
    return `Column(Modifier.padding(16.dp)) { Text("${message}", color = MaterialTheme.colorScheme.error) Button(onClick = { ${retryAction} }) { Text("재시도") } }`;
  },
  successState(title, message) {
    return `Column(Modifier.fillMaxSize().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Check, contentDescription = null) Text("${title}", style = MaterialTheme.typography.headlineMedium) Text("${message}") }`;
  },

  // 14. Meta
  platformInfo() {
    return { name: 'Android', version: '1.0', framework: 'Jetpack Compose', cssFramework: 'Material Design 3' };
  },
};
