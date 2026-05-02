import type { GroundedAnswer, GroundedPrompt } from "@/lib/ai/types";

export interface AIService {
  generateGroundedAnswer(prompt: GroundedPrompt): Promise<GroundedAnswer>;
}

export class FallbackAIService implements AIService {
  async generateGroundedAnswer(prompt: GroundedPrompt): Promise<GroundedAnswer> {
    return {
      content:
        "AI generation is not configured yet. I can only show the source context retrieved for this request.",
      citations: prompt.citations,
    };
  }
}

export function createAIService(): AIService {
  return new FallbackAIService();
}
