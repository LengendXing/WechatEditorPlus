import { useMemo, useRef, useCallback, useEffect } from "react";

interface WechatPreviewProps {
  html: string;
  css: string;
  js: string;
  mode: "raw" | "wechat";
  onHtmlChange?: (html: string) => void;
}

/** 给所有 img 加圆角、去阴影、限制宽度 */
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
    (_match, attrs) => {
      return `<img style="border-radius:8px;max-width:100%;"${attrs}>`;
    }
  );
}

export default function WechatPreview({ html, css, js, mode, onHtmlChange }: WechatPreviewProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const lastExternalHtml = useRef<string>("");
  const isUserEditing = useRef(false);

  const processedHtml = useMemo(() => normalizeImageStyles(html), [html]);

  // 仅在外部 HTML 变化时（代码编辑器改了内容）才重设 innerHTML
  // 用户在 contenteditable 里编辑时不触发，保留浏览器原生 undo 栈
  useEffect(() => {
    if (mode !== "wechat" || !editableRef.current) return;
    if (isUserEditing.current) return;

    // 只有内容真正变了才更新 DOM
    if (processedHtml !== lastExternalHtml.current) {
      lastExternalHtml.current = processedHtml;
      editableRef.current.innerHTML = processedHtml;
    }
  }, [processedHtml, mode]);

  // 用户编辑 → 通知父组件保存，但不触发 React 重渲染到这个 div
  const handleInput = useCallback(() => {
    if (!editableRef.current || !onHtmlChange) return;
    isUserEditing.current = true;
    const currentHtml = editableRef.current.innerHTML;
    lastExternalHtml.current = currentHtml; // 同步，防止 useEffect 覆盖
    onHtmlChange(currentHtml);
    // 延迟重置标记，让 React 的 re-render 周期跑完
    setTimeout(() => { isUserEditing.current = false; }, 1000);
  }, [onHtmlChange]);

  // 粘贴：保留 HTML 格式
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const htmlData = e.clipboardData.getData("text/html");
    const textData = e.clipboardData.getData("text/plain");

    if (htmlData) {
      document.execCommand("insertHTML", false, normalizeImageStyles(htmlData));
    } else if (textData) {
      document.execCommand("insertText", false, textData);
    }
    handleInput();
  }, [handleInput]);

  // Enter → <br>
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      handleInput();
    }
    // Ctrl+Z / Ctrl+Y 不拦截，让浏览器原生处理
  }, [handleInput]);

  // 原始预览模式：只读 iframe
  if (mode === "raw") {
    const srcDoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body style="margin:0;padding:16px;font-family:-apple-system,sans-serif;">${normalizeImageStyles(html)}
<script>${js}<\/script></body></html>`;

    return (
      <div className="h-full flex flex-col">
        <div className="mx-auto w-full max-w-[414px] h-full border border-border rounded-xl overflow-hidden bg-white">
          <div className="h-6 bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-400">原始预览（只读）</span>
          </div>
          <iframe
            srcDoc={srcDoc}
            className="w-full flex-1 border-0"
            style={{ height: "calc(100% - 24px)" }}
            sandbox="allow-scripts"
            title="preview"
          />
        </div>
      </div>
    );
  }

  // 微信预览模式：contenteditable，浏览器原生 undo/redo
  return (
    <div className="h-full flex flex-col">
      <div className="mx-auto w-full max-w-[414px] h-full border border-border rounded-xl overflow-hidden bg-white">
        <div className="h-6 bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-400">公众号效果（可编辑）</span>
        </div>
        <style>{`
          .wx-editable img {
            border-radius: 8px !important;
            max-width: 100% !important;
            box-shadow: none !important;
            cursor: pointer;
          }
          .wx-editable img:hover {
            outline: 2px solid #A855F7;
            outline-offset: 2px;
          }
          .wx-editable:focus {
            outline: none;
          }
          .wx-editable *::selection {
            background: rgba(168, 85, 247, 0.3);
          }
          ${css}
        `}</style>
        <div
          ref={editableRef}
          className="wx-editable"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          style={{
            height: "calc(100% - 24px)",
            overflowY: "auto",
            padding: "16px",
            fontFamily: "-apple-system, sans-serif",
            fontSize: "16px",
            lineHeight: "1.8",
            color: "#333",
            cursor: "text",
          }}
        />
      </div>
    </div>
  );
}
