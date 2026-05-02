-- CreateEnum
CREATE TYPE "RepositoryProvider" AS ENUM ('github', 'local');

-- CreateEnum
CREATE TYPE "RepositoryStatus" AS ENUM ('pending', 'indexing', 'indexed', 'failed');

-- CreateEnum
CREATE TYPE "FileRole" AS ENUM ('route', 'component', 'schema', 'config', 'utility', 'test', 'api_endpoint', 'type_file', 'entry_point', 'unknown');

-- CreateEnum
CREATE TYPE "SymbolKind" AS ENUM ('function', 'class', 'interface', 'type', 'enum', 'component', 'route', 'schema_model', 'variable', 'constant');

-- CreateEnum
CREATE TYPE "TypeDefinitionKind" AS ENUM ('interface', 'type', 'class', 'enum', 'schema_model');

-- CreateEnum
CREATE TYPE "RouteKind" AS ENUM ('page', 'layout', 'route_handler', 'server_action', 'api_route');

-- CreateEnum
CREATE TYPE "ExplanationTargetType" AS ENUM ('file', 'symbol', 'route', 'schema_model', 'selected_lines');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "RepositoryProvider" NOT NULL,
    "defaultBranch" TEXT,
    "cloneUrl" TEXT,
    "sourcePath" TEXT,
    "indexedAt" TIMESTAMP(3),
    "status" "RepositoryStatus" NOT NULL DEFAULT 'pending',
    "statusMessage" TEXT,
    "detectedStack" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repo_files" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "language" TEXT,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "role" "FileRole" NOT NULL DEFAULT 'unknown',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repo_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbols" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SymbolKind" NOT NULL,
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "signature" TEXT,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "async" BOOLEAN NOT NULL DEFAULT false,
    "docComment" TEXT,
    "inferredPurpose" TEXT,

    CONSTRAINT "symbols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_definitions" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "symbolId" TEXT,
    "name" TEXT NOT NULL,
    "kind" "TypeDefinitionKind" NOT NULL,
    "rawDefinition" TEXT NOT NULL,
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,

    CONSTRAINT "type_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_edges" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fromFileId" TEXT NOT NULL,
    "toFileId" TEXT,
    "importPath" TEXT NOT NULL,
    "importedNames" JSONB NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "import_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_edges" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "callerSymbolId" TEXT NOT NULL,
    "calleeSymbolId" TEXT,
    "calleeName" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "call_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "routePath" TEXT NOT NULL,
    "method" TEXT,
    "kind" "RouteKind" NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explanation_cache" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "targetType" "ExplanationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "explanation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "citedFiles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "repositories_userId_idx" ON "repositories"("userId");

-- CreateIndex
CREATE INDEX "repositories_provider_owner_name_idx" ON "repositories"("provider", "owner", "name");

-- CreateIndex
CREATE INDEX "repo_files_repositoryId_role_idx" ON "repo_files"("repositoryId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "repo_files_repositoryId_path_key" ON "repo_files"("repositoryId", "path");

-- CreateIndex
CREATE INDEX "symbols_repositoryId_name_idx" ON "symbols"("repositoryId", "name");

-- CreateIndex
CREATE INDEX "symbols_fileId_idx" ON "symbols"("fileId");

-- CreateIndex
CREATE INDEX "type_definitions_repositoryId_name_idx" ON "type_definitions"("repositoryId", "name");

-- CreateIndex
CREATE INDEX "type_definitions_fileId_idx" ON "type_definitions"("fileId");

-- CreateIndex
CREATE INDEX "import_edges_repositoryId_idx" ON "import_edges"("repositoryId");

-- CreateIndex
CREATE INDEX "import_edges_fromFileId_idx" ON "import_edges"("fromFileId");

-- CreateIndex
CREATE INDEX "import_edges_toFileId_idx" ON "import_edges"("toFileId");

-- CreateIndex
CREATE INDEX "call_edges_repositoryId_idx" ON "call_edges"("repositoryId");

-- CreateIndex
CREATE INDEX "call_edges_callerSymbolId_idx" ON "call_edges"("callerSymbolId");

-- CreateIndex
CREATE INDEX "call_edges_calleeSymbolId_idx" ON "call_edges"("calleeSymbolId");

-- CreateIndex
CREATE INDEX "routes_repositoryId_routePath_idx" ON "routes"("repositoryId", "routePath");

-- CreateIndex
CREATE INDEX "routes_fileId_idx" ON "routes"("fileId");

-- CreateIndex
CREATE INDEX "explanation_cache_repositoryId_targetType_targetId_idx" ON "explanation_cache"("repositoryId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "questions_repositoryId_idx" ON "questions"("repositoryId");

-- CreateIndex
CREATE INDEX "questions_userId_idx" ON "questions"("userId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repo_files" ADD CONSTRAINT "repo_files_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbols" ADD CONSTRAINT "symbols_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbols" ADD CONSTRAINT "symbols_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "repo_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_definitions" ADD CONSTRAINT "type_definitions_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_definitions" ADD CONSTRAINT "type_definitions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "repo_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_definitions" ADD CONSTRAINT "type_definitions_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "symbols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_edges" ADD CONSTRAINT "import_edges_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_edges" ADD CONSTRAINT "import_edges_fromFileId_fkey" FOREIGN KEY ("fromFileId") REFERENCES "repo_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_edges" ADD CONSTRAINT "import_edges_toFileId_fkey" FOREIGN KEY ("toFileId") REFERENCES "repo_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_edges" ADD CONSTRAINT "call_edges_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_edges" ADD CONSTRAINT "call_edges_callerSymbolId_fkey" FOREIGN KEY ("callerSymbolId") REFERENCES "symbols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_edges" ADD CONSTRAINT "call_edges_calleeSymbolId_fkey" FOREIGN KEY ("calleeSymbolId") REFERENCES "symbols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "repo_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explanation_cache" ADD CONSTRAINT "explanation_cache_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
