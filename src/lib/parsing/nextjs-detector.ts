import type { ParsedFileRole, ParsedRoute } from "@/lib/parsing/types";
import type { ParsedRouteKind } from "@/lib/parsing/types";

const CONFIG_FILE_PATTERNS = [
  /^next\.config\.[cm]?[jt]s$/,
  /^tailwind\.config\.[cm]?[jt]s$/,
  /^postcss\.config\.[cm]?[jt]s$/,
  /^tsconfig\.json$/,
  /^package\.json$/,
  /^eslint\.config\.[cm]?[jt]s$/,
];

export function detectFileRole(path: string): ParsedFileRole {
  const normalizedPath = normalizePath(path);
  const basename = normalizedPath.split("/").at(-1) ?? normalizedPath;

  if (
    normalizedPath === "app/layout.tsx" ||
    normalizedPath === "app/page.tsx" ||
    normalizedPath === "middleware.ts" ||
    normalizedPath === "middleware.tsx" ||
    normalizedPath === "instrumentation.ts" ||
    normalizedPath === "instrumentation.tsx" ||
    /^src\/(index|main|server|cli)\.[cm]?[jt]sx?$/.test(normalizedPath)
  ) {
    return "entry_point";
  }

  if (/^app\/.+\/route\.[cm]?tsx?$/.test(normalizedPath)) {
    return "api_endpoint";
  }

  if (normalizedPath === "prisma/schema.prisma") {
    return "schema";
  }

  if (CONFIG_FILE_PATTERNS.some((pattern) => pattern.test(normalizedPath))) {
    return "config";
  }

  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(normalizedPath)) {
    return "test";
  }

  if (
    normalizedPath.includes("/components/") ||
    normalizedPath.startsWith("components/") ||
    /^[A-Z][A-Za-z0-9]+\.tsx$/.test(basename)
  ) {
    return "component";
  }

  if (
    /(^|\/)(types|interfaces|schema|models)\.[cm]?tsx?$/.test(normalizedPath) ||
    normalizedPath.endsWith(".d.ts")
  ) {
    return "type_file";
  }

  if (/\.[cm]?[jt]sx?$/.test(normalizedPath)) {
    return "utility";
  }

  return "unknown";
}

export function detectNextRoute(path: string): ParsedRoute | null {
  const normalizedPath = normalizePath(path);
  const routeMatch = normalizedPath.match(/^app\/(.+)\/(page|layout|route)\.[cm]?tsx?$/);

  if (normalizedPath === "app/page.tsx") {
    return {
      framework: "nextjs",
      routePath: "/",
      method: null,
      kind: "page",
    };
  }

  if (normalizedPath === "app/layout.tsx") {
    return {
      framework: "nextjs",
      routePath: "/",
      method: null,
      kind: "layout",
    };
  }

  if (!routeMatch) {
    return null;
  }

  const [, rawSegments, convention] = routeMatch;
  const routePath = toRoutePath(rawSegments);

  const kind = toRouteKind(convention);

  return {
    framework: "nextjs",
    routePath,
    method: null,
    kind,
  };
}

export function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function toRoutePath(rawSegments: string) {
  const segments = rawSegments
    .split("/")
    .filter((segment) => segment.length > 0 && !isRouteGroup(segment))
    .map((segment) => segment.replace(/^\[(\.\.\.)?(.+)]$/, (_match, rest, name) => {
      return rest ? `[...${name}]` : `[${name}]`;
    }));

  return `/${segments.join("/")}`.replace(/\/+/g, "/");
}

function isRouteGroup(segment: string) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function toRouteKind(convention: string): ParsedRouteKind {
  if (convention === "page") {
    return "page";
  }

  if (convention === "layout") {
    return "layout";
  }

  return "route_handler";
}
