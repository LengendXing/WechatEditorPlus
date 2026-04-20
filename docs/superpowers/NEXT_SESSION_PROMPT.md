# 下一个 Session 启动指令

> 把下面 **「复制到新 session」** 章节里的内容完整粘贴到新开的 Claude Code session 里，即可无缝续接 MBEditor WYSIWYG 重构。

---

## 当前项目状态（2026-04-11 session 2 结束）

- ✅ **Stage 0 完成并 push 到 origin/main**（14 commit，最末 SHA `31022de`）
- ✅ **Stage 1 后端完成并本地合并到 main**（11 commit，最末 SHA `dadde2e`，**未 push**）
  - MBDoc Pydantic schema（含 path traversal + src scheme + uniqueness 安全 validator）
  - BlockRegistry + RenderContext + HeadingRenderer + ParagraphRenderer + StubRenderer
  - `render_for_wechat` 单一入口函数（WYSIWYG 不变量测试通过）
  - MBDocStorage 文件存储 + `/api/v1/mbdoc` CRUD + render 端点（79 后端测试全绿）
  - skill/mbeditor.skill.md 新增 MBDoc 章节
- ⏳ **Task 10 + Task 11 未执行**（Playwright 视觉一致性基础设施 + baseline 测试）
  - 这是 Stage 1 真正达成"编辑器↔公众号视觉一致"产品目标的部分
  - session 2 做完后端骨架后把这两个 Task 延到了新 session
- 📋 **Stage 2-7 骨架已写**（Stage 2 起依赖 Task 10 基础设施）

---

## 🚀 复制到新 session 的启动 prompt

```
我要继续 MBEditor 的 WYSIWYG 重构工作。当前要做 Stage 1 剩余的 Task 10 + Task 11（Playwright 视觉一致性基础设施 + baseline 测试）。

## 环境确认
cd D:/Web/MBEditor
git status  # 应干净
git branch --show-current  # 应在 main
git log --oneline -5  # 最上面应该是 dadde2e docs(handoff): session 2 ...

## 读协调文档（按顺序）
1. docs/superpowers/SESSION_HANDOFF.md — 当前状态 + Stage 1 完成证据
2. docs/superpowers/MULTI_SESSION_ORCHESTRATION.md — 多 session 协议
3. skill/mbeditor.skill.md — 新增的 MBDoc 章节（了解 API 形态）
4. 用户记忆文件（自动加载）：
   - feedback_mbeditor_visual_parity.md — 唯一验收标准 = 视觉一致性
   - feedback_no_midway_checkpoints.md — 长任务一把跑完，不 checkpoint
   - project_wechat_test_account.md — WeChat 测试账号，secret 在 data/config.json

## 不变量检查
按 SESSION_HANDOFF.md §"不变量" 跑 7 条，任何一条红色 = 先修复。
额外加：cd backend && python -m pytest -q 应该 79/79 绿。

## 启动 Task 10 + Task 11

**Task 10：Playwright 视觉一致性基础设施**

创建 backend/tests/visual/ 目录与基础设施，必须实现：
1. `render_mbdoc_to_screenshot(doc: MBDoc) -> Path`：把 MBDoc 经 render_for_wechat 产出的 HTML 写进一个简单 wrapper 页面（模拟 MBEditor 预览 iframe 的 chrome：375px 宽、PingFang 字体、line-height 1.8），用 headless Chromium 截图，返回图片路径。
2. `push_mbdoc_to_wechat_draft(doc: MBDoc) -> str`：走现有 wechat_service（读 data/config.json 凭证），推送草稿并返回 media_id。
3. `screenshot_wechat_draft(media_id: str) -> Path`：Playwright 登录 mp.weixin.qq.com 后台（cookie 持久化到 backend/tests/visual/.auth/state.json），打开对应草稿的预览页面，截图。
   - 首次运行：交互式打开浏览器，引导用户扫码登录，保存 storage state
   - 后续运行：直接加载 storage state，cookie 失效时报错提醒用户重新扫码
4. `diff_images(a: Path, b: Path, tolerance: float = 0.005) -> dict`：像素级 diff（pixelmatch 或 PIL），返回 {diff_pct, diff_image_path}
5. `diff_dom(html_a: str, html_b: str) -> dict`：忽略 noise 属性（data-*, id, src query string）后的语义 DOM diff
6. README 说明首次扫码登录流程

依赖：playwright (pip install playwright && playwright install chromium)、pillow 或 pixelmatch

**Task 11：baseline 视觉测试**

1. 在 backend/tests/visual/test_baseline.py 写一个测试，用一个纯 heading+paragraph 的 MBDoc（包含 h1-h6 + 3 段 p）
2. 编辑器截图 A = render_mbdoc_to_screenshot(doc)
3. 推送草稿 → 截图 B = screenshot_wechat_draft(media_id)
4. 断言 diff_images(A, B) 的 diff_pct < 0.5%，失败时把 diff 图写到 backend/tests/visual/_artifacts/
5. 如果对不上：
   - 研究 135editor / 秀米复制到公众号的 HTML 产物作为参考（用 Playwright 实际打开 135editor.com 和 xiumi.us 看看）
   - 调整 HeadingRenderer/ParagraphRenderer 的 inline style 直到视觉一致
   - 如果差异是微信服务端强制行为（例如强制字体族、强制行距），记录到 docs/research/RESEARCH_CORRECTIONS.md 并在测试里加容忍

## 执行方式
- 使用 superpowers:subagent-driven-development 一个 Task 一个 Task 推进
- 每个 Task 派 implementer → spec reviewer → quality reviewer
- 前端视觉相关使用 sonnet 模型（需要判断）
- Task 10 完成后 commit: feat(visual): playwright editor↔wechat visual parity infrastructure
- Task 11 完成后 commit: test(visual): baseline heading+paragraph visual parity test
- 不要跳到 Stage 2

## Task 10/11 的 DoD
- [ ] backend/tests/visual/ 基础设施到位
- [ ] 首次扫码登录流程有文档
- [ ] baseline 测试跑起来：编辑器截图 A vs 草稿截图 B diff_pct < 0.5%
- [ ] 如果达不到 0.5%：记录差异根因到 RESEARCH_CORRECTIONS.md 并调整容忍阈值
- [ ] merge 到 main 但不 push（等用户明示同意）
- [ ] 更新 SESSION_HANDOFF.md 标记 Stage 1 真正完成

## 如果中途被打断
立即更新 docs/superpowers/SESSION_HANDOFF.md §"断点恢复"，记录最后完成的子任务和卡点。

## 不要做的事
- 不要 push（push 需用户明示同意）
- 不要跳到 Stage 2（Task 10/11 是 Stage 1 的真正完成条件）
- 不要在 git 跟踪文件里暴露 wechat secret
- 不要把扫码登录 state 文件 commit（把 backend/tests/visual/.auth/ 加进 .gitignore）

开始吧。第一步：环境确认 + 不变量检查。
```

---

## 📍 session 2 的关键交付物速查

| 文件 | 作用 |
|---|---|
| `backend/app/models/mbdoc.py` | MBDoc Pydantic schema，7 种 block 类型，3 个安全 validator |
| `backend/app/services/block_registry.py` | BlockRegistry + RenderContext + default() factory |
| `backend/app/services/render_for_wechat.py` | 单一渲染入口 |
| `backend/app/services/renderers/heading_paragraph.py` | H1-H6 + P 的最小 inline-styled renderer（session 3 可能要调样式） |
| `backend/app/services/mbdoc_storage.py` | 文件存储 |
| `backend/app/api/v1/mbdoc.py` | REST 端点 |
| `data/config.json` | WeChat 测试账号凭证（**gitignored**） |
| `skill/mbeditor.skill.md` | MBDoc 章节已加 |

## ⚠️ 给 session 3 的提醒

1. **Stage 1 后端已本地合并到 main 但未 push。** session 3 可能需要先问用户是否要 push（或者合并到 Task 10/11 成果后一起 push）。
2. **heading/paragraph 的 inline style 是拍脑袋写的**，没有和真实公众号比对过。session 3 的 Task 11 很可能需要调整这两个 renderer 的样式常量（`_HEADING_STYLES` 字典和 `_PARAGRAPH_STYLE` 常量），让视觉对得上。这是符合预期的，不是 bug 修复。
3. **Playwright 登录 mp.weixin.qq.com 首次需要用户扫码。** 不要 headless 跑第一次；要用 `headed=True` 让用户看到二维码。之后 storage state 可以跨运行复用。
4. **微信服务端已知会剥离 `position:relative` 但保留 `position:absolute`**（研究报告结论），这不是我们的 bug，如果 baseline 测试撞到这个限制，写进 RESEARCH_CORRECTIONS.md 并接受。

---

_本文件由 session 2 更新，供 session 3 续接使用。Task 10/11 完成后，session 3 应该把本文件更新为 Stage 2 的启动指令。_
