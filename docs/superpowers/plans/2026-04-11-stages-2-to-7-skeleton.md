# Stage 2-7 骨架计划

> **说明：** 这份文档是 Stage 2-7 的**骨架计划**——包含目标、文件结构、任务列表、DoD，但**不包含 step 级 TDD 细节**。原因：Stage 2-7 的 API 形状和数据流依赖 Stage 1 落地后的 `BlockRegistry` / `RenderContext` 实际接口，过早写 step 级细节会产生"执行时对不上"的僵尸步骤。
>
> **执行顺序：** 当某个 Stage 要启动时，应先把对应章节从本文件**拆出为独立的详细计划**（命名 `2026-04-11-stage-N-xxx.md`），按 `2026-04-11-stage-0-pipeline-cleanup.md` / `2026-04-11-stage-1-block-registry.md` 的样式补完 step 级代码。
>
> **For agentic workers:** 不要直接执行本文件。先调用 `superpowers:writing-plans` 将对应 Stage 章节展开为详细计划。

---

## Stage 2: HTML / Markdown Block 渲染器

**Goal:** 把 `html` / `markdown` block 从 stub 替换为真正的 renderer，产出 inline-styled HTML。

**Architecture:**
- `HtmlRenderer`: 接收 `HtmlBlock.source + css`，走 premailer 内联，走 `_sanitize_for_wechat`（Stage 0 收敛过的版本），产出 inline-styled HTML
- `MarkdownRenderer`: 接收 `MarkdownBlock.source`，走 Python 端 markdown-it-py 渲染为 HTML，然后走和 HtmlRenderer 同一个后半段（premailer → sanitize）
- **复用 Stage 0 收敛后的 `_inline_css` 和 `_sanitize_for_wechat`**：它们现在只做"必要的剥离"，正好是 Stage 2 需要的后处理
- 两个 renderer 共享一个 `_process_html_fragment(html, css) -> str` 辅助函数，定义在 `renderers/_common.py`

**Tech Stack:** premailer（已有）+ markdown-it-py（新增依赖）+ Pygments（代码高亮，可选）

**Prerequisites:** Stage 1 已完成。

**Files to create:**
- `backend/app/services/renderers/_common.py` — `process_html_fragment(html, css) -> str`
- `backend/app/services/renderers/html_renderer.py` — `HtmlRenderer`
- `backend/app/services/renderers/markdown_renderer.py` — `MarkdownRenderer`
- `backend/tests/test_html_renderer.py`
- `backend/tests/test_markdown_renderer.py`
- `backend/tests/test_renderers_common.py`

**Files to modify:**
- `backend/requirements.txt` — 新增 `markdown-it-py>=3.0.0`
- `backend/app/services/block_registry.py` — `BlockRegistry.default()` 把 HTML/MARKDOWN 的 stub 替换为真 renderer
- `skill/mbeditor.skill.md` — 更新 block 类型状态表（html / markdown 从 🚧 改为 ✅），加使用示例

**Tasks:**
1. 分支 `stage-2/html-markdown-renderer`
2. 新增依赖 `markdown-it-py`
3. 写 `_common.process_html_fragment` + 测试（4 个场景：空 CSS、有 CSS、含 `<div>`（应变 `<section>`）、含 `<style>`（应被剥）
4. 写 `HtmlRenderer` + 测试（5 个 fixture：纯段落、含表格、含 img、含 class、含嵌套 style）
5. 写 `MarkdownRenderer` + 测试（CommonMark 基本元素、代码块高亮、表格、无序列表）
6. 注册到 `BlockRegistry.default()`，确认原有 `render_for_wechat` 测试仍绿
7. 更新 `test_render_for_wechat.py` 加一个端到端用例：一个 MBDoc 含 1 个 heading + 1 个 markdown + 1 个 html，render 出的结果满足 WYSIWYG 不变量
8. 更新 skill：`html` 和 `markdown` block 章节示例 curl
9. 验证、合并、标记完成

**DoD:**
- `MarkdownBlock(source="# Hello\n\n**world**")` 渲染为 `<h1 style=...>Hello</h1><p style=...><strong>world</strong></p>`
- `HtmlBlock(source="<div>x</div>", css=".x{color:red}")` 渲染为 `<section style="...">x</section>`（div→section，CSS 已内联）
- 所有产物均无 `<style>` `<script>` `class=` 出现
- Stage 1 的 WYSIWYG 不变量测试在混入 html/markdown block 后仍通过
- skill 的 block 类型状态表 html/markdown 标记为 ✅

**工程量：** 1 人·周

---

## Stage 3: 图片管线（自建 CDN + 微信远程拉图）

**Goal:** 实现 `image` block renderer + 后端图片上传 API + 配合 `upload_images=true` 的图片 URL 替换。

**Architecture:**
- `ImageRenderer` 产出 `<img src="{src}" alt="{alt}" style="max-width:100%;border-radius:8px;">`
- `ctx.upload_images=True` 时，渲染前先调用 `ctx.image_uploader(bytes, filename) -> url` 替换 src
- 后端 `/api/v1/images` 接收上传（沿用现有 `image_service`），新增 `/api/v1/images/{id}/bytes` 用于 renderer 读回字节
- 图片 uploader 有两个实现：
  - `LocalUploader`：no-op，返回原 src（用于 `upload_images=False`）
  - `WechatUploader`：调用现有 `wechat_service.upload_image_to_cdn`（`/cgi-bin/media/uploadimg`），返回 mmbiz URL
- 缓存：同一 sha256 已上传过的图片，直接复用 mmbiz URL（避免重复上传）；缓存存储在 `data/image_cdn_cache.json`

**Files to create:**
- `backend/app/services/renderers/image_renderer.py`
- `backend/app/services/image_cdn_cache.py` — sha256 → mmbiz URL 的键值对缓存
- `backend/app/services/uploaders/__init__.py`
- `backend/app/services/uploaders/local.py` — 本地 no-op uploader
- `backend/app/services/uploaders/wechat.py` — 微信 CDN uploader（封装现有 `wechat_service.upload_image_to_cdn`）
- `backend/tests/test_image_renderer.py`
- `backend/tests/test_image_cdn_cache.py`
- `backend/tests/test_uploaders.py`

**Files to modify:**
- `backend/app/services/block_registry.py` — 注册 ImageRenderer
- `backend/app/api/v1/mbdoc.py` — `render_mbdoc` 端点在 `upload_images=True` 时注入 `WechatUploader`
- `skill/mbeditor.skill.md` — 图片 block 章节

**Tasks:**
1. 分支 `stage-3/image-pipeline`
2. 写 `ImageCDNCache` + 测试（get/put、持久化、并发安全）
3. 写 `LocalUploader` + 测试
4. 写 `WechatUploader` + 测试（mock httpx）
5. 写 `ImageRenderer` + 测试（3 个模式：本地 src / 外链 src / 已是 mmbiz src）
6. 在 `mbdoc.py` 的 `render` 端点中根据 `upload_images` 参数选择 uploader
7. 更新 `BlockRegistry.default()` 注册 ImageRenderer
8. 补 WYSIWYG 不变量测试：同一 MBDoc 含 image block，两次 render diff 只在 `<img src>` 属性
9. 更新 skill
10. 合并、标记完成

**DoD:**
- `ImageBlock(src="/images/x.png")` 在 `upload_images=False` 下渲染为 `<img src="/images/x.png" ...>`
- 同一个在 `upload_images=True` 下渲染为 `<img src="https://mmbiz.qpic.cn/..." ...>`
- 两个渲染结果 diff 只出现在 `src=` 属性
- 上传失败时抛 `ImageUploadError`，不静默降级
- 同 sha256 图片重复上传返回缓存的 mmbiz URL，调用次数 = 1（用 mock 验证）
- skill 的 image block 章节有完整 curl 示例

**工程量：** 0.5 人·周

---

## Stage 4: SVG Block 渲染器 + Monaco SVG 子编辑器

**Goal:** SVG block 完整可用（后端渲染 + 白名单校验 + 前端 Monaco 编辑器）。CLI/Agent 优先，程序员其次，运营者最后。

**Architecture:**
- **白名单** `backend/app/data/svg_whitelist.json`：从 `docs/research/wechat-svg-capability.md` 摘取的 标签/属性 白名单
- `SvgValidator`：基于白名单的 DOM 遍历校验器，拒绝 `<script>` / `onclick` / `id=` / 不在白名单的标签
- `SvgRenderer`：校验通过后**原样返回** source（不做任何修改）；校验失败抛 `SvgValidationError`
- 前端 `SvgBlockEditor.tsx`：Monaco (`language="xml"`) + 实时预览（右侧 iframe）+ 校验报错红字
- 前端校验器复用后端白名单（通过 API `GET /api/v1/svg/whitelist` 拉取，或构建时打包成静态 JSON）
- **CLI Agent 模式**：直接用 curl 发 MBDoc JSON，`svg.source` 字段是 raw SVG 字符串，校验失败返回 422
- **程序员模式**：Monaco 编辑器
- **运营者模式**：本 Stage 不做（需要组件库，roadmap §8 已声明 out of scope）

**Files to create:**
- `backend/app/data/svg_whitelist.json`
- `backend/app/services/svg_validator.py`
- `backend/app/services/renderers/svg_renderer.py`
- `backend/app/api/v1/svg.py` — `GET /svg/whitelist` + `POST /svg/validate` 端点
- `backend/tests/test_svg_validator.py`
- `backend/tests/test_svg_renderer.py`
- `frontend/src/components/editor/SvgBlockEditor.tsx`
- `frontend/src/utils/svg-validator.ts` — 前端校验器（逻辑对齐后端）
- `frontend/src/components/editor/__tests__/SvgBlockEditor.test.tsx`

**Files to modify:**
- `backend/app/services/block_registry.py` — 注册 SvgRenderer
- `backend/app/api/v1/router.py` — include svg router
- `skill/mbeditor.skill.md` — SVG 章节（白名单表 + SMIL 示例 + 3 个可直接用的 SVG 样例）

**Whitelist 设计（基于调研报告）：**

**允许的标签：** `svg`, `g`, `defs`, `use`, `symbol`, `clipPath`, `mask`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`, `tspan`, `image`, `linearGradient`, `radialGradient`, `stop`, `pattern`, `filter`, `feGaussianBlur`, `animate`, `animateTransform`, `set`, `foreignObject`

**禁止的标签：** `script`, `a`, `style`

**禁止的属性：**
- `id`（微信过滤）
- `class`
- 所有 `on*` 事件属性（`onclick`、`onload`、`onmouseover` 等）

**SMIL `begin` 允许的值：** `click`, `touchstart`, `touchend`, `touchmove`, `indefinite`, 以及 `<数值>s`（如 `0s`, `1.5s`）

**Tasks:**
1. 分支 `stage-4/svg-renderer`
2. 写 `svg_whitelist.json`（完整白名单）
3. 写 `SvgValidator` + 测试（20+ 个 case：合法 SVG 通过；含 `<script>` 拒绝；含 `id=x` 拒绝；含 `onclick=` 拒绝；SMIL `begin="click"` 通过；`<foreignObject>` 通过但内部 HTML 也需校验）
4. 写 `SvgRenderer` + 测试（校验通过原样返回；校验失败抛错）
5. 实现 `/api/v1/svg/whitelist` `/api/v1/svg/validate` 端点 + 测试
6. 前端 SvgBlockEditor（Monaco + 预览 + 实时校验）+ vitest
7. 更新 `BlockRegistry.default()` 注册 SvgRenderer
8. 写端到端测试：一个含 svg block 的 MBDoc，render 输出含完整 `<svg>` 源码
9. 更新 skill：SVG 白名单摘要 + 3 个可套用样例（分隔线、图标、点击展开图形）
10. 合并、标记完成

**DoD:**
- 合法 SVG 通过校验并渲染
- `<svg><script>` 被拒绝（422 Validation Error）
- `<svg id="x">` 被拒绝
- `<rect onclick="...">` 被拒绝
- `<animate begin="click">` 通过
- 前端编辑器能看到语法错误高亮、校验错误红字
- CLI 流程：`curl POST /mbdoc` 含 svg block → render → 返回的 HTML 含完整 svg 源
- skill 的 svg 章节有 3 个可复制粘贴立即可用的样例

**工程量：** 1.5 人·周

---

## Stage 5: Playwright 栅格化 worker

**Goal:** `raster` block renderer，通过 Playwright 服务端把任意 HTML+CSS 渲染为 PNG，上传 CDN，最终产物是 `<img src="mmbiz...">`。

**Architecture:**
- Docker 镜像加入 Playwright + `fonts-noto-cjk`（参考研究报告 `html-to-svg-compilation.md` §4）
- `PlaywrightRenderer` 单例：启动 Chromium 浏览器 pool（3 worker），每个 raster block 请求一个 page，`setContent(wrappedHTML)` → `screenshot({fullPage: true, type: 'png'})` → bytes
- `wrappedHTML = <html><head><meta charset=utf-8><style>html,body{margin:0;padding:0;} {css}</style></head><body>{html}</body></html>`
- 视口宽度 `block.width`（默认 750px，对应微信文章内容区 2x 高清）
- sha256 缓存：相同 `(html, css, width)` 不重复渲染，结果存 `data/raster_cache/{sha}.png`
- 渲染完成后调 `ctx.image_uploader(png_bytes, f"raster-{sha[:8]}.png")` 获取 mmbiz URL
- 最终 HTML：`<img src="mmbiz_url" alt="" style="max-width:100%;display:block;">`

**Files to create:**
- `backend/app/services/renderers/raster_renderer.py`
- `backend/app/services/playwright_pool.py` — 浏览器实例池，懒初始化
- `backend/app/services/raster_cache.py` — sha256 → PNG bytes 缓存
- `backend/tests/test_raster_renderer.py` — 真的启动 Playwright（慢测试，标记 `@pytest.mark.slow`）
- `backend/tests/test_raster_cache.py`
- `backend/tests/test_playwright_pool.py`
- `backend/Dockerfile.playwright` — 或者修改现有 Dockerfile

**Files to modify:**
- `backend/Dockerfile` — 加 playwright 依赖和 `fonts-noto-cjk`
- `backend/requirements.txt` — `playwright>=1.47.0`
- `backend/app/services/block_registry.py` — 注册 RasterRenderer
- `docker-compose.yml` — 可能需要加内存限制
- `skill/mbeditor.skill.md` — raster block 章节（使用场景、性能警告、样例）

**Tasks:**
1. 分支 `stage-5/raster-worker`
2. 改 Dockerfile 加 playwright（本地先跑通：`docker-compose build --no-cache backend`）
3. 写 `PlaywrightPool` + 测试（单例、并发 safe、懒初始化、cleanup）
4. 写 `RasterCache` + 测试
5. 写 `RasterRenderer` + 测试（mock Playwright page 和真实 page 两个测试）
6. 集成到 `BlockRegistry.default()`
7. 端到端测试：一个 raster block 含 `display:grid` 的 HTML，render 结果是 `<img src="mmbiz...">`（mock uploader）
8. 性能测试：5 个 raster block 并发渲染耗时 < 10s（本地开发机）
9. 更新 skill：raster 章节含性能警告 + "优先尝试 HTML/SVG" 决策树
10. 合并、标记完成

**DoD:**
- Docker 镜像构建成功含 Playwright + `fonts-noto-cjk`
- `RasterBlock(html="<div style=display:grid;>x</div>")` 渲染为 `<img src="mmbiz...">`
- 相同输入的第二次调用不触发 Playwright（cache hit）
- PNG 清晰度测试：渲染 24px 字体后 OCR 识别率 ≥ 95%（可选，硬件允许则加）
- 内存占用：单次 `docker stats` 峰值 < 1GB
- skill 的 raster 章节明示"2-3 秒/块发布开销"

**工程量：** 1.5 人·周

---

## Stage 6: CLI/Agent 友好 API 层 + 前端迁移

**Goal:** 打通"MBDoc → 一键复制 / 推送草稿箱"完整闭环，前端 Editor 页面迁移到 block 化界面，旧 `/articles` 标记 deprecated。

**Architecture:**
- 新增 `POST /api/v1/mbdoc/{id}/publish`：内部先 `render(upload_images=True)` 再调 `wechat_service.create_draft`
- 新增 `POST /api/v1/mbdoc/{id}/copy-html`：返回 `render(upload_images=True)` 的 HTML（供前端写剪贴板）
- 前端 Editor 页面重构：左侧 block 列表（每个 block 点击后右侧 Monaco 打开对应 source），顶部 toolbar 加"添加块"菜单
- 前端 block 编辑器：
  - `heading` / `paragraph` → 简单 input
  - `markdown` / `html` → Monaco
  - `image` → 拖拽/选图 + alt 输入
  - `svg` → Stage 4 的 `SvgBlockEditor`
  - `raster` → Monaco (HTML) + Monaco (CSS) + "警告：此块将被栅格化"
- 旧 `/articles` 路由在响应头加 `Deprecation: true` + `Sunset: Stage-7-complete`

**Files to create:**
- `backend/tests/test_mbdoc_publish.py`
- `frontend/src/components/editor/BlockList.tsx` — 左侧 block 列表
- `frontend/src/components/editor/BlockEditor.tsx` — 分派到具体 block 编辑器
- `frontend/src/components/editor/blocks/HeadingBlockEditor.tsx`
- `frontend/src/components/editor/blocks/ParagraphBlockEditor.tsx`
- `frontend/src/components/editor/blocks/MarkdownBlockEditor.tsx`
- `frontend/src/components/editor/blocks/HtmlBlockEditor.tsx`
- `frontend/src/components/editor/blocks/ImageBlockEditor.tsx`
- `frontend/src/components/editor/blocks/RasterBlockEditor.tsx`
- （`SvgBlockEditor` 已在 Stage 4 创建，复用）
- `frontend/src/pages/MBDocEditor.tsx` — 新版编辑器页面
- `frontend/src/stores/mbdocStore.ts` — Zustand / Context 状态管理

**Files to modify:**
- `backend/app/api/v1/mbdoc.py` — 新增 `publish` / `copy-html` 端点
- `backend/app/api/v1/articles.py` / `backend/app/api/v1/publish.py` — 加 Deprecation 响应头
- `frontend/src/router.tsx` — 加 `/mbdoc-editor/:id` 路由
- `frontend/src/components/panel/ActionPanel.tsx` — "一键复制" / "推送草稿箱" 改调 MBDoc 端点
- `skill/mbeditor.skill.md` — 标记旧 API 为 DEPRECATED，新增"完整 Agent 工作流"章节

**Tasks:**
1. 分支 `stage-6/cli-agent-api`
2. 后端 `publish` + `copy-html` 端点 + 测试
3. 旧端点加 Deprecation 头（不改行为）
4. 前端 MBDoc store（Zustand，参考现有 store 模式）
5. 前端各 block editor 组件（6 个）
6. 前端 BlockList + BlockEditor 容器
7. 前端 MBDocEditor 页面（左侧 block 列表 + 右侧编辑区 + 预览 iframe 复用 Stage 0 的 WechatPreview）
8. 前端 ActionPanel 迁移
9. 端到端 Playwright 测试：打开编辑器 → 添加 block → 编辑 → 复制 → 剪贴板内容与 `render(upload_images=true)` 字节一致（除 src）
10. 更新 skill：完整 agent 工作流示例
11. 合并、标记完成

**DoD:**
- `POST /mbdoc/{id}/publish` 能把文档推到微信草稿箱（真机）
- `POST /mbdoc/{id}/copy-html` 返回的 HTML 在剪贴板里粘贴到微信后台效果正确
- 新 `/mbdoc-editor/:id` 页面可用，支持增删移动 block
- 旧 `/editor/:id` 页面仍可用但标记 deprecated（UI banner 提示）
- Playwright 端到端测试通过
- skill 描述的主流程全部基于 MBDoc

**工程量：** 1 人·周

---

## Stage 7: 真机验证 + 兼容性回归套件

**Goal:** 用真实测试公众号验证每种 block 在微信后台的真实表现，固化为可重放的回归测试套件。

**Architecture:**
- 建立 10 个代表性 MBDoc fixture（覆盖全部 7 种 block 类型）
- 自动化脚本 `scripts/verify-wechat.py`：
  1. 对每个 fixture 调 `/mbdoc/{id}/publish` 推到测试公众号
  2. 调用微信 `getdraft` API 读回 content
  3. diff 上传前 vs 读回后，标记被剥离的部分
  4. 生成 `docs/verification/YYYY-MM-DD/report.md`
- 手机真机截图归档（依赖测试人员）
- 3 个"秀米/135 交互"组件（翻页、轮播、展开）对照样本：用 MBEditor 栅格化方案重做 → 对比视觉差异
- 固化 `tests/golden/wechat-roundtrip.json`：每个 fixture 的 pre/post 字节 diff，未来回归时检测微信规则变化

**Files to create:**
- `tests/fixtures/wechat-samples/*.json` — 10 个 MBDoc
- `scripts/verify-wechat.py` — 自动化验证脚本
- `tests/golden/wechat-roundtrip.json` — 基线 diff 快照
- `tests/test_wechat_roundtrip.py` — CI 回归测试（离线对比快照）
- `docs/verification/2026-04-XX/report.md` — 第一次验证报告
- `docs/verification/2026-04-XX/screenshots/` — 手机截图
- `docs/verification/final-report.md` — block 能力矩阵总表

**Files to modify:**
- `skill/mbeditor.skill.md` — 新增"已验证可用/不可用"清单

**Tasks:**
1. 分支 `stage-7/validation`
2. 设计 10 个 fixture（每种 block 至少 1 个，含边界情况）
3. 写 `verify-wechat.py`（依赖真实测试公众号 AppID/Secret）
4. 跑一次完整验证，生成报告
5. 手机真机截图（人工）
6. 分析结果：每种 block 标"✅/⚠️/❌"
7. 把"秀米/135 样本"用栅格化方案重做，视觉 diff 对比
8. 固化 golden 快照
9. 写离线回归测试（不依赖真实公众号，仅对比 golden）
10. 更新 skill：block 能力矩阵 + 已知限制
11. 合并、标记完成

**DoD:**
- 10 个 fixture 每个都跑过真实 `publish → getdraft → diff` 流程
- 手机真机截图至少 5 个 fixture
- `docs/verification/final-report.md` 完成，含 block 能力矩阵
- CI 回归测试可运行（`pytest tests/test_wechat_roundtrip.py` 绿色）
- skill 新增 "已验证" 章节
- 每种 block 都有明确的"推荐/不推荐使用"决断

**工程量：** 1 人·周

---

## 合并所有 Stage 的最终产物清单

执行完 Stage 0-7 后，MBEditor 应具备：

**代码层面：**
- 后端 `render_for_wechat(doc, ctx)` 作为唯一的 HTML 生成入口
- 7 种 block 类型（heading / paragraph / markdown / html / image / svg / raster）全部可用
- 前端 block 化编辑器（左侧 block 列表 + 右侧 Monaco/可视化编辑 + iframe 预览）
- Playwright 栅格化 worker
- CLI/Agent 友好的 `/api/v1/mbdoc` API

**产品层面：**
- 所见即所得承诺：预览 = 复制 = 草稿箱（除图片 src 外字节一致）
- AI Agent 工作流：`POST /mbdoc` → `POST /mbdoc/{id}/publish` 一键发布
- 任意复杂视觉效果：用 raster block 兜底

**文档层面：**
- `skill/mbeditor.skill.md` 与真实 API 完全同步
- `docs/superpowers/plans/` 8 个 Stage 的详细实施记录
- `docs/research/` 4 份研究报告作为决策依据
- `docs/verification/final-report.md` 真机验收报告

**总工程量：** 9.5 人·周（全部 Stage）
