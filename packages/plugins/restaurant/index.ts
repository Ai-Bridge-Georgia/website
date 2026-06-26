// ============================================================
// Restaurant Plugin — 식당 도메인
// 모듈: menu, reservation, orders, kitchen, reviews
// ============================================================

import type { DomainPlugin, PluginModule, TableSchema } from '../../core/plugin-types';

// --- Schema: menus ---
const menuSchema: TableSchema = {
  name: 'menus',
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
    { name: 'tenant_id', type: 'uuid', references: 'tenants(id)' },
    { name: 'category', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'description', type: 'text', nullable: true },
    { name: 'price', type: 'numeric' },
    { name: 'image_url', type: 'text', nullable: true },
    { name: 'is_available', type: 'boolean', default: 'true' },
    { name: 'sort_order', type: 'integer', default: '0' },
    { name: 'metadata', type: 'jsonb', nullable: true },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
    { name: 'updated_at', type: 'timestamptz', default: 'now()' },
  ],
};

// --- Schema: reservations ---
const reservationSchema: TableSchema = {
  name: 'reservations',
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
    { name: 'tenant_id', type: 'uuid', references: 'tenants(id)' },
    { name: 'customer_name', type: 'text' },
    { name: 'customer_phone', type: 'text' },
    { name: 'customer_email', type: 'text', nullable: true },
    { name: 'date', type: 'timestamptz' },
    { name: 'party_size', type: 'integer' },
    { name: 'status', type: 'text', default: "'pending'" },
    { name: 'notes', type: 'text', nullable: true },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
  ],
};

// --- Schema: orders ---
const orderSchema: TableSchema = {
  name: 'orders',
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
    { name: 'tenant_id', type: 'uuid', references: 'tenants(id)' },
    { name: 'order_type', type: 'text' },  // dine_in / delivery / takeaway
    { name: 'status', type: 'text', default: "'pending'" },
    { name: 'total', type: 'numeric' },
    { name: 'items', type: 'jsonb' },      // [{ menu_id, qty, price }]
    { name: 'customer_info', type: 'jsonb', nullable: true },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
  ],
};

// --- Modules ---
const menuModule: PluginModule = {
  id: 'menu',
  name: 'Menu Management',
  schema: [menuSchema],
};

const reservationModule: PluginModule = {
  id: 'reservation',
  name: 'Reservation System',
  schema: [reservationSchema],
};

const orderModule: PluginModule = {
  id: 'orders',
  name: 'Order Management',
  schema: [orderSchema],
};

const kitchenModule: PluginModule = {
  id: 'kitchen',
  name: 'Kitchen Display',
};

const reviewModule: PluginModule = {
  id: 'reviews',
  name: 'Reviews & Ratings',
};

// --- Plugin ---
export const restaurantPlugin: DomainPlugin = {
  id: 'restaurant',
  name: 'Restaurant Module',
  version: '0.1.0',
  industry: 'restaurant',
  modules: [menuModule, reservationModule, orderModule, kitchenModule, reviewModule],
};
