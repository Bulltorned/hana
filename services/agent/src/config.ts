// Agent config — loaded from environment variables set by provisioning service

export const config = {
  tenantId: process.env.TENANT_ID ?? "",
  tenantName: process.env.TENANT_NAME ?? "",
  gatewayUrl: process.env.GATEWAY_URL ?? "http://provisioning:3100/gateway",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  plan: process.env.PLAN ?? "starter",
  pollIntervalMs: 5_000,     // Poll tasks every 5s
  heartbeatIntervalMs: 30_000, // Heartbeat every 30s
};

export function validateConfig(): void {
  const required = ["tenantId", "gatewayUrl", "anthropicApiKey"] as const;
  const missing = required.filter((k) => !config[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}
