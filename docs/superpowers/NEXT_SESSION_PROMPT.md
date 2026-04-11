# 下一个 Session 启动指令

> 把下面 **「复制到新 session」** 章节里的内容完整粘贴到新开的 Claude Code session 里，即可无缝续接 MBEditor WYSIWYG 重构。

---

## 当前项目状态（2026-04-11）

- ✅ **Stage 0 完成并 push 到 origin/main**（14 commit，最末 SHA `31022de`）
- ⏳ **Stage 1 未启动**（BlockRegistry + MBDoc schema）
- 📋 **Stage 2-7 骨架已写**（等 Stage 1 完成后细化）

## 🚀 复制到新 session 的启动 prompt

```
我要继续 MBEditor 的 WYSIWYG 重构工作。请按以下顺序执行：

## 环境确认
cd D:/Web/MBEditor
git status  # 应该是干净的
git branch --show-current  # 应该在 main
git log --oneline -5  # 应该看到 31022de feat: stage 0

## 读协调文档（按顺序）
1. docs/superpowers/SESSION_HANDOFF.md — 当前项目状态 + 下一步
2. docs/superpowers/MULTI_SESSION_ORCHESTRATION.md — 多 session 协议
3. docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md §2 — Stage 总览表

## 跑不变量检查
执行 SESSION_HANDOFF.md §"不变量" 里的 7 条检查命令。任何一条红色 = 先修复，不要推进。

## 启动 Stage 1
Stage 1 是 BlockRegistry + MBDoc schema + /api/v1/mbdoc CRUD 端点。
- 详细计划：docs/superpowers/plans/2026-04-11-stage-1-block-registry.md
- 9 个 Task，TDD 流程完整细化
- 使用 superpowers:subagent-driven-development skill 执行

执行时请遵守：
- 先创建 stage-1/block-registry 分支
- 每个 Task 派 implementer subagent → spec reviewer → code quality reviewer
- Important issues 必须 fix 后重新 review
- 每完成一个 Task 后 TaskUpdate 标记
- Task 粒度用 sonnet 模型；reviewer 用 sonnet；简单机械任务可以降级到 haiku

## Stage 1 完成条件（DoD）
- [ ] POST /api/v1/mbdoc + GET/PUT/DELETE + LIST 全通
- [ ] POST /api/v1/mbdoc/{id}/render 返回 HTML
- [ ] 核心单元测试：同一 MBDoc 两次 render 的 diff 只在 <img src> 属性
- [ ] 端到端测试 POST→GET→PUT→render→DELETE 闭环
- [ ] 旧 /articles 端点行为不受影响
- [ ] skill/mbeditor.skill.md 新增 "MBDoc 文档模型" 章节
- [ ] merge stage-1/block-registry 到 main（--no-ff）
- [ ] 更新 docs/superpowers/SESSION_HANDOFF.md 标记 Stage 1 完成
- [ ] commit handoff: docs(handoff): session 2 — Stage 1 complete
- [ ] 提示我是否 push 到 origin（push 需要我明示同意）

## Stage 0 已知遗留（Stage 1 必须处理）
1. backend/app/api/v1/publish.py:27 的 _WECHAT_BASE_CSS 强制 img 加 border-radius:8px
   → Stage 1 的 ImageRenderer 替代掉这行（不在旧 publish.py 里动，在新 render_for_wechat 里建立新路径）
2. 微信服务端会剥 position:relative 保留 position:absolute
   → Stage 1 的 BlockRegistry 要预留一个 "compatibility hint" 字段给后续 Stage 用

## 如果中途被中断
立即更新 docs/superpowers/SESSION_HANDOFF.md §"断点恢复" 章节，记录：
- 最后完成的 Task 编号
- 未完成 Task 的具体卡点
- 任何需要人类决策的问题
- commit handoff 文件

然后告诉我恢复 prompt。

开始吧。第一步：跑环境确认和不变量检查。
```

---

## 🔀 并行开发（可选）

如果你想同时启动多个 session 加速 Stage 2-5 的开发（必须先完成 Stage 1），按以下步骤准备 worktree：

```bash
cd D:/Web/MBEditor

# Stage 1 完成后，基于最新 main 创建并行 worktree
git worktree add ../MBEditor-stage2 -b stage-2/html-markdown-renderer main
git worktree add ../MBEditor-stage3 -b stage-3/image-pipeline main
git worktree add ../MBEditor-stage4 -b stage-4/svg-renderer main

# 每个 worktree 独立 npm install / pip install
cd ../MBEditor-stage2 && cd backend && pip install -r requirements-dev.txt && cd ../frontend && npm install
# 重复 stage3/stage4...
```

然后在每个 worktree 启动一个独立 session，分别用以下 prompt：

```
我在 D:/Web/MBEditor-stage2 这个 worktree 上工作 Stage 2。
1. 读 ../MBEditor/docs/superpowers/SESSION_HANDOFF.md 确认 Stage 1 已完成
2. 读 ../MBEditor/docs/superpowers/MULTI_SESSION_ORCHESTRATION.md §5 并行规则
3. 在 ../MBEditor/docs/superpowers/AGENT_LOCKS.md 登记自己的 lock
4. 先把 docs/superpowers/plans/2026-04-11-stages-2-to-7-skeleton.md 里的 Stage 2 章节
   展开为独立的 step 级 TDD 计划（docs/superpowers/plans/2026-04-11-stage-2-html-markdown-renderer.md）
5. 然后用 superpowers:subagent-driven-development 执行
6. 完成后释放 lock、更新 handoff、commit、告诉我 push
```

---

## ⚠️ 不要做的事

- ❌ 不要在未读 SESSION_HANDOFF.md 的情况下开始任何代码工作
- ❌ 不要跳过 two-stage review（spec + quality）
- ❌ 不要跨 Stage（一个 session 做完 Stage 1 就停，不要顺手做 Stage 2）
- ❌ 不要在没有我明示同意的情况下 push
- ❌ 不要让 subagent 自己读 plan 文件（必须粘贴 Task 全文给它）
- ❌ 不要在 docs/superpowers/ 里存放未经核实的"推测性信息"（这个目录是项目协调的真相来源）

---

## 📍 文件速查

| 我要找... | 去这里 |
|---|---|
| 现在在哪 | `docs/superpowers/SESSION_HANDOFF.md` |
| 如何多 session 协作 | `docs/superpowers/MULTI_SESSION_ORCHESTRATION.md` |
| Stage 1 详细 TDD | `docs/superpowers/plans/2026-04-11-stage-1-block-registry.md` |
| Stage 总览 | `docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md` |
| 为什么这么设计 | `docs/research/wechat-wysiwyg-pipeline.md` 等 4 份 |
| 给 Agent 的使用指南 | `skill/mbeditor.skill.md` |
| Stage 0 已完成的证据 | `git log 31022de..main --oneline` |

---

_本文件是给"新 session 启动"的一次性参考卡。Stage 1 完成后，应该由 session 2 更新本文件为 Stage 2 的启动指令。_
