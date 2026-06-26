-- ============================================================
-- Domain Tables (Restaurant Plugin) — 3개 테이블
-- ============================================================

-- menus
CREATE TABLE IF NOT EXISTS menus (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC NOT NULL DEFAULT 0,
  image_url   TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menus_tenant ON menus(tenant_id, sort_order);

-- reservations
CREATE TABLE IF NOT EXISTS reservations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  date           TIMESTAMPTZ NOT NULL,
  party_size     INTEGER NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'pending',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_tenant_date ON reservations(tenant_id, date DESC);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_type   TEXT NOT NULL DEFAULT 'dine_in',
  status       TEXT NOT NULL DEFAULT 'pending',
  total        NUMERIC NOT NULL DEFAULT 0,
  items        JSONB NOT NULL DEFAULT '[]',
  customer_info JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id, created_at DESC);

-- RLS for domain tables
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY menus_isolation ON menus FOR ALL USING (tenant_id = current_tenant_id());

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY reservations_isolation ON reservations FOR ALL USING (tenant_id = current_tenant_id());

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_isolation ON orders FOR ALL USING (tenant_id = current_tenant_id());

-- updated_at triggers
CREATE TRIGGER trg_menus_updated BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 첫 메뉴 데이터 INSERT
-- ============================================================
INSERT INTO menus (tenant_id, category, name, description, price, is_available, sort_order)
SELECT id, 'main', '비빔밥', '신선한 야채와 고추장으로 비벼낸 정통 한국 비빔밥', 25, true, 1
FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;

INSERT INTO menus (tenant_id, category, name, description, price, is_available, sort_order)
SELECT id, 'main', '김치찌개', '돼지고기와 묵은 김치로 끓여낸 얼큰한 찌개', 22, true, 2
FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;

INSERT INTO menus (tenant_id, category, name, description, price, is_available, sort_order)
SELECT id, 'side', '김치', '직접 담근 한국식 묵은 김치', 8, true, 10
FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;

INSERT INTO menus (tenant_id, category, name, description, price, is_available, sort_order)
SELECT id, 'drink', '맥주 (Cass)', '시원한 한국 생맥주 500ml', 10, true, 20
FROM tenants WHERE slug = 'aibg'
ON CONFLICT DO NOTHING;
