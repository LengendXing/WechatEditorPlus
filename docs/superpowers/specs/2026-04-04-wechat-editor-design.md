# 微信公众号 HTML 编辑预览工具 — 设计文档

## 概述

一个部署在 NAS 上的公众号文章编辑预览工具，支持 HTML 代码编辑和 Markdown 写作两种模式，提供公众号真实效果预览、一键复制富文本、微信 API 推送草稿箱等功能。

## 技术栈

- **前端**：React 19 + Tailwind CSS v4 + Vite + Monaco Editor
- **后端**：Python FastAPI + uvicorn
- **部署**：Docker Compose（前端 :7070，后端 :7071）
- **核心库**：juice（CSS inline 化）、marked + highlight.js（Markdown 渲染）、httpx（微信 API 调用）

## 四层保真架构

### 第 1 层：编辑预览

- iframe 沙箱渲染，支持完整 HTML/CSS/JS
- 代码改动实时刷新（防抖 300ms）

### 第 2 层：公众号预览

- 578px 固定宽度模拟手机屏
- 应用 juice CSS inline 化 + 标签白名单过滤
- 所见即所得 = 公众号最终呈现效果

### 第 3 层：一键复制

- Clipboard API 写入 `text/html` MIME 类型富文本
- 降级方案：Selection + execCommand('copy')
- 粘贴到公众号后台零损失

### 第 4 层：API 推送

- 图片通过 `uploadimg` 接口上传到微信 CDN
- HTML 中图片 URL 自动替换为微信域名
- 调用 `draft/add` 接口创建草稿

## 页面布局

```
┌─────────────────────────────────────────────────────────────┐
│  顶栏：[HTML模式 | Markdown模式]   文章标题输入   [设置⚙]    │
├──────────────────┬──────────────────┬───────────────────────┤
│                  │                  │                       │
│   代码编辑器      │   公众号预览      │   操作面板            │
│   Monaco Editor  │   578px 手机框   │                       │
│                  │                  │  [一键复制富文本]      │
│   HTML 模式:     │   实时渲染        │  [推送到草稿箱]       │
│   HTML/CSS/JS    │   inline style   │  [导出 HTML 文件]     │
│   三标签切换      │   已应用          │                       │
│                  │                  │  ── 图片管理 ──       │
│   Markdown 模式: │                  │  [上传图片]           │
│   MD 编辑 +      │                  │  图片列表/复制链接     │
│   主题选择器      │                  │                       │
│                  │                  │  ── 主题/模板 ──      │
│                  │                  │  Markdown 主题切换     │
│                  │                  │  CSS 代码片段库        │
│                  │                  │                       │
├──────────────────┴──────────────────┴───────────────────────┤
│  底栏状态：字数统计 | 图片数 | 预估阅读时间 | 保存状态        │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. 双模式编辑器

**HTML 模式**：
- Monaco Editor 提供 VS Code 级别编辑体验
- 三个 tab 切换：HTML / CSS / JS
- iframe 沙箱实时渲染完整效果

**Markdown 模式**：
- Monaco Editor Markdown 编辑
- `marked` 库 + 自定义 renderer 输出带 inline style 的 HTML
- 主题选择器切换不同排版风格
- `highlight.js` 代码块高亮（颜色 inline 化）

### 2. 公众号兼容引擎

**CSS inline 化**：
- 使用 `juice` 库在浏览器端将 `<style>` 和 class 全部转为 inline style
- 字号使用 px，颜色使用十六进制，行高使用数值或 px

**标签白名单过滤**：
- 保留公众号支持的标签：`section`, `p`, `span`, `img`, `strong`, `em`, `h1`-`h6`, `blockquote`, `ul`, `ol`, `li`, `table`, `tr`, `td`, `th`, `br`, `hr`, `pre`, `code`, `a`
- 移除：`script`, `style`, `link`, `iframe`, `embed`, `class`, `id` 属性
- 保留：`style`（inline）, `src`, `href`, `alt`, `data-*`（部分）

**CSS 限制遵守**：
- 不使用 CSS Grid
- 不使用 position fixed/absolute
- flexbox 谨慎使用
- 内容区宽度限制 578px
- 使用 `<section>` 代替 `<div>`（更稳定）

### 3. NAS 本地图床

**存储**：
- 路径：`data/images/{YYYY}/{MM}/{DD}/{md5}.{ext}`
- MD5 去重：同一张图不重复存储
- 后端提供 `/images/{path}` 静态文件服务

**上传方式**：
- 编辑器内拖拽上传
- 编辑器内粘贴上传
- 图片管理面板手动上传

**管理功能**：
- 图片列表展示
- 搜索、删除
- 复制内网链接

### 4. 富文本复制

**主方案**：Clipboard API
```
navigator.clipboard.write([
  new ClipboardItem({
    'text/html': new Blob([inlinedHtml], { type: 'text/html' }),
    'text/plain': new Blob([plainText], { type: 'text/plain' }),
  })
])
```

**降级方案**：Selection + execCommand
- 创建隐藏 contenteditable div
- 填入 HTML，选中内容
- 执行 `document.execCommand('copy')`

### 5. 微信 API 对接

**配置**：
- 设置页面输入 AppID + AppSecret
- 后端加密存储到 `data/config.json`
- access_token 自动获取并缓存，2 小时有效期内自动刷新

**图片上传**：
- 接口：`POST https://api.weixin.qq.com/cgi-bin/media/uploadimg`
- 返回微信 CDN 永久链接（mmbiz.qpic.cn）
- 不占素材库额度
- 同一张图缓存 URL 避免重复调用

**推送草稿**：
- 接口：`POST https://api.weixin.qq.com/cgi-bin/draft/add`
- 包含：标题、作者、内容（已转换 HTML）、封面图（media_id）、摘要

### 6. 文章管理

- 每篇文章存为 `data/articles/{uuid}.json`
- 字段：标题、内容（HTML/CSS/JS 或 Markdown）、编辑模式、封面图、创建时间、更新时间
- 编辑器内自动保存（3 秒防抖）
- 文章列表页：历史文章浏览、打开继续编辑

## 边界情况

| 场景 | 处理方式 |
|------|---------|
| 未配置微信 API 时点推送 | 提示去设置页配置，复制功能仍可用 |
| 图片上传到微信失败 | 逐张重试，失败的标记提示，不阻断整体流程 |
| access_token 过期 | 后端自动刷新，请求自动重试一次 |
| 文章内容过大 | 前端提示字数/图片数，微信单篇限制 2w 字 |
| 图片重复上传 | MD5 去重，NAS 端不重复存储；微信端同一张图缓存 URL |
| 浏览器不支持 Clipboard API | 降级为 Selection + execCommand 方案 |

## 项目结构

```
D:/Web/wechat-editor/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx / App.tsx / router.tsx / index.css
│       ├── lib/api.ts
│       ├── components/
│       │   ├── ui/
│       │   ├── editor/       (MonacoEditor, MarkdownEditor, EditorTabs)
│       │   ├── preview/      (WechatPreview)
│       │   ├── panel/        (ActionPanel, ImageManager, ThemeSelector)
│       │   └── layout/       (MainLayout)
│       ├── hooks/            (useClipboard, useImageUpload, useWechatPublish)
│       ├── utils/            (inliner, sanitizer, markdown)
│       ├── pages/            (Editor, Settings)
│       └── types/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── core/             (config, security)
│       ├── api/v1/           (router, images, wechat, articles)
│       └── services/         (image_service, wechat_service, article_service)
└── data/
    ├── images/
    ├── articles/
    └── config.json
```

## 端口分配

| 端口 | 用途 |
|------|------|
| 7070 | 前端 Nginx |
| 7071 | 后端 FastAPI |
| 7072-7080 | 预留扩展 |

### 7. Agent Skill（CLI 层）

不做独立 CLI 工具，直接通过 SKILL.md 用 curl 调后端 API，与 nas-tools skill 模式一致。

**Skill 安装位置**：
- Claude Code: `C:/Users/93577/.claude/skills/wechat-editor/SKILL.md`
- OpenClaw: `C:/Users/93577/.openclaw/workspace/skills/wechat-editor/SKILL.md`

**Skill 覆盖的 API 操作**：

```bash
# 文章管理
POST   /api/v1/articles              # 创建文章
GET    /api/v1/articles              # 列出所有文章
GET    /api/v1/articles/{id}         # 获取文章详情
PUT    /api/v1/articles/{id}         # 更新文章内容（HTML/CSS/JS/MD/title）
DELETE /api/v1/articles/{id}         # 删除文章

# 图片
POST   /api/v1/images/upload         # 上传图片到 NAS 图床
GET    /api/v1/images                # 列出所有图片
DELETE /api/v1/images/{id}           # 删除图片

# 发布
POST   /api/v1/publish/process       # 处理文章（inline CSS + 图片上传微信）
POST   /api/v1/publish/draft         # 推送到微信草稿箱
GET    /api/v1/publish/html/{id}     # 获取处理后的 HTML（供复制）

# 配置
GET    /api/v1/config                # 查看配置状态
PUT    /api/v1/config                # 更新微信 AppID/AppSecret

# 预览
GET    http://NAS_IP:7070/editor/{id}  # 浏览器打开编辑器预览
```

**Agent 典型工作流**：
```
用户: "帮我写一篇关于 AI 的公众号文章"

1. curl -X POST /api/v1/articles -d '{"title":"AI改变世界","mode":"html"}'
   → {"id":"abc123"}
2. Agent 生成 HTML + CSS
3. curl -X PUT /api/v1/articles/abc123 -d '{"html":"...","css":"..."}'
4. curl -X POST /api/v1/images/upload -F "file=@cover.jpg"
   → {"url":"http://nas:7071/images/2026/04/04/xxxx.jpg"}
5. curl -X POST /api/v1/publish/draft -d '{"article_id":"abc123"}'
   → {"msg":"草稿创建成功"}
```

**Skill 文件格式**：遵循现有 SKILL.md frontmatter 格式，提供完整 API 文档和 curl 示例，让 Agent 可以直接通过自然语言调用。

## 项目结构（更新）

```
D:/Web/wechat-editor/
├── docker-compose.yml
├── frontend/                        # 同前
├── backend/                         # 同前
├── data/                            # 同前
└── skill/
    └── SKILL.md                     # Agent skill 文件（部署时复制到 CC/OpenClaw）
```

## 技术参考

- **doocs/md** (12k stars)：juice CSS inline 化、主题系统、图床方案
- **mdnice/markdown-nice** (4.5k stars)：marked 自定义 renderer、复制方案
- **lyricat/wechat-format** (4.5k stars)：渲染时直接生成 inline style 方案
- **nas-tools skill**：curl 调 API 的 skill 模式参考
- 微信公众平台文档：素材管理 API、草稿箱 API
