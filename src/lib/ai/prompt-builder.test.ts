import { describe, expect, it } from "vitest";
import { buildGroundedPrompt } from "@/lib/ai/prompt-builder";

describe("buildGroundedPrompt", () => {
  it("builds a source-grounded prompt with citations", () => {
    const prompt = buildGroundedPrompt({
      task: "Explain the selected file.",
      question: "What is the entry point?",
      contexts: [
        {
          filePath: "app/page.tsx",
          startLine: 1,
          endLine: 4,
          content: "export default function Page() {\n  return null;\n}",
        },
      ],
    });

    expect(prompt.citations).toEqual([
      { filePath: "app/page.tsx", startLine: 1, endLine: 4 },
    ]);
    expect(prompt.prompt).toContain("Only use the cited source context");
    expect(prompt.prompt).toContain("app/page.tsx:1-4");
    expect(prompt.prompt).toContain("What is the entry point?");
  });

  it("rejects prompts without source context", () => {
    expect(() =>
      buildGroundedPrompt({
        task: "Explain this repo.",
        contexts: [],
      }),
    ).toThrow("Grounded prompts require at least one source context.");
  });
});
