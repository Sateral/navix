import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FileTree } from "./file-tree";

const files = [
  { id: "readme", path: "README.md", role: "documentation" },
  { id: "app-page", path: "src/app/page.tsx", role: "entry_point" },
  { id: "button", path: "src/components/button.tsx", role: "component" },
];

describe("FileTree", () => {
  it("collapses folders outside the selected file path on initial render", () => {
    const html = renderToStaticMarkup(
      <FileTree files={files} repoId="repo-1" selectedFileId="app-page" />,
    );

    expect(html).toContain("README.md");
    expect(html).toContain("src");
    expect(html).toContain("app");
    expect(html).toContain("page.tsx");
    expect(html).toContain("components");
    expect(html).not.toContain("button.tsx");
  });

  it("starts with folders closed when no file is selected", () => {
    const html = renderToStaticMarkup(<FileTree files={files} repoId="repo-1" />);

    expect(html).toContain("README.md");
    expect(html).toContain("src");
    expect(html).not.toContain("page.tsx");
    expect(html).not.toContain("button.tsx");
  });
});
