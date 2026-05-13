import { OpenAIProvider } from "./openai.js";

export class OpenRouterProvider extends OpenAIProvider {
  protected override readonly defaultBaseUrl = "https://openrouter.ai/api/v1";
  protected override readonly providerName = "OpenRouter";
  protected override readonly envKey = "OPENROUTER_API_KEY";
}
