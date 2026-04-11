# 多 Session / 多 Agent 开发协调框架

> 本文档定义 MBEditor WYSIWYG 重构过程中**跨 session、跨 agent** 的协调规则。目标：让任何 session 的任何 agent 都能在不破坏他人进度的前提下推进项目。

---

## 1. 角色定义

**Session** = 一次 Claude Code 启动。每次 `claude` 命令启动都是一个新 session。不同 session 之间**不共享内存**，只能通过文件（git + 本目录下的 handoff 文档）交换状态。

**Controller** = 当前 session 的主 Claude 实例。唯一有权：
- 启动 / 终止 subagent
- 更新 `SESSION_HANDOFF.md`
- 执行 `git push`（需用户明示同意）
- 跨 Stage 决策

**Subagent (Implementer)** = 由 Controller 派发的一次性 Task 执行者。生命周期 = 一个 Task。特征：
- 独立上下文（不继承 Controller 的对话历史）
- 必须按指定 Stage/Task 的 spec 执行
- 完成后返回 DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT
- 不能跨 Task 保持状态

**Subagent (Reviewer)** = 专门做 spec review 或 code quality review 的一次性 agent。两阶段 review：
1. Spec compliance reviewer（验证 implementer 做对了 spec）
2. Code quality reviewer（验证代码可读可维护）

**Fix Subagent** = 当 reviewer 找到 Important issue 时，由 Controller 派发的修复 agent。拿到具体 issue 清单，只修这几条，不做其它。

---

## 2. Session 启动协议（每个新 session 必读）

### Step 1: 环境确认
```bash
cd D:/Web/MBEditor
git status
git branch --show-current
git log --oneline -5
```
期望：干净工作树（或只有 `frontend/tsconfig.tsbuildinfo` 这类构建缓存）；在 `main` 或 `stage-N/*` 分支。

### Step 2: 读 handoff 文件
打开并读完：
1. `docs/superpowers/SESSION_HANDOFF.md` — 当前项目状态
2. `docs/superpowers/plans/2026-04-11-mbeditor-wysiwyg-roadmap.md` — 总览（只需快速扫一眼 §2 的表格）
3. 当前 Stage 的详细计划（`2026-04-11-stage-N-*.md`）

### Step 3: 跑不变量
执行 SESSION_HANDOFF.md §"不变量" 里的 7 条 grep/test 命令。任何一条红色 = **停止，先修复**。

### Step 4: 认领工作
在 `SESSION_HANDOFF.md` §"下一个 Session 要做什么" 找到要做的 Stage/Task。如果多个 session 并行，看 `AGENT_LOCKS.md`（见 §5）先获取 lock。

### Step 5: 开始工作
对于 Stage 级工作，启动 `superpowers:subagent-driven-development` skill。对于已知 Task 级补丁，直接派发 implementer subagent。

---

## 3. Session 结束协议（每个 session 必走）

无论 session 因为什么原因结束（任务完成 / 用户中断 / context 满 / 需要新起一个），都必须：

### Step 1: 标记 Stage / Task 进度
- 用 TaskUpdate 把完成的 Task 标记为 completed
- 如果有未完成 Task，留在 in_progress 状态

### Step 2: 更新 SESSION_HANDOFF.md
**必须更新的字段：**
- §"当前进度" 表格（Stage 状态 / 完成日期）
- §"下一个 Session 要做什么"（真实的下一步）
- §"断点恢复"（如果有未完成工作，具体记录卡点）
- §"变更日志"（加一行 session 记录）

### Step 3: Commit handoff 文件
```bash
git add docs/superpowers/SESSION_HANDOFF.md
git commit -m "docs(handoff): session N — <Stage M / Task X complete | stuck on Y>"
```

### Step 4: 决定是否 push
- **如果没有用户在场** → 不 push，留本地 commit
- **如果用户明示同意 push** → `git push origin <branch>`

### Step 5: 释放 lock（多 session 场景）
如果在 `AGENT_LOCKS.md` 里认领了什么 Stage，现在释放。

### Step 6: 告诉用户具体的下一步 prompt
Session 最后一条消息一定要包含可以直接粘到**新 session** 里的启动 prompt。

---

## 4. Subagent 派发规则（Controller 遵守）

### 4.1 Implementer Subagent

**派发时必须提供：**
- 完整的 Task 描述（从计划文件里复制**全文**，不让 subagent 自己读计划）
- Scene-setting context（它不知道 Stage 0 完成了什么）
- Working directory（`D:/Web/MBEditor`）
- Branch name
- 失败处理指导（BLOCKED / NEEDS_CONTEXT / DONE_WITH_CONCERNS 用法）
- Self-review checklist

**禁止：**
- 让 subagent 读 `SESSION_HANDOFF.md`（它不需要全局上下文）
- 让 subagent 读整个 plan 文件（只给相关 Task 全文）
- 在同一消息里派两个 implementer（会冲突）

**模型选择：**
- 纯机械性改动（删几行、改几个字符串、复制粘贴 spec 到文件） → `haiku`
- 需要理解上下文（实现新函数、跨文件协调、有细节判断） → `sonnet`
- 架构决策、设计评审、复杂重构 → `opus`

### 4.2 Reviewer Subagent

两阶段流程：
1. **Spec reviewer**：用 `general-purpose` + 对应模型
2. **Code quality reviewer**：用 `superpowers:code-reviewer`

**Spec reviewer 先跑；spec 过了再跑 quality。** 如果 spec 发现 issue，派 fix subagent 修完再重跑 spec reviewer，然后才能进入 quality review。

### 4.3 Fix Subagent

只在 reviewer 发现 Important/Critical issue 时派发。必须：
- 给出具体的 issue 清单（含 file:line）
- 给出具体的修复代码（不要让 fix subagent 自己想）
- 要求 fix subagent 跑验证命令
- 要求 single commit with `fix:` 前缀

---

## 5. 多 Session 并行策略（可选高级用法）

### 5.1 何时用并行

**适合并行的 Stage 组合：**
- Stage 2 (HTML/Markdown) + Stage 3 (Image) + Stage 4 (SVG)：三者都只依赖 Stage 1，无互相依赖，可三路并行
- Stage 5 (Raster) 依赖 Stage 3 的 `ImageUploader` 接口，必须在 Stage 3 达到"接口冻结"后才能启动

**必须串行的 Stage：**
- Stage 0 → Stage 1（Stage 1 依赖 Stage 0 清理）
- Stage 1 → Stage 2-5（全部依赖 BlockRegistry 的存在）
- Stage 6 → Stage 7（验证依赖 CLI/UI 闭环）

### 5.2 Worktree 准备

每个并行 session 应在独立 worktree 工作，避免 `git checkout` 互相干扰：

```bash
cd D:/Web/MBEditor
# 主 worktree 保留在 main 做协调
git worktree add ../MBEditor-stage2 stage-2/html-markdown-renderer
git worktree add ../MBEditor-stage3 stage-3/image-pipeline
git worktree add ../MBEditor-stage4 stage-4/svg-renderer
```

每个并行 session 在对应 worktree 里启动。

### 5.3 Lock 机制

创建 `docs/superpowers/AGENT_LOCKS.md`（本框架的一部分），每个 session 启动时在里面登记：

```markdown
## Active Locks

| Stage | Worktree | Owner Session | Started | ETA |
|---|---|---|---|---|
| Stage 2 | MBEditor-stage2 | session-2 | 2026-04-12 09:00 | 2026-04-12 17:00 |
| Stage 3 | MBEditor-stage3 | session-3 | 2026-04-12 09:00 | 2026-04-12 13:00 |
```

Session 结束时删除自己的 lock 行。如果 session 启动时发现 stale lock（超过 ETA 24h），可以在 handoff 文件里标记为"需要人类清理"，不要强抢。

### 5.4 冲突解决

**场景 A：两个 Stage 改了同一个文件**
- 最常见的是 `skill/mbeditor.skill.md` 和 `docs/superpowers/SESSION_HANDOFF.md`
- 规则：先合并到 main 的胜出，后合并的 session 在 rebase 时解决冲突
- `BlockRegistry.default()` 可能被多个 Stage 改（每个 Stage 注册自己的 renderer）——必须**串行化**这些改动，不能并行

**场景 B：两个 Stage 依赖同一个新接口**
- 不应该发生——依赖管理在计划阶段就应该拆清楚
- 如果真发生了，Controller 把其中一个 Stage 退回到 "blocked" 状态，在 handoff 里明确记录

---

## 6. Skill 演进协议

`skill/mbeditor.skill.md` 是所有 Stage 共享的一等交付物。为了避免并行改动冲突：

**Rule S-1：** 每个 Stage 的最后一个 Task 必须是"更新 skill"。不在中间 Task 里改 skill。

**Rule S-2：** 更新 skill 的 commit 必须单独（不与代码提交混合）。commit message 格式：
```
docs(skill): stage N — <变更摘要>
```

**Rule S-3：** 同一个 session 内多个 Stage 完成时，skill 更新可以合并为一个 commit；但跨 session 的 skill 更新必须各自 commit。

**Rule S-4：** skill 里不准出现"即将"、"未来"这类词描述尚未实装的 API。每个 API 示例必须当前可以真实 curl。

---

## 7. 研究报告的使用

`docs/research/` 下有 4 份研究报告。它们是**决策依据**，不是教程。规则：

**Rule R-1：** 实施过程中如果对技术方案有疑问，先查 research 报告。
**Rule R-2：** 研究报告**不会随实施过程更新**（除非发现报告本身有错误）。
**Rule R-3：** 如果真机实测推翻了研究报告（例如发现微信后端对 SVG `id` 属性的处理与报告不符），在 `docs/superpowers/RESEARCH_CORRECTIONS.md` 里追加一行 errata，不要直接改报告。

---

## 8. 应急机制

### 8.1 如果 subagent 报告 BLOCKED
Controller 应该：
1. 读 subagent 的 blocker 描述
2. 判断是 context 问题（补充信息后重派）还是架构问题（升级）
3. 不要让同一个 subagent 重试 > 2 次
4. 如果升级：在 handoff 文件记录，然后问用户

### 8.2 如果 reviewer 反复发现同一个 issue
- 第 1 次：Important → 派 fix subagent
- 第 2 次同一 issue：说明 fix subagent 没理解 → 换 sonnet/opus 模型再试一次
- 第 3 次同一 issue：说明 plan 本身有歧义 → 停止，在 handoff 记录 "spec ambiguity"，问用户

### 8.3 如果环境被破坏（不变量检查失败）
1. **先回滚**：`git reset --hard <上一个已知好 SHA>`
2. **再分析**：哪个 commit 引入的破坏
3. **修复后再继续**：确认所有不变量恢复绿色

### 8.4 如果用户长时间不在
- 完成当前 Task，standby
- 在 handoff 文件更新进度
- 不要 push
- 不要擅自推进到下一个 Stage

---

## 9. 快速参考：Prompt 模板

### 9.1 新 session 启动 prompt

```
读 docs/superpowers/SESSION_HANDOFF.md 了解当前状态。
按 §"下一个 Session 要做什么" 执行。
遵守 docs/superpowers/MULTI_SESSION_ORCHESTRATION.md 的所有协议。
```

### 9.2 启动特定 Stage 的 prompt

```
读 docs/superpowers/SESSION_HANDOFF.md 确认 Stage N 未完成。
然后用 superpowers:subagent-driven-development 执行
docs/superpowers/plans/2026-04-11-stage-N-*.md。
遵守 docs/superpowers/MULTI_SESSION_ORCHESTRATION.md。
最后更新 SESSION_HANDOFF.md 并 commit（不 push，除非我说 push）。
```

### 9.3 断点恢复 prompt

```
读 docs/superpowers/SESSION_HANDOFF.md §"断点恢复" 章节。
从记录的断点继续执行。
遵守 docs/superpowers/MULTI_SESSION_ORCHESTRATION.md。
```

### 9.4 细化骨架 Stage prompt

```
读 docs/superpowers/plans/2026-04-11-stages-2-to-7-skeleton.md 里 Stage N 的章节。
基于当前代码实际形态，把它展开为独立的 step 级 TDD 计划，
命名为 docs/superpowers/plans/2026-04-11-stage-N-<主题>.md。
写完后继续执行（superpowers:subagent-driven-development）。
```

---

## 10. 不会出现的事（显式排除）

- ❌ 一个 session 跨多个 Stage（除非每个 Stage 都小到 < 30 分钟）
- ❌ 直接修改 `origin/main`（所有改动必须先本地 commit 验证）
- ❌ 跳过 two-stage review（spec + quality 都必须过）
- ❌ 在 Stage N 里偷偷做 Stage N+1 的事（YAGNI）
- ❌ 让 subagent 自己读 plan 文件（必须 Controller 把 spec 粘给它）
- ❌ 使用多个并行 implementer 改同一文件（一次只能一个）
- ❌ push --force 到 main
- ❌ 不 commit 就结束 session（至少 commit handoff）
