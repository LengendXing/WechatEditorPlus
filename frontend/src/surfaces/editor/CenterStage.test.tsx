import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CenterStage from "./CenterStage";
import { useUIStore } from "@/stores/uiStore";
import type { OutlineBlock } from "./StructurePanel";

const DRAFT = {
  title: "测试稿件",
  mode: "html" as const,
  html: "<p>Hello preview</p>",
  css: "",
  js: "",
  markdown: "",
  author: "",
  digest: "",
};

const NAVIGATION_BLOCK: OutlineBlock = {
  id: "html-heading-1",
  type: "section",
  label: "第一部分",
  preview: "第一部分",
  depth: 1,
  sourceOffset: 12,
  sourceLine: 3,
};

const PROCESSED_PREVIEW_HTML = [
  '<section style="font-size:16px; line-height:1.8; color:#333;">',
  '<p style="margin:0; color:#333;">Hello preview</p>',
  "</section>",
].join("");

describe("CenterStage", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  beforeEach(() => {
    window.localStorage.clear();
    useUIStore.setState({ editorPreviewWidth: 420, editorPreviewHeight: 760, editorPreviewScale: 1 });
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("lets the preview panel resize by dragging the bottom-right corner", () => {
    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={DRAFT}
        view="preview"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml="<p>Hello preview</p>"
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={vi.fn()}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    const resizeCorner = screen.getByRole("button", { name: "拖动调整预览大小" });
    const previewFrameShell = screen.getByTestId("preview-frame-shell");

    expect(previewFrameShell).toHaveStyle({ width: "420px", height: "760px" });

    fireEvent.mouseDown(resizeCorner, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 220, clientY: 180 });
    fireEvent.mouseUp(window);

    expect(previewFrameShell).toHaveStyle({ width: "540px", height: "840px" });
  });

  it("lets the preview panel zoom freely", () => {
    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={DRAFT}
        view="preview"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml="<p>Hello preview</p>"
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={vi.fn()}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    const previewFrameShell = screen.getByTestId("preview-frame-shell");
    const previewFrame = screen.getByTestId("preview-frame");
    const zoomSlider = screen.getByRole("slider", { name: "调整预览缩放" });

    fireEvent.change(zoomSlider, { target: { value: "150" } });

    expect(previewFrameShell).toHaveStyle({ width: "630px", height: "1140px" });
    expect(previewFrame).toHaveStyle({ transform: "scale(1.5)" });
  });

  it("renders a back button that routes to the previous page", () => {
    const onBack = vi.fn();

    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={DRAFT}
        view="code"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml=""
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={onBack}
        onFieldChange={vi.fn()}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("moves the editor caret when an outline navigation request arrives", () => {
    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={{
          ...DRAFT,
          html: "<h1>总标题</h1>\n<p>导语</p>\n<h2>第一部分</h2>\n<p>正文</p>",
        }}
        view="code"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected={NAVIGATION_BLOCK.id}
        navigationRequest={{ block: NAVIGATION_BLOCK, seq: 1 }}
        previewHtml=""
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={vi.fn()}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveFocus();
    expect((textarea as HTMLTextAreaElement).selectionStart).toBe(NAVIGATION_BLOCK.sourceOffset);
  });

  it("scrolls the preview to the requested outline target", () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={DRAFT}
        view="preview"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected={NAVIGATION_BLOCK.id}
        navigationRequest={{ block: NAVIGATION_BLOCK, seq: 1 }}
        previewHtml="<section><h1>总标题</h1><h2>第一部分</h2><p>正文</p></section>"
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={vi.fn()}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("lets users edit preview content and sync it back to html source", () => {
    vi.useFakeTimers();
    const onFieldChange = vi.fn();

    const { rerender } = render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={DRAFT}
        view="preview"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml={PROCESSED_PREVIEW_HTML}
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={onFieldChange}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    const editable = screen.getByTestId("preview-editable-content");
    expect(editable).toHaveAttribute("contenteditable", "true");

    (editable as HTMLDivElement).innerHTML = [
      '<section style="font-size:16px; line-height:1.8; color:#333;">',
      '<p style="margin:0; color:#333;">Edited preview</p>',
      "</section>",
    ].join("");
    fireEvent.input(editable);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onFieldChange).toHaveBeenCalledWith("html", "<p>Edited preview</p>");
    expect(editable.innerHTML).toContain("Edited preview");

    rerender(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={DRAFT}
        view="preview"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml={[
          '<section style="font-size:16px; line-height:1.8; color:#333;">',
          '<p style="margin:0; color:#333;">Edited preview</p>',
          "</section>",
        ].join("")}
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={onFieldChange}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    expect(screen.getByTestId("preview-editable-content").innerHTML).toContain("Edited preview");
  });

  it("lets markdown preview edits sync back into markdown source", () => {
    vi.useFakeTimers();
    const onFieldChange = vi.fn();

    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={{
          ...DRAFT,
          mode: "markdown",
          html: "<h1>Hello preview</h1><p>正文</p>",
          markdown: "# Hello preview\n\n正文",
        }}
        view="preview"
        setView={vi.fn()}
        tab="markdown"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml="<h1>Hello preview</h1>"
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={onFieldChange}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    const editable = screen.getByTestId("preview-editable-content");
    expect(editable).toHaveAttribute("contenteditable", "true");

    (editable as HTMLDivElement).innerHTML = [
      '<section style="font-size:16px; line-height:1.8; color:#333;">',
      "<h1>Hello preview</h1>",
      '<p style="margin:0; color:#333;">已更新正文</p>',
      "</section>",
    ].join("");
    fireEvent.input(editable);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onFieldChange).toHaveBeenCalledWith("markdown", "# Hello preview\n\n已更新正文");
  });

  it("keeps structural edits clean when preview adds a new paragraph", () => {
    vi.useFakeTimers();
    const onFieldChange = vi.fn();

    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={{
          ...DRAFT,
          html: "<h2>H</h2><p>P</p>",
        }}
        view="preview"
        setView={vi.fn()}
        tab="html"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml={[
          '<section style="font-size:16px; line-height:1.8; color:#333;">',
          "<h2>H</h2>",
          '<p style="margin:0; color:#333;">P</p>',
          "</section>",
        ].join("")}
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={onFieldChange}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    const editable = screen.getByTestId("preview-editable-content");
    (editable as HTMLDivElement).innerHTML = [
      '<section style="font-size:16px; line-height:1.8; color:#333;">',
      "<h2>H</h2>",
      '<p style="margin:0; color:#333;">P</p>',
      '<p style="margin:0; color:#333;">NEXT</p>',
      "</section>",
    ].join("");
    fireEvent.input(editable);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onFieldChange).toHaveBeenCalledWith("html", "<h2>H</h2><p>P</p><p>NEXT</p>");
  });

  it("keeps structural edits clean when markdown preview adds a new paragraph", () => {
    vi.useFakeTimers();
    const onFieldChange = vi.fn();

    render(
      <CenterStage
        articleId="draft-1"
        canGoBack
        draft={{
          ...DRAFT,
          mode: "markdown",
          html: "<h1>标题</h1><p>正文第一段。</p>",
          markdown: "# 标题\n\n正文第一段。",
        }}
        view="preview"
        setView={vi.fn()}
        tab="markdown"
        setTab={vi.fn()}
        saveState="saved"
        selected="body"
        navigationRequest={null}
        previewHtml={[
          '<section style="font-size:16px; line-height:1.8; color:#333;">',
          "<h1>标题</h1>",
          '<p style="margin:0; color:#333;">正文第一段。</p>',
          "</section>",
        ].join("")}
        previewLoading={false}
        previewError={null}
        publishing={false}
        copying={false}
        onBack={vi.fn()}
        onFieldChange={onFieldChange}
        onRefreshPreview={vi.fn()}
        onCopyRichText={vi.fn()}
        onPublish={vi.fn()}
      />
    );

    const editable = screen.getByTestId("preview-editable-content");
    (editable as HTMLDivElement).innerHTML = [
      '<section style="font-size:16px; line-height:1.8; color:#333;">',
      "<h1>标题</h1>",
      '<p style="margin:0; color:#333;">正文第一段。</p>',
      '<p style="margin:0; color:#333;">新增一段。</p>',
      "</section>",
    ].join("");
    fireEvent.input(editable);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onFieldChange).toHaveBeenCalledWith("markdown", "# 标题\n\n正文第一段。\n\n新增一段。");
  });
});
