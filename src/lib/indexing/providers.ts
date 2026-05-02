import { mkdir, mkdtemp, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseGitHubRepositoryUrl } from "@/lib/github/url";
import { assertDirectory } from "@/lib/indexing/file-system";

export type RepositorySourceType = "local" | "github";

export type FetchedRepository = {
  owner: string;
  name: string;
  provider: RepositorySourceType;
  cloneUrl: string | null;
  sourcePath: string;
  defaultBranch: string | null;
};

export async function fetchRepositorySource(
  sourceType: RepositorySourceType,
  source: string,
): Promise<FetchedRepository> {
  if (sourceType === "local") {
    return fetchLocalRepository(source);
  }

  return fetchPublicGitHubRepository(source);
}

async function fetchLocalRepository(sourcePath: string): Promise<FetchedRepository> {
  const resolvedPath = await realpath(sourcePath);
  await assertDirectory(resolvedPath);

  return {
    owner: "local",
    name: path.basename(resolvedPath),
    provider: "local",
    cloneUrl: null,
    sourcePath: resolvedPath,
    defaultBranch: null,
  };
}

async function fetchPublicGitHubRepository(source: string): Promise<FetchedRepository> {
  const parsed = parseGitHubRepositoryUrl(source);
  const basePath = path.join(os.tmpdir(), "navix-ingestion");
  await mkdir(basePath, { recursive: true });

  const clonePath = await mkdtemp(path.join(basePath, `${parsed.owner}-${parsed.name}-`));

  await runGit(["clone", "--depth=1", parsed.cloneUrl, clonePath]);

  return {
    owner: parsed.owner,
    name: parsed.name,
    provider: "github",
    cloneUrl: parsed.cloneUrl,
    sourcePath: clonePath,
    defaultBranch: await readGitBranch(clonePath),
  };
}

async function readGitBranch(cwd: string) {
  try {
    const output = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
    return output.trim() || null;
  } catch {
    return null;
  }
}

function runGit(args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `git ${args.join(" ")} failed.`));
    });
  });
}
