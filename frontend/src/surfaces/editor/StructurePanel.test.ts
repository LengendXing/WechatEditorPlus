import { describe, expect, it } from "vitest";
import { buildHtmlOutline, buildMarkdownOutline } from "./StructurePanel";

describe("StructurePanel outline builders", () => {
  it("extracts markdown headings with source metadata", () => {
    const outline = buildMarkdownOutline("# 总标题\n\n## 第一部分\n正文\n\n### 细节展开");

    expect(outline.map((block) => block.label)).toEqual(["总标题", "第一部分", "细节展开"]);
    expect(outline.map((block) => block.sourceLine)).toEqual([1, 3, 6]);
    expect(outline[1]?.sourceOffset).toBeGreaterThan(outline[0]?.sourceOffset ?? -1);
  });

  it("extracts html headings and image blocks with navigation metadata", () => {
    const outline = buildHtmlOutline(
      "<h1>总标题</h1>\n<p>导语</p>\n<h2>第一部分</h2>\n<p><img src=\"/images/demo.png\" alt=\"演示图\"></p>",
    );

    expect(outline.map((block) => block.label)).toEqual(["总标题", "第一部分", "图片 1"]);
    expect(outline[0]?.sourceLine).toBe(1);
    expect(outline[1]?.sourceLine).toBe(3);
    expect(outline[2]?.previewImageIndex).toBe(0);
  });
});
