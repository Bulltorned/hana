import { config, validateConfig } from "./config.js";
import { pollTask, sendHeartbeat } from "./gateway.js";
import { loadSkills } from "./skills.js";
import { processTask } from "./processor.js";

// ── Startup ─────────────────────────────────────────

validateConfig();

console.log(`🤖 Hana Agent starting for tenant: ${config.tenantName} (${config.tenantId})`);
console.log(`   Gateway: ${config.gatewayUrl}`);
console.log(`   Plan: ${config.plan}`);

// Load skills
const skills = loadSkills("/app/skills/hrd-agent-skills");

let messageCount = 0;
const startTime = Date.now();

// ── Task Polling Loop ───────────────────────────────

async function pollLoop(): Promise<void> {
  while (true) {
    try {
      const task = await pollTask();

      if (task) {
        messageCount++;
        await processTask(task, skills);
      }
    } catch (err: any) {
      console.error("Poll error:", err.message);
    }

    // Wait before next poll
    await sleep(config.pollIntervalMs);
  }
}

// ── Heartbeat Loop ──────────────────────────────────

async function heartbeatLoop(): Promise<void> {
  while (true) {
    try {
      const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
      await sendHeartbeat({
        messageCount,
        uptimeSeconds,
      });
    } catch (err: any) {
      console.error("Heartbeat error:", err.message);
    }

    await sleep(config.heartbeatIntervalMs);
  }
}

// ── Start ───────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Send initial heartbeat
sendHeartbeat({ messageCount: 0, uptimeSeconds: 0 }).catch(() => {});

// Start both loops concurrently
Promise.all([pollLoop(), heartbeatLoop()]).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

console.log("✅ Agent running — polling for tasks...");
