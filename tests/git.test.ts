import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("child_process", () => ({ execSync: vi.fn() }));

import { execSync } from "child_process";
import {
  findRepoRoot,
  getCurrentBranch,
  collectGitContext,
} from "../src/git/index.js";

const mock = vi.mocked(execSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findRepoRoot", () => {
  it("returns the trimmed repo root path", () => {
    mock.mockReturnValue("/home/user/myrepo\n" as never);
    expect(findRepoRoot()).toBe("/home/user/myrepo");
  });

  it("throws a friendly error when not in a git repo", () => {
    mock.mockImplementation(() => {
      throw new Error("fatal: not a git repo");
    });
    expect(() => findRepoRoot()).toThrow("Not inside a git repository");
  });
});

describe("getCurrentBranch", () => {
  it("returns the current branch name", () => {
    mock.mockReturnValue("feature/auth\n" as never);
    expect(getCurrentBranch("/repo")).toBe("feature/auth");
  });

  it("returns null for detached HEAD state", () => {
    mock.mockReturnValue("HEAD\n" as never);
    expect(getCurrentBranch("/repo")).toBeNull();
  });

  it("returns null when git command fails", () => {
    mock.mockImplementation(() => {
      throw new Error("fail");
    });
    expect(getCurrentBranch("/repo")).toBeNull();
  });
});

describe("collectGitContext", () => {
  it("returns staged diff when available", () => {
    mock
      .mockReturnValueOnce("/repo" as never)               // git rev-parse --show-toplevel
      .mockReturnValueOnce("main" as never)                // git rev-parse --abbrev-ref HEAD
      .mockReturnValueOnce("diff --git a/x b/x\n+1" as never); // git diff --cached

    const ctx = collectGitContext();
    expect(ctx.diff).toBe("diff --git a/x b/x\n+1");
    expect(ctx.branch).toBe("main");
    expect(ctx.repoRoot).toBe("/repo");
  });

  it("throws when there are no staged changes", () => {
    mock
      .mockReturnValueOnce("/repo" as never)
      .mockReturnValueOnce("main" as never)
      .mockReturnValueOnce("" as never); // empty staged diff

    expect(() => collectGitContext()).toThrow("No staged changes found");
  });

  it("includes branch as null when in detached HEAD", () => {
    mock
      .mockReturnValueOnce("/repo" as never)
      .mockReturnValueOnce("HEAD" as never)
      .mockReturnValueOnce("diff --git a/x b/x" as never);

    const ctx = collectGitContext();
    expect(ctx.branch).toBeNull();
  });
});
