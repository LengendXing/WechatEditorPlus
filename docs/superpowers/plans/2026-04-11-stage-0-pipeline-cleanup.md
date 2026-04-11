# Stage 0: 管线清理 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清除"违反 WYSIWYG 产品承诺"的死代码和分岔管线，搭建前后端测试基础设施，为 Stage 1 BlockRegistry 改造铺路。

**Architecture:** 删除预览期二次清洗 + 失效的交互模板 + 死代码，收敛后端 `_process_for_wechat` 的规则集，禁止"清洗下游"反模式；新增 pytest（后端）和 vitest（前端）框架。

**Tech Stack:** FastAPI + pytest（新增）+ React 19 + Vite + vitest（新增）

**Prerequisites:**
- 开发环境：Node 20+、Python 3.11+、已安装项目依赖（`frontend/ && npm install`，`backend/ && pip install -r requirements.txt`）
- Docker 环境（当前 `docker-compose.yml` 可用）
- 所有命令假设 cwd = `D:/Web/MBEditor/`

**Completion criteria（DoD）：**
- `grep -rn "sanitizeForWechatPreview" frontend/src/` 命中数 = 0
- `grep -rn "cleanMode\|normalizeImageStyles" frontend/src/components/preview/` 命中数 = 0
- 文件 `frontend/src/utils/wechatSanitizer.ts` 不存在
- 文件 `frontend/src/utils/svg-templates.ts` 不存在
- `useClipboard` 模块只剩 `writeHtmlToClipboard`，不再导出 `copyRichText`
- `backend/tests/test_smoke.py` 存在且 `pytest` 绿色
- `frontend/src/utils/__tests__/smoke.test.ts` 存在且 `npm test` 绿色
- `skill/mbeditor.skill.md` 删除"内置交互组件"整节
- 手动回归：启动项目 → 打开编辑器 → 预览能看到 HTML、复制功能能跑通（可以降级，但不能崩）

---

## File Structure

**Files to delete（删除）：**
- `frontend/src/utils/wechatSanitizer.ts`
- `frontend/src/utils/svg-templates.ts`
- `frontend/src/components/panel/SvgTemplatePanel.tsx`（依赖 svg-templates）

**Files to modify（修改）：**
- `frontend/src/components/preview/WechatPreview.tsx` — 删除 `cleanMode`、`normalizeImageStyles`、`sanitizeForWechatPreview` 引用
- `frontend/src/pages/Editor.tsx` — 删除对 `SvgTemplatePanel` 的引用
- `frontend/src/hooks/useClipboard.ts` — 删除 `copyRichText`，保留 `writeHtmlToClipboard`
- `frontend/src/utils/inliner.ts` — 删除 `processForWechat` 和 `sanitizeForWechat`，保留 `inlineCSS`（Stage 2 仍会用）
- `backend/app/api/v1/publish.py` — 删除 `_sanitize_for_wechat` 中不属于 HC-2 范畴的规则
- `skill/mbeditor.skill.md` — 删除"内置交互组件"章节
- `frontend/package.json` — 新增 vitest 依赖
- `backend/requirements.txt` — 新增 pytest 依赖

**Files to create（新建）：**
- `backend/tests/__init__.py`（空文件）
- `backend/tests/test_smoke.py`
- `backend/pytest.ini`
- `frontend/src/utils/__tests__/smoke.test.ts`
- `frontend/vitest.config.ts`

---

## Task 1: 创建 git 分支

**Files:**
- None

- [ ] **Step 1: 创建并切换到分支**

Run:
```bash
cd D:/Web/MBEditor
git checkout -b stage-0/pipeline-cleanup
```

- [ ] **Step 2: 确认当前分支**

Run: `git branch --show-current`
Expected: `stage-0/pipeline-cleanup`

---

## Task 2: 搭建后端 pytest 框架

**Files:**
- Create: `backend/pytest.ini`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_smoke.py`
- Create: `backend/requirements-dev.txt` (NEW — test deps split from prod)
- Modify: `backend/requirements.txt` (pytest lines removed)

- [ ] **Step 1: 添加 pytest 依赖到 requirements-dev.txt（不污染生产镜像）**

Create `backend/requirements-dev.txt` with content:
```
-r requirements.txt
pytest>=8.0.0
pytest-asyncio>=0.23.0
```
`backend/requirements.txt` must NOT contain pytest lines. The production Dockerfile continues to use `requirements.txt`; CI / dev workflows use `requirements-dev.txt`.

- [ ] **Step 2: 安装依赖**

Run:
```bash
cd D:/Web/MBEditor/backend
pip install -r requirements-dev.txt
```
Expected: `Successfully installed pytest-... pytest-asyncio-...`

- [ ] **Step 3: 创建 pytest.ini**

Create `backend/pytest.ini` with content:
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts = -v --tb=short
```

- [ ] **Step 4: 创建 tests 包**

Create `backend/tests/__init__.py` as empty file.

- [ ] **Step 5: 写第一个冒烟测试**

Create `backend/tests/test_smoke.py`:
```python
"""Smoke test — verifies the FastAPI app can respond to /healthz."""
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_healthz_responds():
    """The /healthz endpoint must return 200 with the expected body."""
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```
Note: `test_app_imports` is intentionally omitted — if `app.main` fails to import, `test_healthz_responds` already fails at module load time (the `client = TestClient(app)` line runs at import). The body assertion strengthens the contract check.

- [ ] **Step 6: 验证 /healthz 端点存在**

Run: `grep -rn "healthz" D:/Web/MBEditor/backend/app/`
Expected: at least one match. If none found, proceed to Step 6a.

- [ ] **Step 6a: 若 /healthz 不存在，添加它**

Only if Step 6 returned no matches, edit `backend/app/main.py` and add:
```python
@app.get("/healthz")
def healthz():
    return {"status": "ok"}
```

- [ ] **Step 7: 运行测试**

Run:
```bash
cd D:/Web/MBEditor/backend
pytest tests/test_smoke.py -v
```
Expected: `1 passed` (single test — `test_app_imports` was removed as redundant)

- [ ] **Step 8: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/pytest.ini backend/tests/__init__.py backend/tests/test_smoke.py backend/requirements.txt backend/requirements-dev.txt
# if main.py was modified in Step 6a also add it:
git add backend/app/main.py 2>/dev/null || true
git commit -m "fix(backend): split test deps to requirements-dev.txt, drop redundant smoke test"
```

---

## Task 3: 搭建前端 vitest 框架

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/utils/__tests__/smoke.test.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: 添加 vitest 依赖**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm install -D vitest@^2 @vitest/ui@^2 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25
```
Expected: `added N packages` without error.

- [ ] **Step 2: 添加 test script 到 package.json**

Edit `frontend/package.json`, 在 `scripts` 对象里添加：
```json
"test": "vitest run",
"test:ui": "vitest --ui",
"test:watch": "vitest"
```
（如果 `scripts` 中已有 `test` 则替换它；注意保留既有的 `dev` / `build` / `preview`）

- [ ] **Step 3: 创建 vitest 配置**

Create `frontend/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [x] **Step 4: 创建冒烟测试**

Create `frontend/src/utils/__tests__/smoke.test.ts` (2-test version, post-code-review fix):
```typescript
/**
 * Smoke test for the Vitest setup.
 *
 * Verifies vitest is running, the jsdom environment is active, and the
 * "@/..." path alias resolves via vite config. If this passes, every
 * layer of the test toolchain is wired correctly.
 */
import { describe, it, expect } from "vitest";

describe("vitest toolchain smoke", () => {
  it("runs under the jsdom environment", () => {
    // Under node env, `document` is undefined. Under jsdom, it's an object.
    expect(typeof document).toBe("object");
  });

  it("can import a module via the @ path alias", async () => {
    const mod = await import("@/utils/wordCount");
    expect(typeof mod.getWordCount).toBe("function");
  });
});
```

Note: `vite.config.ts` also updated (1-line change): `import path from "path"` → `import path from "node:path"` to match `vitest.config.ts` style.

- [ ] **Step 5: 运行测试**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm test
```
Expected: `2 passed`

- [ ] **Step 6: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/utils/__tests__/smoke.test.ts
git commit -m "chore(frontend): add vitest framework with smoke test"
```

---

## Task 4: 给现有 WechatPreview 写保护性测试

**目的：** 重构前先固化"当前行为哪些部分要保留"，避免重构把婴儿和洗澡水一起倒掉。

**Files:**
- Create: `frontend/src/components/preview/__tests__/WechatPreview.baseline.test.tsx`

- [ ] **Step 1: 阅读 WechatPreview.tsx，识别必须保留的行为**

Run: `cat D:/Web/MBEditor/frontend/src/components/preview/WechatPreview.tsx | head -60`

识别三个必须保留的行为：
1. iframe 写入传入的 HTML
2. 375px 宽度容器（移动端模拟）
3. iframe 高度自动适配内容

- [ ] **Step 2: 写保护性测试**

Create `frontend/src/components/preview/__tests__/WechatPreview.baseline.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import WechatPreview from "../WechatPreview";

/**
 * Baseline freeze for the WechatPreview component.
 *
 * These tests document the critical static behaviors that must NOT break
 * during the Stage 0 pipeline cleanup (Task 5 will rewrite internals of
 * this component). If Task 5 breaks any test here, it's a regression.
 *
 * Intentionally NOT tested (deferred to integration tests in later Stages):
 * - iframe content rendering (requires async DOM write tracking)
 * - postMessage-driven height synchronization (requires async event plumbing)
 *
 * The 375px wrapper class selector is deliberately coupled to the Tailwind
 * class `w-[375px]`. This is acceptable because the 375px mobile-simulation
 * width is a fixed design constant of this component — if a refactor changes
 * HOW the width is applied, the test SHOULD fail so a human re-confirms the
 * intent is preserved.
 */
describe("WechatPreview contract (baseline freeze)", () => {
  it("renders an iframe with title='preview'", () => {
    const { container } = render(
      <WechatPreview html="<p>hello</p>" css="" mode="wechat" />
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("title")).toBe("preview");
  });

  it("wraps the iframe in a 375px mobile-simulation container", () => {
    const { container } = render(
      <WechatPreview html="<p>hello</p>" css="" mode="wechat" />
    );
    // White-box selector intentional — see file header for rationale.
    const wrapper = container.querySelector(".w-\\[375px\\]");
    expect(wrapper).not.toBeNull();
  });

  it("renders successfully when mode='raw' (smoke check for the raw-mode code path)", () => {
    // Raw mode takes a different conditional branch in writeToIframe.
    // This test ensures that branch does not crash on render. We don't
    // assert anything about sanitization differences — Task 5 is free to
    // restructure the raw/wechat branching internally.
    const { container } = render(
      <WechatPreview html="<p>hello</p>" css="" mode="raw" />
    );
    expect(container.querySelector("iframe")).not.toBeNull();
  });
});
```

- [ ] **Step 3: 运行测试确认基线通过**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm test -- WechatPreview.baseline
```
Expected: `3 passed`

- [ ] **Step 4: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add frontend/src/components/preview/__tests__/
git commit -m "test(frontend): add baseline behavior tests for WechatPreview"
```

---

## Task 5: 清理 WechatPreview 的 cleanMode / sanitizer 逻辑

**Files:**
- Modify: `frontend/src/components/preview/WechatPreview.tsx`

- [ ] **Step 1: 写重构后行为测试（先红）**

Edit `frontend/src/components/preview/__tests__/WechatPreview.baseline.test.tsx`, 在末尾追加：
```typescript
describe("WechatPreview post-cleanup", () => {
  it("does not import sanitizeForWechatPreview", async () => {
    const mod = await import("../WechatPreview");
    // Verify the module string doesn't mention the removed function
    const src = mod.default.toString();
    expect(src).not.toContain("sanitizeForWechatPreview");
    expect(src).not.toContain("normalizeImageStyles");
  });

  it("does not render a cleanMode toggle button", () => {
    const { container } = render(
      <WechatPreview html="<p>hi</p>" css="" mode="wechat" />
    );
    const buttons = container.querySelectorAll("button");
    const hasCleanModeBtn = Array.from(buttons).some((b) =>
      b.textContent?.includes("清洗预览")
    );
    expect(hasCleanModeBtn).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd D:/Web/MBEditor/frontend && npm test -- WechatPreview.baseline`
Expected: 最后 2 个测试 FAIL（"does not import sanitizeForWechatPreview" 和 "does not render a cleanMode toggle button"）

- [ ] **Step 3: 重写 WechatPreview.tsx**

Replace the entire content of `frontend/src/components/preview/WechatPreview.tsx` with:
```typescript
import { useRef, useCallback, useEffect, useState } from "react";
import { normalizeEditableHtml } from "@/utils/htmlSemantics";

interface WechatPreviewProps {
  html: string;
  css: string;
  js?: string;
  mode: "raw" | "wechat";
  onHtmlChange?: (html: string) => void;
}

/**
 * WeChat article preview iframe.
 *
 * Renders the provided HTML inside an iframe that mimics the WeChat mobile
 * article view (375px width, PingFang font, line-height 1.8).
 *
 * Post-Stage-0 invariant: the HTML written into the iframe body is EXACTLY
 * what the caller passes in. No second-pass sanitization, no cleanMode toggle,
 * no image style normalization. WYSIWYG is enforced by the upstream
 * renderForWechat pipeline (Stage 1+).
 */
export default function WechatPreview({
  html,
  css,
  js,
  mode,
  onHtmlChange,
}: WechatPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isUserEditing = useRef(false);
  const lastSetHtml = useRef("");
  const lastSemanticKey = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iframeHeight, setIframeHeight] = useState(400);

  // In "wechat" mode the iframe body is contenteditable for in-place editing.
  const editable = mode === "wechat";

  // Listen for iframe resize messages (validate source to prevent spoofing).
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (
        e.data?.type === "mbeditor:preview-resize" &&
        typeof e.data.height === "number"
      ) {
        setIframeHeight(Math.max(400, e.data.height + 40));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const writeToIframe = useCallback(
    (content: string, canEdit: boolean) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      // The iframe chrome (font, padding, line-height) mimics the WeChat
      // article reader page. It is NOT part of the content — it is the
      // viewport. The content HTML is written AS-IS into body.
      const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 20px 24px;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    outline: none;
    -webkit-user-modify: ${canEdit ? "read-write" : "read-only"};
  }
  body *::selection { background: rgba(232, 85, 58, 0.12); }
  img { max-width: 100%; }
  ${css}
</style>
</head><body${canEdit ? ' contenteditable="true"' : ""}>${content}${js ? `<script>${js}<\/script>` : ""}<script>(function(){var post=function(){try{window.parent.postMessage({type:'mbeditor:preview-resize',height:document.body.scrollHeight},'*');}catch(e){}};if(typeof ResizeObserver!=='undefined'){var ro=new ResizeObserver(post);ro.observe(document.body);}Array.from(document.images).forEach(function(img){if(!img.complete)img.addEventListener('load',post);});post();setTimeout(post,100);setTimeout(post,500);})();<\/script></body></html>`;

      doc.open();
      doc.write(fullHtml);
      doc.close();

      const initial = normalizeEditableHtml(content);
      lastSemanticKey.current = initial.semanticKey;
      lastSetHtml.current = content;

      if (canEdit && onHtmlChange) {
        doc.body.addEventListener("input", () => {
          isUserEditing.current = true;
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => {
            if (!onHtmlChange) {
              setTimeout(() => {
                isUserEditing.current = false;
              }, 500);
              return;
            }
            const next = normalizeEditableHtml(doc.body.innerHTML);
            if (next.semanticKey !== lastSemanticKey.current) {
              lastSemanticKey.current = next.semanticKey;
              lastSetHtml.current = next.serialized;
              onHtmlChange(next.serialized);
            }
            setTimeout(() => {
              isUserEditing.current = false;
            }, 500);
          }, 800);
        });
      }
    },
    [css, js, onHtmlChange]
  );

  // Sync external html changes.
  useEffect(() => {
    if (isUserEditing.current) return;
    if (html === lastSetHtml.current) return;
    writeToIframe(html, editable);
  }, [html, editable, writeToIframe]);

  // Initial write on mount.
  useEffect(() => {
    const timer = setTimeout(() => {
      writeToIframe(html, editable);
    }, 50);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-[375px] shrink-0 rounded-xl overflow-hidden border border-border-primary shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
        <div className="h-6 bg-surface-tertiary flex items-center justify-between px-2 shrink-0">
          <span className="text-[10px] text-fg-muted font-mono">
            {mode === "raw" ? "原始预览" : "公众号预览"}
          </span>
        </div>
        <iframe
          ref={iframeRef}
          className="w-full border-0"
          style={{
            height: `${iframeHeight}px`,
            background: "#FAF8F5",
            transition: "height 0.2s ease",
          }}
          title="preview"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认全绿**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm test -- WechatPreview.baseline
```
Expected: `5 passed`

- [ ] **Step 5: 验证编辑器能打开（手动冒烟）**

Run (in one terminal):
```bash
cd D:/Web/MBEditor
docker-compose up -d
```
Wait 10 seconds, then open `http://localhost:7073/editor/<any-existing-article-id>` in browser.

Expected:
- 页面能打开
- 预览 iframe 渲染文章内容（不再有"清洗预览 (只读)" 切换按钮）
- 控制台无 `sanitizeForWechatPreview` / `normalizeImageStyles` 相关报错

- [ ] **Step 6: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add frontend/src/components/preview/WechatPreview.tsx frontend/src/components/preview/__tests__/WechatPreview.baseline.test.tsx
git commit -m "refactor(preview): remove cleanMode toggle and sanitizer, enforce WYSIWYG"
```

---

## Task 6: 删除 wechatSanitizer 和 inliner 死代码

**Files:**
- Delete: `frontend/src/utils/wechatSanitizer.ts`
- Modify: `frontend/src/utils/inliner.ts`
- Modify: `frontend/src/hooks/useClipboard.ts`

- [ ] **Step 1: 确认 wechatSanitizer 没有其它引用者**

Run:
```bash
cd D:/Web/MBEditor
grep -rn "wechatSanitizer\|sanitizeForWechatPreview" frontend/src/
```
Expected: 0 matches（Task 5 已经删了 WechatPreview 里的引用）。

如果有非 0 命中，必须先删除每一个引用点再继续。

- [ ] **Step 2: 删除 wechatSanitizer.ts**

Run:
```bash
cd D:/Web/MBEditor
rm frontend/src/utils/wechatSanitizer.ts
```

- [ ] **Step 3: 精简 inliner.ts 为仅导出 inlineCSS**

Replace the entire content of `frontend/src/utils/inliner.ts` with:
```typescript
import juice from "juice";

/**
 * Inline the given CSS rules into the HTML's style attributes.
 *
 * This function is the ONLY place in the frontend where CSS-to-inline-style
 * conversion happens. It is consumed by Stage-1 renderForWechat.
 *
 * Stage-0 scope: simply wraps juice. Does NOT strip tags, classes, or apply
 * any WeChat-specific rewriting — that responsibility moves to the backend
 * renderForWechat pipeline in Stage 1.
 */
export function inlineCSS(html: string, css: string): string {
  if (!css.trim()) return html;
  try {
    const wrapped = `<style>${css}</style>${html}`;
    return juice(wrapped, { removeStyleTags: true, preserveImportant: true });
  } catch {
    return html;
  }
}
```

- [ ] **Step 4: 精简 useClipboard.ts**

Replace the entire content of `frontend/src/hooks/useClipboard.ts` with:
```typescript
/**
 * Writes rich-text HTML to the clipboard.
 *
 * Post-Stage-0: the single public API is writeHtmlToClipboard. Callers are
 * responsible for preparing the HTML upstream (via renderForWechat in Stage 1).
 * No more processForWechat helper, no more "copyRichText" — those lived in a
 * world where the frontend did its own CSS inlining, which violated WYSIWYG.
 */
export async function writeHtmlToClipboard(html: string): Promise<boolean> {
  try {
    const blob = new Blob([html], { type: "text/html" });
    const plainBlob = new Blob([html], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": blob,
        "text/plain": plainBlob,
      }),
    ]);
    return true;
  } catch {
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.setAttribute("contenteditable", "true");
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const ok = document.execCommand("copy");
    document.body.removeChild(container);
    return ok;
  }
}
```

- [ ] **Step 5: 检查所有对已删除符号的引用**

Run:
```bash
cd D:/Web/MBEditor
grep -rn "processForWechat\|sanitizeForWechat\|copyRichText" frontend/src/
```
Expected: 0 matches.

如果有命中，逐个定位并删除引用（应该只可能是 `ActionPanel.tsx` 或 `useClipboard.ts` 的某个过时引用）。

- [ ] **Step 6: 确认前端编译通过**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm run build
```
Expected: `build completed` 无 TypeScript 错误。

若编译报错，错误一定是还有文件 import 了被删除的符号。修复每个错误直到编译通过。

- [ ] **Step 7: 跑所有测试**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm test
```
Expected: all tests pass.

- [ ] **Step 8: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add frontend/src/utils/inliner.ts frontend/src/hooks/useClipboard.ts
git add -u frontend/src/utils/  # picks up the deletion of wechatSanitizer.ts
git commit -m "refactor(frontend): remove wechatSanitizer, processForWechat, copyRichText dead code"
```

---

## Task 7: 删除 svg-templates 和 SvgTemplatePanel

**Files:**
- Delete: `frontend/src/utils/svg-templates.ts`
- Delete: `frontend/src/components/panel/SvgTemplatePanel.tsx`
- Modify: `frontend/src/pages/Editor.tsx`（删除 SvgTemplatePanel 引用）

**背景：** 研究报告 `docs/research/wechat-svg-capability.md` 已证明：这 6 个所谓"SVG 交互组件"本质是 HTML checkbox hack（`<input>+<label>+<style>+:checked`），微信正文会把这 4 样**全部剥光**。保留它们等于保留一个欺骗用户的功能。

- [ ] **Step 1: 确认 Editor.tsx 中 SvgTemplatePanel 的位置**

Run:
```bash
cd D:/Web/MBEditor
grep -n "SvgTemplatePanel\|handleInsertSvg" frontend/src/pages/Editor.tsx
```
Expected: 几个命中行。记下行号。

- [ ] **Step 2: 删除 Editor.tsx 中的 SvgTemplatePanel import**

Edit `frontend/src/pages/Editor.tsx`:
- 删除 `import SvgTemplatePanel from "@/components/panel/SvgTemplatePanel";` 那一行
- 删除 `handleInsertSvg` 函数（整个 useCallback 块）
- 删除 JSX 中注释或未注释的 `<SvgTemplatePanel ... />` 节点
- 如果删除后有未使用的 import（比如 useCallback 仅被 handleInsertSvg 使用），删除这些 import

具体删除哪些行：
1. 搜索 `SvgTemplatePanel` 并删除所有命中行
2. 搜索 `handleInsertSvg` 并删除整个函数定义（包括包围它的 useCallback）
3. 搜索 `{/* <SvgTemplatePanel` 注释并删除

- [ ] **Step 3: 删除源文件**

Run:
```bash
cd D:/Web/MBEditor
rm frontend/src/utils/svg-templates.ts
rm frontend/src/components/panel/SvgTemplatePanel.tsx
```

- [ ] **Step 4: 验证前端编译**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm run build
```
Expected: 编译通过。

若报错 `Cannot find module '@/utils/svg-templates'` 或类似，回到 Step 2 检查是否还有遗漏的 import。

- [ ] **Step 5: 跑测试**

Run:
```bash
cd D:/Web/MBEditor/frontend
npm test
```
Expected: all green.

- [ ] **Step 6: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add -u frontend/src/
git commit -m "refactor(frontend): remove svg-templates and SvgTemplatePanel (HTML-hack, incompatible with WeChat)"
```

---

## Task 8: 收敛后端 _sanitize_for_wechat 的规则集

**目的：** 现在 `_sanitize_for_wechat` 里有 10+ 条规则，其中只有 2 条属于"删除微信不支持的标签"（script、style、input、label、class、data-*），其余（grid→block、position 删除、animation 删除、top/left 删除、cursor 删除等）都属于"清洗下游"反模式。删除这些反模式规则，让规则集只做"剥离微信不支持标签"的事。

**Files:**
- Modify: `backend/app/api/v1/publish.py:246-331`
- Create: `backend/tests/test_sanitize_baseline.py`

- [ ] **Step 1: 写基线测试固化"要保留的行为"**

Create `backend/tests/test_sanitize_baseline.py`:
```python
"""
Baseline tests for _sanitize_for_wechat.

After Stage 0, this function should ONLY strip tags that WeChat's backend
renderer removes (script, style, link, input, label, class attr, data-* attr).
It should NOT rewrite CSS values, delete positioning, etc.
"""
import pytest

from app.api.v1.publish import _sanitize_for_wechat


def test_strips_script_tag():
    html = '<section>hi</section><script>alert(1)</script>'
    result = _sanitize_for_wechat(html)
    assert "<script" not in result
    assert "hi" in result


def test_strips_style_tag():
    html = '<style>.x{color:red}</style><section>hi</section>'
    result = _sanitize_for_wechat(html)
    assert "<style" not in result
    assert "hi" in result


def test_strips_class_attribute():
    html = '<section class="foo">hi</section>'
    result = _sanitize_for_wechat(html)
    assert 'class="foo"' not in result
    assert "hi" in result


def test_strips_data_attributes():
    html = '<section data-id="x" data-foo="bar">hi</section>'
    result = _sanitize_for_wechat(html)
    assert "data-id" not in result
    assert "data-foo" not in result


def test_strips_input_and_label():
    html = '<input type="checkbox" /><label for="x">click</label>'
    result = _sanitize_for_wechat(html)
    assert "<input" not in result
    assert "<label" not in result


def test_converts_div_to_section():
    html = '<div>hi</div>'
    result = _sanitize_for_wechat(html)
    assert "<section" in result
    assert "<div" not in result


def test_preserves_inline_style_grid():
    """Stage-0 rule: sanitizer MUST NOT rewrite display:grid."""
    html = '<section style="display:grid;color:red;">hi</section>'
    result = _sanitize_for_wechat(html)
    assert "display:grid" in result
    assert "display:block" not in result


def test_preserves_position_absolute():
    """Stage-0 rule: sanitizer MUST NOT strip position:absolute.
    If the user writes it, we send it. Failing at runtime is WeChat's problem,
    not ours — we don't silently mutate authored intent."""
    html = '<section style="position:absolute;top:0;left:0;">hi</section>'
    result = _sanitize_for_wechat(html)
    assert "position:absolute" in result
    assert "top:0" in result
    assert "left:0" in result


def test_preserves_animation():
    """Stage-0 rule: sanitizer MUST NOT strip animation property."""
    html = '<section style="animation:fadeIn 1s;color:red;">hi</section>'
    result = _sanitize_for_wechat(html)
    assert "animation:fadeIn" in result
```

- [ ] **Step 2: 跑测试确认 4 个"保留"测试会失败（旧代码会删掉它们）**

Run:
```bash
cd D:/Web/MBEditor/backend
pytest tests/test_sanitize_baseline.py -v
```
Expected: 前 6 个测试 PASS，后 3 个测试（preserves_inline_style_grid / preserves_position_absolute / preserves_animation）FAIL。

- [ ] **Step 3: 重写 _sanitize_for_wechat**

Edit `backend/app/api/v1/publish.py`, 找到 `def _sanitize_for_wechat(html: str) -> str:` 函数（约在第 246 行），将整个函数体（直到函数结束前的 `return html.strip()`）替换为：

```python
def _sanitize_for_wechat(html: str) -> str:
    """Strip tags/attributes that WeChat's backend renderer removes.

    Post-Stage-0 scope: this function ONLY removes what WeChat itself removes.
    It does NOT rewrite CSS values, delete grid/flex/position, or otherwise
    mutate the author's intent. If the user writes display:grid, we send
    display:grid. WeChat's runtime is responsible for the final rendering.

    The "cleaning downstream" anti-pattern (rewriting grid→block, deleting
    absolute positioning, etc.) is explicitly banned — see
    docs/research/wechat-wysiwyg-pipeline.md HC-6.
    """
    # ---- remove contenteditable (editor-only attribute) ---------------------
    html = re.sub(r'\s*contenteditable="[^"]*"', '', html)

    # ---- strip tags WeChat does not support ---------------------------------
    html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<link[^>]*/?>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<meta[^>]*/?>", "", html, flags=re.IGNORECASE)

    # ---- strip <input>/<label> (WeChat article body drops them) -------------
    html = re.sub(r'<input\s[^>]*>\s*', '', html)
    html = re.sub(r'<label\b[^>]*>(.*?)</label>', r'\1', html, flags=re.DOTALL)

    # ---- remove class / data-* attributes (WeChat drops external CSS) ------
    html = re.sub(r'\s+class="[^"]*"', "", html)
    html = re.sub(r"\s+class='[^']*'", "", html)
    html = re.sub(r'\s+data-[\w-]+="[^"]*"', "", html)

    # ---- <div> → <section> (WeChat convention from Xiumi/135) ---------------
    html = re.sub(r'<div\b', '<section', html)
    html = re.sub(r'</div>', '</section>', html)

    # ---- normalize style quotes: premailer may emit style='...' (single)
    # Must escape any inner double quotes to &quot; before swapping the
    # wrapper, otherwise font-family:"PingFang SC","Hiragino Sans GB" gets
    # torn into fake attributes by the HTML parser.
    def _single_to_double_quoted_style(m: re.Match) -> str:
        inner = m.group(1).replace('"', '&quot;')
        return f'style="{inner}"'

    html = re.sub(r"style='([^']*)'", _single_to_double_quoted_style, html)

    # ---- collapse blank lines ----------------------------------------------
    html = re.sub(r'\n\s*\n', '\n', html)
    return html.strip()
```

**同时删除**以下不再使用的辅助函数（它们只被旧的 `_sanitize_for_wechat` 调用）：
- `_remove_if_decorative` (publish.py 约 118 行)
- `_estimate_svg_height` (publish.py 约 146 行)
- `_wrap_in_svg_foreignobject` (publish.py 约 185 行)
- `_extract_and_protect_interactive` (publish.py 约 218 行)
- `_restore_interactive` (publish.py 约 238 行)
- `_INTERACTIVE_PATTERN` 常量 (publish.py 约 139 行)

Run: `grep -n "^def _remove_if_decorative\|^def _estimate_svg\|^def _wrap_in_svg\|^def _extract_and_protect\|^def _restore_interactive\|^_INTERACTIVE_PATTERN" backend/app/api/v1/publish.py`

把每一个命中的函数整块删除（从 `def` 行到下一个 `def` / 顶级定义之前）。

- [ ] **Step 4: 跑测试**

Run:
```bash
cd D:/Web/MBEditor/backend
pytest tests/test_sanitize_baseline.py -v
```
Expected: all 9 tests PASS.

- [ ] **Step 5: 跑完整后端测试**

Run:
```bash
cd D:/Web/MBEditor/backend
pytest -v
```
Expected: all tests pass.

- [ ] **Step 6: 冒烟启动 API**

Run:
```bash
cd D:/Web/MBEditor/backend
uvicorn app.main:app --host 0.0.0.0 --port 7072 &
sleep 3
curl -s http://localhost:7072/healthz
kill %1 2>/dev/null || true
```
Expected: `{"status":"ok"}`

- [ ] **Step 7: 提交**

Run:
```bash
cd D:/Web/MBEditor
git add backend/app/api/v1/publish.py backend/tests/test_sanitize_baseline.py
git commit -m "refactor(backend): narrow _sanitize_for_wechat to tag-stripping only, ban downstream CSS rewriting"
```

---

## Task 9: 校验 mbeditor skill 已反映 Stage 0 状态

**背景：** 在 Stage 0 正式执行之前，已经做过一次 skill 预更新（参见 2026-04-11 的 git 历史 `docs(skill): stage 0 preview`），把顶部的"核心使命"、"设计决策树"、"重要变更公告"、"HTML 层写作规范"、"交互组件已下线警告"、"SVG 层示例"、"Raster 层使用时机"全都加上了。

**本 Task 的目的是幂等校验：** 确认 skill 确实处于预期状态，补齐 Stage 0 执行中发现的任何新注意事项。

**Files:**
- Modify: `skill/mbeditor.skill.md`（仅当校验不通过时）

- [ ] **Step 1: 运行校验 grep**

Run:
```bash
cd D:/Web/MBEditor
# 必须存在的章节
grep -q "🎯 核心使命" skill/mbeditor.skill.md && echo "OK: core mission section"
grep -q "🧭 设计决策树" skill/mbeditor.skill.md && echo "OK: decision tree section"
grep -q "HTML 层写作规范" skill/mbeditor.skill.md && echo "OK: html writing rules section"
grep -q "交互组件（Stage 0 起已下线）" skill/mbeditor.skill.md && echo "OK: deprecated components warning"
grep -q "SVG 层示例" skill/mbeditor.skill.md && echo "OK: svg example"
grep -q "Raster 层的使用时机" skill/mbeditor.skill.md && echo "OK: raster usage section"

# 必须没有的内容
! grep -q "^### 内置交互组件$" skill/mbeditor.skill.md && echo "OK: no old deprecated section header"
! grep -q "100% 微信兼容" skill/mbeditor.skill.md && echo "OK: no misleading compat claim"
```
Expected: 所有 8 行都输出 `OK: ...`。

如果**任何一行没有输出 OK**，说明 skill 状态与预期不符，需要回到 git log 检查 `docs(skill): stage 0 preview` 提交是否存在并已合并。

- [ ] **Step 2: 如果校验全过，本 Task 无需 commit，跳过 Step 3-4**

若 Step 1 全绿，直接进入 Task 10。

- [ ] **Step 3: 补 Stage 0 执行中发现的新注意事项（按需）**

在 Stage 0 的 Task 5/6/7/8 执行过程中，如果发现某些旧组件 / 旧行为 / 旧写法 **在代码层面已彻底删除**，在 skill 里可以移除对应的"迁移提示"文案（因为已不存在滑入问题）。

具体检查点：
- 是否仍有对 `sanitizeForWechatPreview` 的提及？应当没有，skill 不应谈论内部函数。
- 是否仍有"6 种交互组件"的独立章节？应当只剩"已下线"警告。
- 是否仍有对 `SvgTemplatePanel` 的引用？应当没有。

Run:
```bash
cd D:/Web/MBEditor
grep -n "sanitizeForWechatPreview\|SvgTemplatePanel" skill/mbeditor.skill.md
```
Expected: 0 命中。

若有命中，编辑文件删除相应段落。

- [ ] **Step 4: 仅在 Step 3 修改了文件时提交**

Run:
```bash
cd D:/Web/MBEditor
git diff --quiet skill/mbeditor.skill.md && echo "no changes, skip commit" || {
  git add skill/mbeditor.skill.md
  git commit -m "docs(skill): stage 0 — final cleanup of deprecated references after code removal"
}
```

---

## Task 10: 最终验证与合并

- [ ] **Step 1: 完整跑一遍测试**

Run:
```bash
cd D:/Web/MBEditor/backend && pytest -v
cd D:/Web/MBEditor/frontend && npm test
cd D:/Web/MBEditor/frontend && npm run build
```
Expected: 全部绿色，无 TypeScript 错误。

- [ ] **Step 2: 验证 DoD grep 清单**

Run each command and verify the count:
```bash
cd D:/Web/MBEditor
# 全部应返回 0
grep -rn "sanitizeForWechatPreview" frontend/src/ | wc -l
grep -rn "normalizeImageStyles" frontend/src/components/preview/ | wc -l
grep -rn "cleanMode" frontend/src/components/preview/ | wc -l
grep -rn "processForWechat" frontend/src/ | wc -l
grep -rn "svgTemplates\|SvgTemplatePanel" frontend/src/ | wc -l
# 应返回 "No such file or directory" 或空
ls frontend/src/utils/wechatSanitizer.ts 2>&1
ls frontend/src/utils/svg-templates.ts 2>&1
```
Expected: 每个 grep 返回 `0`，每个 ls 返回 "No such file or directory" 或类似。

- [ ] **Step 3: 冒烟启动完整栈**

Run:
```bash
cd D:/Web/MBEditor
docker-compose down
docker-compose up -d --build
sleep 15
curl -s http://localhost:7072/healthz
curl -s http://localhost:7073/ | head -5
```
Expected: `/healthz` 返回 `{"status":"ok"}`，`7073` 返回 HTML（含 `<title>`）。

- [ ] **Step 4: 手动回归**

打开 `http://localhost:7073/` 并：
1. 创建一篇新文章（HTML 模式）
2. 写一段 `<p>hello</p>` 粘贴到 HTML tab
3. 切换到分屏视图
4. 验证预览 iframe 渲染正常
5. 验证**没有**"清洗预览/原始样式"切换按钮
6. 验证右侧 ActionPanel 的"一键复制富文本"按钮能点击（行为暂不要求完美，Stage 6 才收尾）

- [ ] **Step 5: 合并到主分支**

Run:
```bash
cd D:/Web/MBEditor
git checkout main 2>/dev/null || git checkout master
git merge --no-ff stage-0/pipeline-cleanup -m "feat: stage 0 — WYSIWYG pipeline cleanup"
```

- [ ] **Step 6: 标记 Stage 0 完成**

Edit `docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md` §2，将 Stage 0 那一行的"详细计划"列从 `✅ 已细化` 改为 `✅ 完成 (YYYY-MM-DD)`。

Run:
```bash
cd D:/Web/MBEditor
git add docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md
git commit -m "docs(roadmap): mark stage 0 as complete"
```

---

## Rollback 预案

若任一 Task 发现破坏性问题且难以修复：
```bash
cd D:/Web/MBEditor
git checkout main 2>/dev/null || git checkout master
git branch -D stage-0/pipeline-cleanup
```
然后回到"File Structure"章节重新分析哪个 Task 步骤有问题。

---

## 已知遗留项（Stage 1+ 才解决）

- 后端 `_process_for_wechat` 仍然存在（Stage 1 会被 `render_for_wechat` 替换）
- 后端 `_inline_css` 仍在使用 `_WECHAT_BASE_CSS` 注入字体样式（Stage 1 评估是否删除）
- `Editor.tsx` 的 debounced `/publish/preview` 调用仍在（Stage 1 切到新管线时删）
- 旧 `/articles` 和 `/publish/*` 端点仍然是主力（Stage 6 前不动）
- "一键复制" 和"推送草稿箱"仍走旧路径（Stage 6 切换）

这些**不是 Stage 0 的范围**。Stage 0 的目标是"不破坏现有功能的前提下清走死代码"，不涉及架构变更。
