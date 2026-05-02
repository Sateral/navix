import type { SourceFile } from "@/lib/indexing/file-system";

export type StackDetection = {
  name: string;
  version: string | null;
  confidence: number;
  evidence: string[];
};

export function detectStack(files: SourceFile[]): StackDetection[] {
  const byPath = new Map(files.map((file) => [file.relativePath, file]));
  const packageJson = readPackageJson(byPath.get("package.json")?.content);
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
  };

  const detections: StackDetection[] = [];

  if (dependencies.next || byPath.has("next.config.ts") || byPath.has("next.config.mjs")) {
    detections.push({
      name: "Next.js",
      version: dependencies.next ?? null,
      confidence: dependencies.next ? 0.95 : 0.75,
      evidence: [
        dependencies.next ? "package.json dependency: next" : null,
        byPath.has("app/page.tsx") ? "app/page.tsx" : null,
        byPath.has("app/layout.tsx") ? "app/layout.tsx" : null,
        byPath.has("next.config.ts") ? "next.config.ts" : null,
        byPath.has("next.config.mjs") ? "next.config.mjs" : null,
      ].filter((item): item is string => Boolean(item)),
    });
  }

  if (dependencies.typescript || byPath.has("tsconfig.json")) {
    detections.push({
      name: "TypeScript",
      version: dependencies.typescript ?? null,
      confidence: dependencies.typescript ? 0.95 : 0.8,
      evidence: [
        dependencies.typescript ? "package.json dependency: typescript" : null,
        byPath.has("tsconfig.json") ? "tsconfig.json" : null,
      ].filter((item): item is string => Boolean(item)),
    });
  }

  if (dependencies["@prisma/client"] || byPath.has("prisma/schema.prisma")) {
    detections.push({
      name: "Prisma",
      version: dependencies["@prisma/client"] ?? dependencies.prisma ?? null,
      confidence: byPath.has("prisma/schema.prisma") ? 0.95 : 0.75,
      evidence: [
        dependencies["@prisma/client"] ? "package.json dependency: @prisma/client" : null,
        byPath.has("prisma/schema.prisma") ? "prisma/schema.prisma" : null,
      ].filter((item): item is string => Boolean(item)),
    });
  }

  if (dependencies["better-auth"] || dependencies["next-auth"]) {
    detections.push({
      name: "Auth",
      version: dependencies["better-auth"] ?? dependencies["next-auth"] ?? null,
      confidence: 0.8,
      evidence: [
        dependencies["better-auth"] ? "package.json dependency: better-auth" : null,
        dependencies["next-auth"] ? "package.json dependency: next-auth" : null,
      ].filter((item): item is string => Boolean(item)),
    });
  }

  if (dependencies.pg || dependencies["@prisma/adapter-pg"]) {
    detections.push({
      name: "PostgreSQL",
      version: dependencies.pg ?? null,
      confidence: 0.75,
      evidence: [
        dependencies.pg ? "package.json dependency: pg" : null,
        dependencies["@prisma/adapter-pg"]
          ? "package.json dependency: @prisma/adapter-pg"
          : null,
      ].filter((item): item is string => Boolean(item)),
    });
  }

  return detections;
}

function readPackageJson(content: string | undefined) {
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
  } catch {
    return null;
  }
}
