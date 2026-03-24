import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3100),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_API_KEY: z.string().min(8),
  DOCKER_SOCKET: z.string().default("/var/run/docker.sock"),
  AGENT_IMAGE: z.string().default("hana-agent:latest"),
  AGENT_NETWORK: z.string().default("hana-network"),
  SKILLS_PATH: z.string().default("/app/skills"),
  CRON_COMPLIANCE: z.string().default("0 1 1 * *"),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof envSchema>;
