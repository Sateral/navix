import ts from "typescript";
import type {
  ParsedCallEdge,
  ParsedImport,
  ParsedSourceFile,
  ParsedSymbol,
  ParsedSymbolKind,
  ParsedTypeDefinition,
  ParsedTypeDefinitionKind,
} from "@/lib/parsing/types";

type SourceInput = {
  path: string;
  content: string;
};

export function parseTypeScriptSource(input: SourceInput): ParsedSourceFile {
  const sourceFile = ts.createSourceFile(
    input.path,
    input.content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(input.path),
  );

  const imports: ParsedImport[] = [];
  const symbols: ParsedSymbol[] = [];
  const typeDefinitions: ParsedTypeDefinition[] = [];
  const callEdges: ParsedCallEdge[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      imports.push(parseImport(node));
      return;
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      symbols.push(toSymbol(sourceFile, node.name.text, "function", node));
      callEdges.push(...extractCallEdges(sourceFile, node.name.text, node.body));
    }

    if (ts.isVariableStatement(node)) {
      const exported = hasModifier(node, ts.SyntaxKind.ExportKeyword);

      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }

        const initializer = declaration.initializer;
        const isFunctionValue =
          initializer &&
          (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer));

        const kind: ParsedSymbolKind = isFunctionValue
          ? "function"
          : isConstDeclaration(node)
            ? "constant"
            : "variable";

        symbols.push(
          toSymbol(sourceFile, declaration.name.text, kind, node, {
            exported,
            async: isFunctionValue ? hasModifier(initializer, ts.SyntaxKind.AsyncKeyword) : false,
          }),
        );

        if (isFunctionValue) {
          callEdges.push(
            ...extractCallEdges(sourceFile, declaration.name.text, initializer.body),
          );
        }
      }
    }

    if (ts.isInterfaceDeclaration(node)) {
      symbols.push(toSymbol(sourceFile, node.name.text, "interface", node));
      typeDefinitions.push(toTypeDefinition(sourceFile, node.name.text, "interface", node));
    }

    if (ts.isTypeAliasDeclaration(node)) {
      symbols.push(toSymbol(sourceFile, node.name.text, "type", node));
      typeDefinitions.push(toTypeDefinition(sourceFile, node.name.text, "type", node));
    }

    if (ts.isClassDeclaration(node) && node.name) {
      symbols.push(toSymbol(sourceFile, node.name.text, "class", node));
      typeDefinitions.push(toTypeDefinition(sourceFile, node.name.text, "class", node));
    }

    if (ts.isEnumDeclaration(node)) {
      symbols.push(toSymbol(sourceFile, node.name.text, "enum", node));
      typeDefinitions.push(toTypeDefinition(sourceFile, node.name.text, "enum", node));
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  return {
    path: input.path,
    language: getLanguage(input.path),
    imports,
    symbols,
    typeDefinitions,
    callEdges: dedupeCallEdges(callEdges),
  };
}

function parseImport(node: ts.ImportDeclaration): ParsedImport {
  const importPath = ts.isStringLiteral(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : node.moduleSpecifier.getText();

  const importedNames: string[] = [];
  const clause = node.importClause;

  if (!clause) {
    importedNames.push("side-effect");
  } else {
    if (clause.name) {
      importedNames.push(`default:${clause.name.text}`);
    }

    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) {
        importedNames.push(`namespace:${clause.namedBindings.name.text}`);
      }

      if (ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          const prefix = clause.isTypeOnly || element.isTypeOnly ? "type:" : "";
          importedNames.push(`${prefix}${element.name.text}`);
        }
      }
    }
  }

  return {
    importPath,
    importedNames,
    isExternal: isExternalImport(importPath),
  };
}

function toSymbol(
  sourceFile: ts.SourceFile,
  name: string,
  kind: ParsedSymbolKind,
  node: ts.Node,
  overrides?: Partial<Pick<ParsedSymbol, "exported" | "async">>,
): ParsedSymbol {
  const range = getLineRange(sourceFile, node);

  return {
    name,
    kind,
    startLine: range.startLine,
    endLine: range.endLine,
    signature: getSignature(node, sourceFile),
    exported: overrides?.exported ?? hasModifier(node, ts.SyntaxKind.ExportKeyword),
    async: overrides?.async ?? hasModifier(node, ts.SyntaxKind.AsyncKeyword),
    docComment: getDocComment(node),
  };
}

function toTypeDefinition(
  sourceFile: ts.SourceFile,
  name: string,
  kind: ParsedTypeDefinitionKind,
  node: ts.Node,
): ParsedTypeDefinition {
  const range = getLineRange(sourceFile, node);

  return {
    name,
    kind,
    rawDefinition: node.getText(sourceFile).trim(),
    startLine: range.startLine,
    endLine: range.endLine,
  };
}

function extractCallEdges(
  sourceFile: ts.SourceFile,
  callerName: string,
  body: ts.Node | undefined,
): ParsedCallEdge[] {
  if (!body) {
    return [];
  }

  const edges: ParsedCallEdge[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const calleeName = getCalleeName(node.expression);

      if (calleeName && calleeName !== callerName) {
        edges.push({
          callerName,
          calleeName,
          confidence: 0.55,
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(body, visit);

  return edges;
}

function getCalleeName(expression: ts.Expression): string | null {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  return null;
}

function getSignature(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  const text = node.getText(sourceFile).trim();
  const bodyIndex = text.indexOf("{");

  if (bodyIndex > -1) {
    return text.slice(0, bodyIndex).trim();
  }

  const firstLine = text.split(/\r?\n/, 1)[0];
  return firstLine || null;
}

function getDocComment(node: ts.Node): string | null {
  const jsDocs = (node as { jsDoc?: ts.JSDoc[] }).jsDoc;
  const comment = jsDocs
    ?.map((doc) => doc.comment)
    .filter((value): value is string => typeof value === "string")
    .join("\n")
    .trim();

  return comment || null;
}

function getLineRange(sourceFile: ts.SourceFile, node: ts.Node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

  return {
    startLine: start.line + 1,
    endLine: end.line + 1,
  };
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind) {
  return ts.canHaveModifiers(node)
    ? (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind)
    : false;
}

function isConstDeclaration(node: ts.VariableStatement) {
  return (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
}

function isExternalImport(importPath: string) {
  return !importPath.startsWith(".") && !importPath.startsWith("/");
}

function getScriptKind(path: string) {
  if (path.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }

  if (path.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }

  if (path.endsWith(".js") || path.endsWith(".mjs") || path.endsWith(".cjs")) {
    return ts.ScriptKind.JS;
  }

  return ts.ScriptKind.TS;
}

function getLanguage(path: string) {
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

  return "unknown";
}

function dedupeCallEdges(edges: ParsedCallEdge[]) {
  const seen = new Set<string>();

  return edges.filter((edge) => {
    const key = `${edge.callerName}:${edge.calleeName}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
