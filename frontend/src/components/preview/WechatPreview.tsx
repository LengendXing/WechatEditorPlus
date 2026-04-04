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
    (match, before, style, after) => {
      // 去掉 box-shadow，确保有 border-radius 和 max-width
      let s = style
        .replace(/box-shadow:[^;]+;?/gi, "")
        .replace(/border-radius:[^;]+;?/gi, "");
      s = `border-radius:8px;max-width:100%;${s}`;
      return `<img${before}style="${s}"${after}>`;
    }
  ).replace(
    /<img\b(?![^>]*style=)([^>]*?)>/gi,
    (match, attrs) => {
      return `<img style="border-radius:8px;max-width:100%;"${attrs}>`;
    }
  );
}

export default function WechatPreview({ html, css, js, mode, onHtmlChange }: WechatPreviewProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const isUserEditing = useRef(false);

  // 处理后的 HTML（图片圆角、无阴影）
  const processedHtml = useMemo(() => normalizeImageStyles(html), [html]);

  // 同步外部 html 变化到 contenteditable（仅在非用户编辑时）
  useEffect(() => {
    if (mode === "wechat" && editableRef.current && !isUserEditing.current) {
      editableRef.current.innerHTML = processedHtml;
    }
  }, [processedHtml, mode]);

  // 用户编辑后同步回父组件
  const handleInput = useCallback(() => {
    if (!editableRef.current || !onHtmlChange) return;
    isUserEditing.current = true;
    onHtmlChange(editableRef.current.innerHTML);
    // 短暂标记为用户编辑中，防止外部更新覆盖光标位置
    setTimeout(() => { isUserEditing.current = false; }, 500);
  }, [onHtmlChange]);

  // 处理粘贴：只粘贴纯文本或 HTML，不带外部格式
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const htmlData = e.clipboardData.getData("text/html");
    const textData = e.clipboardData.getData("text/plain");

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    sel.deleteFromDocument();

    if (htmlData) {
      // 插入 HTML
      const frag = document.createRange().createContextualFragment(normalizeImageStyles(htmlData));
      sel.getRangeAt(0).insertNode(frag);
    } else if (textData) {
      // 纯文本
      const textNode = document.createTextNode(textData);
      sel.getRangeAt(0).insertNode(textNode);
    }

    // 移动光标到插入内容后面
    sel.collapseToEnd();
    handleInput();
  }, [handleInput]);

  // 处理图片拖拽进入
  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    // 让父组件的图片上传逻辑处理
    // 这里不阻止默认行为，让浏览器自然处理
  }, []);

  // 处理按键：Enter 插入 <br> 而非 <div>
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      handleInput();
    }
  }, [handleInput]);

  // 原始预览模式：只读 iframe
  if (mode === "raw") {
    const srcDoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body style="margin:0;padding:16px;font-family:-apple-system,sans-serif;">${processedHtml}
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

  // 微信预览模式：可编辑
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
          onDrop={handleDrop}
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
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      </div>
    </div>
  );
}
