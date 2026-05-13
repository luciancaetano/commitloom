import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";

const SCRIPT_NAME = "git-loom";
const SCRIPT_CONTENT = `#!/bin/sh
exec cloom c "$@"
`;

function candidateDirs(): string[] {
  return [
    path.join(os.homedir(), ".local", "bin"),
    "/usr/local/bin",
    "/usr/bin",
  ];
}

function findInstalled(): string | null {
  for (const dir of candidateDirs()) {
    const p = path.join(dir, SCRIPT_NAME);
    if (fs.existsSync(p)) return p;
  }
  try {
    const result = execSync("which git-loom 2>/dev/null", { encoding: "utf8" }).trim();
    if (result) return result;
  } catch {
    // not found
  }
  return null;
}

function pickInstallDir(): string {
  const pathDirs = new Set((process.env.PATH ?? "").split(":"));
  for (const dir of candidateDirs()) {
    if (pathDirs.has(dir)) return dir;
  }
  // ~/.local/bin not in PATH yet — create it and return it with a warning
  return path.join(os.homedir(), ".local", "bin");
}

export function runInstall(): void {
  const existing = findInstalled();
  if (existing) {
    process.stderr.write(`  git-loom already installed at ${existing}\n`);
    process.stderr.write("  Run 'cloom uninstall' to remove it first.\n");
    return;
  }

  const dir = pickInstallDir();
  const target = path.join(dir, SCRIPT_NAME);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    process.stderr.write(`  created ${dir}\n`);
  }

  fs.writeFileSync(target, SCRIPT_CONTENT, { encoding: "utf8", mode: 0o755 });
  process.stderr.write(`  installed ${target}\n`);

  const pathDirs = new Set((process.env.PATH ?? "").split(":"));
  if (!pathDirs.has(dir)) {
    process.stderr.write(`\n  ${dir} is not in your PATH. Add to your shell profile:\n`);
    process.stderr.write(`    export PATH="$PATH:${dir}"\n`);
    process.stderr.write("  Then reload the shell or run: source ~/.bashrc\n");
  } else {
    process.stderr.write("\nDone. Try: git loom\n");
  }
}

export function runUninstall(): void {
  const existing = findInstalled();
  if (!existing) {
    process.stderr.write("  git-loom is not installed.\n");
    return;
  }

  fs.unlinkSync(existing);
  process.stderr.write(`  removed ${existing}\n\nDone.\n`);
}
