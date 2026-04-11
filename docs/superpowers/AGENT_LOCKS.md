# Active Agent Locks

> 多 session 并行开发时，每个 session 在启动前先在此登记自己要做的 Stage。结束时删除自己的行。
>
> **单 session 顺序开发时不需要用此文件。** 只有在多 worktree 并行场景下才需要。
>
> 规则见 `MULTI_SESSION_ORCHESTRATION.md` §5.3。

## Format

| Stage | Worktree | Owner Session | Started (UTC) | ETA | Notes |
|---|---|---|---|---|---|

## Active Locks

_当前无活跃 lock。单 session 顺序开发中。_

## Stale Lock 清理规则

如果任何 lock 的 `Started` 时间超过 24 小时且 `ETA` 已过，在 `SESSION_HANDOFF.md` §"断点恢复" 里标记"需要人类清理 stale lock"，不要强制抢占。
