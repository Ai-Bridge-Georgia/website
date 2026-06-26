// ============================================================
// SaaS Plugin — IT/서비스 도메인
// 모듈: pricing, features, docs
// ============================================================

import type { DomainPlugin, PluginModule } from '../../core/plugin-types';

export const saasPlugin: DomainPlugin = {
  id: 'saas',
  name: 'SaaS Module',
  version: '0.1.0',
  industry: 'saas',
  modules: [
    {
      id: 'pricing',
      name: 'Pricing Plans',
      schema: [{
        name: 'pricing_plans',
        columns: [
          { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
          { name: 'tenant_id', type: 'uuid', references: 'tenants(id)' },
          { name: 'plan_name', type: 'text' },
          { name: 'price', type: 'numeric' },
          { name: 'billing_cycle', type: 'text' },
          { name: 'features', type: 'jsonb' },
          { name: 'is_popular', type: 'boolean', default: 'false' },
          { name: 'sort_order', type: 'integer', default: '0' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }],
    },
    { id: 'features', name: 'Feature Showcase' },
    { id: 'docs', name: 'Documentation' },
  ],
};
