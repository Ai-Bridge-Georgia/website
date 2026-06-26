// ============================================================
// Business OS — Tenant Config Templates (제3계층 스킨)
// ============================================================

import type { TenantConfig } from '@aibg/core';

// --- Restaurant Template ---
export const restaurantTemplate: TenantConfig = {
  tenant: {
    name: 'Restaurant',
    slug: 'restaurant',
    industry: 'restaurant',
  },
  theme: {
    primaryColor: '#003478',
    accentColor: '#FF0000',
    font: 'Pretendard',
    logoLight: '/logos/restaurant-LIGHT-nobg.svg',
    logoDark: '/logos/restaurant-DARK-nobg.svg',
  },
  plugins: ['restaurant'],
  modules: ['menu', 'reservation', 'gallery', 'reviews'],
  features: {
    online_order: true,
    delivery: true,
    multilingual: ['ko', 'ka', 'en'],
  },
};

// --- Hotel Template ---
export const hotelTemplate: TenantConfig = {
  tenant: {
    name: 'Hotel',
    slug: 'hotel',
    industry: 'hotel',
  },
  theme: {
    primaryColor: '#2D5F3F',
    accentColor: '#F4A261',
    font: 'Inter',
    logoLight: '/logos/hotel-LIGHT-nobg.svg',
    logoDark: '/logos/hotel-DARK-nobg.svg',
  },
  plugins: ['hotel'],
  modules: ['rooms', 'booking', 'tours'],
  features: {
    multilingual: ['ko', 'ka', 'en', 'ru'],
  },
};

// --- SaaS Template ---
export const saasTemplate: TenantConfig = {
  tenant: {
    name: 'SaaS Company',
    slug: 'saas',
    industry: 'saas',
  },
  theme: {
    primaryColor: '#0A0A0A',
    accentColor: '#3B82F6',
    font: 'SF Pro',
    logoLight: '/logos/saas-LIGHT-nobg.svg',
    logoDark: '/logos/saas-DARK-nobg.svg',
  },
  plugins: ['saas'],
  modules: ['pricing', 'features', 'docs'],
  features: {
    multilingual: ['en'],
  },
};

// --- Template Registry ---
export const templates: Record<string, TenantConfig> = {
  restaurant: restaurantTemplate,
  hotel: hotelTemplate,
  saas: saasTemplate,
};

export function createTenantConfig(
  industry: string,
  overrides: Partial<TenantConfig>
): TenantConfig {
  const base = templates[industry] ?? saasTemplate;
  return {
    ...base,
    ...overrides,
    tenant: { ...base.tenant, ...overrides.tenant },
    theme: { ...base.theme, ...overrides.theme },
  };
}
