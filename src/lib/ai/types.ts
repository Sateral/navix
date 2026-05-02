export type SourceCitation = {
  filePath: string;
  startLine?: number;
  endLine?: number;
  symbolName?: string;
};

export type SourceContext = SourceCitation & {
  content: string;
};

export type GroundedPromptInput = {
  task: string;
  question?: string;
  contexts: SourceContext[];
};

export type GroundedPrompt = {
  prompt: string;
  citations: SourceCitation[];
};

export type GroundedAnswer = {
  content: string;
  citations: SourceCitation[];
};
