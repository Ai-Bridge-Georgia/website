// ============================================================
// Integration Engine — External API Connector
// 헌법: "API First", "Everything is an Engine"
// 외부 서비스 연동을 메타데이터로 정의
// ============================================================

// --- Integration Definition ---
export interface IntegrationDefinition {
  id: string;                     // 'wolt' | 'glovo' | 'bolt-food'
  name: string;
  category: 'delivery' | 'payment' | 'analytics' | 'marketing' | 'auth' | 'custom';
  enabled: boolean;
  // 인증
  auth: AuthConfig;
  // 엔드포인트
  endpoints: Record<string, EndpointDef>;
  // 웹훅
  webhooks?: WebhookDef[];
  // 동기화 설정
  sync?: {
    direction: 'push' | 'pull' | 'bidirectional';
    interval?: number;            // 초
    entity?: string;              // 'orders' | 'menu'
  };
}

// --- Auth Config ---
export type AuthConfig =
  | { type: 'api_key'; header: string; keyEnv: string }     // 'X-API-Key', 'env:WOLT_API_KEY'
  | { type: 'bearer'; tokenEnv: string }
  | { type: 'oauth2'; clientIdEnv: string; clientSecretEnv: string; tokenUrl: string }
  | { type: 'basic'; usernameEnv: string; passwordEnv: string }
  | { type: 'none' };

// --- Endpoint Definition ---
export interface EndpointDef {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;                   // '/v1/orders' (baseUrl 뒤에 붙음)
  // 파라미터 매핑
  params?: ParamMapping[];
  // 응답 매핑
  responseMap?: Record<string, string>;  // source → target
}

export interface ParamMapping {
  name: string;
  source: string;                 // our field name
  target: string;                 // their field name
  required?: boolean;
  transform?: string;             // transformer ID
}

// --- Webhook ---
export interface WebhookDef {
  path: string;                   // '/webhooks/wolt'
  events: string[];               // ['order.created', 'order.updated']
  // 수신 데이터 → 내부 이벤트 매핑
  eventMap?: Record<string, string>;  // 'order.created' → 'external.wolt.order'
}

// --- Registry ---
const integrations = new Map<string, IntegrationDefinition>();

export function registerIntegration(def: IntegrationDefinition): void {
  integrations.set(def.id, def);
}

export function getIntegration(id: string): IntegrationDefinition | undefined {
  return integrations.get(id);
}

export function listIntegrations(category?: string): IntegrationDefinition[] {
  const all = Array.from(integrations.values());
  return category ? all.filter((i) => i.category === category) : all;
}

// --- 환경변수 해결 ---
function resolveEnv(ref: string): string {
  if (ref.startsWith('env:')) {
    return process.env[ref.slice(4)] ?? '';
  }
  return ref;
}

// --- 인증 헤더 생성 ---
function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'api_key':
      return { [auth.header]: resolveEnv(auth.keyEnv) };
    case 'bearer':
      return { 'Authorization': `Bearer ${resolveEnv(auth.tokenEnv)}` };
    case 'basic': {
      const credentials = Buffer.from(
        `${resolveEnv(auth.usernameEnv)}:${resolveEnv(auth.passwordEnv)}`
      ).toString('base64');
      return { 'Authorization': `Basic ${credentials}` };
    }
    case 'none':
    default:
      return {};
  }
}

// --- API 호출 ---
export async function callIntegration(
  integrationId: string,
  endpointName: string,
  data?: Record<string, unknown>,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const integration = getIntegration(integrationId);
  if (!integration) {
    return { success: false, error: `연동 '${integrationId}'를 찾을 수 없습니다` };
  }
  if (!integration.enabled) {
    return { success: false, error: `연동 '${integrationId}'가 비활성화되어 있습니다` };
  }

  const endpoint = integration.endpoints[endpointName];
  if (!endpoint) {
    return { success: false, error: `엔드포인트 '${endpointName}'를 찾을 수 없습니다` };
  }

  // 실제 구현: baseUrl 필요 (Phase 2)
  // 현재: 인터페이스만 정의
  return {
    success: true,
    data: { message: `연동 '${integrationId}/${endpointName}' 호출 완료 (Phase 2 구현 예정)` },
  };
}

// --- 기본 연동 정의 ---
export const defaultIntegrations: IntegrationDefinition[] = [
  {
    id: 'wolt',
    name: 'Wolt (배달)',
    category: 'delivery',
    enabled: false,
    auth: { type: 'api_key', header: 'X-API-Key', keyEnv: 'env:WOLT_API_KEY' },
    endpoints: {
      'push-menu': { method: 'POST', path: '/v1/menu' },
      'get-orders': { method: 'GET', path: '/v1/orders' },
      'accept-order': { method: 'POST', path: '/v1/orders/{id}/accept' },
      'reject-order': { method: 'POST', path: '/v1/orders/{id}/reject' },
    },
    webhooks: [{
      path: '/webhooks/wolt',
      events: ['order.created', 'order.updated'],
      eventMap: { 'order.created': 'external.wolt.order_created' },
    }],
    sync: { direction: 'bidirectional', interval: 60, entity: 'orders' },
  },
  {
    id: 'glovo',
    name: 'Glovo (배달)',
    category: 'delivery',
    enabled: false,
    auth: { type: 'bearer', tokenEnv: 'env:GLOVO_TOKEN' },
    endpoints: {
      'get-orders': { method: 'GET', path: '/api/orders' },
    },
  },
  {
    id: 'stripe',
    name: 'Stripe (결제)',
    category: 'payment',
    enabled: false,
    auth: { type: 'api_key', header: 'Authorization', keyEnv: 'env:STRIPE_SECRET_KEY' },
    endpoints: {
      'create-payment': { method: 'POST', path: '/v1/payment_intents' },
      'get-balance': { method: 'GET', path: '/v1/balance' },
    },
    webhooks: [{
      path: '/webhooks/stripe',
      events: ['payment_intent.succeeded', 'payment_intent.failed'],
      eventMap: { 'payment_intent.succeeded': 'payment.completed' },
    }],
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    category: 'analytics',
    enabled: true,
    auth: { type: 'api_key', header: 'X-Goog-Api-Key', keyEnv: 'env:GA4_API_KEY' },
    endpoints: {
      'get-metrics': { method: 'POST', path: '/v1beta/properties/{property}/:runReport' },
    },
  },
];
