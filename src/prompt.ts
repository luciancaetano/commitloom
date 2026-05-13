import { GitContext } from "./types.js";

const DEFAULT_INSTRUCTIONS = `Generate a concise, descriptive git commit message following the Conventional Commits format.
Use one of these types: feat, fix, docs, style, refactor, test, chore, perf, ci, build.
Write in the imperative mood (e.g., "add feature" not "added feature").
Keep the subject line under 72 characters.
Do not include explanations or markdown — output only the commit message.`;

export function buildPrompt(
  gitContext: GitContext,
  instructions: string | null
): string {
  const effectiveInstructions = instructions?.trim() || DEFAULT_INSTRUCTIONS;

  const branchLine =
    gitContext.branch
      ? `Current branch: ${gitContext.branch}`
      : "Current branch: unknown";

  return [
    "You are a git commit message generator.",
    "",
    "## Instructions",
    effectiveInstructions,
    "",
    "## Repository Context",
    branchLine,
    "",
    "## Staged changes (git diff --cached):",
    "```diff",
    gitContext.diff,
    "```",
    "",
    "Generate the commit message now. Output only the commit message with no additional text, explanation, or markdown formatting.",
  ].join("\n");
}
