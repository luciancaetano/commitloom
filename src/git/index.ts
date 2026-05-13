import { execSync } from "child_process";
import { GitContext } from "../types.js";

function exec(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

export function findRepoRoot(): string {
  try {
    return exec("git rev-parse --show-toplevel", process.cwd());
  } catch {
    throw new Error("Not inside a git repository. Run this command from within a git repo.");
  }
}

export function getCurrentBranch(repoRoot: string): string | null {
  try {
    const branch = exec("git rev-parse --abbrev-ref HEAD", repoRoot);
    return branch === "HEAD" ? null : branch;
  } catch {
    return null;
  }
}

export function getStagedDiff(repoRoot: string): string {
  try {
    return exec("git diff --cached", repoRoot);
  } catch {
    return "";
  }
}


export function collectGitContext(): GitContext {
  const repoRoot = findRepoRoot();
  const branch = getCurrentBranch(repoRoot);

  const stagedDiff = getStagedDiff(repoRoot);
  if (stagedDiff.length > 0) {
    return { diff: stagedDiff, branch, repoRoot };
  }

  throw new Error("No staged changes found. Run `git add <files>` before using commitforge.");
}
