-- 첫 테넌트 + 역할 생성
INSERT INTO tenants (name, slug, domain, industry, plan, status, settings)
VALUES (
  'AI Bridge Georgia',
  'aibg',
  'aibridgegeorgia.tech',
  'saas',
  'pro',
  'active',
  '{"languages": ["ko", "ka", "en"], "currency": "GEL", "timezone": "Asia/Tbilisi"}'
)
ON CONFLICT (slug) DO NOTHING;

-- 시스템 역할 4개 생성
INSERT INTO roles (tenant_id, name, level, is_system)
SELECT id, 'admin', 100, true FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;

INSERT INTO roles (tenant_id, name, level, is_system)
SELECT id, 'owner', 50, true FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;

INSERT INTO roles (tenant_id, name, level, is_system)
SELECT id, 'staff', 10, true FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;

INSERT INTO roles (tenant_id, name, level, is_system)
SELECT id, 'customer', 0, true FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;
