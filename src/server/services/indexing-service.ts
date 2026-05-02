import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { readIndexableFiles } from "@/lib/indexing/file-system";
import { resolveImportPath } from "@/lib/indexing/import-resolver";
import {
  type RepositorySourceType,
  fetchRepositorySource,
} from "@/lib/indexing/providers";
import { detectStack } from "@/lib/indexing/stack-detection";
import { detectFileRole, detectNextRoute } from "@/lib/parsing/nextjs-detector";
import { parseTypeScriptSource } from "@/lib/parsing/typescript-parser";
import type { ParsedSourceFile } from "@/lib/parsing/types";

type ImportRepositoryInput = {
  sourceType: RepositorySourceType;
  source: string;
  userId?: string | null;
};

type ParsedFileRecord = {
  path: string;
  parsed: ParsedSourceFile | null;
};

export async function importRepository(
  input: ImportRepositoryInput,
  db: PrismaClient = prisma,
) {
  const fetchedRepository = await fetchRepositorySource(input.sourceType, input.source);

  const repository = await db.repository.create({
    data: {
      owner: fetchedRepository.owner,
      name: fetchedRepository.name,
      provider: fetchedRepository.provider,
      defaultBranch: fetchedRepository.defaultBranch,
      cloneUrl: fetchedRepository.cloneUrl,
      sourcePath: fetchedRepository.sourcePath,
      status: "indexing",
      userId: input.userId ?? null,
    },
  });

  try {
    const files = await readIndexableFiles(fetchedRepository.sourcePath);
    const indexedPaths = new Set(files.map((file) => file.relativePath));
    const parsedFiles: ParsedFileRecord[] = [];
    const fileIdsByPath = new Map<string, string>();
    const symbolIdsByFileAndName = new Map<string, string>();
    const symbolIdsByName = new Map<string, string>();

    for (const file of files) {
      const createdFile = await db.repoFile.create({
        data: {
          repositoryId: repository.id,
          path: file.relativePath,
          language: detectLanguage(file.relativePath),
          content: file.content,
          contentHash: sha256(file.content),
          size: file.size,
          role: detectFileRole(file.relativePath),
        },
      });

      fileIdsByPath.set(file.relativePath, createdFile.id);

      const parsed = shouldParseTypeScript(file.relativePath)
        ? parseTypeScriptSource({
            path: file.relativePath,
            content: file.content,
          })
        : null;

      parsedFiles.push({ path: file.relativePath, parsed });

      if (parsed) {
        for (const symbol of parsed.symbols) {
          const createdSymbol = await db.codeSymbol.create({
            data: {
              repositoryId: repository.id,
              fileId: createdFile.id,
              name: symbol.name,
              kind: symbol.kind,
              startLine: symbol.startLine,
              endLine: symbol.endLine,
              signature: symbol.signature,
              exported: symbol.exported,
              async: symbol.async,
              docComment: symbol.docComment,
            },
          });

          symbolIdsByFileAndName.set(
            symbolKey(file.relativePath, symbol.name),
            createdSymbol.id,
          );
          symbolIdsByName.set(symbol.name, createdSymbol.id);
        }

        for (const typeDefinition of parsed.typeDefinitions) {
          await db.typeDefinition.create({
            data: {
              repositoryId: repository.id,
              fileId: createdFile.id,
              symbolId:
                symbolIdsByFileAndName.get(symbolKey(file.relativePath, typeDefinition.name)) ??
                null,
              name: typeDefinition.name,
              kind: typeDefinition.kind,
              rawDefinition: typeDefinition.rawDefinition,
              startLine: typeDefinition.startLine,
              endLine: typeDefinition.endLine,
            },
          });
        }
      }

      const route = detectNextRoute(file.relativePath);

      if (route) {
        await db.route.create({
          data: {
            repositoryId: repository.id,
            fileId: createdFile.id,
            framework: route.framework,
            routePath: route.routePath,
            method: route.method,
            kind: route.kind,
          },
        });
      }
    }

    for (const file of parsedFiles) {
      if (!file.parsed) {
        continue;
      }

      const fromFileId = fileIdsByPath.get(file.path);

      if (!fromFileId) {
        continue;
      }

      for (const parsedImport of file.parsed.imports) {
        const resolvedPath = resolveImportPath(
          file.path,
          parsedImport.importPath,
          indexedPaths,
        );

        await db.importEdge.create({
          data: {
            repositoryId: repository.id,
            fromFileId,
            toFileId: resolvedPath ? fileIdsByPath.get(resolvedPath) ?? null : null,
            importPath: parsedImport.importPath,
            importedNames: parsedImport.importedNames,
            isExternal: parsedImport.isExternal,
          },
        });
      }

      for (const callEdge of file.parsed.callEdges) {
        const callerSymbolId = symbolIdsByFileAndName.get(
          symbolKey(file.path, callEdge.callerName),
        );

        if (!callerSymbolId) {
          continue;
        }

        await db.callEdge.create({
          data: {
            repositoryId: repository.id,
            callerSymbolId,
            calleeSymbolId: symbolIdsByName.get(callEdge.calleeName) ?? null,
            calleeName: callEdge.calleeName,
            confidence: callEdge.confidence,
          },
        });
      }
    }

    return db.repository.update({
      where: { id: repository.id },
      data: {
        status: "indexed",
        indexedAt: new Date(),
        statusMessage: null,
        detectedStack: detectStack(files),
      },
    });
  } catch (error) {
    await db.repository.update({
      where: { id: repository.id },
      data: {
        status: "failed",
        statusMessage: error instanceof Error ? error.message : "Indexing failed.",
      },
    });

    throw error;
  }
}

function shouldParseTypeScript(path: string) {
  return /\.[cm]?[jt]sx?$/.test(path);
}

function detectLanguage(path: string) {
  if (path.endsWith(".tsx")) {
    return "tsx";
  }

  if (path.endsWith(".ts") || path.endsWith(".mts") || path.endsWith(".cts")) {
    return "typescript";
  }

  if (path.endsWith(".jsx")) {
    return "jsx";
  }

  if (path.endsWith(".js") || path.endsWith(".mjs") || path.endsWith(".cjs")) {
    return "javascript";
  }

  if (path.endsWith(".prisma")) {
    return "prisma";
  }

  if (path.endsWith(".json")) {
    return "json";
  }

  return null;
}

function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function symbolKey(filePath: string, symbolName: string) {
  return `${filePath}:${symbolName}`;
}
