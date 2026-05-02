import Link from "next/link";
import { ChevronRight, FileCode2, Folder } from "lucide-react";
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
  const root = buildTree(files);

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
  depth = 0,
}: {
  node: TreeNode;
  repoId: string;
  selectedFileId?: string;
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

  return (
    <div>
      <div
        className="flex h-8 items-center gap-2 px-2 text-sm text-slate-300"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
        <Folder className="h-3.5 w-3.5 text-slate-500" />
        <span className="truncate">{node.name}</span>
      </div>
      {[...node.children.values()].map((child) => (
        <TreeBranch
          key={child.path}
          node={child}
          repoId={repoId}
          selectedFileId={selectedFileId}
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
