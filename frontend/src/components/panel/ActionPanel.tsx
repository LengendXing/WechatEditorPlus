import { useState } from "react";
import { Copy, Send, Download } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { processForWechat } from "@/utils/inliner";
import ImageManager from "./ImageManager";
import api from "@/lib/api";
import type { Article } from "@/types";

interface ActionPanelProps {
  article: Article;
  onInsertImage: (url: string) => void;
}

export default function ActionPanel({ article, onInsertImage }: ActionPanelProps) {
  const { copyRichText } = useClipboard();
  const [copyMsg, setCopyMsg] = useState("");
  const [publishMsg, setPublishMsg] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handleCopy = async () => {
    const ok = await copyRichText(article.html, article.css);
    setCopyMsg(ok ? "已复制!" : "复制失败");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMsg("");
    try {
      const res = await api.post("/publish/draft", { article_id: article.id });
      setPublishMsg(res.data.code === 0 ? "草稿已推送!" : res.data.message);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setPublishMsg(err.response?.data?.message || "推送失败");
    }
    setPublishing(false);
    setTimeout(() => setPublishMsg(""), 3000);
  };

  const handleExport = () => {
    const processed = processForWechat(article.html, article.css);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${article.title}</title></head><body>${processed}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.title || "article"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-56 shrink-0 border-l border-border p-4 bg-surface-secondary overflow-y-auto space-y-4">
      <div className="space-y-2">
        <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">
          <Copy size={14} /> 一键复制富文本
        </button>
        {copyMsg && <div className="text-xs text-success">{copyMsg}</div>}

        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full flex items-center gap-2 px-3 py-2 bg-surface-tertiary hover:bg-border text-fg-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Send size={14} /> {publishing ? "推送中..." : "推送到草稿箱"}
        </button>
        {publishMsg && <div className="text-xs text-fg-secondary">{publishMsg}</div>}

        <button onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 bg-surface-tertiary hover:bg-border text-fg-primary rounded-lg text-sm font-medium transition-colors">
          <Download size={14} /> 导出 HTML
        </button>
      </div>

      <hr className="border-border" />

      <ImageManager onInsert={onInsertImage} />
    </div>
  );
}
