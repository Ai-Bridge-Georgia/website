// ============================================================
// Supabase Adapter — Infrastructure Layer
// Factory Core의 IEntityStore / ITenantResolver 인터페이스 구현
// Core는 이 파일의 존재를 모름
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { IEntityStore, ITenantResolver } from '../../core/boundary';

// --- Entity Store (Supabase 구현) ---
export class SupabaseEntityStore implements IEntityStore {
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async find(
    table: string,
    options: {
      tenantId: string;
      filters?: Record<string, unknown>;
      sort?: { column: string; ascending: boolean };
      pagination?: { page: number; limit: number };
    },
  ): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const { page = 1, limit = 50 } = options.pagination ?? {};
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client
      .from(table)
      .select('*', { count: 'exact' })
      .eq('tenant_id', options.tenantId)
      .range(from, to);

    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        query = query.eq(key, value);
      }
    }

    if (options.sort) {
      query = query.order(options.sort.column, { ascending: options.sort.ascending });
    }

    const { data, count, error } = await query;

    if (error) throw new Error(`[Supabase] find: ${error.message}`);

    return {
      data: (data ?? []) as Record<string, unknown>[],
      total: count ?? 0,
    };
  }

  async findById(
    table: string,
    id: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;
    return data as Record<string, unknown>;
  }

  async insert(
    table: string,
    data: Record<string, unknown>,
    tenantId: string,
  ): Promise<Record<string, unknown>> {
    const { data: result, error } = await this.client
      .from(table)
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw new Error(`[Supabase] insert: ${error.message}`);
    return result as Record<string, unknown>;
  }

  async update(
    table: string,
    id: string,
    data: Record<string, unknown>,
    tenantId: string,
  ): Promise<Record<string, unknown>> {
    const { data: result, error } = await this.client
      .from(table)
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new Error(`[Supabase] update: ${error.message}`);
    return result as Record<string, unknown>;
  }

  async delete(table: string, id: string, tenantId: string): Promise<void> {
    const { error } = await this.client
      .from(table)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(`[Supabase] delete: ${error.message}`);
  }
}

// --- Tenant Resolver (Supabase 구현) ---
const tenantCache = new Map<string, { id: string; expires: number }>();

export class SupabaseTenantResolver implements ITenantResolver {
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async resolve(request: {
    headers?: Record<string, string | null>;
    searchParams?: URLSearchParams;
  }): Promise<{ tenantId: string; slug: string; role: string; userId?: string } | null> {
    const slug =
      request.headers?.['x-tenant-slug'] ??
      request.searchParams?.get('tenant') ??
      'aibg';

    const cached = tenantCache.get(slug);
    if (cached && cached.expires > Date.now()) {
      return { tenantId: cached.id, slug, role: 'admin' };
    }

    const { data, error } = await this.client
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;

    tenantCache.set(slug, { id: data.id, expires: Date.now() + 60_000 });

    return { tenantId: data.id, slug, role: 'admin' };
  }
}
