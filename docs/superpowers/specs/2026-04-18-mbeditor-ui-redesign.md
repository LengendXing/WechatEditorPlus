# MBEditor UI Redesign — Implementation Spec

## Decision

Completely rewrite the frontend to match the design handoff in `MBEditor/design_handoff_mbeditor/`. The existing `frontend/src/` is replaced wholesale. Backend API (`backend/`) and Docker setup remain unchanged.

## Source of Truth

- **Design tokens, layout, interactions**: `design_handoff_mbeditor/README.md`
- **CSS reference**: `design/styles.css`
- **Component reference**: `design/components/*.jsx`
- **Icons**: `design/components/shared.jsx` — the `I` object (custom SVGs, NOT Lucide)

## Target Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Vite + React 18 | Keep existing vite.config.ts proxy setup |
| Language | TypeScript strict | |
| Styling | Tailwind CSS v4 + CSS variables | Port all design tokens; `[data-theme]` switching |
| Components | Radix UI primitives | Dialog, Tabs, Popover, DropdownMenu, Command |
| Fonts | Inter, Instrument Serif, JetBrains Mono, Noto Serif SC | Google Fonts CDN for dev; self-host later |
| Icons | Custom SVG set from `shared.jsx` | Copy verbatim, wrap as React components |
| State | Zustand | 3 stores: `uiStore`, `articlesStore`, `agentStore` |
| Data fetching | React Query (TanStack Query) | Server state for articles, agent |
| Editor | TipTap (already a dependency) | Paper-themed, Noto Serif SC body, Instrument Serif headings |
| Routing | React Router v6 | 4 surfaces + settings |

## Architecture

```
src/
├── app/
│   ├── App.tsx              # RouterProvider
│   ├── router.tsx           # Route definitions
│   └── main.tsx             # Entry point
├── components/
│   ├── icons/               # Custom SVG icon components (from shared.jsx I object)
│   ├── shell/               # TopBar, SideRail, Shell (persistent frame)
│   ├── ui/                  # Button, Chip, Card, Modal, Seg, etc.
│   └── shared/              # BrandLogo, MonoLabel, Pulse, etc.
├── surfaces/
│   ├── article-list/        # 稿库 surface
│   ├── editor/              # 3-pane editor surface
│   │   ├── OutlinePane.tsx
│   │   ├── MainEditor.tsx
│   │   ├── AgentPanel.tsx
│   │   └── EditorSurface.tsx
│   ├── agent-console/       # Agent 控制台 surface
│   └── promo/               # 宣传片 (iframe/standalone, NOT in bundle)
├── stores/
│   ├── uiStore.ts           # theme, accent, density, layout, agentPosition
│   ├── articlesStore.ts     # articles CRUD
│   └── agentStore.ts        # messages, missions, model, status
├── hooks/
│   ├── useTheme.ts
│   ├── useClock.ts
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── api.ts               # Axios instance (keep existing proxy config)
│   └── tokens.ts            # Design token constants if needed
├── styles/
│   └── index.css            # Tailwind + all CSS variables + 3 themes
└── types/
    └── index.ts
```

## Phase Breakdown

### Phase 1 — Shell & Tokens
**Goal**: App skeleton renders with TopBar, SideRail, and route switching across 4 skeleton pages.

**Deliverables**:
1. `styles/index.css` — Port ALL design tokens from `styles.css`:
   - 3 themes: walnut (default), paper, swiss
   - All CSS variables: `--bg`, `--surface`, `--fg`, `--border`, `--accent`, `--gold`, `--forest`, `--info`, `--warn`, `--paper`, `--paper-ink`, etc.
   - Typography: `--f-display`, `--f-sans`, `--f-mono`
   - Border radii: `--r-xs` through `--r-xl`
   - Shadows: `--shadow-1/2/3`
   - Motion easings: `--ease-out-expo`, `--ease-in-out`, `--ease-snap`
   - Utility classes: `.mono`, `.serif`, `.caps`, `.caps-gold`, `.caps-accent`, `.tnum`
   - Scrollbar styling, selection color, focus ring
   - Map to Tailwind theme extend where possible
2. `components/icons/` — All icons from `shared.jsx` `I` object as named React components
3. `components/shared/` — BrandLogo, Chip, MonoLabel, Pulse
4. `components/shell/TopBar.tsx` — 44px, 3-column grid: brand left, nav center, status right
5. `components/shell/SideRail.tsx` — 52px wide, vertical icon stack, vlabel at bottom
6. `components/shell/Shell.tsx` — Frame: TopBar + (SideRail + content area)
7. `app/router.tsx` — 4 routes: list, editor, agent, promo (skeleton placeholders)
8. `stores/uiStore.ts` — theme, layout, density, accent, agentPosition; localStorage persistence
9. Tailwind config extending theme with design tokens

### Phase 2 — Article List (稿库)
**Goal**: Full editorial ledger layout matching `ArticleList.jsx`.

**Deliverables**:
1. Editorial masthead with serif title "稿 库." and metadata
2. Filter pills (全部/草稿/审稿中/已投递/回收站) — mono 11px, uppercase
3. Search input with icon
4. Sort dropdown
5. Ledger-style grid rows (7-column: №, cover, title, author, status, word count, arrow)
6. CoverTile component (striped SVG placeholders)
7. "新建一篇" prompt row at bottom
8. Footer slug
9. Hover states: background → `--surface`, slide-up entrance animation
10. Click → navigate to `/editor/:id`
11. Mock data layer (MOCK_ARTICLES from design)

### Phase 3 — Editor (编辑台)
**Goal**: 3-pane writing surface with TipTap paper editor and Agent co-pilot panel.

**Deliverables**:
1. **EditorSurface** — 3-pane grid: Outline (280px) + Main (flex-1) + Agent (360px/44px collapsed)
2. **OutlinePane (StructurePanel)**:
   - File header with title input + mode selector (HTML/MD seg control)
   - Block tree with icons, depth indentation, active state
   - Assets grid (color-block thumbnails + upload placeholder)
   - Footer: block count + word count
3. **MainEditor (CenterStage)**:
   - Sub-toolbar: view mode seg (代码/分屏/预览), save status chip, preview/publish buttons
   - Code pane: language tabs (html/css/js), syntax-highlighted code view, line numbers
   - Preview pane: paper-themed article preview in dots-bg container, phone-ish frame
   - Command bar at bottom: status, line/col, mode, selection, word count, shortcuts
4. **AgentPanel (AgentCopilot)**:
   - Collapsed state: single icon column with vertical label
   - Expanded (360px): header with agent avatar/name/model, status chips
   - Activity stream: user/assistant/think/tool/diff message types
   - Suggested action chips
   - Input bar with send button
   - Keyboard hint footer
5. **Layout variants**: focus, split, triptych, agent-bottom (via uiStore)
6. Keyboard shortcuts: Cmd+K, Cmd+J, Cmd+/, Cmd+Enter, Cmd+S, Esc

### Phase 4 — Agent Runtime
**Goal**: SSE streaming endpoint integration, message persistence, mission queue.

**Deliverables**:
1. `agentStore.ts` — messages, activeMissions, model, status
2. SSE client for `/api/agent` streaming
3. Message history rendering with streaming tokens
4. Tool call display (method + path + status)
5. Mission queue (deferred long tasks)
6. Agent typing indicator (3-dot, 1.2s loop)
7. Quick-action chips: 改开头、加小标题、校对错字、做封面图

### Phase 5 — Agent Console (代理控制台)
**Goal**: Bird's-eye mission control matching `AgentConsole.jsx`.

**Deliverables**:
1. Two-column layout: left masthead+ledger, right live terminal
2. KPI strip: 4-card grid (活跃任务, 今日投递, 工具调用, 平均用时)
3. Runs table: 5-column grid with progress bars, status chips, agent badges
4. LiveRunPanel: terminal-style output with live streaming lines
5. Terminal line types: meta, log, tool, think (color-coded)
6. Running cursor animation
7. Command input at bottom
8. Always dark theme override for this surface

### Phase 6 — WeChat Integration
**Goal**: Publish flow connecting to existing backend API.

**Deliverables**:
1. Publish-to-draft flow (reuse backend `/api/v1/publish`)
2. Preview renderer matching WeChat rendering
3. Settings page for API keys (APPID/APPSECRET)
4. OAuth flow if applicable

### Phase 7 — Polish & Self-host
**Goal**: Production-ready with Docker.

**Deliverables**:
1. Update `frontend/Dockerfile` for new build
2. Settings page
3. Loading states (skeleton cards, editor frame streaming)
4. Error states (gold-orange left-border inline, terminal error screen)
5. Animation polish (panel 200ms, card hover 150ms, route 180ms crossfade)
6. Export/import functionality

## Hard Rules (from CLAUDE.md)

1. Do NOT copy-paste HTML prototype — re-implement in React/TypeScript/Tailwind
2. Design tokens are sacred — no rounding, no simplifying
3. Use custom SVG icon set — NOT Lucide/Heroicons/Tabler
4. Three themes ship day one: walnut, paper, swiss
5. Promo is NOT part of the app bundle
6. Editor uses TipTap, not custom editor
7. Agent panel is first-class, not optional
8. One conceptual change per commit, reference the phase

## What Gets Deleted

The entire `frontend/src/` directory is replaced. Key things NOT carried over:
- Lucide icon imports
- Per-page headers (ArticleListHeader, EditorHeader, SettingsHeader)
- Current ArticleList card grid layout
- Monaco editor integration (replaced by TipTap paper editor + code view)
- Current theme system (only 2 themes → 3 themes)
- toastStore (replaced by Zustand)

## What Gets Preserved

- `vite.config.ts` — proxy config, chunk splitting strategy (update imports)
- `frontend/Dockerfile` and `nginx.conf`
- Backend API contract (`/api/v1/*`)
- `package.json` dependencies as base (add Zustand, Radix, TanStack Query; remove lucide-react)
