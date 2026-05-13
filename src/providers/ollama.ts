import { Ollama } from "ollama";
import { LLMProvider, LLMRequest } from "../types.js";

export class OllamaProvider implements LLMProvider {
  async generate(request: LLMRequest): Promise<string> {
    const { prompt, config } = request;
    const host = (config.baseUrl ?? "http://localhost:11434").replace(/\/$/, "");

    const client = new Ollama({ host });

    let response;
    try {
      response = await client.generate({
        model: config.model,
        prompt,
        stream: false,
        options: {
          temperature: config.temperature ?? 0.2,
          num_predict: config.maxTokens ?? 512,
        },
      });
    } catch (err) {
      const msg = (err as Error).message;
      throw new Error(`Ollama error (${host}): ${msg}`);
    }

    return response.response.trim();
  }
}
