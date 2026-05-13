import * as fs from "fs";
import * as path from "path";
import { findRepoRoot } from "../git/index.js";

const DEFAULT_CONFIG = `provider: ollama
model: qwen2.5-coder:7b
baseUrl: http://localhost:11434
apiKey: null
timeoutMs: 30000
temperature: 0.2
maxTokens: 512
`;

const DEFAULT_INSTRUCTIONS = `You are a git commit message generator. Follow the Conventional Commits specification strictly.

## Format

\`\`\`
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
\`\`\`

## Types

- **feat**: new feature for the user
- **fix**: bug fix for the user
- **docs**: documentation changes only
- **style**: formatting, missing semicolons, whitespace (no logic change)
- **refactor**: code restructuring without adding features or fixing bugs
- **test**: adding or correcting tests
- **chore**: build process, dependency updates, tooling
- **perf**: performance improvements
- **ci**: CI/CD configuration changes
- **build**: changes that affect the build system

## Rules

- Subject line: imperative mood, lowercase, no trailing period, max 72 characters
- Scope: optional, lowercase noun describing the section affected (e.g. \`auth\`, \`api\`, \`config\`)
- Body: use when the change needs context; wrap at 72 characters; explain *what* and *why*, not *how*
- Breaking change: add \`!\` after type/scope (e.g. \`feat!:\`) and a \`BREAKING CHANGE:\` footer
- Output only the commit message — no markdown fences, no explanation, no extra text
`;

function addToGitignore(repoRoot: string, entry: string): void {
  const gitignorePath = path.join(repoRoot, ".gitignore");
  const line = entry.startsWith("/") ? entry : `/${entry}`;

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf8");
    const lines = content.split("\n").map((l) => l.trim());
    if (lines.includes(entry) || lines.includes(line) || lines.includes(`/${entry}`)) {
      return;
    }
    const separator = content.endsWith("\n") ? "" : "\n";
    fs.appendFileSync(gitignorePath, `${separator}${line}\n`, "utf8");
    process.stderr.write(`  updated .gitignore — added ${line}\n`);
  } else {
    fs.writeFileSync(gitignorePath, `${line}\n`, "utf8");
    process.stderr.write(`  created .gitignore — added ${line}\n`);
  }
}

export function runInit(): void {
  const repoRoot = findRepoRoot();

  const configPath = path.join(repoRoot, ".commitforge.yml");
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, DEFAULT_CONFIG, "utf8");
    process.stderr.write(`  created .commitforge.yml\n`);
  } else {
    process.stderr.write(`  .commitforge.yml already exists — skipped\n`);
  }

  const instructionsPath = path.join(repoRoot, ".commitforge.md");
  if (!fs.existsSync(instructionsPath)) {
    fs.writeFileSync(instructionsPath, DEFAULT_INSTRUCTIONS, "utf8");
    process.stderr.write(`  created .commitforge.md\n`);
  } else {
    process.stderr.write(`  .commitforge.md already exists — skipped\n`);
  }

  addToGitignore(repoRoot, ".commitforge.yml");

  process.stderr.write("\nDone. Edit .commitforge.yml to configure your provider.\n");
}
