"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type FileTreeFile = {
  id: string;
  path: string;
  role: string;
};

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  file?: FileTreeFile;
};

export function FileTree({
  repoId,
  files,
  selectedFileId,
}: {
  repoId: string;
  files: FileTreeFile[];
  selectedFileId?: string;
}) {
  const root = useMemo(() => buildTree(files), [files]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    getSelectedFileAncestorPaths(files, selectedFileId),
  );

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }, []);

  return (
    <div className="h-full overflow-auto p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Files</h2>
        <span className="text-xs text-slate-500">{files.length}</span>
      </div>
      <div className="space-y-0.5">
        {[...root.children.values()].map((node) => (
          <TreeBranch
            key={node.path}
            node={node}
            repoId={repoId}
            selectedFileId={selectedFileId}
            expandedPaths={expandedPaths}
            onTogglePath={togglePath}
          />
        ))}
      </div>
    </div>
  );
}

function TreeBranch({
  node,
  repoId,
  selectedFileId,
  expandedPaths,
  onTogglePath,
  depth = 0,
}: {
  node: TreeNode;
  repoId: string;
  selectedFileId?: string;
  expandedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  depth?: number;
}) {
  if (node.file) {
    const selected = node.file.id === selectedFileId;

    return (
      <Link
        href={`/repo/${repoId}?fileId=${node.file.id}`}
        className={cn(
          "flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white",
          selected && "bg-violet-500/25 text-violet-100",
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <FileCode2 className="h-3.5 w-3.5 shrink-0 text-sky-300" />
        <span className="truncate">{node.name}</span>
      </Link>
    );
  }

  const expanded = expandedPaths.has(node.path);
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;
  const FolderIcon = expanded ? FolderOpen : Folder;

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`}
        className="flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
        onClick={() => onTogglePath(node.path)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <FolderIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="truncate">{node.name}</span>
      </button>
      {expanded &&
        [...node.children.values()].map((child) => (
          <TreeBranch
            key={child.path}
            node={child}
            repoId={repoId}
            selectedFileId={selectedFileId}
            expandedPaths={expandedPaths}
            onTogglePath={onTogglePath}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

function buildTree(files: FileTreeFile[]) {
  const root: TreeNode = {
    name: "",
    path: "",
    children: new Map(),
  };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    parts.forEach((part, index) => {
      const nodePath = parts.slice(0, index + 1).join("/");
      const existing = current.children.get(part);
      const node: TreeNode =
        existing ??
        {
          name: part,
          path: nodePath,
          children: new Map(),
        };

      if (!existing) {
        current.children.set(part, node);
      }

      if (index === parts.length - 1) {
        node.file = file;
      }

      current = node;
    });
  }

  return root;
}

function getSelectedFileAncestorPaths(files: FileTreeFile[], selectedFileId?: string) {
  const selectedFile = files.find((file) => file.id === selectedFileId);

  if (!selectedFile) {
    return new Set<string>();
  }

  const parts = selectedFile.path.split("/");
  const ancestorPaths = new Set<string>();

  for (let index = 0; index < parts.length - 1; index++) {
    ancestorPaths.add(parts.slice(0, index + 1).join("/"));
  }

  return ancestorPaths;
}
