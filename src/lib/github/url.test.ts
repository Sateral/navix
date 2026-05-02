import { describe, expect, it } from "vitest";
import { parseGitHubRepositoryUrl } from "@/lib/github/url";

describe("parseGitHubRepositoryUrl", () => {
  it("normalizes public GitHub repository URLs", () => {
    expect(parseGitHubRepositoryUrl("https://github.com/Sateral/navix")).toEqual({
      owner: "Sateral",
      name: "navix",
      cloneUrl: "https://github.com/Sateral/navix.git",
    });

    expect(parseGitHubRepositoryUrl("https://github.com/Sateral/navix.git")).toEqual({
      owner: "Sateral",
      name: "navix",
      cloneUrl: "https://github.com/Sateral/navix.git",
    });
  });

  it("rejects non-GitHub or incomplete URLs", () => {
    expect(() => parseGitHubRepositoryUrl("https://example.com/acme/repo")).toThrow(
      "Expected a github.com repository URL.",
    );
    expect(() => parseGitHubRepositoryUrl("https://github.com/acme")).toThrow(
      "Expected a GitHub URL in owner/repo form.",
    );
  });
});
