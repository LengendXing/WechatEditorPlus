# MBEditor WYSIWYG 架构重构 Roadmap

> **For agentic workers:** 此文档是**总览/路线图**，不是可执行计划。每个 Stage 都有自己独立的详细计划文件（见 §5）。执行时按 Stage 编号顺序推进，每完成一个 Stage 后才开始下一个 Stage 的详细计划细化。

**产品目标：** 让作者在 MBEditor 里设计的页面**100% 还原**到微信公众号后台，不论使用什么代码语言、结构、框架。

**核心架构：** Block 化文档模型 + 三层混合调度（HTML inline / SVG+SMIL / Playwright 栅格化），三条输出管线（预览 iframe / 一键复制 / 草稿箱）共享单一 `renderForWechat` 函数，保证字节级一致。

**优先级：** CLI/Agent 使用 > 程序员使用 > 运营者使用 > 组件库（本轮不做）

**当前违反产品目标的点：**
1. `sanitizeForWechatPreview` 在预览时二次清洗 HTML，产出 ≠ 复制 ≠ 草稿箱
2. `cleanMode` UI 开关让用户在"清洗预览"和"原始样式"间切换，把产品承诺变成二选一
3. 6 个所谓"SVG 模板"本质是 HTML checkbox hack（`<input>+<label>+<style>+:checked`），微信正文会把这 4 样全剥光
4. 后端 `_process_for_wechat` 与前端 `inliner.processForWechat` 维护两份 CSS 内联逻辑
5. 无 Block 抽象，`article` 是扁平的 `{html, css, js, markdown}`，无法表达"这一段走 HTML、那一段走 SVG、那一段走图片"

---

## 1. 产品形态（目标态）

### 1.1 文档模型 MBDoc

所有 MBEditor 文章都是一个 `MBDoc` JSON 对象，AI Agent 和 CLI 可以直接产出：

```json
{
  "version": "1",
  "id": "ac7f39652866",
  "meta": {
    "title": "MBEditor 功能全览",
    "author": "Anson",
    "digest": "首款支持 AI Agent 的公众号编辑器",
    "cover": "/images/cover.jpg"
  },
  "blocks": [
    { "id": "b1", "type": "heading", "level": 1, "text": "欢迎使用 MBEditor" },
    { "id": "b2", "type": "paragraph", "text": "这是一个段落。" },
    { "id": "b3", "type": "markdown", "source": "## 快速开始\n\n- 步骤 1\n- 步骤 2" },
    { "id": "b4", "type": "html", "source": "<section style=\"...\">自定义 HTML</section>" },
    { "id": "b5", "type": "image", "src": "/images/hero.png", "alt": "hero" },
    { "id": "b6", "type": "svg", "source": "<svg xmlns=\"...\" viewBox=\"0 0 580 200\">...</svg>" },
    { "id": "b7", "type": "raster", "html": "<div style=\"display:grid;...\">复杂 CSS</div>", "css": ".x{...}" }
  ]
}
```

### 1.2 Block 类型总览

| type | 源语言 | 渲染路径 | 适用场景 |
|---|---|---|---|
| `heading` | 纯数据 | HTML inline-style | 标题 |
| `paragraph` | 纯数据 | HTML inline-style | 正文段落 |
| `markdown` | Markdown 源 | marked → juice → inline HTML | 快速写长文本 |
| `html` | HTML 片段 | juice → inline HTML | 程序员精细控制 |
| `image` | URL + alt | 自建 CDN → 微信远程拉图 | 图片 |
| `svg` | SVG 源码 | 原样保留 | 装饰 / 图表 / SMIL 动画 |
| `raster` | HTML + CSS | Playwright 截图 → PNG → `<img>` | 高危视觉效果（grid/3D/animation） |

### 1.3 输出管线

所有 block 经过 `renderForWechat(doc, ctx)` 合并为最终 HTML：
- `ctx.uploadImages = false` → 预览 iframe（图片走本地 `/images/` 或 CDN）
- `ctx.uploadImages = true` → 一键复制 / 草稿箱（图片走 mmbiz.qpic.cn）

**不变量：** 两次调用结果的 diff 仅出现在 `<img src=...>` 属性上。

### 1.4 CLI/Agent 接口

```bash
# 创建文章
curl -X POST http://localhost:7072/api/v1/mbdoc -d @article.json

# 更新
curl -X PUT http://localhost:7072/api/v1/mbdoc/{id} -d @article.json

# 预览（返回 HTML 字符串）
curl -X POST http://localhost:7072/api/v1/mbdoc/{id}/render?uploadImages=false

# 推送草稿箱（执行图片上传 + Playwright 栅格化 + 微信 API）
curl -X POST http://localhost:7072/api/v1/mbdoc/{id}/publish
```

AI Agent 的工作流：`生成 MBDoc JSON` → `POST /mbdoc` → `POST /mbdoc/{id}/publish` → 完成。无需打开浏览器。

---

## 2. Stage 总览

| Stage | 主题 | 工程量 | 依赖 | 详细计划 |
|---|---|---|---|---|
| **Stage 0** | 管线清理 | 1 人·周 | 无 | ✅ 完成 (2026-04-11) |
| **Stage 1** | BlockRegistry + MBDoc schema | 2 人·周 | Stage 0 | ✅ 已细化 |
| **Stage 2** | HTML/Markdown Block 渲染器 | 1 人·周 | Stage 1 | ⏳ 骨架 |
| **Stage 3** | 图片管线（自建 CDN + 微信远程拉图） | 0.5 人·周 | Stage 1 | ⏳ 骨架 |
| **Stage 4** | SVG Block 渲染器 + Monaco SVG 子编辑器 | 1.5 人·周 | Stage 1 | ⏳ 骨架 |
| **Stage 5** | Playwright 栅格化 worker | 1.5 人·周 | Stage 1, Stage 3 | ⏳ 骨架 |
| **Stage 6** | CLI/Agent 友好 API 层 | 1 人·周 | Stage 1-5 | ⏳ 骨架 |
| **Stage 7** | 真机验证 + 兼容性回归套件 | 1 人·周 | 全部 | ⏳ 骨架 |
| **合计** | | **9.5 人·周** | | |

---

## 3. Stage 依赖拓扑

```
Stage 0: 清理
   │
   ▼
Stage 1: BlockRegistry + MBDoc schema  ◀── 架构基石
   │
   ├──▶ Stage 2: HTML/Markdown renderer
   │
   ├──▶ Stage 3: Image pipeline
   │       │
   │       ▼
   ├──▶ Stage 5: Rasterization worker  （依赖 Stage 3 的图片上传器）
   │
   ├──▶ Stage 4: SVG renderer
   │
   └──▶ Stage 6: CLI/Agent API  （依赖 2/3/4/5 的 renderer）
           │
           ▼
       Stage 7: 真机验证
```

**关键：** Stage 2/3/4/5 是**独立并行**的（都依赖 Stage 1），如果有多人开发可以并发推进。

---

## 4. 每个 Stage 的 Definition of Done

### Stage 0：管线清理（1 人·周）

**目标：** 把"违反产品目标的代码"全部清除，为 Stage 1 铺路。

**DoD：**
- [ ] `grep -rn "sanitizeForWechatPreview" frontend/` 返回 0 行
- [ ] `grep -rn "cleanMode\|normalizeImageStyles" frontend/src/components/preview/` 返回 0 行
- [ ] `frontend/src/utils/wechatSanitizer.ts` 已删除
- [ ] `frontend/src/utils/svg-templates.ts` 已删除（6 个 HTML-hack 模板下线）
- [ ] `frontend/src/hooks/useClipboard.ts` 中的 `copyRichText` 已删除（死代码）
- [ ] `frontend/src/utils/inliner.ts` 中的 `processForWechat` 已删除（死代码）
- [ ] 后端 `_process_for_wechat` 的正则清洗规则中，删除不属于"剥离微信不支持标签"范畴的规则（display:grid→block、animation 删除、absolute 删除这些属于"清洗下游"反例）
- [ ] 后端 pytest 框架跑通一个冒烟测试
- [ ] 前端 vitest 框架跑通一个冒烟测试
- [ ] 所有现有 API 端点行为仍正常（预览/复制/推送草稿箱走旧管线能跑通）
- [ ] 提交信息：`refactor: clean up wechat pipeline dead code`

**详细计划：** `docs/superpowers/plans/2026-04-11-stage-0-pipeline-cleanup.md`

---

### Stage 1：BlockRegistry + MBDoc schema（2 人·周）

**目标：** 引入 Block 化文档模型，新增 MBDoc 存储，BlockRegistry 框架，`renderForWechat(doc, ctx)` 单一入口函数。**保留旧的 `/articles` API 平行运行**，直到 Stage 6 迁移完成。

**DoD：**
- [ ] `backend/app/models/mbdoc.py` 定义 Pydantic `MBDoc`、`Block` 基类、具体 block 类型
- [ ] `backend/app/services/block_registry.py` 提供 block 注册/查找、三个 renderer 接口
- [ ] `backend/app/services/render_for_wechat.py` 提供 `render_for_wechat(doc, ctx)` 单一入口
- [ ] `backend/app/api/v1/mbdoc.py` 提供 CRUD + render 端点
- [ ] 存储在 `data/mbdocs/{id}.json`（类似现有 `data/articles/`）
- [ ] 单元测试：同一 `MBDoc` 调两次 `render_for_wechat`（`uploadImages=true/false`），diff 仅在 `<img src>` 属性
- [ ] 单元测试：BlockRegistry 对未知 type 的 block 抛可读错误
- [ ] 端到端测试：`POST /mbdoc` → `GET /mbdoc/{id}` → `POST /mbdoc/{id}/render` 闭环
- [ ] 旧的 `/articles` 和 `/publish/*` 端点**不受影响**（Stage 1 不迁移）
- [ ] 文档 `docs/api/mbdoc.md` 说明 MBDoc schema 和端点

**详细计划：** `docs/superpowers/plans/2026-04-11-stage-1-block-registry.md`

---

### Stage 2：HTML/Markdown Block 渲染器（1 人·周）

**目标：** 实现 `heading` / `paragraph` / `html` / `markdown` 四种 block 的 renderer，保证 preview ≡ content（除图片外）。

**DoD：**
- [ ] `backend/app/services/renderers/html_renderer.py` 实现 4 种 block 的 `render` 方法
- [ ] Markdown 渲染走 `markdown-it-py` 或 `mistune`（后端 Python 实现，不依赖前端 marked）
- [ ] 所有 block 产出的 HTML 都已 inline style（不含 `<style>/<script>/<link>`）
- [ ] CSS 内联走后端 premailer（复用现有依赖）
- [ ] 单元测试：每种 block 输入 5 个典型样本，产出 HTML snapshot 对比
- [ ] 单元测试：`<h1>Hello</h1>` 经过 renderer 后 `<h1 style="...">Hello</h1>` 且 style 非空
- [ ] 集成测试：一个包含 4 种 block 的完整 MBDoc 渲染结果在浏览器里渲染正常

---

### Stage 3：图片管线（0.5 人·周）

**目标：** 实现 `image` block 的 renderer，提供图片上传到自建 CDN 的接口，发布时使用"微信远程拉图"策略（模仿 mdnice）。

**DoD：**
- [ ] `backend/app/services/renderers/image_renderer.py` 实现 `image` block renderer
- [ ] `POST /api/v1/images` 接受上传，存储在 `data/images/`，返回 `{url, sha256}`
- [ ] 图片去重：同 sha256 不重复存储
- [ ] `uploadImages=true` 分支：检测 src 是否在 mmbiz.qpic.cn → 如不是则调 `wechat_service.upload_image_to_cdn` 上传并替换 src
- [ ] `uploadImages=false` 分支：原样保留 src（指向本地 `/images/`）
- [ ] 单元测试：本地图片 → 上传返回新 URL；mmbiz URL → 跳过
- [ ] 单元测试：上传失败抛错不静默降级

---

### Stage 4：SVG Block 渲染器 + Monaco SVG 子编辑器（1.5 人·周）

**目标：** 实现 `svg` block 的 renderer，前端提供 Monaco SVG 代码编辑器（CLI/Agent/程序员优先），支持 SMIL 动画白名单校验。

**DoD：**
- [ ] `backend/app/services/renderers/svg_renderer.py` 实现 `svg` block renderer
- [ ] 后端 SVG 校验器：检查白名单内的标签与属性，拒绝 `<script>`、`onclick`、`id` 属性（基于 Stage 2 调研结论 `docs/research/wechat-svg-capability.md`）
- [ ] 前端 `frontend/src/components/editor/SvgBlockEditor.tsx`：Monaco 编辑器实例，language="xml"，右侧实时预览
- [ ] 前端校验与后端一致（共用白名单 JSON `backend/app/data/svg_whitelist.json`）
- [ ] 单元测试：合法 SVG 通过；含 `<script>` 的 SVG 拒绝；含 `id="x"` 的 SVG 拒绝；`<animate begin="click">` 通过
- [ ] 集成测试：在前端插入一个 SVG block，iframe 预览可见，渲染到微信草稿箱 content 保持原样

---

### Stage 5：Playwright 栅格化 worker（1.5 人·周）

**目标：** 实现 `raster` block 的 renderer，通过 Playwright 服务端渲染 HTML + CSS 到 PNG，上传到 CDN，content 里用 `<img>` 引用。

**DoD：**
- [ ] 后端 Docker 镜像加入 `playwright` + `fonts-noto-cjk`
- [ ] `backend/app/services/renderers/raster_renderer.py` 提供 `render_raster_block(block, ctx) → final_html`
- [ ] Playwright worker：启动 headless Chromium → `page.setContent(wrappedHTML)` → `page.screenshot({fullPage: true, type: 'png'})` → 返回 bytes
- [ ] 栅格化结果 sha256 缓存：同内容不重复渲染
- [ ] 单元测试：合法 HTML+CSS 返回非空 PNG bytes
- [ ] 单元测试：缓存命中不触发 Playwright
- [ ] 集成测试：一个 `display:grid` 的 block 被栅格化为 PNG，上传后 content 里是 `<img src="https://mmbiz.qpic.cn/...">`
- [ ] 性能测试：5 个 raster block 并发栅格化总时间 < 10s（本地开发机）

---

### Stage 6：CLI/Agent 友好 API 层（1 人·周）

**目标：** 在 Stage 1-5 的基础上，提供 AI Agent / CLI 的最小化调用面，并实现"一键复制"和"推送草稿箱"走同一条 `renderForWechat` 管线。

**DoD：**
- [ ] `POST /api/v1/mbdoc` / `PUT /api/v1/mbdoc/{id}` / `DELETE /api/v1/mbdoc/{id}` / `GET /api/v1/mbdoc/{id}` 全部打通
- [ ] `POST /api/v1/mbdoc/{id}/render?uploadImages=false|true` 返回渲染好的 HTML
- [ ] `POST /api/v1/mbdoc/{id}/publish` 触发 `uploadImages=true` → 草稿箱
- [ ] 旧 `/articles` 和 `/publish/*` 端点**标记 deprecated**（加响应头 `Deprecation: true`）
- [ ] 旧 Editor 页面 `frontend/src/pages/Editor.tsx` 重构为基于 MBDoc 的 block 化界面
- [ ] "一键复制" 按钮从 `mbdoc/{id}/render?uploadImages=true` 的结果写入剪贴板
- [ ] "推送草稿箱" 按钮调用 `mbdoc/{id}/publish`
- [ ] 端到端测试：Playwright 打开编辑器 → 编辑 → 复制 → 剪贴板内容与 render 接口返回字节级一致（除 src）
- [ ] CLI 文档 `docs/cli/agent-guide.md` 含 3 个典型 curl 示例

---

### Stage 7：真机验证 + 兼容性回归套件（1 人·周）

**目标：** 用真实测试公众号验证每种 block 在微信后台的实际表现，固化为回归测试集。

**DoD：**
- [ ] 建立 `tests/fixtures/wechat-samples/` 存放 10 个代表性 MBDoc 样本（每种 block 至少 1 个）
- [ ] 对每个样本：`render → draft/add → getdraft → diff` 检查微信是否保留
- [ ] 回读 diff 记录为 `tests/golden/wechat-roundtrip.json`
- [ ] 自动化脚本 `scripts/verify-wechat.py` 支持一键跑完整验证流程
- [ ] 手机真机截图 10 个样本的渲染结果，归档 `docs/verification/2026-04-XX/`
- [ ] 3 个已知"秀米/135 交互"样本栅格化输出对比（证明我们的栅格化方案不输竞品）
- [ ] 验收报告 `docs/verification/final-report.md`：每个 block 类型的最终可用性评级

---

## 5. 详细计划清单

| 文件 | 状态 |
|---|---|
| `2026-04-11-mbeditor-wysiwyg-roadmap.md` | ✅ 本文件 |
| `2026-04-11-stage-0-pipeline-cleanup.md` | ✅ 已细化（TDD step 级） |
| `2026-04-11-stage-1-block-registry.md` | ✅ 已细化（TDD step 级） |
| `2026-04-11-stage-2-html-markdown-renderer.md` | ⏳ 骨架（待 Stage 1 落地后细化） |
| `2026-04-11-stage-3-image-pipeline.md` | ⏳ 骨架 |
| `2026-04-11-stage-4-svg-renderer.md` | ⏳ 骨架 |
| `2026-04-11-stage-5-raster-worker.md` | ⏳ 骨架 |
| `2026-04-11-stage-6-cli-agent-api.md` | ⏳ 骨架 |
| `2026-04-11-stage-7-validation.md` | ⏳ 骨架 |

**骨架文件**只含：Stage 目标、文件结构、任务列表（不含 step 级代码）。等 Stage 0 和 Stage 1 落地后，根据实际 API 形状依次细化 Stage 2-7。

---

## 6. 关键研究报告索引

所有规划决策背后的事实依据：
- `docs/research/wechat-wysiwyg-pipeline.md` — 现有三管线分岔的审计
- `docs/research/wechat-svg-capability.md` — SVG 能力白名单（决定 Stage 4 的设计空间）
- `docs/research/html-to-svg-compilation.md` — Satori / Playwright 栅格化评估（决定 Stage 5 用 Playwright）
- `docs/research/wechat-editor-competitors.md` — doocs/md / mdnice / 秀米 / 135 / 壹伴拆解（决定 Stage 2 抄 doocs 管线、Stage 3 抄 mdnice 图片策略）

---

## 7. Agent Skill 演进（横切交付物）

MBEditor 的定位是"**AI Agent 原生**的微信公众号编辑器"，因此 `skill/mbeditor.skill.md` 是**一等交付物**，必须随每个 Stage 同步演进。开发过程中遵循规则：

**规则 A：每个 Stage 的 DoD 都必须包含 skill 更新任务。** 没更新 skill 的 Stage 不算完成。

**规则 B：skill 描述的 API 必须是"当前真实可用"的。** 禁止把未开发完的接口写进 skill，也禁止把已 deprecate 的接口继续留在"推荐用法"。

**规则 C：skill 里每个 API 示例必须有真实可执行的 curl 命令。** 禁止伪代码、TODO、"...省略"。

### skill 演进路径

| Stage | skill 章节变更 |
|---|---|
| Stage 0 | 删除"内置交互组件"整节（6 个 HTML-hack 模板下线，研究已证明微信会剥光）。在"HTML 模式兼容规则"加上警告横幅："以下规则为旧 `/articles` API 所用，新项目请等待 MBDoc API 上线"。 |
| Stage 1 | 新增"MBDoc 文档模型"章节，含 schema、block type 列表、`POST /mbdoc` / `GET /mbdoc/{id}` / `POST /mbdoc/{id}/render` 示例。旧 `/articles` 章节保留但标记 "(legacy, 将在 Stage 6 移除)"。 |
| Stage 2 | 新增 `heading` / `paragraph` / `html` / `markdown` block 的完整样例，每个至少 1 个 curl。 |
| Stage 3 | 新增"图片管线"章节：`POST /images` 上传流程 + `image` block 样例 + "自建 CDN 与微信远程拉图"的原理说明。 |
| Stage 4 | 新增"SVG Block"章节：白名单表格（从 `docs/research/wechat-svg-capability.md` 摘取）+ SMIL begin 事件说明 + 3 个可直接套用的 SVG 样例（分隔线、图标、点击展开图形）。**加粗警告：绝对不要用 `id=` / `<script>` / `onclick`。** |
| Stage 5 | 新增"Raster Block"章节：适用场景（grid / 3D / animation / 复杂背景）+ 性能警告（每个 raster block 增加 2-3 秒发布时间）+ 样例 + "优先尝试 SVG 或 HTML，raster 是兜底" 的决策树。 |
| Stage 6 | 标记旧 `/articles` 和 `/publish/*` 整节为 **DEPRECATED**，给出迁移路径。新增"Agent 典型工作流"章节，含端到端 curl 脚本（MBDoc JSON → publish → 草稿箱）。 |
| Stage 7 | 新增"已验证可用 / 已知不可用"清单（基于真机测试结果），每个 block type 标注"✅ 可用"/"⚠️ 部分可用"/"❌ 不可用"。 |

### skill 变更的提交约定

每个 Stage 更新 skill 时提交信息格式：
```
docs(skill): stage N — <变更摘要>
```

例：`docs(skill): stage 0 — remove deprecated 6 interactive templates`

---

## 8. 本轮不做的事（显式声明）

以下是被明确排除的范围，避免 scope creep：

- ❌ **组件库 / 可视化 SVG 画布**：用户明确表示"组件库暂时不用"。Stage 4 仅提供 Monaco SVG 源码编辑器。
- ❌ **Tiptap 所见即所得富文本编辑**：现有 `WechatTiptapEditor.tsx` 不动；Block 化编辑在 Stage 6 通过"块列表 + 每块独立 Monaco"实现。
- ❌ **多用户 / 权限 / 协作**：单用户单机假设。
- ❌ **版本历史 / 回滚**：Stage 1 的 MBDoc 存储是平铺覆盖式的。
- ❌ **SVG 转 PNG 再上传**：SVG block 直接原样保留。若真机验证失败再回到这里。
- ❌ **迁移现有 articles 数据到 MBDoc 格式**：旧数据保持在旧 API，不做自动转换。
