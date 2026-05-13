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
    mock.mockReturnValue("/home/user/myrepo\n");
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
    mock.mockReturnValue("feature/auth\n");
    expect(getCurrentBranch("/repo")).toBe("feature/auth");
  });

  it("returns null for detached HEAD state", () => {
    mock.mockReturnValue("HEAD\n");
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
  // mock order: show-toplevel, abbrev-ref HEAD, diff -M, diff --stat, log --oneline
  function mockGitCalls(diff: string, stat = " foo.ts | 1 +", log = "abc feat: init") {
    mock
      .mockReturnValueOnce("/repo")   // git rev-parse --show-toplevel
      .mockReturnValueOnce("main")    // git rev-parse --abbrev-ref HEAD
      .mockReturnValueOnce(diff)      // git diff --cached -M
      .mockReturnValueOnce(stat)      // git diff --cached --stat
      .mockReturnValueOnce(log);      // git log --oneline -5
  }

  it("returns diff, stat and log when staged changes exist", () => {
    mockGitCalls("diff --git a/x b/x\n+1", " x | 1 +", "abc feat: add x");

    const ctx = collectGitContext();
    expect(ctx.diff).toBe("diff --git a/x b/x\n+1");
    expect(ctx.stat).toBe("x | 1 +");
    expect(ctx.recentLog).toBe("abc feat: add x");
    expect(ctx.branch).toBe("main");
    expect(ctx.repoRoot).toBe("/repo");
  });

  it("throws when there are no staged changes", () => {
    mock
      .mockReturnValueOnce("/repo")
      .mockReturnValueOnce("main")
      .mockReturnValueOnce(""); // empty diff

    expect(() => collectGitContext()).toThrow("No staged changes found");
  });

  it("includes branch as null when in detached HEAD", () => {
    mock
      .mockReturnValueOnce("/repo")
      .mockReturnValueOnce("HEAD")
      .mockReturnValueOnce("diff --git a/x b/x")
      .mockReturnValueOnce(" x | 1 +")
      .mockReturnValueOnce("");

    expect(collectGitContext().branch).toBeNull();
  });

  it("includes empty stat and log when git commands fail", () => {
    mock
      .mockReturnValueOnce("/repo")
      .mockReturnValueOnce("main")
      .mockReturnValueOnce("diff --git a/x b/x")
      .mockImplementationOnce(() => { throw new Error("fail"); }) // stat fails
      .mockImplementationOnce(() => { throw new Error("fail"); }); // log fails

    const ctx = collectGitContext();
    expect(ctx.stat).toBe("");
    expect(ctx.recentLog).toBe("");
  });
});
