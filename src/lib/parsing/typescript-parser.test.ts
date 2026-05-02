import { describe, expect, it } from "vitest";
import { parseTypeScriptSource } from "@/lib/parsing/typescript-parser";

describe("parseTypeScriptSource", () => {
  it("extracts imports, exported symbols, type definitions, async flags, and line ranges", () => {
    const source = [
      "import fs from 'node:fs';",
      "import { loadConfig, type SimulationConfig } from './config';",
      "",
      "export interface SimulationResult {",
      "  ticks: number;",
      "}",
      "",
      "export type SimulationMode = 'fast' | 'accurate';",
      "",
      "/** Runs the main simulation lifecycle. */",
      "export async function runSimulation(config: SimulationConfig): Promise<SimulationResult> {",
      "  const world = initializeWorld(config);",
      "  return stepWorld(world);",
      "}",
      "",
      "export class SimulationEngine {}",
    ].join("\n");

    const parsed = parseTypeScriptSource({
      path: "src/engine.ts",
      content: source,
    });

    expect(parsed.imports).toEqual([
      {
        importPath: "node:fs",
        importedNames: ["default:fs"],
        isExternal: true,
      },
      {
        importPath: "./config",
        importedNames: ["loadConfig", "type:SimulationConfig"],
        isExternal: false,
      },
    ]);

    expect(parsed.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "SimulationResult",
          kind: "interface",
          exported: true,
          startLine: 4,
          endLine: 6,
        }),
        expect.objectContaining({
          name: "SimulationMode",
          kind: "type",
          exported: true,
          startLine: 8,
          endLine: 8,
        }),
        expect.objectContaining({
          name: "runSimulation",
          kind: "function",
          exported: true,
          async: true,
          startLine: 11,
          endLine: 14,
          docComment: "Runs the main simulation lifecycle.",
        }),
        expect.objectContaining({
          name: "SimulationEngine",
          kind: "class",
          exported: true,
          startLine: 16,
          endLine: 16,
        }),
      ]),
    );

    expect(parsed.typeDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "SimulationResult",
          kind: "interface",
          rawDefinition: expect.stringContaining("ticks: number"),
        }),
        expect.objectContaining({
          name: "SimulationMode",
          kind: "type",
          rawDefinition: "export type SimulationMode = 'fast' | 'accurate';",
        }),
      ]),
    );

    expect(parsed.callEdges).toEqual([
      { callerName: "runSimulation", calleeName: "initializeWorld", confidence: 0.55 },
      { callerName: "runSimulation", calleeName: "stepWorld", confidence: 0.55 },
    ]);
  });

  it("treats exported arrow functions as functions", () => {
    const parsed = parseTypeScriptSource({
      path: "src/config.ts",
      content: "export const loadConfig = async () => ({ mode: 'fast' });",
    });

    expect(parsed.symbols).toEqual([
      expect.objectContaining({
        name: "loadConfig",
        kind: "function",
        exported: true,
        async: true,
        startLine: 1,
        endLine: 1,
      }),
    ]);
  });
});
