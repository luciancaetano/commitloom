import { describe, it, expect } from "vitest";
import { buildPrompt } from "../src/prompt.js";
import type { GitContext } from "../src/types.js";

const base: GitContext = {
  diff: 'diff --git a/foo.ts b/foo.ts\n+const x = 1',
  stat: " foo.ts | 1 +\n 1 file changed, 1 insertion(+)",
  recentLog: "abc1234 feat(auth): add login\ndef5678 fix: handle edge case",
  branch: "main",
  repoRoot: "/tmp/repo",
};

describe("buildPrompt", () => {
  it("includes the branch name", () => {
    expect(buildPrompt(base, null)).toContain("Branch: main");
  });

  it('shows "unknown" when branch is null', () => {
    expect(buildPrompt({ ...base, branch: null }, null)).toContain("Branch: unknown");
  });

  it("includes the diff content", () => {
    expect(buildPrompt(base, null)).toContain(base.diff);
  });

  it("includes the stat summary", () => {
    expect(buildPrompt(base, null)).toContain("Changed files");
    expect(buildPrompt(base, null)).toContain("foo.ts");
  });

  it("includes recent log with indentation", () => {
    const prompt = buildPrompt(base, null);
    expect(prompt).toContain("Recent commits:");
    expect(prompt).toContain("  abc1234 feat(auth): add login");
  });

  it("omits recent log section when log is empty", () => {
    const prompt = buildPrompt({ ...base, recentLog: "" }, null);
    expect(prompt).not.toContain("Recent commits:");
  });

  it("omits stat section when stat is empty", () => {
    const prompt = buildPrompt({ ...base, stat: "" }, null);
    expect(prompt).not.toContain("Changed files");
  });

  it("uses provided instructions when given", () => {
    const instructions = "---\nlanguage: en\n---\n\nAlways use emoji prefixes.";
    expect(buildPrompt(base, instructions)).toContain("Always use emoji prefixes.");
  });

  it("falls back to default instructions when none provided", () => {
    expect(buildPrompt(base, null)).toContain("Conventional Commits");
  });

  it("falls back to default instructions for empty string", () => {
    expect(buildPrompt(base, "")).toContain("Conventional Commits");
  });

  it("labels the diff section with -M flag", () => {
    expect(buildPrompt(base, null)).toContain("git diff --cached -M");
  });

  it("includes the output-only instruction", () => {
    expect(buildPrompt(base, null)).toContain("Output only the commit message");
  });
});
