-- ============================================================
-- Business OS — Universal Core DB Migration v2
-- 8 Core Tables + RLS (Supabase PostgreSQL)
-- 헌법: "SECURITY BY DEFAULT", "Multi-tenant: RLS"
-- 수정: agy 리뷰 반영 (RLS 무한루프/FK누락/auth연동/version)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. tenants — 테넌트 루트
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  domain      TEXT,
  industry    TEXT NOT NULL DEFAULT 'saas',
  plan        TEXT NOT NULL DEFAULT 'free',
  status      TEXT NOT NULL DEFAULT 'active',
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- ============================================================
-- 2. users + tenant_users
-- 수정: users.id 가 auth.users 를 참조하도록 변경
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- auth.users 에 새 사용자 생성 시 users 테이블에 자동 동기화
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_auth_user ON auth.users;
CREATE TRIGGER trg_sync_auth_user
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_user();

-- ============================================================
-- 3. roles + permissions (RBAC) — tenant_users보다 먼저
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  level       INT NOT NULL DEFAULT 0,
  is_system   BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource    TEXT NOT NULL,
  action      TEXT NOT NULL,
  UNIQUE(role_id, resource, action)
);

-- ============================================================
-- 2b. tenant_users (roles 이후)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id     UUID REFERENCES roles(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tu_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tu_user ON tenant_users(user_id);

-- ============================================================
-- 4. metadata (동적 메타데이터)
-- ============================================================
CREATE TABLE IF NOT EXISTS metadata (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  key         TEXT NOT NULL,
  value       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, entity_type, entity_id, key)
);

CREATE INDEX IF NOT EXISTS idx_meta_tenant_entity ON metadata(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_meta_value_gin ON metadata USING GIN (value);

-- ============================================================
-- 5. events (이벤트 버스)
-- 수정: version 필드 추가 (agy 권고)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  payload     JSONB,
  version     TEXT NOT NULL DEFAULT '1.0',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_tenant_type ON events(tenant_id, event_type, created_at DESC);

-- ============================================================
-- 6. audit_logs (감사 로그)
-- 수정: FK 추가 (agy 권고)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);

-- ============================================================
-- 7. notifications (알림)
-- 수정: FK 추가 (agy 권고)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT,
  body        TEXT,
  data        JSONB,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_status ON notifications(user_id, status);

-- ============================================================
-- 8. configurations (테넌트별 설정)
-- ============================================================
CREATE TABLE IF NOT EXISTS configurations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  key         TEXT NOT NULL,
  value       JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category, key)
);

-- ============================================================
-- RLS: current_tenant_id() — SECURITY DEFINER (agy 치명적 수정)
-- 무한 루프 방지: RLS를 바이패스하려면 SECURITY DEFINER 필수
-- ============================================================
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM tenant_users
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- ============================================================
-- RLS: 모든 테이블에 적용
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants FOR ALL USING (id = current_tenant_id());

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tu_isolation ON tenant_users FOR ALL USING (tenant_id = current_tenant_id());

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_isolation ON roles FOR ALL USING (tenant_id = current_tenant_id() OR tenant_id IS NULL);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY perms_isolation ON permissions FOR ALL USING (
  role_id IN (SELECT id FROM roles WHERE tenant_id = current_tenant_id())
);

ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY meta_isolation ON metadata FOR ALL USING (tenant_id = current_tenant_id());

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_isolation ON events FOR ALL USING (tenant_id = current_tenant_id());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_isolation ON audit_logs FOR ALL USING (tenant_id = current_tenant_id());

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_isolation ON notifications FOR ALL USING (tenant_id = current_tenant_id());

ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY config_isolation ON configurations FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_configs_updated BEFORE UPDATE ON configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 완료 (v2 — agy 리뷰 반영)
