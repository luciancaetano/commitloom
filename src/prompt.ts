import * as yaml from "js-yaml";
import type { GitContext, PromptMeta } from "./types.js";

const DEFAULT_INSTRUCTIONS = `Generate a concise, descriptive git commit message following the Conventional Commits format.
Use one of these types: feat, fix, docs, style, refactor, test, chore, perf, ci, build.
Write in the imperative mood (e.g., "add feature" not "added feature").
Keep the subject line under 72 characters.
Do not include explanations or markdown — output only the commit message.`;

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseFrontmatter(raw: string): { meta: PromptMeta; body: string; found: boolean } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { meta: {}, body: raw, found: false };
  try {
    const meta = (yaml.load(match[1]) as PromptMeta) ?? {};
    return { meta, body: match[2].trim(), found: true };
  } catch {
    return { meta: {}, body: raw, found: false };
  }
}

function interpolate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{([\w-]+)\}\}/g, (match, key: string) => params[key] ?? match);
}

export function buildPrompt(
  gitContext: GitContext,
  instructions: string | null,
  params: Record<string, string> = {}
): string {
  const { meta, body, found } = parseFrontmatter(instructions?.trim() ?? "");

  if (instructions && !found) {
    throw new Error(
      ".commitloom.md is missing the YAML frontmatter header.\n\n" +
      "Add a frontmatter block at the top of the file:\n\n" +
      "  ---\n" +
      "  system: \"You are a git commit message generator.\"\n" +
      "  language: en\n" +
      "  ---\n\n" +
      "Run `cloom init` in a new repo to see a full example."
    );
  }

  const rawBody = body || DEFAULT_INSTRUCTIONS;
  const effectiveBody = Object.keys(params).length > 0 ? interpolate(rawBody, params) : rawBody;

  const systemLine = meta.system ?? "You are a git commit message generator.";

  const languageNote = meta.language
    ? `IMPORTANT: Write the commit message in ${meta.language}.`
    : "IMPORTANT: Write the commit message in the exact same language as the instructions above.";

  const finalLine = meta.final
    ?? (meta.language
      ? `Generate the commit message now in ${meta.language}. Output only the commit message — a single line, no explanation.`
      : "Generate the commit message now in the same language as the instructions. Output only the commit message — a single line, no explanation.");

  const parts: string[] = [
    systemLine,
    "",
    "## Instructions",
    effectiveBody,
    "",
    languageNote,
  ];

  if (Object.keys(params).length > 0) {
    parts.push("", "## Context variables");
    for (const [key, value] of Object.entries(params)) {
      parts.push(`${key}: ${value}`);
    }
  }

  parts.push(
    "",
    "## Repository Context",
    `Branch: ${gitContext.branch ?? "unknown"}`,
  );

  if (gitContext.recentLog) {
    parts.push("Recent commits:");
    parts.push(
      gitContext.recentLog
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n")
    );
  }

  if (gitContext.stat) {
    parts.push("");
    parts.push("## Changed files");
    parts.push(gitContext.stat);
  }

  parts.push(
    "",
    "## Staged changes (git diff --cached -M):",
    "```diff",
    gitContext.diff,
    "```",
    "",
    finalLine
  );

  return parts.join("\n");
}
