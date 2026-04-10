import { useState } from "react";
import { Copy, Send, Download } from "lucide-react";
import api from "@/lib/api";
import { writeHtmlToClipboard } from "@/hooks/useClipboard";
import type { Article } from "@/types";

interface ActionPanelProps {
  article: Article;
  processedHtml?: string;
}

/** Get local-CSS-inlined HTML as a fallback when image upload is unavailable. */
async function fetchInlinedHtml(
  html: string,
  css: string,
  fallback: string | undefined,
): Promise<string> {
  if (fallback) return fallback;
  try {
    const res = await api.post("/publish/preview", { html, css });
    if (res.data.code === 0) return res.data.data.html as string;
  } catch {
    /* ignore */
  }
  return html;
}

export default function ActionPanel({ article, processedHtml }: ActionPanelProps) {
  const [copyMsg, setCopyMsg] = useState("");
  const [copyMsgKind, setCopyMsgKind] = useState<"success" | "warn" | "error">(
    "success",
  );
  const [publishMsg, setPublishMsg] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyStage, setCopyStage] = useState<"upload" | "fallback">("upload");

  const showCopyMsg = (msg: string, kind: "success" | "warn" | "error") => {
    setCopyMsg(msg);
    setCopyMsgKind(kind);
    setTimeout(() => setCopyMsg(""), 4000);
  };

  const handleCopy = async () => {
    setCopying(true);
    setCopyStage("upload");
    setCopyMsg("");
    try {
      // Ask backend to inline CSS + upload local images to WeChat CDN
      const res = await api.post("/publish/process-for-copy", {
        html: article.html,
        css: article.css,
      });

      if (res.data.code === 0) {
        const html = res.data.data.html as string;
        const ok = await writeHtmlToClipboard(html);
        if (ok) {
          showCopyMsg("已复制（图片已上传微信 CDN）", "success");
        } else {
          showCopyMsg("复制失败", "error");
        }
      } else if (res.data.code === 400) {
        // WeChat not configured — fall back to local inline HTML
        setCopyStage("fallback");
        const html = await fetchInlinedHtml(
          article.html,
          article.css,
          processedHtml,
        );
        const ok = await writeHtmlToClipboard(html);
        if (ok) {
          showCopyMsg(
            "已复制，但未配置微信账号，图片可能无法显示，建议使用\"推送到草稿箱\"",
            "warn",
          );
        } else {
          showCopyMsg("复制失败", "error");
        }
      } else {
        showCopyMsg(res.data.message || "复制失败", "error");
      }
    } catch {
      // Network / unknown error — fall back to local inline HTML
      setCopyStage("fallback");
      try {
        const html = await fetchInlinedHtml(
          article.html,
          article.css,
          processedHtml,
        );
        const ok = await writeHtmlToClipboard(html);
        if (ok) {
          showCopyMsg(
            "已复制（图片上传失败，使用本地 HTML 回退）",
            "warn",
          );
        } else {
          showCopyMsg("复制失败", "error");
        }
      } catch {
        showCopyMsg("复制失败", "error");
      }
    }
    setCopying(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMsg("");
    try {
      await api.put(`/articles/${article.id}`, {
        html: article.html,
        css: article.css,
        js: article.js || "",
        title: article.title,
        mode: article.mode,
      });
      const res = await api.post("/publish/draft", { article_id: article.id });
      setPublishMsg(res.data.code === 0 ? "草稿已推送!" : res.data.message);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setPublishMsg(err.response?.data?.message || "推送失败");
    }
    setPublishing(false);
    setTimeout(() => setPublishMsg(""), 3000);
  };

  const handleExport = async () => {
    try {
      const res = await api.post("/publish/preview", {
        html: article.html,
        css: article.css,
      });
      const inlinedHtml = res.data.code === 0 ? res.data.data.html : article.html;
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${article.title}</title></head><body>${inlinedHtml}</body></html>`;
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${article.title || "article"}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${article.title}</title></head><body>${article.html}</body></html>`;
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${article.title || "article"}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={handleCopy}
        disabled={copying}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Copy size={14} />{" "}
        {copying
          ? copyStage === "upload"
            ? "上传图片到微信 CDN..."
            : "回退本地复制..."
          : "一键复制富文本"}
      </button>
      {copyMsg && (
        <div
          className={
            "text-[11px] px-1 " +
            (copyMsgKind === "success"
              ? "text-success"
              : copyMsgKind === "warn"
                ? "text-warning"
                : "text-error")
          }
        >
          {copyMsg}
        </div>
      )}

      <button
        onClick={handlePublish}
        disabled={publishing}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-surface-tertiary hover:bg-border-primary text-fg-primary rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Send size={14} /> {publishing ? "推送中..." : "推送到草稿箱"}
      </button>
      {publishMsg && <div className="text-[11px] text-fg-secondary px-1">{publishMsg}</div>}

      <button
        onClick={handleExport}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-surface-tertiary hover:bg-border-primary text-fg-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
      >
        <Download size={14} /> 导出 HTML
      </button>
    </div>
  );
}
