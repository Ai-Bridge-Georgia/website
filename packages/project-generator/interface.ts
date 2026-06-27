// ============================================================
// Project Generator Interface — Universal Contract
// 모든 플랫폼 Generator가 구현해야 하는 8개 계약.
// 입력: Business Manifest + Platform Adapter
// 출력: 실행 가능한 프로젝트 (파일 트리)
// ============================================================

import type { PlatformAdapter } from '../platform-adapters/interface';

// --- Generated File ---
export interface GeneratedFile {
  path: string;           // 프로젝트 루트 기준 상대 경로
  content: string;
  encoding?: 'utf-8' | 'binary';
}

// --- Project Generator Interface (8개 계약) ---
export interface ProjectGenerator {
  readonly platform: string;

  // 1. 전체 프로젝트 생성 (아래 모든 것을 조합)
  generateProject(manifest: ProjectManifest, adapter: PlatformAdapter): GeneratedFile[];

  // 2. 화면 생성
  generateScreens(manifest: ProjectManifest, adapter: PlatformAdapter): GeneratedFile[];

  // 3. 컴포넌트 생성
  generateComponents(manifest: ProjectManifest, adapter: PlatformAdapter): GeneratedFile[];

  // 4. 네비게이션 생성
  generateNavigation(manifest: ProjectManifest, adapter: PlatformAdapter): GeneratedFile[];

  // 5. 에셋 생성 (로고, 아이콘, 폰트)
  generateAssets(manifest: ProjectManifest): GeneratedFile[];

  // 6. 현지화 (i18n)
  generateLocalization(manifest: ProjectManifest): GeneratedFile[];

  // 7. 설정 파일 (package.json, build.gradle, etc.)
  generateConfiguration(manifest: ProjectManifest): GeneratedFile[];

  // 8. 빌드 파일 (Makefile, scripts, CI config)
  generateBuildFiles(manifest: ProjectManifest): GeneratedFile[];

  // 9. 플랫폼 전용 추가 파일 (Theme, Manifest, etc.) — Adaptive
  generateTheme?(manifest: ProjectManifest): GeneratedFile[];
  generateAndroidManifest?(manifest: ProjectManifest): GeneratedFile[];
}

// --- Project Manifest (Business Manifest 확장) ---
export interface ProjectManifest {
  projectName: string;        // 'korean-kitchen'
  displayName: string;        // '한국의 맛'
  industry: string;           // 'restaurant'
  platform: string;           // 'web' | 'android' | 'ios' | 'flutter'
  screens: ScreenSpec[];
  brand: {
    name: string;
    primaryColor: string;
    accentColor: string;
    font: string;
    language: string;
  };
  api?: {
    baseUrl: string;
  };
  database?: {
    tables: string[];
  };
}

export interface ScreenSpec {
  name: string;               // 'home', 'menu', 'reservation', 'admin'
  type: 'landing' | 'list' | 'detail' | 'form' | 'dashboard' | 'table';
  title: string;
  sections?: string[];        // ['hero', 'featured', 'contact']
  apiEndpoint?: string;       // '/api/v1/menus'
  fields?: FieldSpec[];
}

export interface FieldSpec {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'datetime' | 'stepper';
  required: boolean;
  options?: string[];
}

// --- Build Result ---
export interface BuildResult {
  success: boolean;
  platform: string;
  outputDir: string;
  buildLog: string;
  artifacts: string[];        // 빌드 산출물 경로
  durationMs: number;
}

// --- Test Result ---
export interface TestResult {
  success: boolean;
  typeChecked: boolean;
  lintPassed: boolean;
  testsPassed: boolean;
  reviewScore?: number;
  details: string[];
}

// --- Quality Gate ---
export interface QualityGateResult {
  buildPassed: boolean;
  testPassed: boolean;
  reviewScore: number;
  productionReady: boolean;
  blockers: string[];
}
