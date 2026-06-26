// ============================================================
// Restaurant Plugin — Self Registration
// Factory Core가 아닌 플러그인이 자기 엔티티를 등록
// ============================================================

import type { PluginManifest, EntitySchemaMeta, FieldSchemaMeta } from '../../core/boundary';
import { registerEntity } from '../../core/handler';

// --- Entity Schema Metadata ---
const menuFields: FieldSchemaMeta[] = [
  { name: 'category', type: 'text' },
  { name: 'name', type: 'text' },
  { name: 'description', type: 'text', nullable: true },
  { name: 'price', type: 'numeric' },
  { name: 'image_url', type: 'text', nullable: true },
  { name: 'is_available', type: 'boolean', default: 'true' },
  { name: 'sort_order', type: 'numeric', default: '0' },
  { name: 'metadata', type: 'jsonb', nullable: true },
];

const reservationFields: FieldSchemaMeta[] = [
  { name: 'customer_name', type: 'text' },
  { name: 'customer_phone', type: 'text', nullable: true },
  { name: 'customer_email', type: 'text', nullable: true },
  { name: 'date', type: 'timestamptz' },
  { name: 'party_size', type: 'numeric', default: '1' },
  { name: 'status', type: 'text', default: "'pending'" },
  { name: 'notes', type: 'text', nullable: true },
];

const orderFields: FieldSchemaMeta[] = [
  { name: 'order_type', type: 'text', default: "'dine_in'" },
  { name: 'status', type: 'text', default: "'pending'" },
  { name: 'total', type: 'numeric', default: '0' },
  { name: 'items', type: 'jsonb', default: "'[]'" },
  { name: 'customer_info', type: 'jsonb', nullable: true },
];

// --- Entity Definitions ---
const menusEntity: EntitySchemaMeta = {
  name: 'menus',
  table: 'menus',
  label: '메뉴',
  fields: menuFields,
  defaultSort: { column: 'sort_order', ascending: true },
  filterable: ['category', 'is_available'],
  requiredFields: ['name', 'category', 'price'],
  resource: 'menu',
};

const reservationsEntity: EntitySchemaMeta = {
  name: 'reservations',
  table: 'reservations',
  label: '예약',
  fields: reservationFields,
  defaultSort: { column: 'date', ascending: false },
  filterable: ['status', 'date'],
  requiredFields: ['customer_name', 'date', 'party_size'],
  resource: 'reservations',
  workflowId: 'reservation',
};

const ordersEntity: EntitySchemaMeta = {
  name: 'orders',
  table: 'orders',
  label: '주문',
  fields: orderFields,
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['status', 'order_type'],
  requiredFields: ['items'],
  resource: 'orders',
  workflowId: 'order',
};

// --- Self Registration (import 시 자동 실행) ---
registerEntity(menusEntity);
registerEntity(reservationsEntity);
registerEntity(ordersEntity);

// --- Plugin Manifest (Factory가 읽는 메타데이터) ---
export const restaurantManifest: PluginManifest = {
  id: 'restaurant',
  name: 'Restaurant Module',
  version: '0.2.0',
  industry: 'restaurant',
  entities: [menusEntity, reservationsEntity, ordersEntity],
  permissions: [
    { role: 'admin', resource: 'menu', actions: ['read', 'create', 'update', 'delete'] },
    { role: 'owner', resource: 'menu', actions: ['read', 'create', 'update'] },
    { role: 'staff', resource: 'menu', actions: ['read'] },
    { role: 'customer', resource: 'menu', actions: ['read'] },
    { role: 'admin', resource: 'reservations', actions: ['read', 'create', 'update', 'delete'] },
    { role: 'customer', resource: 'reservations', actions: ['read', 'create'] },
    { role: 'admin', resource: 'orders', actions: ['read', 'create', 'update', 'delete'] },
    { role: 'customer', resource: 'orders', actions: ['read', 'create'] },
  ],
  ruleIds: ['business-hours', 'min-order-amount', 'lunch-discount', 'max-party-size', 'late-night-surcharge'],
  workflowIds: ['reservation', 'order'],
  notificationRuleIds: ['order-created-slack', 'reservation-new-slack'],
};
