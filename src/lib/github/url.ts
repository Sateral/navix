export type GitHubRepositoryUrl = {
  owner: string;
  name: string;
  cloneUrl: string;
};

export function parseGitHubRepositoryUrl(input: string): GitHubRepositoryUrl {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Expected a valid GitHub repository URL.");
  }

  if (url.hostname !== "github.com") {
    throw new Error("Expected a github.com repository URL.");
  }

  const [owner, rawName] = url.pathname.split("/").filter(Boolean);

  if (!owner || !rawName) {
    throw new Error("Expected a GitHub URL in owner/repo form.");
  }

  const name = rawName.replace(/\.git$/, "");

  return {
    owner,
    name,
    cloneUrl: `https://github.com/${owner}/${name}.git`,
  };
}
