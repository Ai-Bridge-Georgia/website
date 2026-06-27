// @aibg/project-generator — Universal Project Generator
// Manifest → Platform Adapter → 실행 가능한 프로젝트

export { runPipeline, generateProject, buildProject, testProject, qualityGate } from './pipeline';
export { writeProject } from './pipeline';
export { webProjectGenerator } from './generators/web';
export { androidProjectGenerator } from './generators/android';
export { iosProjectGenerator } from './generators/ios';
export type { ProjectGenerator, GeneratedFile, ProjectManifest, ScreenSpec, FieldSpec, BuildResult, TestResult, QualityGateResult } from './interface';
