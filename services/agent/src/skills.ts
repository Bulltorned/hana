import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

export interface Skill {
  name: string;
  content: string;
  triggers: string[];
  priority: number;
}

/**
 * Load all SKILL.md files from the skills directory.
 * Parses YAML frontmatter for triggers and priority.
 */
export function loadSkills(skillsPath: string): Skill[] {
  if (!existsSync(skillsPath)) {
    console.warn(`Skills path not found: ${skillsPath}`);
    return [];
  }

  const skills: Skill[] = [];
  const dirs = readdirSync(skillsPath, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of dirs) {
    const skillFile = join(skillsPath, dir.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    const raw = readFileSync(skillFile, "utf-8");
    const { frontmatter, body } = parseFrontmatter(raw);

    skills.push({
      name: dir.name,
      content: body,
      triggers: (frontmatter.triggers as string[]) ?? ["__always_load__"],
      priority: (frontmatter.priority as number) ?? 10,
    });
  }

  // Sort by priority (lower = first)
  skills.sort((a, b) => a.priority - b.priority);

  console.log(`Loaded ${skills.length} skills: ${skills.map((s) => s.name).join(", ")}`);
  return skills;
}

/**
 * Get relevant skills based on user message content.
 */
export function getRelevantSkills(
  skills: Skill[],
  userMessage: string
): Skill[] {
  const msg = userMessage.toLowerCase();

  return skills.filter((skill) => {
    // Always load these
    if (skill.triggers.includes("__always_load__")) return true;

    // Check if any trigger keyword matches
    return skill.triggers.some((trigger) => {
      if (trigger.startsWith("__")) return false; // Special triggers
      return msg.includes(trigger.toLowerCase());
    });
  });
}

/**
 * Build system prompt from relevant skills.
 */
export function buildSystemPrompt(
  skills: Skill[],
  tenantName: string
): string {
  const parts = [
    `You are an HR Agent assistant for ${tenantName}. You help with HR operations, compliance, document generation, and employee management for Indonesian companies.`,
    `Always respond in Bahasa Indonesia unless the user writes in English.`,
    "",
    ...skills.map((s) => `--- ${s.name} ---\n${s.content}`),
  ];

  return parts.join("\n\n");
}

// ── Frontmatter parser ──────────────────────────────

function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const yamlStr = match[1];
  const body = match[2].trim();

  // Simple YAML parser (handles our use case)
  const frontmatter: Record<string, unknown> = {};
  let currentKey = "";
  let currentArray: string[] | null = null;

  for (const line of yamlStr.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("- ") && currentArray !== null) {
      currentArray.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    // Save previous array
    if (currentArray !== null) {
      frontmatter[currentKey] = currentArray;
      currentArray = null;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const val = trimmed.slice(colonIdx + 1).trim();

    if (!val) {
      // Might be start of array
      currentKey = key;
      currentArray = [];
    } else {
      // Simple key-value
      const parsed = val.replace(/^["']|["']$/g, "");
      frontmatter[key] = isNaN(Number(parsed)) ? parsed : Number(parsed);
    }
  }

  // Save last array
  if (currentArray !== null) {
    frontmatter[currentKey] = currentArray;
  }

  return { frontmatter, body };
}
