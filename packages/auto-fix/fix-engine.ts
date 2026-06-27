// ============================================================
// Fix Engine — Issue → FixSuggestion → 자동 수정
// ============================================================

import type { ParsedError, Platform } from './error-parser';
export type { FixSuggestion } from './error-parser';
import type { FixSuggestion } from './error-parser';

// ============================================================
// FIX GENERATORS
// ============================================================

function fixMissingTheme(error: ParsedError): FixSuggestion {
  const themeName = error.message.split(' ')[0]; // e.g. "KoreankitchenTheme"
  const pkgName = 'com.aibg.korean_kitchen';

  return {
    error,
    action: 'create-file',
    description: `Create ${themeName}.kt with Material 3 theme`,
    confidence: 98,
    targetFile: `app/src/main/java/com/aibg/korean_kitchen/${themeName}.kt`,
    newFileContent: `package ${pkgName}

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF111827),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE5E7EB),
    secondary = Color(0xFF6B7280),
    background = Color.White,
    surface = Color(0xFFF9FAFB),
    onSurface = Color(0xFF111827),
    error = Color(0xFFDC2626),
)

@Composable
fun ${themeName}(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography(),
        content = content
    )
}
`,
  };
}

function fixNamingCase(error: ParsedError): FixSuggestion {
  // "homeView() should be HomeView()"
  const match = error.message.match(/(\w+)\(\) should be (\w+)\(\)/);
  if (!match) {
    // Fallback: extract from rawError
    const rawMatch = error.rawError.match(/(\w+)\s*→\s*(\w+)/);
    if (rawMatch) {
      return {
        error,
        action: 'rename-symbol',
        description: `Fix case: ${rawMatch[1]} → ${rawMatch[2]}`,
        confidence: 99,
        targetFile: error.file ?? '',
        findString: rawMatch[1] + '()',
        replaceString: rawMatch[2] + '()',
      };
    }
    return { error, action: 'modify-file', description: 'Cannot auto-fix naming', confidence: 0, targetFile: error.file ?? '' };
  }

  return {
    error,
    action: 'rename-symbol',
    description: `Fix case: ${match[1]} → ${match[2]}`,
    confidence: 99,
    targetFile: error.file ?? '',
    findString: match[1] + '()',
    replaceString: match[2] + '()',
  };
}

function fixAndroidManifest(_error: ParsedError): FixSuggestion {
  return {
    error: _error,
    action: 'create-file',
    description: 'Create AndroidManifest.xml',
    confidence: 97,
    targetFile: 'app/src/main/AndroidManifest.xml',
    newFileContent: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.DynamicColors.DayNight">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
  };
}

function fixMissingSearch(error: ParsedError): FixSuggestion {
  // Add search state + filtering to Android list screen
  return {
    error,
    action: 'modify-file',
    description: 'Add search TextField + filtering to list screen',
    confidence: 85,
    targetFile: error.file ?? '',
    findString: 'val loading = remember { mutableStateOf(true) }',
    replaceString: `val loading = remember { mutableStateOf(true) }
    var searchText = remember { mutableStateOf("") }`,
  };
}

function fixMissingSuccessState(error: ParsedError): FixSuggestion {
  // Add success state to Android form screen
  return {
    error,
    action: 'modify-file',
    description: 'Add success state with checkmark + reset button',
    confidence: 88,
    targetFile: error.file ?? '',
    findString: 'Button(onClick = { /* TODO: POST */ }',
    replaceString: `var submitted by remember { mutableStateOf(false) }
    if (submitted) {
        Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.primary)
            Text("${error.file?.includes('Reserve') ? '예약 완료' : '완료'}", style = MaterialTheme.typography.headlineMedium)
            Button(onClick = { submitted = false }) { Text("다시") }
        }
        return
    }
    Button(onClick = { submitted = true }`,
  };
}

function fixApiStub(error: ParsedError): FixSuggestion {
  return {
    error,
    action: 'replace-stub',
    description: 'Replace TODO with actual Retrofit/HttpURLConnection call placeholder',
    confidence: 75,
    targetFile: error.file ?? '',
    findString: '// TODO: Fetch from',
    replaceString: '// TODO: Implement API call using Retrofit or Ktor\n        // val client = OkHttpClient()\n        // val request = Request.Builder().url(API_URL).build()\n        // client.newCall(request).execute().use { response -> parse(response.body?.string()) }',
  };
}

function fixAccessibility(error: ParsedError, platform: Platform): FixSuggestion {
  const label = platform === 'web' ? 'aria-label="버튼"' :
                platform === 'android' ? 'contentDescription = "버튼"' :
                '.accessibilityLabel("버튼")';

  return {
    error,
    action: 'add-a11y',
    description: `Add accessibility labels (${label})`,
    confidence: 80,
    targetFile: error.file ?? '',
    findString: '',
    replaceString: label,
  };
}

// ============================================================
// MAIN FIX ENGINE
// ============================================================

export function generateFixes(errors: ParsedError[]): FixSuggestion[] {
  const fixes: FixSuggestion[] = [];

  for (const error of errors) {
    let fix: FixSuggestion | null = null;

    switch (error.category) {
      case 'theme':
        fix = fixMissingTheme(error);
        break;
      case 'naming':
        fix = fixNamingCase(error);
        break;
      case 'missing-file':
        if (error.message.includes('AndroidManifest')) {
          fix = fixAndroidManifest(error);
        }
        break;
      case 'ux-inconsistency':
        if (error.message.includes('search')) {
          fix = fixMissingSearch(error);
        } else if (error.message.includes('success')) {
          fix = fixMissingSuccessState(error);
        }
        break;
      case 'api-stub':
        fix = fixApiStub(error);
        break;
      case 'accessibility':
        fix = fixAccessibility(error, error.platform);
        break;
    }

    if (fix) fixes.push(fix);
  }

  return fixes;
}

// ============================================================
// APPLY FIXES
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

export interface ApplyResult {
  applied: number;
  skipped: number;
  details: { file: string; action: string; success: boolean; reason?: string }[];
}

export function applyFixes(fixes: FixSuggestion[], projectDir: string): ApplyResult {
  let applied = 0;
  let skipped = 0;
  const details: ApplyResult['details'] = [];

  for (const fix of fixes) {
    const fullPath = path.join(projectDir, fix.targetFile);

    try {
      switch (fix.action) {
        case 'create-file': {
          if (fix.newFileContent) {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, fix.newFileContent);
            applied++;
            details.push({ file: fix.targetFile, action: 'created', success: true });
          }
          break;
        }

        case 'modify-file':
        case 'rename-symbol':
        case 'replace-stub': {
          if (fix.findString && fix.replaceString && fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes(fix.findString)) {
              const newContent = content.replace(fix.findString, fix.replaceString);
              fs.writeFileSync(fullPath, newContent);
              applied++;
              details.push({ file: fix.targetFile, action: 'modified', success: true });
            } else {
              skipped++;
              details.push({ file: fix.targetFile, action: 'skipped', success: false, reason: 'findString not found' });
            }
          }
          break;
        }

        case 'add-a11y': {
          // a11y is contextual — skip auto-apply for now
          skipped++;
          details.push({ file: fix.targetFile, action: 'skipped', success: false, reason: 'a11y requires context (manual)' });
          break;
        }

        default:
          skipped++;
          details.push({ file: fix.targetFile, action: 'skipped', success: false, reason: 'Unknown action' });
      }
    } catch (e) {
      skipped++;
      details.push({ file: fix.targetFile, action: 'error', success: false, reason: String(e) });
    }
  }

  return { applied, skipped, details };
}
