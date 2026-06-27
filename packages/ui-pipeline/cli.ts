// ============================================================
// UI Pipeline — CLI
// npm run review-ui
// ============================================================

import { runPipeline } from './pipeline';
import * as path from 'path';

const cwd = process.cwd();

runPipeline({
  promptDir: path.join(cwd, '.generated', 'prompts'),
  uiDir: path.join(cwd, '.generated', 'ui'),
  reportDir: path.join(cwd, '.generated', 'reports'),
  brandColor: '#111827',
});
