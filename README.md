# CommitPilot

<p align="center">
  <img src="logo.png" alt="CommitPilot" width="250" />
</p>

**Stop burning tokens on commit messages.**

AI-powered git commit message generator that runs locally or against any LLM provider. Reads your staged diff, follows your rules, and outputs a clean [Conventional Commit](https://www.conventionalcommits.org/) — then asks before it commits.

---

## Install

```bash
npm install -g commitpilot
```

---

## Quick start

```bash
# 1. Initialize CommitPilot in your repo
commitpilot init

# 2. Edit .commitpilot.yml to point at your provider
#    (it's already gitignored — safe for API keys)

# 3. Stage your changes and generate a commit
git add .
commitpilot c
```

---

## Commands

### `commitpilot init`

Sets up CommitPilot in the current repository.

- Creates `.commitpilot.yml` with provider configuration
- Creates `.commitpilot.md` with Conventional Commits instructions
- Adds `.commitpilot.yml` to `.gitignore` automatically
- Never overwrites `.commitpilot.md` if it already exists

```bash
commitpilot init
```

### `commitpilot commit` · alias `commitpilot c`

Reads your staged diff, generates a commit message via your configured LLM, shows it to you, and asks for confirmation before running `git commit`.

```bash
commitpilot commit
commitpilot c        # short alias

# Override config or instructions for a single run
commitpilot c --config path/to/.commitpilot.yml
commitpilot c --instructions path/to/rules.md
commitpilot c --verbose
```

---

## Configuration (`.commitpilot.yml`)

This file is **gitignored by default** — safe to store API keys.

```yaml
provider: ollama
model: qwen2.5-coder:7b
baseUrl: http://localhost:11434
apiKey: null
timeoutMs: 30000
temperature: 0.2
maxTokens: 512
```

### Supported providers

| Provider                               | `provider` value | Default `baseUrl`              |
|----------------------------------------|------------------|--------------------------------|
| [Ollama](https://ollama.com) (local)   | `ollama`         | `http://localhost:11434`       |
| [OpenAI](https://platform.openai.com)  | `openai`         | `https://api.openai.com/v1`    |
| [OpenRouter](https://openrouter.ai)    | `openrouter`     | `https://openrouter.ai/api/v1` |
| [Anthropic](https://www.anthropic.com) | `anthropic`      | `https://api.anthropic.com`    |

#### Ollama (local, no cost)

```yaml
provider: ollama
model: qwen2.5-coder:7b
baseUrl: http://localhost:11434
```

#### OpenAI

```yaml
provider: openai
model: gpt-4o-mini
apiKey: sk-...
```

#### OpenRouter

```yaml
provider: openrouter
model: mistralai/mistral-7b-instruct
apiKey: sk-or-...
```

#### Anthropic

```yaml
provider: anthropic
model: claude-haiku-4-5-20251001
apiKey: sk-ant-...
```

API keys can also be set via environment variables:
`OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`

---

## Customizing commit rules (`.commitpilot.md`)

This file is committed to your repo and shared with your team. It contains the instructions sent to the LLM on every run. Edit it to enforce your project's conventions.

The default template follows the full [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) spec, including:

- All standard types (`feat`, `fix`, `refactor`, `chore`, `perf`, `ci`…)
- Scope guidelines
- Subject line rules (imperative, lowercase, 72 chars)
- Body and footer usage
- Breaking change format (`feat!:` + `BREAKING CHANGE:` footer)
- A decision guide and concrete examples

---

## Setting up Ollama (local, free, no API key)

Ollama lets you run LLMs fully offline on your own machine. It's the default provider for CommitPilot.

### Install Ollama

**macOS**
```bash
# Download the app from the official site and drag to Applications
# https://ollama.com/download
```
Or via Homebrew:
```bash
brew install ollama
```

**Linux**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows**

Download the `.exe` installer from [ollama.com/download](https://ollama.com/download), run it, and follow the prompts. The `ollama` command will be available in PowerShell/CMD after installation.

---

### Pull the recommended model

```bash
ollama pull qwen2.5-coder:7b
```

This is the default model in `.commitpilot.yml`. It's fast, lightweight, and purpose-built for code understanding.

---

### Alternative models

Pick a model based on your hardware. All run locally with Ollama.

| Model                   | Pull command                        | RAM needed | GPU VRAM | Runs on CPU?      | Quality   |
|-------------------------|-------------------------------------|------------|----------|-------------------|-----------|
| `qwen2.5-coder:7b` ⭐    | `ollama pull qwen2.5-coder:7b`      | 8 GB       | 6 GB     | ✅ slow            | Good      |
| `qwen2.5-coder:14b`     | `ollama pull qwen2.5-coder:14b`     | 12 GB      | 10 GB    | ✅ very slow       | Better    |
| `qwen2.5-coder:32b`     | `ollama pull qwen2.5-coder:32b`     | 24 GB      | 20 GB    | ⚠️ impractical     | Excellent |
| `qwen3:8b`              | `ollama pull qwen3:8b`              | 8 GB       | 6 GB     | ✅ slow            | Better    |
| `qwen3:14b`             | `ollama pull qwen3:14b`             | 12 GB      | 10 GB    | ✅ very slow       | Very good |
| `qwen3:32b`             | `ollama pull qwen3:32b`             | 24 GB      | 20 GB    | ⚠️ impractical     | Excellent |
| `deepseek-coder-v2:16b` | `ollama pull deepseek-coder-v2:16b` | 16 GB      | 12 GB    | ⚠️ very slow       | Very good |
| `codellama:13b`         | `ollama pull codellama:13b`         | 12 GB      | 10 GB    | ✅ slow            | Good      |
| `devstral`              | `ollama pull devstral`              | 16 GB      | 14 GB    | ❌ not recommended | Excellent |

**CPU-only notes:**
- Models **≤ 8B** are usable on CPU (expect 3–10 tokens/sec on a modern machine)
- Models **14B** are tolerable on CPU with 32 GB RAM (1–3 tokens/sec)
- Models **32B+** are impractical without a GPU — responses take minutes per commit
- Apple Silicon (M1/M2/M3) uses unified memory, so it handles larger models much better than x86 CPU-only

**To use a different model**, edit `.commitpilot.yml`:
```yaml
provider: ollama
model: qwen3:14b        # ← swap here
baseUrl: http://localhost:11434
```

---

## How it works

```
git add <files>
       │
       ▼
commitpilot commit
       │
       ├─ reads .commitpilot.yml   → provider + model config
       ├─ reads .commitpilot.md    → commit rules for the LLM
       ├─ runs git diff --cached   → staged changes only
       │
       ▼
    LLM prompt
       │
       ▼
  generated message
       │
  shown to user
       │
  [y/n] confirm?
       │
       ▼
  git commit -m "..."
```

Only staged changes are used — what you `git add` is what gets described.

---

## Requirements

- Node.js 18+
- Git
- A running LLM provider (Ollama locally, or an API key for cloud providers)

---

## License

MIT © [Lucian Caetano](https://github.com/lucian-caetano)
