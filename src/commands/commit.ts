import * as readline from "readline";
import { execSync } from "child_process";
import { GenerateOptions } from "../types.js";
import { collectGitContext } from "../git/index.js";
import { loadConfig, loadInstructions } from "../config/index.js";
import { buildPrompt } from "../prompt.js";
import { createProvider } from "../providers/index.js";

function ask(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith("s") || answer.trim().toLowerCase().startsWith("y"));
    });
  });
}

function runCommit(repoRoot: string, message: string): void {
  execSync(`git commit -m ${JSON.stringify(message)}`, {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

export async function runCommitCommand(options: GenerateOptions): Promise<void> {
  const gitContext = collectGitContext();

  const config = loadConfig(gitContext.repoRoot, options.config);
  const instructions = loadInstructions(gitContext.repoRoot, options.instructions);

  if (options.verbose) {
    process.stderr.write(`Provider: ${config.provider} / ${config.model}\n`);
    process.stderr.write(`Branch: ${gitContext.branch ?? "unknown"}\n`);
    process.stderr.write(`Staged diff: ${gitContext.diff.length} chars\n`);
  }

  process.stderr.write("Generating commit message...\n");

  const prompt = buildPrompt(gitContext, instructions);
  const provider = createProvider(config);
  const message = await provider.generate({ prompt, config });

  if (!message) {
    throw new Error("LLM returned an empty response. Check your provider configuration.");
  }

  process.stderr.write("\n");
  process.stderr.write("─".repeat(60) + "\n");
  process.stdout.write(message + "\n");
  process.stderr.write("─".repeat(60) + "\n\n");

  const confirmed = await ask("Commit with this message? [s/n]: ");

  if (!confirmed) {
    process.stderr.write("Aborted.\n");
    process.exit(0);
  }

  runCommit(gitContext.repoRoot, message);
}
