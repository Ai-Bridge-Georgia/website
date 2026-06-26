// ============================================================
// Business OS — API Health Check
// 헌법: "API First"
// GET /api/v1/health → 시스템 상태
// ============================================================

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'AI Bridge Georgia — Business OS',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    engines: [
      'form', 'dashboard', 'notification', 'workflow',
      'permission', 'rule', 'search', 'import-export',
      'audit', 'scheduling', 'report', 'ai',
      'integration', 'plugin',
    ],
  });
}
