import path from "node:path";

const RESOLVABLE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];

export function resolveImportPath(
  fromFilePath: string,
  importPath: string,
  indexedPaths: Set<string>,
) {
  if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
    return null;
  }

  const fromDirectory = path.posix.dirname(fromFilePath);
  const basePath = importPath.startsWith("/")
    ? importPath.slice(1)
    : path.posix.normalize(path.posix.join(fromDirectory, importPath));

  const candidates = [
    basePath,
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
  ];

  return candidates.find((candidate) => indexedPaths.has(candidate)) ?? null;
}
