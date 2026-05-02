import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  "coverage",
  "dist",
  "build",
  "node_modules",
  "out",
]);

const INDEXABLE_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".env",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".prisma",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

export type SourceFile = {
  absolutePath: string;
  relativePath: string;
  content: string;
  size: number;
};

export async function assertDirectory(sourcePath: string) {
  const info = await stat(sourcePath);

  if (!info.isDirectory()) {
    throw new Error(`Expected ${sourcePath} to be a directory.`);
  }
}

export async function readIndexableFiles(rootPath: string): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  await walkDirectory(rootPath, rootPath, files);
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function walkDirectory(rootPath: string, currentPath: string, files: SourceFile[]) {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".env.example") {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
    }

    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(rootPath, absolutePath, files);
      continue;
    }

    if (!entry.isFile() || !isIndexableFile(entry.name)) {
      continue;
    }

    const content = await readFile(absolutePath, "utf8");
    const relativePath = path.relative(rootPath, absolutePath).replaceAll(path.sep, "/");

    files.push({
      absolutePath,
      relativePath,
      content,
      size: Buffer.byteLength(content),
    });
  }
}

function isIndexableFile(fileName: string) {
  if (fileName === "package.json" || fileName === "README.md") {
    return true;
  }

  return INDEXABLE_EXTENSIONS.has(path.extname(fileName));
}
