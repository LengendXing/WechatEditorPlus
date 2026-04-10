import { useRef, useCallback, useEffect, useState } from "react";
import { normalizeEditableHtml } from "@/utils/htmlSemantics";
import { sanitizeForWechatPreview } from "@/utils/wechatSanitizer";

/** 给所有 img 加圆角、去阴影 */
function normalizeImageStyles(html: string): string {
  return html.replace(
    /<img\b([^>]*?)style="([^"]*)"([^>]*?)>/gi,
    (_match, before, style, after) => {
      let s = style
        .replace(/box-shadow:[^;]+;?/gi, "")
        .replace(/border-radius:[^;]+;?/gi, "");
      s = `border-radius:8px;max-width:100%;${s}`;
      return `<img${before}style="${s}"${after}>`;
    }
  ).replace(
    /<img\b(?![^>]*style=)([^>]*?)>/gi,
    (_match, attrs) => `<img style="border-radius:8px;max-width:100%;"${attrs}>`
  );
}

interface WechatPreviewProps {
  html: string;
  css: string;
  js?: string;
  mode: "raw" | "wechat";
  onHtmlChange?: (html: string) => void;
}

export default function WechatPreview({ html, css, js, mode, onHtmlChange }: WechatPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isUserEditing = useRef(false);
  const lastSetHtml = useRef("");
  const lastSemanticKey = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iframeHeight, setIframeHeight] = useState(400);
  const [cleanMode, setCleanMode] = useState(true);

  const baseHtml = normalizeImageStyles(html);
  // 清洗模拟：在 wechat 模式下可切换。raw 模式始终原样。
  const processedHtml =
    mode === "wechat" && cleanMode ? sanitizeForWechatPreview(baseHtml) : baseHtml;
  // cleanMode 下禁用编辑回写，防止清洗后的 HTML 污染 Monaco 源
  const editable = mode === "wechat" && !cleanMode;

  // Listen for iframe resize messages (validate source to prevent spoofing)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === 'mbeditor:preview-resize' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(400, e.data.height + 40));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Write content into iframe (only when changed externally)
  const writeToIframe = useCallback((content: string, editable: boolean) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 20px 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    outline: none;
    -webkit-user-modify: ${editable ? "read-write" : "read-only"};
  }
  body *::selection { background: rgba(232, 85, 58, 0.12); }
  img { border-radius: 8px; max-width: 100%; box-shadow: none; }
  ${css}
</style>
</head><body${editable ? ' contenteditable="true"' : ''}>${content}${js ? `<script>${js}<\/script>` : ""}<script>(function(){var post=function(){try{window.parent.postMessage({type:'mbeditor:preview-resize',height:document.body.scrollHeight},'*');}catch(e){}};if(typeof ResizeObserver!=='undefined'){var ro=new ResizeObserver(post);ro.observe(document.body);}Array.from(document.images).forEach(function(img){if(!img.complete)img.addEventListener('load',post);});post();setTimeout(post,100);setTimeout(post,500);})();<\/script></body></html>`;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    const initial = normalizeEditableHtml(content);
    lastSemanticKey.current = initial.semanticKey;
    lastSetHtml.current = content;

    if (editable && onHtmlChange) {
      // Listen for edits inside iframe
      doc.body.addEventListener("input", () => {
        isUserEditing.current = true;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          if (!onHtmlChange) {
            setTimeout(() => { isUserEditing.current = false; }, 500);
            return;
          }
          const next = normalizeEditableHtml(doc.body.innerHTML);
          if (next.semanticKey !== lastSemanticKey.current) {
            lastSemanticKey.current = next.semanticKey;
            lastSetHtml.current = next.serialized;
            onHtmlChange(next.serialized);
          }
          setTimeout(() => { isUserEditing.current = false; }, 500);
        }, 800);
      });

      // Handle paste: keep HTML format
      doc.body.addEventListener("paste", (e) => {
        // Let browser handle paste naturally for rich content
      });
    }
  }, [css, js, onHtmlChange]);

  // Sync external html changes
  useEffect(() => {
    if (isUserEditing.current) return;
    if (processedHtml === lastSetHtml.current) return;
    writeToIframe(processedHtml, editable);
  }, [processedHtml, editable, writeToIframe]);

  // Initial write on mount
  useEffect(() => {
    // Small delay to ensure iframe is ready
    const timer = setTimeout(() => {
      writeToIframe(processedHtml, editable);
    }, 50);
    return () => clearTimeout(timer);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-[375px] shrink-0 rounded-xl overflow-hidden border border-border-primary shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
        <div className="h-6 bg-surface-tertiary flex items-center justify-between px-2 shrink-0">
          <span className="text-[10px] text-fg-muted font-mono">
            {mode === "raw"
              ? "原始预览"
              : cleanMode
              ? "公众号效果（清洗预览）"
              : "公众号效果（可编辑）"}
          </span>
          {mode === "wechat" && (
            <button
              onClick={() => setCleanMode((v) => !v)}
              className="text-[10px] text-fg-muted hover:text-accent font-mono"
              title={
                cleanMode
                  ? "清洗预览模式为只读，避免污染源代码；点击切回原始样式可编辑"
                  : "切回清洗预览以接近微信真机效果（只读）"
              }
            >
              {cleanMode ? "✓ 清洗预览（只读）" : "原始样式（可编辑）"}
            </button>
          )}
        </div>
        <iframe
          ref={iframeRef}
          className="w-full border-0"
          style={{
            height: `${iframeHeight}px`,
            background: "#FAF8F5",
            transition: 'height 0.2s ease'
          }}
          title="preview"
        />
      </div>
    </div>
  );
}
