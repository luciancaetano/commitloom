# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This is the canonical instruction file for AI coding agents. All provider-specific files (CLAUDE.md, AGENTS.md, etc.) are symlinks pointing here.

## Project overview

**commitloom** (`cloom`) — AI-powered CLI that reads a staged git diff, builds a prompt, calls an LLM, and outputs a Conventional Commit message. Supports Ollama (local), OpenAI, Anthropic, and OpenRouter.

## Commands

```bash
npm run build          # tsc → dist/
npm run dev            # ts-node src/index.ts (no build needed)
npm test               # vitest run (single pass)
npm run test:watch     # vitest (watch mode)
npm run lint           # eslint src/ tests/
npm run lint:fix       # eslint --fix

# Run a single test file
npx vitest run tests/prompt.test.ts
```

## Architecture

```
src/
  index.ts          # CLI entry: commander setup, -- param splitting, subcommand dispatch
  types.ts          # All shared interfaces (commitloomConfig, GitContext, LLMProvider, …)
  config/index.ts   # Loads .commitloom.yml and .commitloom.md from repo root
  git/index.ts      # Git shell helpers: diff, stat, log, branch, repo-root detection
  prompt.ts         # Builds LLM user/system prompt; sanitizeMessage; detectTypeHint
  providers/        # One file per provider (ollama, openai, openrouter, anthropic)
    index.ts        # createProvider() factory — switch on config.provider
  commands/
    commit.ts       # Interactive loop: generate → show → y/e/r/n → git commit
    init.ts         # Writes default .commitloom.yml + .commitloom.md to cwd
```

### Data flow for `cloom c`

1. `index.ts` splits `process.argv` at `--` to extract context params.
2. `commit.ts` calls `collectGitContext()` → `loadConfig()` → `loadInstructions()`.
3. `buildPrompt()` assembles the user message: instructions body → language note → context vars → type hint → repo context → staged diff.
4. `createProvider(config)` returns the matching `LLMProvider` implementation.
5. Provider calls its SDK, returns raw string → `sanitizeMessage()` strips fences/prose.
6. Interactive loop: user presses y (commit), e (edit inline), r (regenerate with feedback), n (abort).

### Key details

- **`.commitloom.yml`** — gitignored config (provider, model, apiKey, temperature, etc.). Defaults to `ollama / qwen2.5-coder:7b`.
- **`.commitloom.md`** — committed instructions file. **Must have YAML frontmatter** (`system`, `language`, `final` fields); missing frontmatter throws at runtime.
- **Context variables** — arbitrary `--key value` pairs after `--` are injected into the prompt and replace `{{key}}` placeholders in `.commitloom.md`.
- **Type hints** — `detectTypeHint()` in `prompt.ts` inspects changed file paths and injects a hint (e.g. "prefer type `test`") when all files match a single category.
- **Module format** — `tsconfig.json` targets `CommonJS`. Source imports use `.js` extensions (TypeScript resolves these to `.ts` at compile time).
- **Strict TS** — `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` are all enabled. Don't leave unused variables.
- `stdout` is reserved for the commit message only; all UI/diagnostics go to `stderr`.
