import Dockerode from "dockerode";
import { config } from "../config.js";
import { logger } from "./logger.js";

const docker = new Dockerode({ socketPath: config.DOCKER_SOCKET });

const CONTAINER_PREFIX = "hana-agent-";

function containerName(tenantId: string): string {
  return `${CONTAINER_PREFIX}${tenantId.slice(0, 8)}`;
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

  logger.info({ tenantId: opts.tenantId, name }, "Creating agent container");

  const container = await docker.createContainer({
    name,
    Image: config.AGENT_IMAGE,
    Env: [
      `TENANT_ID=${opts.tenantId}`,
      `TENANT_NAME=${opts.tenantName}`,
      `GATEWAY_URL=http://provisioning:${config.PORT}/gateway`,
      `SUPABASE_URL=${config.SUPABASE_URL}`,
      `SUPABASE_SERVICE_ROLE_KEY=${config.SUPABASE_SERVICE_ROLE_KEY}`,
      `PLAN=${opts.plan}`,
    ],
    Labels: {
      "hana.agent": "true",
      "hana.tenant_id": opts.tenantId,
      "hana.tenant_name": opts.tenantName,
      "hana.plan": opts.plan,
    },
    HostConfig: {
      Binds: [
        `${config.SKILLS_PATH}:/app/skills:ro`,
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
