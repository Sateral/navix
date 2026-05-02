export type ParsedFileRole =
  | "route"
  | "component"
  | "schema"
  | "config"
  | "utility"
  | "test"
  | "api_endpoint"
  | "type_file"
  | "entry_point"
  | "unknown";

export type ParsedSymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "component"
  | "route"
  | "schema_model"
  | "variable"
  | "constant";

export type ParsedTypeDefinitionKind =
  | "interface"
  | "type"
  | "class"
  | "enum"
  | "schema_model";

export type ParsedRouteKind =
  | "page"
  | "layout"
  | "route_handler"
  | "server_action"
  | "api_route";

export type ParsedImport = {
  importPath: string;
  importedNames: string[];
  isExternal: boolean;
};

export type ParsedSymbol = {
  name: string;
  kind: ParsedSymbolKind;
  startLine: number;
  endLine: number;
  signature: string | null;
  exported: boolean;
  async: boolean;
  docComment: string | null;
};

export type ParsedTypeDefinition = {
  name: string;
  kind: ParsedTypeDefinitionKind;
  rawDefinition: string;
  startLine: number;
  endLine: number;
};

export type ParsedCallEdge = {
  callerName: string;
  calleeName: string;
  confidence: number;
};

export type ParsedSourceFile = {
  path: string;
  language: string;
  imports: ParsedImport[];
  symbols: ParsedSymbol[];
  typeDefinitions: ParsedTypeDefinition[];
  callEdges: ParsedCallEdge[];
};

export type ParsedRoute = {
  framework: "nextjs";
  routePath: string;
  method: string | null;
  kind: ParsedRouteKind;
};
