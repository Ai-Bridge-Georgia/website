// ============================================================
// CLI — npm run generate-project
// 한국 음식점 Manifest로 Web/Android/iOS 프로젝트 생성
// ============================================================

import { runPipeline } from './pipeline';
import type { ProjectManifest } from './interface';
import * as path from 'path';

// --- Restaurant Manifest ---
const manifest: ProjectManifest = {
  projectName: 'korean-kitchen',
  displayName: '한국의 맛',
  industry: 'restaurant',
  platform: 'web',
  screens: [
    { name: 'home', type: 'landing', title: '한국의 맛, 트빌리시에서' },
    { name: 'menu', type: 'list', title: '메뉴', apiEndpoint: '/api/v1/menus' },
    { name: 'reserve', type: 'form', title: '예약하기', apiEndpoint: '/api/v1/reservations',
      fields: [
        { name: 'customer_name', label: '이름', type: 'text', required: true },
        { name: 'customer_phone', label: '전화번호', type: 'text', required: false },
        { name: 'date', label: '날짜 및 시간', type: 'datetime', required: true },
        { name: 'party_size', label: '인원', type: 'stepper', required: true },
        { name: 'notes', label: '요청사항', type: 'textarea', required: false },
      ],
    },
    { name: 'admin', type: 'dashboard', title: '관리자', apiEndpoint: '/api/v1/menus' },
  ],
  brand: {
    name: '한국의 맛',
    primaryColor: '#111827',
    accentColor: '#003478',
    font: 'Pretendard',
    language: 'ko',
  },
  api: { baseUrl: 'http://localhost:3000/api/v1' },
};

const cwd = process.cwd();
const platform = process.argv[2] || 'web'; // npm run generate-project -- android
manifest.platform = platform;

const outputDir = path.join(cwd, '.generated', 'projects', platform);

runPipeline(manifest, outputDir);
