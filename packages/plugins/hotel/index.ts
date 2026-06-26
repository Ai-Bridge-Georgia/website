// ============================================================
// Hotel Plugin — 호텔/호스텔 도메인
// 모듈: rooms, booking, tours
// ============================================================

import type { DomainPlugin, PluginModule, TableSchema } from '../../core/plugin-types';

const roomSchema: TableSchema = {
  name: 'rooms',
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
    { name: 'tenant_id', type: 'uuid', references: 'tenants(id)' },
    { name: 'room_type', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'description', type: 'text', nullable: true },
    { name: 'price_per_night', type: 'numeric' },
    { name: 'capacity', type: 'integer' },
    { name: 'amenities', type: 'jsonb', nullable: true },
    { name: 'image_url', type: 'text', nullable: true },
    { name: 'is_available', type: 'boolean', default: 'true' },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
  ],
};

const bookingSchema: TableSchema = {
  name: 'bookings',
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
    { name: 'tenant_id', type: 'uuid', references: 'tenants(id)' },
    { name: 'room_id', type: 'uuid' },
    { name: 'guest_name', type: 'text' },
    { name: 'guest_email', type: 'text' },
    { name: 'check_in', type: 'timestamptz' },
    { name: 'check_out', type: 'timestamptz' },
    { name: 'guests', type: 'integer' },
    { name: 'total_price', type: 'numeric' },
    { name: 'status', type: 'text', default: "'pending'" },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
  ],
};

export const hotelPlugin: DomainPlugin = {
  id: 'hotel',
  name: 'Hotel Module',
  version: '0.1.0',
  industry: 'hotel',
  modules: [
    { id: 'rooms', name: 'Room Management', schema: [roomSchema] },
    { id: 'booking', name: 'Booking System', schema: [bookingSchema] },
    { id: 'tours', name: 'Tours & Experiences' },
  ],
};
