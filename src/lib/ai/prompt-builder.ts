import type { GroundedPrompt, GroundedPromptInput, SourceCitation } from "@/lib/ai/types";

export function buildGroundedPrompt(input: GroundedPromptInput): GroundedPrompt {
  if (input.contexts.length === 0) {
    throw new Error("Grounded prompts require at least one source context.");
  }

  const citations = input.contexts.map(toCitation);
  const contextBlock = input.contexts
    .map((context, index) => {
      const label = formatCitation(citations[index]);
      return `Source ${index + 1}: ${label}\n\`\`\`\n${context.content}\n\`\`\``;
    })
    .join("\n\n");

  return {
    citations,
    prompt: [
      "You are Navix, a calm senior engineer explaining a repository from source.",
      "Only use the cited source context. Do not invent files, functions, relationships, or intent.",
      "If evidence is insufficient, say exactly what is missing.",
      "Use practical, direct language and cite file paths with line ranges.",
      "",
      `Task: ${input.task}`,
      input.question ? `Question: ${input.question}` : null,
      "",
      contextBlock,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  };
}

function toCitation(context: GroundedPromptInput["contexts"][number]): SourceCitation {
  return {
    filePath: context.filePath,
    startLine: context.startLine,
    endLine: context.endLine,
    symbolName: context.symbolName,
  };
}

function formatCitation(citation: SourceCitation) {
  const lineRange =
    citation.startLine && citation.endLine
      ? `:${citation.startLine}-${citation.endLine}`
      : "";
  const symbol = citation.symbolName ? `#${citation.symbolName}` : "";

  return `${citation.filePath}${lineRange}${symbol}`;
}
