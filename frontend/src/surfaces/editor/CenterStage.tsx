import { useState, useMemo } from "react";
import Seg from "@/components/ui/Seg";
import { IconEye, IconSend } from "@/components/icons";

// ── Default content ──
const DEFAULT_HTML = `<!-- Hero -->
<section style="padding:40px 0 24px;text-align:center;">
  <section style="display:inline-block;padding:4px 16px;border:1px solid #c4b5a0;border-radius:20px;font-size:10px;color:#8a7e6e;letter-spacing:0.2em;">
    OPEN SOURCE EDITOR
  </section>
  <h1 style="font-size:26px;font-weight:700;margin:8px 0;color:#1a1714;line-height:1.35;">
    让公众号排版<br/>回归内容本身
  </h1>
  <p style="font-size:13px;color:#8a7e6e;margin:0;line-height:1.7;">
    MBEditor — 首款支持 AI Agent 的公众号编辑器
  </p>
</section>

<div style="height:1px;background:linear-gradient(90deg,transparent,#d4c9b8,transparent);margin:12px 0 24px;"></div>

<!-- 三种模式 -->
<div style="font-size:9px;color:#b8a99a;letter-spacing:0.3em;margin-bottom:6px;">WHAT IS MBEDITOR</div>
<h2 style="font-size:18px;font-weight:600;color:#1a1714;margin:0 0 10px;">三种模式，一个目标</h2>
<p style="font-size:13px;color:#5c5650;line-height:1.8;margin:0 0 16px;">
  好的编辑器应该让创作者忘记工具的存在。无论你习惯写代码、写 Markdown，还是直接拖拽排版。
</p>

<!-- Stats -->
<section style="display:flex;gap:12px;margin-top:20px;">
  <section style="flex:1;padding:14px 8px;background:#faf8f5;border-radius:8px;border:1px solid #ece6dd;text-align:center;">
    <section style="font-size:22px;font-weight:700;color:#e8553a;">3</section>
    <section style="font-size:10px;color:#8a7e6e;margin-top:2px;">编辑模式</section>
  </section>
  <section style="flex:1;padding:14px 8px;background:#faf8f5;border-radius:8px;border:1px solid #ece6dd;text-align:center;">
    <section style="font-size:22px;font-weight:700;color:#c4a76c;">100%</section>
    <section style="font-size:10px;color:#8a7e6e;margin-top:2px;">开源</section>
  </section>
  <section style="flex:1;padding:14px 8px;background:#faf8f5;border-radius:8px;border:1px solid #ece6dd;text-align:center;">
    <section style="font-size:22px;font-weight:700;color:#0d9488;">API</section>
    <section style="font-size:10px;color:#8a7e6e;margin-top:2px;">AI 原生</section>
  </section>
</section>`;

const DEFAULT_CSS = `/* MBEditor 示例样式 */
::selection { background: rgba(196,167,108,0.2); }

a {
  color: #c4a76c;
  text-decoration: none;
  border-bottom: 1px solid rgba(196,167,108,0.3);
}`;

const DEFAULT_JS = `// 阅读进度条 — 暖金色细线
(function() {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:#c4a76c;z-index:9999;transition:width 0.2s';
  document.body.appendChild(bar);
  window.addEventListener('scroll', function() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0';
  });
})();`;

// ── CenterStage ──
interface CenterStageProps {
  view: string;
  setView: (v: string) => void;
  tab: string;
  setTab: (t: string) => void;
  mode: string;
  saved: boolean;
  setSaved: (s: boolean) => void;
  selected: string;
}

export default function CenterStage({
  view,
  setView,
  tab,
  setTab,
  mode,
  saved,
  setSaved,
  selected,
}: CenterStageProps) {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);

  const showCode = view === "code" || view === "split";
  const showPrev = view === "preview" || view === "split";

  const currentCode = tab === "html" ? html : tab === "css" ? css : js;
  const setCurrentCode = tab === "html" ? setHtml : tab === "css" ? setCss : setJs;

  const lineCount = currentCode.split("\n").length;
  const wordCount = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").length;

  const handleCodeChange = (value: string) => {
    setCurrentCode(value);
    setSaved(false);
    // Auto-save simulation
    setTimeout(() => setSaved(true), 800);
  };

  // Build preview HTML with CSS + JS injected
  const previewHtml = useMemo(() => {
    return `<div style="font-family:'Noto Serif SC','Source Han Serif SC',serif;font-size:14px;line-height:1.8;color:#1A1512;padding:36px 28px 40px;background:#FAF6EB;">
      <style>${css}</style>
      ${html}
      <div style="text-align:center;margin-top:28px;font-size:10px;color:#b8a99a;letter-spacing:0.1em;">MBEditor · OPEN SOURCE · MIT</div>
    </div>`;
  }, [html, css]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        background: "var(--bg)",
      }}
    >
      {/* Sub toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div className="caps">编辑 &middot; STAGE</div>
        <div style={{ flex: 1 }} />

        <Seg
          options={[
            { value: "code", label: "代码" },
            { value: "split", label: "分屏" },
            { value: "preview", label: "预览" },
          ]}
          value={view}
          onChange={setView}
        />

        <span
          className="chip"
          style={{ color: saved ? "var(--forest)" : "var(--warn)" }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: saved ? "var(--forest)" : "var(--warn)",
            }}
          />
          {saved ? "已保存" : "编辑中"}
        </span>
        <button className="btn btn-outline btn-sm">
          <IconEye size={12} /> 预览
        </button>
        <button className="btn btn-primary btn-sm">
          <IconSend size={12} /> 投递草稿
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Code column — editable textarea */}
        {showCode && (
          <div
            style={{
              flex: showPrev ? 1 : 2,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              borderRight: showPrev ? "1px solid var(--border)" : "none",
            }}
          >
            {/* Lang tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-deep)",
              }}
            >
              {(["html", "css", "js"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    all: "unset",
                    padding: "8px 18px",
                    fontFamily: "var(--f-mono)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: tab === t ? "var(--fg)" : "var(--fg-4)",
                    background: tab === t ? "var(--surface)" : "transparent",
                    borderRight: "1px solid var(--border)",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {t}
                  {tab === t && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: -1,
                        height: 2,
                        background: "var(--accent)",
                      }}
                    />
                  )}
                </button>
              ))}
              <div style={{ flex: 1, borderBottom: "1px solid var(--border)" }} />
              <div
                style={{
                  padding: "8px 16px",
                  fontFamily: "var(--f-mono)",
                  fontSize: 10,
                  color: "var(--fg-5)",
                  letterSpacing: "0.1em",
                }}
              >
                UTF-8 &middot; LF &middot; {selected}
              </div>
            </div>

            {/* Editable code area */}
            <div style={{ flex: 1, display: "flex", minHeight: 0, background: "var(--bg-deep)" }}>
              {/* Line numbers */}
              <div
                style={{
                  padding: "14px 8px 14px 14px",
                  fontFamily: "var(--f-mono)",
                  fontSize: 12.5,
                  lineHeight: 1.75,
                  color: "var(--fg-5)",
                  userSelect: "none",
                  textAlign: "right",
                  minWidth: 36,
                  overflow: "hidden",
                }}
              >
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Textarea */}
              <textarea
                value={currentCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  background: "transparent",
                  color: "var(--fg-2)",
                  fontFamily: "var(--f-mono)",
                  fontSize: 12.5,
                  lineHeight: 1.75,
                  padding: "14px 20px 14px 8px",
                  overflow: "auto",
                  tabSize: 2,
                  whiteSpace: "pre",
                }}
              />
            </div>
          </div>
        )}

        {/* Preview column — live rendered HTML */}
        {showPrev && (
          <div
            className="dots-bg"
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--bg-deep)",
              padding: "32px 28px",
              overflow: "auto",
              position: "relative",
            }}
          >
            {/* Preview header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                maxWidth: 420,
                margin: "0 auto 14px",
                gap: 8,
              }}
            >
              <div className="caps">公众号预览 &middot; iPhone 15</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--fg-5)" }}>
                375 &times; 812
              </div>
            </div>

            {/* Live preview — contentEditable for direct editing */}
            <div
              style={{
                maxWidth: 420,
                margin: "0 auto",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                boxShadow: "0 24px 48px -24px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  // Sync edits back to HTML source
                  const el = e.currentTarget;
                  const style = el.querySelector("style");
                  if (style) style.remove();
                  // Strip wrapper div
                  const inner = el.innerHTML
                    .replace(/^<div[^>]*>/, "")
                    .replace(/<div[^>]*>MBEditor[^<]*<\/div>\s*<\/div>$/, "")
                    .trim();
                  if (inner && inner !== html) {
                    setHtml(inner);
                    setSaved(false);
                    setTimeout(() => setSaved(true), 800);
                  }
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Command bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "8px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-deep)",
          fontFamily: "var(--f-mono)",
          fontSize: 10,
          color: "var(--fg-4)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: "var(--forest)" }}>&bull; READY</span>
        <span>LN {lineCount}</span>
        <span>{mode.toUpperCase()}</span>
        <span>SELECTION &middot; {selected}</span>
        <div style={{ flex: 1 }} />
        <span>{wordCount.toLocaleString()} 字</span>
        <span>&middot; {(new Blob([html + css + js]).size / 1024).toFixed(1)}KB</span>
        <span>&middot; ⌘K COMMAND</span>
      </div>
    </div>
  );
}
