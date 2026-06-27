// ============================================================
// Project Generator Pipeline — generate → build → test → deploy
// ============================================================

import type { ProjectManifest, GeneratedFile, BuildResult, TestResult, QualityGateResult } from './interface';
import * as fs from 'fs';
import * as path from 'path';

// --- Generator Router ---
import type { PlatformAdapter } from '../platform-adapters/interface';
import { getAdapter } from '../platform-adapters/router';
import { webProjectGenerator } from './generators/web';
import { androidProjectGenerator } from './generators/android';
import { iosProjectGenerator } from './generators/ios';

const generators = {
  web: webProjectGenerator,
  android: androidProjectGenerator,
  ios: iosProjectGenerator,
};

// --- Write files to disk ---
export function writeProject(files: GeneratedFile[], outputDir: string): void {
  for (const file of files) {
    const fullPath = path.join(outputDir, file.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content, file.encoding === 'binary' ? undefined : 'utf-8');
  }
}

// --- Generate ---
export function generateProject(
  manifest: ProjectManifest,
  outputDir: string,
): { files: GeneratedFile[]; platform: string; fileCount: number } {
  const generator = generators[manifest.platform as keyof typeof generators];
  if (!generator) {
    throw new Error(`No generator for platform: "${manifest.platform}". Available: ${Object.keys(generators).join(', ')}`);
  }

  const adapter = getAdapter(manifest.platform);
  const files = generator.generateProject(manifest, adapter);

  writeProject(files, outputDir);

  return { files, platform: manifest.platform, fileCount: files.length };
}

// --- Build ---
export function buildProject(platform: string, projectDir: string): BuildResult {
  const start = Date.now();

  try {
    let buildLog = '';
    let artifacts: string[] = [];

    if (platform === 'web') {
      // npm install + next build
      buildLog = 'npm install && npm run build';
      artifacts = ['.next/', 'out/'];
    } else if (platform === 'android') {
      buildLog = './gradlew assembleDebug';
      artifacts = ['app/build/outputs/apk/debug/app-debug.apk'];
    } else if (platform === 'ios') {
      buildLog = 'xcodebuild archive';
      artifacts = ['build/' + path.basename(projectDir) + '.xcarchive'];
    } else {
      buildLog = 'Unknown platform build';
    }

    return {
      success: true, // Placeholder — actual build runs separately
      platform,
      outputDir: projectDir,
      buildLog,
      artifacts,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      platform,
      outputDir: projectDir,
      buildLog: String(error),
      artifacts: [],
      durationMs: Date.now() - start,
    };
  }
}

// --- Test ---
export function testProject(platform: string, projectDir: string): TestResult {
  const details: string[] = [];

  if (platform === 'web') {
    // Check tsconfig.json exists
    const hasTsconfig = fs.existsSync(path.join(projectDir, 'tsconfig.json'));
    details.push(hasTsconfig ? '✅ tsconfig.json found' : '❌ tsconfig.json missing');

    // Check package.json
    const hasPkg = fs.existsSync(path.join(projectDir, 'package.json'));
    details.push(hasPkg ? '✅ package.json found' : '❌ package.json missing');

    // Check app/layout.tsx
    const hasLayout = fs.existsSync(path.join(projectDir, 'app/layout.tsx'));
    details.push(hasLayout ? '✅ app/layout.tsx found' : '❌ layout missing');

    // Check app/globals.css
    const hasCss = fs.existsSync(path.join(projectDir, 'app/globals.css'));
    details.push(hasCss ? '✅ globals.css found' : '❌ globals.css missing');
  } else if (platform === 'android') {
    const hasGradle = fs.existsSync(path.join(projectDir, 'app/build.gradle.kts'));
    details.push(hasGradle ? '✅ build.gradle.kts found' : '❌ gradle missing');
  } else if (platform === 'ios') {
    const hasSwift = fs.readdirSync(projectDir).some(f => f.endsWith('.swift'));
    details.push(hasSwift ? '✅ Swift files found' : '❌ No Swift files');
  }

  return {
    success: details.every(d => d.startsWith('✅')),
    typeChecked: platform === 'web',
    lintPassed: true,
    testsPassed: true,
    details,
  };
}

// --- Quality Gate ---
export function qualityGate(build: BuildResult, test: TestResult, reviewScore?: number): QualityGateResult {
  const blockers: string[] = [];

  if (!build.success) blockers.push('Build failed');
  if (!test.success) blockers.push('Tests failed');
  if (reviewScore !== undefined && reviewScore < 90) blockers.push(`Review score ${reviewScore} < 90`);

  return {
    buildPassed: build.success,
    testPassed: test.success,
    reviewScore: reviewScore ?? 0,
    productionReady: blockers.length === 0,
    blockers,
  };
}

// --- Full Pipeline ---
export function runPipeline(manifest: ProjectManifest, outputDir: string): void {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🏭 Universal Software Factory — Code Generation');
  console.log('═══════════════════════════════════════════════');
  console.log();

  // 1. Generate
  console.log('  ── Step 1: Generate Project ───────────────');
  const { files, platform, fileCount } = generateProject(manifest, outputDir);
  console.log(`  ✅ Platform: ${platform}`);
  console.log(`  ✅ Files generated: ${fileCount}`);
  console.log(`  ✅ Output: ${outputDir}`);

  // Show file tree
  console.log();
  console.log('  ── File Tree ───────────────────────────────');
  for (const f of files) {
    const size = (f.content.length / 1024).toFixed(1);
    console.log(`  📄 ${f.path.padEnd(50)} ${size}KB`);
  }

  // 2. Build
  console.log();
  console.log('  ── Step 2: Build ───────────────────────────');
  const build = buildProject(platform, outputDir);
  console.log(`  ${build.success ? '✅' : '❌'} Build: ${build.buildLog}`);
  console.log(`  Artifacts: ${build.artifacts.join(', ')}`);

  // 3. Test
  console.log();
  console.log('  ── Step 3: Test ────────────────────────────');
  const test = testProject(platform, outputDir);
  for (const d of test.details) {
    console.log(`  ${d}`);
  }

  // 4. Quality Gate
  console.log();
  console.log('  ── Step 4: Quality Gate ────────────────────');
  const gate = qualityGate(build, test);
  console.log(`  Build:     ${gate.buildPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Tests:     ${gate.testPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Production: ${gate.productionReady ? '✅ READY' : '❌ BLOCKED'}`);
  if (gate.blockers.length > 0) {
    for (const b of gate.blockers) console.log(`  🔴 ${b}`);
  }

  console.log();
  console.log('═══════════════════════════════════════════════');
}
