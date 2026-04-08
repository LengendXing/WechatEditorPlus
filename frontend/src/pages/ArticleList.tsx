import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import type { ArticleSummary } from "@/types";
import EmptyState from "@/components/editor/EmptyState";
import { toast } from "@/stores/toastStore";
import ArticleListHeader from "@/components/layout/ArticleListHeader";
import { ArticleCardSkeleton } from "@/components/ui/Skeleton";

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #2D1B4E, #1A3A5C 50%, #0D4A4A)",
  "linear-gradient(45deg, #1A4A3E, #0D6B5C)",
  "linear-gradient(180deg, #5C3A1A, #8B6034)",
  "linear-gradient(90deg, #4A1A2E, #7B3048)",
  "linear-gradient(200deg, #1A3A5C, #3A5A7C)",
  "linear-gradient(60deg, #2E4A1A, #4A6B34)",
];

const SAMPLE_MARKDOWN = `# 欢迎使用 MBEditor

> 这是一篇示例文章，帮助你快速了解 MBEditor 的功能。

## 什么是 MBEditor？

MBEditor 是**首款支持 AI Agent 直接使用的公众号编辑器**，支持三种编辑模式：

1. **可视化编辑** - 所见即所得的富文本编辑
2. **Markdown 模式** - 使用 Markdown 语法写作
3. **代码模式** - 直接编辑 HTML/CSS

## 主要特性

- 多种精美排版模板
- 一键推送到微信公众号
- 支持图片上传与管理
- 实时预览效果

## 代码示例

\`\`\`javascript
const editor = new MBEditor({
  mode: 'markdown',
  theme: 'studio-ink'
});
\`\`\`

---

*开始你的创作之旅吧！*
`;

export default function ArticleList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [sortBy, setSortBy] = useState<"updated" | "created">("updated");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("全部文章");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/articles").then((res) => {
      if (res.data.code === 0) setArticles(res.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const createArticle = async (
    mode: "html" | "markdown" = "html",
    title = "未命名文章",
    markdown?: string
  ) => {
    try {
      const res = await api.post("/articles", { title, mode });
      if (res.data.code === 0) {
        const id = res.data.data.id;
        if (markdown) {
          await api.put(`/articles/${id}`, { markdown });
        }
        navigate(`/editor/${id}`);
      }
    } catch {
      toast.error("创建失败", "无法创建文章，请稍后重试");
    }
  };

  const createSample = () => {
    createArticle("markdown", "MBEditor 示例文章", SAMPLE_MARKDOWN);
  };

  const createBlank = () => {
    createArticle("html");
  };

  const deleteArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/articles/${id}`);
      toast.success("已删除", "文章已成功删除");
      load();
    } catch {
      toast.error("删除失败");
    }
  };

  const sorted = [...articles].sort((a, b) => {
    const key = sortBy === "updated" ? "updated_at" : "created_at";
    return new Date(b[key]).getTime() - new Date(a[key]).getTime();
  });

  const filtered = sorted.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header - always shown */}
      <ArticleListHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateNew={createBlank}
      />

      {/* Body */}
      {!loading && articles.length === 0 ? (
        <EmptyState onCreateSample={createSample} onCreateBlank={createBlank} />
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="px-12 py-8">
            {/* Stats row */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] text-fg-muted">
                共 {filtered.length} 篇文章
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-fg-muted">排序:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "updated" | "created")}
                    className="appearance-none bg-surface-secondary border border-border-secondary rounded-md px-2.5 py-1 pr-7 text-[12px] text-fg-secondary cursor-pointer focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="updated">最近修改</option>
                    <option value="created">最近创建</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Card grid */}
            {loading ? (
              <div className="grid grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                {filtered.map((a, i) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/editor/${a.id}`)}
                    onMouseEnter={() => setHoveredId(a.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="relative bg-surface-secondary rounded-xl border border-border-primary cursor-pointer hover:border-border-secondary transition-all group overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                  >
                    {/* Cover */}
                    <div
                      className="h-[140px] relative flex items-end p-3.5"
                      style={{ background: COVER_GRADIENTS[i % COVER_GRADIENTS.length] }}
                    >
                      <h3 className="text-white font-bold text-[14px] leading-snug line-clamp-2 drop-shadow-sm">
                        {a.title || "未命名文章"}
                      </h3>
                    </div>

                    {/* Body */}
                    <div className="p-3.5 flex flex-col gap-2">
                      <div className="text-[13px] font-semibold text-fg-primary truncate">
                        {a.title || "未命名文章"}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-fg-muted">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                          a.mode === "markdown"
                            ? "bg-accent-bg text-accent"
                            : "bg-info-bg text-info"
                        }`}>
                          {a.mode}
                        </span>
                        <span>
                          {new Date(a.updated_at).toLocaleString("zh-CN", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-bg text-warning">
                          草稿
                        </span>
                      </div>
                    </div>

                    {/* Delete button (hover) */}
                    {hoveredId === a.id && (
                      <button
                        onClick={(e) => deleteArticle(a.id, e)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-fg-muted hover:text-accent transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {/* New article card */}
                <div
                  onClick={createBlank}
                  className="flex flex-col items-center justify-center h-[264px] rounded-xl border border-border-secondary hover:border-fg-muted cursor-pointer transition-colors group"
                >
                  <Plus size={28} className="text-fg-muted group-hover:text-fg-secondary transition-colors mb-2" />
                  <span className="text-[13px] text-fg-muted group-hover:text-fg-secondary transition-colors">
                    新建文章
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
