// ============================================================
// Validation Intelligence — Fix Suggestion Engine
// Issue[] → PatchProposal[] (제안만, 적용 ❌)
// ============================================================

import type { Issue, SuggestedFix, ImpactReport } from './types';

export interface PatchProposal {
  id: string;
  issueId: string;
  severity: string;
  fix: SuggestedFix;
  impact: ImpactReport;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

// --- 빈 impact (기본값) ---
function defaultImpact(): ImpactReport {
  return {
    affectedEntities: [],
    affectedApis: [],
    affectedForms: [],
    affectedPermissions: [],
    migrationImpact: 'none',
    breakingChange: false,
    rollbackPossible: true,
    estimatedRisk: 'low',
  };
}

// --- Issue → PatchProposal 변환 ---
export function generateFixProposals(issues: Issue[]): PatchProposal[] {
  const proposals: PatchProposal[] = [];

  for (const issue of issues) {
    if (!issue.suggestedFix) continue;

    // Impact 계산
    const impact = analyzeImpact(issue);

    proposals.push({
      id: `PATCH-${issue.id}`,
      issueId: issue.id,
      severity: issue.severity,
      fix: issue.suggestedFix,
      impact,
      status: 'pending',
    });
  }

  return proposals;
}

// --- 영향 범위 계산 ---
function analyzeImpact(issue: Issue): ImpactReport {
  const impact = defaultImpact();
  const entityName = issue.location.entityName;

  if (entityName) {
    impact.affectedEntities.push(entityName);
    impact.affectedApis.push(
      `GET /api/v1/${entityName}`,
      `POST /api/v1/${entityName}`,
      `PATCH /api/v1/${entityName}/{id}`,
      `DELETE /api/v1/${entityName}/{id}`,
    );
    impact.affectedForms.push(`${entityName}-form`);
  }

  // 수정 타입별 영향
  if (issue.suggestedFix) {
    switch (issue.suggestedFix.type) {
      case 'add-field':
      case 'remove-field':
      case 'change-type':
        impact.migrationImpact = 'additive';
        impact.breakingChange = issue.suggestedFix.type === 'remove-field';
        impact.rollbackPossible = issue.suggestedFix.type !== 'remove-field';
        break;
      case 'add-permission':
        impact.affectedPermissions.push(issue.suggestedFix.target);
        break;
      case 'add-reference':
        impact.migrationImpact = 'breaking';
        impact.breakingChange = true;
        impact.rollbackPossible = false;
        impact.estimatedRisk = 'high';
        break;
    }
  }

  return impact;
}
