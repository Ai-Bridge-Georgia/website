// ============================================================
// Build Error Parser — Web/Android/iOS 빌드 출력 분석
// 에러 메시지에서 구조화된 Issue 추출
// ============================================================

export type Platform = 'web' | 'android' | 'ios';
export type ErrorCategory = 'syntax' | 'missing-file' | 'missing-import' | 'naming' | 'accessibility' | 'api-stub' | 'theme' | 'config' | 'build' | 'ux-inconsistency';
export type FixAction = 'create-file' | 'modify-file' | 'rename-symbol' | 'add-import' | 'add-a11y' | 'replace-stub' | 'add-boilerplate';

export interface ParsedError {
  category: ErrorCategory;
  platform: Platform;
  file?: string;
  line?: number;
  message: string;
  rawError: string;
}

export interface FixSuggestion {
  error: ParsedError;
  action: FixAction;
  description: string;
  confidence: number;          // 0-100
  targetFile: string;
  findString?: string;
  replaceString?: string;
  newFileContent?: string;     // for create-file
}

// ============================================================
// PARSERS
// ============================================================

export function parseWebErrors(buildLog: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = buildLog.split('\n');

  for (const line of lines) {
    // TypeScript error: "error TS2304: Cannot find name 'X'"
    const tsMatch = line.match(/error\s+TS(\d+):\s+(.*)/);
    if (tsMatch) {
      errors.push({
        category: tsMatch[2].includes('Cannot find') ? 'missing-import' : 'syntax',
        platform: 'web',
        message: tsMatch[2],
        rawError: line,
      });
    }

    // Next.js build error
    if (line.includes('Build error occurred') || line.includes('Failed to compile')) {
      errors.push({ category: 'build', platform: 'web', message: line.trim(), rawError: line });
    }

    // ESLint error
    if (line.match(/Error:\s+.*/)) {
      errors.push({ category: 'syntax', platform: 'web', message: line.trim(), rawError: line });
    }
  }

  return errors;
}

export function parseAndroidErrors(buildLog: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = buildLog.split('\n');

  for (const line of lines) {
    // Kotlin: "e: file://...kt:10:5: error: unresolved reference: KoreankitchenTheme"
    const kotlinMatch = line.match(/e:\s+file:\/\/.*\/([^/]+\.kt):(\d+):\d+:\s+error:\s+(.*)/);
    if (kotlinMatch) {
      const msg = kotlinMatch[3];
      let category: ErrorCategory = 'syntax';
      if (msg.includes('unresolved reference')) category = 'missing-import';
      if (msg.includes('not found')) category = 'missing-file';

      errors.push({
        category, platform: 'android',
        file: kotlinMatch[1], line: parseInt(kotlinMatch[2]),
        message: msg, rawError: line,
      });
    }

    // Gradle: "FAILURE: Build failed with an exception"
    if (line.includes('FAILURE: Build failed')) {
      errors.push({ category: 'build', platform: 'android', message: 'Gradle build failed', rawError: line });
    }

    // Missing AndroidManifest
    if (line.includes('AndroidManifest.xml') && line.includes('not found')) {
      errors.push({ category: 'missing-file', platform: 'android', message: 'AndroidManifest.xml missing', rawError: line });
    }
  }

  return errors;
}

export function parseIOSErrors(buildLog: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = buildLog.split('\n');

  for (const line of lines) {
    // Swift: "error: cannot find 'homeView' in scope"
    const swiftMatch = line.match(/error:\s+(.*)/);
    if (swiftMatch) {
      const msg = swiftMatch[1];
      let category: ErrorCategory = 'syntax';
      if (msg.includes('cannot find') || msg.includes('use of unresolved')) category = 'naming';
      if (msg.includes('not in scope')) category = 'naming';

      errors.push({
        category, platform: 'ios',
        message: msg, rawError: line,
      });
    }

    // Xcode: "BUILD FAILED"
    if (line.includes('BUILD FAILED')) {
      errors.push({ category: 'build', platform: 'ios', message: 'Xcode build failed', rawError: line });
    }
  }

  return errors;
}

export function parseBuildErrors(platform: Platform, buildLog: string): ParsedError[] {
  switch (platform) {
    case 'web': return parseWebErrors(buildLog);
    case 'android': return parseAndroidErrors(buildLog);
    case 'ios': return parseIOSErrors(buildLog);
  }
}

// ============================================================
// STATIC ISSUE DETECTOR (빌드 없이 코드 분석)
// ============================================================

export function detectStaticIssues(platform: Platform, projectDir: string, files: { path: string; content: string }[]): ParsedError[] {
  const issues: ParsedError[] = [];

  for (const file of files) {
    const code = file.content;

    // --- Android: Missing Theme ---
    if (platform === 'android' && code.includes('Theme') && code.includes('setContent')) {
      const themeName = code.match(/(\w+Theme)\s*\{/);
      if (themeName) {
        const themeDefExists = files.some(f => f.content.includes(`@Composable\nfun ${themeName[1]}`) || f.content.includes(`fun ${themeName[1]}(`));
        if (!themeDefExists) {
          issues.push({
            category: 'theme', platform: 'android', file: file.path,
            message: `${themeName[1]} referenced but not defined`,
            rawError: `Theme ${themeName[1]} not found in project`,
          });
        }
      }
    }

    // --- Android: Missing Search ---
    if (platform === 'android' && file.path.includes('MenuScreen') || file.path.includes('List')) {
      if (!code.toLowerCase().includes('search') && (code.toLowerCase().includes('lazyverticalgrid') || code.toLowerCase().includes('lazycolumn'))) {
        issues.push({
          category: 'ux-inconsistency', platform: 'android', file: file.path,
          message: 'List screen missing search (Web/iOS have search)',
          rawError: 'Cross-platform UX inconsistency: search missing',
        });
      }
    }

    // --- Android: Missing Success State in Form ---
    if (platform === 'android' && file.path.includes('ReserveScreen')) {
      if (!code.toLowerCase().includes('success') && !code.toLowerCase().includes('submitted')) {
        issues.push({
          category: 'ux-inconsistency', platform: 'android', file: file.path,
          message: 'Form screen missing success state (Web/iOS have it)',
          rawError: 'Cross-platform UX inconsistency: success state missing',
        });
      }
    }

    // --- Android: API TODO stub ---
    if (platform === 'android' && code.includes('TODO') && code.toLowerCase().includes('fetch')) {
      issues.push({
        category: 'api-stub', platform: 'android', file: file.path,
        message: 'API call is a TODO stub',
        rawError: 'API stub found — needs real implementation',
      });
    }

    // --- iOS: Case mismatch (homeView vs HomeView) ---
    if (platform === 'ios' && file.path.endsWith('.swift')) {
      // Check for lowercase function calls that should be struct names
      const lowerCalls = code.match(/(\w+View)\(\)/g);
      if (lowerCalls) {
        for (const call of lowerCalls) {
          const name = call.replace('()', '');
          // If first char is lowercase, it's wrong
          if (name.charAt(0) === name.charAt(0).toLowerCase() && name.charAt(0) !== name.charAt(0).toUpperCase()) {
            issues.push({
              category: 'naming', platform: 'ios', file: file.path,
              message: `${name}() should be ${name.charAt(0).toUpperCase() + name.slice(1)}() (Swift naming convention)`,
              rawError: `Case mismatch: ${name} → ${name.charAt(0).toUpperCase() + name.slice(1)}`,
            });
          }
        }
      }
    }

    // --- All: Missing accessibility ---
    const hasInteractive = code.includes('Button') || code.includes('<button') || code.includes('onClick');
    const hasA11y = code.includes('aria-label') || code.includes('contentDescription') || code.includes('accessibilityLabel') || code.includes('.semantics');
    if (hasInteractive && !hasA11y && file.path.endsWith('.tsx') || file.path.endsWith('.kt') || file.path.endsWith('.swift')) {
      // Only flag if there are interactive elements without a11y
      const interactiveCount = (code.match(/<button|Button\(|onClick/g) || []).length;
      const a11yCount = (code.match(/aria-label|contentDescription|accessibilityLabel/g) || []).length;
      if (interactiveCount > 2 && a11yCount === 0) {
        issues.push({
          category: 'accessibility', platform, file: file.path,
          message: `${interactiveCount} interactive elements without accessibility labels`,
          rawError: 'Accessibility missing',
        });
      }
    }

    // --- All: Missing AndroidManifest.xml ---
    if (platform === 'android') {
      const hasManifest = files.some(f => f.path.includes('AndroidManifest.xml'));
      if (!hasManifest && !issues.some(i => i.category === 'missing-file' && i.message.includes('AndroidManifest'))) {
        issues.push({
          category: 'missing-file', platform: 'android',
          message: 'AndroidManifest.xml not generated',
          rawError: 'AndroidManifest.xml missing — required for Android build',
        });
      }
    }
  }

  return issues;
}
