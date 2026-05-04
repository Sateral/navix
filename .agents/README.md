# Navix Agent Brief

This document is for coding agents working in this repository. It explains what Navix is, how the current implementation is shaped, what matters for product correctness, and where to be careful before changing code.

## Product Definition

Navix is a codebase comprehension workbench for developers exploring unfamiliar repositories. The name is temporary and should not be hardcoded repeatedly. Use the centralized app constants when adding visible product text.

Navix is not a documentation generator, generic repo chatbot, course platform, quiz app, or gamified onboarding tool. The product should feel like a precise engineering workbench: GitHub-style source browsing, symbol intelligence, dependency relationships, source-grounded explanations, and repo-aware Q&A.

The core user problem is repository orientation. When a developer opens a large or unfamiliar codebase, they need to answer questions like:

- Where does the app start?
- Which files matter first?
- What does this file or function do?
- What calls this symbol, and what does it call?
- Where are inputs and types defined?
- How is data created before it reaches a function?
- What changes become risky if this file changes?
- What is the runtime/data flow across routes, services, schemas, and entry points?

Every explanation must be grounded in indexed source evidence. If the evidence is missing, say so. Do not invent files, relationships, intent, or call flows.

## Current Stack

- Runtime and package manager: Bun
- Framework: Next.js App Router
- Language: TypeScript, strict mode
- UI: Tailwind CSS, shadcn-style local primitives, lucide-react icons
- API layer: tRPC
- Database: Supabase Postgres
- ORM: Prisma 7
- Auth: Better Auth with Prisma adapter
- Parsing: TypeScript compiler API
- AI: centralized abstraction with source-grounded prompt construction; currently fallback-only unless an AI provider is added

Important runtime detail: Prisma 7 requires Node `^20.19 || ^22.12 || >=24.0`. This repo pins Node `24.13.0` through `.node-version` and `.nvmrc`. Use:

```bash
fnm exec --using v24.13.0 bun run typecheck
```

or equivalent when invoking Bun/Prisma if your shell defaults to an older Node.

## Prisma 7 Notes

This project intentionally uses Prisma 7 patterns.

- `schema.prisma` declares the provider but does not contain a datasource URL.
- `prisma.config.ts` loads datasource config for Prisma CLI commands.
- The generated client uses the `prisma-client` generator and outputs to `src/generated/prisma`.
- Runtime Prisma Client uses `@prisma/adapter-pg` and `PrismaPg`.

For app runtime, `src/lib/db/prisma.ts` reads `DATABASE_URL`. For Supabase, this can be the pooled connection string.

For migrations, use the direct Supabase URL. If `DIRECT_URL` is set, run migrations like this:

```bash
DATABASE_URL="$DIRECT_URL" fnm exec --using v24.13.0 bunx prisma migrate dev
```

The direct URL is important because Supabase pooler URLs can hang or fail for schema migration operations.

## Environment

Expected local variables:

```env
DATABASE_URL=""
DIRECT_URL=""
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
AI_PROVIDER=""
AI_API_KEY=""
```

`AI_PROVIDER` and `AI_API_KEY` are optional for now. Without AI configuration, Navix returns deterministic fallback text and still includes retrieved source citations.

Do not print secrets in logs or final responses. If checking env health, only report whether variables are set or missing.

## Architecture Map

Primary source locations:

- `src/app` contains App Router pages, route handlers, and client providers.
- `src/app/api/auth/[...all]/route.ts` exposes Better Auth handlers.
- `src/app/api/trpc/[trpc]/route.ts` exposes tRPC over the Fetch adapter.
- `src/app/dashboard` contains the repo import/list UI.
- `src/app/repo/[repoId]` contains the code workbench route.
- `src/components/repo` contains file tree, code viewer, inspector, stack strip, question box, and explanation action.
- `src/lib/db/prisma.ts` initializes Prisma 7 with `PrismaPg`.
- `src/lib/auth` contains Better Auth setup and session helpers.
- `src/lib/github` contains GitHub URL parsing.
- `src/lib/indexing` contains source fetching, filesystem walking, import resolution, and stack detection.
- `src/lib/parsing` contains TypeScript parsing and Next.js route/file role detection.
- `src/lib/ai` contains prompt construction, citation types, and AI service abstraction.
- `src/server/routers` contains tRPC routers.
- `src/server/services` contains service-level orchestration for indexing, questions, and explanations.
- `prisma/schema.prisma` defines auth and Navix domain models.

Keep ingestion logic separate from UI. Keep provider integrations separate from indexing logic. Keep AI prompt construction centralized.

## Data Model Intent

The database stores structured source metadata, not just embeddings. Important models include:

- `Repository`: owner/name/provider/status/default branch/index metadata.
- `RepoFile`: path, language, role, content hash, content, and size.
- `CodeSymbol`: functions, classes, interfaces, types, variables, components, routes, and schema models.
- `TypeDefinition`: raw definitions for interfaces, types, classes, enums, and schema models.
- `ImportEdge`: file-to-file and external import relationships.
- `CallEdge`: best-effort symbol call relationships.
- `Route`: framework route path and kind.
- `ExplanationCache`: grounded file/symbol/route explanation results.
- `Question`: repo Q&A history with cited files.

`RepoFile` is used instead of `File` to avoid collisions with DOM/runtime `File` types.

## Current Capabilities

Implemented:

- Local folder import.
- Public GitHub URL import via shallow clone.
- File metadata persistence.
- TypeScript import and symbol extraction.
- Exported function/interface/type/class extraction.
- Async flag, doc comment, signature, and line range extraction.
- Basic call name extraction inside functions.
- Next.js App Router route detection.
- File role detection for entry points, API endpoints, components, schema files, tests, config, and type files.
- Stack detection with confidence and evidence.
- Dashboard repo list and import UI.
- Workbench layout with file tree, code viewer, right-side inspector, stack strip, question box, and file explanation action.
- Grounded prompt builder with citation enforcement.
- AI fallback service when no provider is configured.

Known limitations:

- Call graph is best-effort and name-based.
- Type origin resolution is basic.
- Prisma schema model parsing is not implemented yet.
- GitHub App/private repo access is not implemented yet.
- Embeddings/vector search are not implemented yet.
- AI provider integration is not implemented yet.
- The auth UI is not fully productized; Better Auth endpoints are wired, but the product flow still needs a polished sign-in surface.

## Product Rules For Agents

When adding features, preserve these rules:

- Build a workbench, not a chatbot-first app.
- Prefer source structure, symbols, routes, imports, and schema metadata over generic semantic search.
- Every generated answer must cite real source paths and line ranges when available.
- If evidence is weak, use cautious language: "This appears to...", "Based on usage in...", or "I do not see direct usage yet."
- Do not invent files, functions, relationships, or motivations.
- Do not add gamification, quizzes, achievements, generic docs export, PR review features, or autonomous code modification.
- Keep UI dense, calm, and engineering-focused.
- Use icons for tool actions where appropriate.
- Avoid decorative marketing UI inside the product workbench.

## Visual Direction

The product UI should follow the existing dark Navix workbench direction:

- Deep slate/near-black surfaces.
- Thin borders and panel separation.
- Blue/violet accents used sparingly.
- Dense but readable engineering layout.
- Left navigation/file tree, center code viewer, right inspector.
- Confidence/status indicators where useful.
- No oversized hero sections in the authenticated product area.

Cards are acceptable for repeated items and framed tools, but avoid nesting cards inside cards or turning every section into a floating marketing panel.

## Development Commands

Use the pinned Node version:

```bash
fnm exec --using v24.13.0 bun install
fnm exec --using v24.13.0 bunx prisma validate
fnm exec --using v24.13.0 bunx prisma generate
fnm exec --using v24.13.0 bun run typecheck
fnm exec --using v24.13.0 bun run test
fnm exec --using v24.13.0 bun run lint
fnm exec --using v24.13.0 bun run build
fnm exec --using v24.13.0 bun run dev
```

For Supabase migrations:

```bash
DATABASE_URL="$DIRECT_URL" fnm exec --using v24.13.0 bunx prisma migrate dev --name <migration-name>
```

## Testing Expectations

Parser and source-grounding code should have tests. Existing test areas:

- `src/lib/parsing/typescript-parser.test.ts`
- `src/lib/parsing/nextjs-detector.test.ts`
- `src/lib/github/url.test.ts`
- `src/lib/ai/prompt-builder.test.ts`

When changing parser behavior, follow red-green testing. Add the desired source example first, watch it fail, then implement the minimum parser change.

For UI-only work, at minimum run typecheck and lint. For workbench layout changes, manually verify desktop and mobile-ish widths if possible.

## Auth And GitHub

Better Auth is configured in `src/lib/auth/auth.ts`.

GitHub OAuth env variables are:

```env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

The local callback URL is:

```txt
${BETTER_AUTH_URL}/api/auth/callback/github
```

Public GitHub repo import does not require OAuth. Private repo access should be added later behind a provider abstraction rather than mixed into indexing logic.

## AI Integration Guidance

AI code belongs behind the `AIService` interface in `src/lib/ai/ai-service.ts`. Prompt construction belongs in `src/lib/ai/prompt-builder.ts`.

Do not build one-off prompts in UI components or tRPC routers. Services should gather source context, call the centralized prompt builder, call an AI service, and persist citations.

Expected answer behavior:

- Use only cited source context.
- Include source file paths and line ranges when available.
- Say when evidence is insufficient.
- Avoid broad generic answers.
- Keep tone direct and practical.

## Safe Change Boundaries

Good agent tasks:

- Add parser tests and improve extraction.
- Improve Next.js route detection.
- Add Prisma schema model parsing.
- Improve file/symbol inspector data.
- Add sign-in UI around Better Auth.
- Add GitHub App/private repo provider behind existing provider boundaries.
- Add AI provider implementation behind `AIService`.

Risky tasks that need extra care:

- Prisma schema changes require migrations and generated client updates.
- Ingestion changes can affect persisted metadata shape.
- Auth changes can break session handling across tRPC and route handlers.
- UI changes should preserve the three-panel workbench mental model.

Avoid unrelated refactors while implementing feature work. Keep commits atomic.
