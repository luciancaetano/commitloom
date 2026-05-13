import { OpenAIProvider } from "./openai.js";
import type { LLMRequest } from "../types.js";

export class LMStudioProvider extends OpenAIProvider {
  protected override readonly defaultBaseUrl = "http://localhost:1234/v1";
  protected override readonly providerName = "LMStudio";
  protected override readonly envKey = "LMSTUDIO_API_KEY";

  // LM Studio is local and does not require an API key; use a placeholder if none set
  override async generate(request: LLMRequest): Promise<string> {
    const patched: LLMRequest = {
      ...request,
      config: {
        ...request.config,
        apiKey: request.config.apiKey ?? process.env["LMSTUDIO_API_KEY"] ?? "lm-studio",
      },
    };
    return super.generate(patched);
  }
}
