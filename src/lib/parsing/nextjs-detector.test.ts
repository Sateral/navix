import { describe, expect, it } from "vitest";
import { detectFileRole, detectNextRoute } from "@/lib/parsing/nextjs-detector";

describe("detectFileRole", () => {
  it("classifies high-signal Next.js and TypeScript files", () => {
    expect(detectFileRole("app/layout.tsx")).toBe("entry_point");
    expect(detectFileRole("app/page.tsx")).toBe("entry_point");
    expect(detectFileRole("app/api/users/route.ts")).toBe("api_endpoint");
    expect(detectFileRole("middleware.ts")).toBe("entry_point");
    expect(detectFileRole("prisma/schema.prisma")).toBe("schema");
    expect(detectFileRole("src/components/button.tsx")).toBe("component");
    expect(detectFileRole("src/types.ts")).toBe("type_file");
    expect(detectFileRole("src/engine.test.ts")).toBe("test");
  });
});

describe("detectNextRoute", () => {
  it("detects app router pages, layouts, and route handlers", () => {
    expect(detectNextRoute("app/page.tsx")).toEqual({
      framework: "nextjs",
      routePath: "/",
      method: null,
      kind: "page",
    });

    expect(detectNextRoute("app/(marketing)/about/page.tsx")).toEqual({
      framework: "nextjs",
      routePath: "/about",
      method: null,
      kind: "page",
    });

    expect(detectNextRoute("app/dashboard/layout.tsx")).toEqual({
      framework: "nextjs",
      routePath: "/dashboard",
      method: null,
      kind: "layout",
    });

    expect(detectNextRoute("app/api/users/route.ts")).toEqual({
      framework: "nextjs",
      routePath: "/api/users",
      method: null,
      kind: "route_handler",
    });
  });

  it("returns null for non-route files", () => {
    expect(detectNextRoute("src/lib/auth.ts")).toBeNull();
  });
});
