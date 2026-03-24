import Dockerode from "dockerode";
import { config } from "../config.js";
import { logger } from "./logger.js";

const docker = new Dockerode({ socketPath: config.DOCKER_SOCKET });

const CONTAINER_PREFIX = "openclaw-";

function containerName(tenantId: string): string {
  return `${CONTAINER_PREFIX}${tenantId.slice(0, 12)}`;
}

export interface CreateContainerOptions {
  tenantId: string;
  tenantName: string;
  plan: string;
}

export async function createAgentContainer(
  opts: CreateContainerOptions
): Promise<string> {
  const name = containerName(opts.tenantId);
  const tenantDataDir = `/data/tenants/${opts.tenantId}`;

  logger.info({ tenantId: opts.tenantId, name }, "Creating OpenClaw container");

  const container = await docker.createContainer({
    name,
    Image: config.AGENT_IMAGE,
    Env: [
      `TENANT_ID=${opts.tenantId}`,
      `TENANT_NAME=${opts.tenantName}`,
      `ANTHROPIC_API_KEY=${config.ANTHROPIC_API_KEY}`,
      `SUPABASE_URL=${config.SUPABASE_URL}`,
      `SUPABASE_SERVICE_ROLE_KEY=${config.SUPABASE_SERVICE_ROLE_KEY}`,
      `OPENCLAW_HOME=/workspace`,
      `OPENCLAW_STATE_DIR=/workspace/.openclaw/state`,
      `OPENCLAW_CONFIG_PATH=/workspace/.openclaw/openclaw.json`,
      `PLAN=${opts.plan}`,
    ],
    Labels: {
      "hana.agent": "true",
      "hana.tenant_id": opts.tenantId,
      "hana.tenant_name": opts.tenantName,
      "hana.plan": opts.plan,
    },
    ExposedPorts: {
      "18789/tcp": {},
    },
    HostConfig: {
      Binds: [
        `${tenantDataDir}/skills:/workspace/skills`,
        `${tenantDataDir}/state:/workspace/.openclaw`,
      ],
      NetworkMode: config.AGENT_NETWORK,
      Memory: 512 * 1024 * 1024, // 512MB
      NanoCpus: 500_000_000, // 0.5 CPU
      RestartPolicy: { Name: "unless-stopped" },
    },
  });

  return container.id;
}

export async function startContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.start();
  logger.info({ containerId }, "Container started");
}

export async function stopContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.stop({ t: 10 });
  logger.info({ containerId }, "Container stopped");
}

export async function removeContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.remove({ force: true });
  logger.info({ containerId }, "Container removed");
}

export type ContainerStatus = "running" | "stopped" | "not_found";

export async function getContainerStatus(
  tenantId: string
): Promise<{ status: ContainerStatus; containerId?: string }> {
  try {
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: [`hana.tenant_id=${tenantId}`],
      },
    });

    if (containers.length === 0) {
      return { status: "not_found" };
    }

    const c = containers[0];
    return {
      status: c.State === "running" ? "running" : "stopped",
      containerId: c.Id,
    };
  } catch {
    return { status: "not_found" };
  }
}

/**
 * Get the internal Docker network IP of a tenant's container.
 * Used to send messages to the OpenClaw gateway.
 */
export async function getContainerIp(tenantId: string): Promise<string | null> {
  try {
    const containers = await docker.listContainers({
      filters: {
        label: [`hana.tenant_id=${tenantId}`],
      },
    });

    if (containers.length === 0) return null;

    const container = docker.getContainer(containers[0].Id);
    const info = await container.inspect();
    const networks = info.NetworkSettings.Networks;
    const network = networks[config.AGENT_NETWORK];

    return network?.IPAddress ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the OpenClaw gateway URL for a tenant's container.
 */
export function getOpenClawGatewayUrl(tenantId: string): string {
  // Container name is resolvable on the Docker network
  return `http://${containerName(tenantId)}:18789`;
}

export interface AgentContainerInfo {
  containerId: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  state: string;
  createdAt: string;
}

export async function listAgentContainers(): Promise<AgentContainerInfo[]> {
  const containers = await docker.listContainers({
    all: true,
    filters: {
      label: ["hana.agent=true"],
    },
  });

  return containers.map((c) => ({
    containerId: c.Id,
    tenantId: c.Labels["hana.tenant_id"] ?? "",
    tenantName: c.Labels["hana.tenant_name"] ?? "",
    plan: c.Labels["hana.plan"] ?? "",
    state: c.State ?? "unknown",
    createdAt: new Date(c.Created * 1000).toISOString(),
  }));
}

export async function restartContainer(tenantId: string): Promise<void> {
  const { status, containerId } = await getContainerStatus(tenantId);
  if (status === "not_found" || !containerId) {
    throw new Error(`No container found for tenant ${tenantId}`);
  }
  const container = docker.getContainer(containerId);
  await container.restart({ t: 10 });
  logger.info({ tenantId, containerId }, "Container restarted");
}

/**
 * Execute a command inside a tenant's container and return stdout.
 * Uses child_process.execSync to call docker exec for reliable output.
 */
export async function execInContainer(
  tenantId: string,
  cmd: string[]
): Promise<string> {
  const { status, containerId } = await getContainerStatus(tenantId);
  if (status !== "running" || !containerId) {
    throw new Error(`Container for tenant ${tenantId} is not running`);
  }

  const { execSync } = await import("child_process");

  const dockerCmd = `docker exec ${containerId} ${cmd.map((c) => `'${c.replace(/'/g, "'\\''")}'`).join(" ")}`;

  try {
    const output = execSync(dockerCmd, {
      encoding: "utf-8",
      timeout: 90_000,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return output.trim();
  } catch (err: any) {
    // execSync throws on non-zero exit, but stdout may still have output
    if (err.stdout) {
      return (err.stdout as string).trim();
    }
    throw err;
  }
}

/**
 * Call an OpenClaw gateway RPC method inside a tenant's container.
 */
export async function openclawGatewayCall(
  tenantId: string,
  method: string,
  params: Record<string, unknown> = {},
  options: { timeout?: number; expectFinal?: boolean } = {}
): Promise<unknown> {
  const timeout = options.timeout ?? 60000;
  const cmd = [
    "openclaw", "gateway", "call", method,
    "--params", JSON.stringify(params),
    "--json",
    "--timeout", String(timeout),
  ];

  if (options.expectFinal) {
    cmd.push("--expect-final");
  }

  logger.info({ tenantId, method, params }, "OpenClaw gateway call");

  const output = await execInContainer(tenantId, cmd);

  // Parse JSON response
  try {
    // Find the first { or [ to start of JSON (skip any log lines)
    const jsonStart = output.search(/[{\[]/);
    if (jsonStart === -1) {
      logger.warn({ tenantId, method, output }, "No JSON in OpenClaw response");
      return { raw: output };
    }
    return JSON.parse(output.slice(jsonStart));
  } catch {
    logger.warn({ tenantId, method, output }, "Failed to parse OpenClaw response");
    return { raw: output };
  }
}
