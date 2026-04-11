# MBEditor 多 Session 开发协调 — 当前状态

> **这是整个 MBEditor WYSIWYG 重构的"活文档"。每个 session 启动时先读这个文件，结束时更新这个文件。**
>
> 更新规则：
> - 完成任何 Stage / Task 后必须更新本文件
> - 本文件是 session-to-session 的**唯一真相来源**
> - 本文件归属 git 跟踪（不在 .gitignore 里），提交信息格式 `docs(handoff): session N — <摘要>`

---

## 🎯 项目北极星

**产品承诺：** 作者在 MBEditor 里设计的页面，复制或推送后在微信公众号后台**100% 还原**。不论用户用什么 HTML/CSS/SVG/栅格化手段。

**参考资料（按优先级）：**
1. `docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md` — 8 个 Stage 的总览 + 依赖图 + DoD
2. `docs/superpowers/plans/2026-04-11-stages-2-to-7-skeleton.md` — 每个未开始 Stage 的骨架
3. `docs/research/*.md` — 4 份决策依据（微信 SVG 能力、竞品拆解、html→svg 评估、管线审计）
4. `skill/mbeditor.skill.md` — 一等交付物，随每个 Stage 演进
5. `docs/superpowers/plans/2026-04-11-stage-N-*.md` — 每个 Stage 的详细 TDD 计划

---

## 📊 当前进度

| Stage | 主题 | 工程量 | 状态 | 完成日期 | 详细计划 |
|---|---|---|---|---|---|
| **Stage 0** | 管线清理 | 1 人·周 | ✅ 已完成 | 2026-04-11 | `2026-04-11-stage-0-pipeline-cleanup.md` |
| **Stage 1** | BlockRegistry + MBDoc schema | 2 人·周 | ✅ 已完成 | 2026-04-11 | `2026-04-11-stage-1-block-registry.md` |
| **Stage 2** | HTML/Markdown renderer | 1 人·周 | ⏳ 骨架待细化 | — | 骨架章节 |
| **Stage 3** | 图片管线 | 0.5 人·周 | ⏳ 骨架待细化 | — | 骨架章节 |
| **Stage 4** | SVG renderer + Monaco 子编辑器 | 1.5 人·周 | ⏳ 骨架待细化 | — | 骨架章节 |
| **Stage 5** | Playwright 栅格化 worker | 1.5 人·周 | ⏳ 骨架待细化 | — | 骨架章节 |
| **Stage 6** | CLI/Agent API + 前端迁移 | 1 人·周 | ⏳ 骨架待细化 | — | 骨架章节 |
| **Stage 7** | 真机验证 + 回归套件 | 1 人·周 | ⏳ 骨架待细化 | — | 骨架章节 |

**总进度：** 2/8 Stage 完成 ≈ **31.5%**（按工程量权重）

---

## 🔥 Stage 0 收尾状态（2026-04-11 19:30）

**14 个 commit 已 push 到 `origin/main`（最末 SHA `31022de`）。**

**产出清单：**
- Backend: pytest 基础设施 + `_sanitize_for_wechat` 收敛（-169 行）
- Frontend: vitest 基础设施 + `WechatPreview` 重写（删除 cleanMode）+ 死代码清理（`wechatSanitizer.ts`/`svg-templates.ts`/`SvgTemplatePanel.tsx`/`processForWechat`/`copyRichText` 全部删除）
- Skill: 加入"设计决策树 + HTML/SVG/Raster 分层规范 + 已下线组件警告"
- 真机 smoke test：MBEditor → 一键复制 → 微信公众号后台粘贴 → 保存草稿的完整链路 10/11 契约验证通过

**Stage 0 已知遗留（Stage 1 必须处理）：**
1. **`_WECHAT_BASE_CSS` 强制 img 加 `border-radius:8px`** — `backend/app/api/v1/publish.py:27`，违反 HC-6 反模式，Stage 1 `BlockRegistry.ImageRenderer` 需要替换掉这行 CSS 注入。
2. **微信服务端剥离 `position:relative` 保留 `position:absolute`** — 微信原生限制，不是我们的代码问题。Stage 1+ 需要在 `SvgRenderer` 或 `RasterRenderer` 里提供替代方案（如把含 relative+absolute 的组合块走栅格化）。
3. **`_inline_css` 仍然存在且注入 `wechat-root` wrapper** — Stage 1 会被统一的 `render_for_wechat(doc, ctx)` 替代。

**Stage 0 代码审查中累积的 Minor 遗留（非阻塞）：**
- `<input>` bare form 和 `data-*` 单引号不被 `_sanitize_for_wechat` 剥离
- smoke test 的 `mod.default.toString()` grep 检测在 minify 后会脆弱

---

## 🚀 下一个 Session 要做什么

### 选项 A（推荐）：Stage 1 视觉一致性基础设施 — Task 10 + Task 11

Stage 1 后端骨架已经完成（MBDoc schema + BlockRegistry + render_for_wechat + /api/v1/mbdoc CRUD），但**视觉一致性验证还没开始**。用户在 session 2 明确要求：所有测试的唯一判据 = 编辑器 ↔ 公众号草稿视觉一致性，必须用 Playwright 自动化到人眼无差别为止。

Task 10 和 Task 11 是 Stage 1 的扩展任务（未写入原始 plan，在 TaskList 里已列）：
- **Task 10：** 搭建 Playwright 视觉一致性基础设施（`backend/tests/visual/`），能做到：
  - 渲染 MBDoc → headless Chromium 截图 A
  - 调用 `wechat_service.create_draft` 推送草稿
  - Playwright 登录 mp.weixin.qq.com（cookie 持久化，首次扫码）→ 截图草稿预览 B
  - 像素 diff + 语义 DOM diff 帮助函数
  - 凭证从 `data/config.json` 读（已配置 MB科技测试号）
- **Task 11：** 第一个 baseline 测试 —— 纯标题+段落的 MBDoc，走 Task 10 的管线对比 A/B。迭代 HeadingRenderer/ParagraphRenderer 的样式，直到人眼无差别或记录微信强制行为到 `docs/research/RESEARCH_CORRECTIONS.md`。

**启动方式：**
```
读 docs/superpowers/SESSION_HANDOFF.md 了解当前状态。
执行 Task 10（Playwright 视觉一致性基础设施）和 Task 11（baseline 视觉测试），
这两个 Task 已在 TaskList 里。
遵守 docs/superpowers/MULTI_SESSION_ORCHESTRATION.md。
研究 135editor / 秀米的公众号复制产物作为参考。
```

### 选项 B：启动 Stage 2（HTML/Markdown renderer）

如果暂时不想处理真机登录环节，可以先用 headless Chromium 做"编辑器预览 vs 后端 render HTML 截图"的半截测试，然后推进 Stage 2 实装 markdown/html block 的真实渲染器。Stage 2 完成后再补完整视觉回路。

**前提：** 建议 Task 10/11 先做，避免 Stage 2-5 多个 renderer 都做完才发现对不上公众号。

### 选项 C：新开 worktree 并行开发 Stage 2/3/4

Stage 1 后端已合并，Stage 2/3/4 都只依赖 Stage 1，理论上可以三路并行。但由于尚未建立视觉一致性基础设施（Task 10），每个 worktree 可能重复造 Playwright 轮子。**不推荐在 Task 10 之前启动。**

---

## 🧠 Session Handoff 协议

**每个 session 开始时：**
1. 读本文件
2. 读"下一个 session 要做什么"章节
3. 读对应 Stage 的详细计划
4. 启动 superpowers:subagent-driven-development

**每个 session 结束前（无论完成了多少）：**
1. 更新本文件 §"当前进度"表格
2. 更新本文件 §"下一个 Session 要做什么"章节为真正的下一步
3. 如果中途断点，在本文件底部 `⏸️ 断点恢复` 章节记录：
   - 最后一个完成的 Task 是哪个
   - 未完成的 Task 的具体卡点
   - 任何需要人类决策的问题
4. 提交本文件 `git commit -m "docs(handoff): session N — <摘要>"`

**在 session 内部，每个 Task 完成后：**
1. TaskUpdate 标记完成
2. commit（subagent 内部已自动 commit）
3. 继续下一个 Task（不写入 handoff 文件，避免噪音）

只有 **Stage 级别的状态变化** 才写入 handoff。Task 级别用 TaskList/TaskUpdate 追踪。

---

## ⏸️ 断点恢复（当前为空）

_当前无断点。Stage 0 完整完成。Stage 1 未启动。_

---

## 🛡️ 不变量（每次 session 都必须重新确认）

- [I-1] `grep -rn "sanitizeForWechatPreview\|normalizeImageStyles\|cleanMode" frontend/src/components/preview/WechatPreview.tsx` = 0
- [I-2] `grep -rn "svg-templates\|SvgTemplatePanel" frontend/src/` = 0
- [I-3] `ls frontend/src/utils/wechatSanitizer.ts` → 不存在
- [I-4] `cd backend && pytest -q` → 10/10 绿
- [I-5] `cd frontend && npm test` → 7/7 绿
- [I-6] `cd frontend && npm run build` → 绿
- [I-7] `curl http://localhost:7072/healthz` → `{"status":"ok"}`（需 docker-compose up）

**执行 Stage N 前先跑这 7 条。任何一条红色 = 环境被破坏，不要继续开发，先修复。**

---

## 📞 紧急情况

**"我不知道当前在哪里"** → 按顺序读：
1. 本文件（SESSION_HANDOFF.md）
2. `docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md`
3. `git log --oneline -20`

**"Stage 0 有回归"** → 对照 §"不变量"清单跑 grep，找到违反的那条 → 回滚对应 commit。

**"两个 session 同时改了同一个文件"** → 看 `MULTI_SESSION_ORCHESTRATION.md` §"冲突解决"。

**"不确定要不要 push"** → 规则：`main` 分支本地自由 commit，push 需要用户明示同意。如果不确定，**先问**。

---

## 📜 变更日志

| 日期 | Session | 事件 |
|---|---|---|
| 2026-04-11 | #1 | Stage 0 启动并完成。14 commit 已 push。创建多 session 协调框架。|
| 2026-04-11 | #2 | Stage 1 后端完成（Task 1-9）：MBDoc schema + BlockRegistry + render_for_wechat + /api/v1/mbdoc CRUD + skill 更新。两阶段 review 协议，8 个 feature commit + 1 个 fix commit（path traversal / src scheme / 唯一性 validator）+ merge commit。79 后端测试全绿，7 前端测试全绿，build 绿。Task 10（Playwright 视觉一致性基础设施）和 Task 11（baseline 视觉测试）留给下一个 session。用户提供 MB科技测试公众号凭证（存 data/config.json，gitignored）。**本地合并到 main，未 push。**|
