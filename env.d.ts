// ============================================================
// Business OS — Environment Variables Type Definition
// 헌법: "SECURITY BY DEFAULT"
// ============================================================

interface EnvVariables {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;

  // Slack
  SLACK_WEBHOOK_URL: string;

  // GA4
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: string;

  // FAL.ai
  FAL_KEY: string;

  // ElevenLabs
  ELEVENLABS_API_KEY: string;

  // Firecrawl
  FIRECRAWL_API_KEY: string;

  // Linear
  LINEAR_API_KEY: string;

  // Canva MCP
  CANVA_CLIENT_ID: string;
  CANVA_CLIENT_SECRET: string;
  CANVA_ACCESS_TOKEN: string;
  CANVA_REFRESH_TOKEN: string;
}
