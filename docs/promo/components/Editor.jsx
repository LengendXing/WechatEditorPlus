/* global React, I, Chip, MonoLabel */
// Editor — 3-pane: Structure rail + Article (paper) + Agent co-pilot
// Novel layout: article renders on cream "paper" floating in dark shell; Agent
// panel is a persistent co-pilot with activity stream.

const { useState: useStateEd, useEffect: useEffectEd, useRef: useRefEd } = React;

const MOCK_BLOCKS = [
  { id: "b1", type: "hero",      label: "Hero · 标题组", preview: "让公众号排版回归内容本身", active: true, depth: 0 },
  { id: "b2", type: "section",   label: "Section · 什么是", preview: "三种模式，一个目标", depth: 0 },
  { id: "b3", type: "card",      label: "Card · HTML 模式", preview: "完全掌控每一个像素…", depth: 1 },
  { id: "b4", type: "card",      label: "Card · Markdown 模式", preview: "用最简洁的语法写作…", depth: 1 },
  { id: "b5", type: "card",      label: "Card · 可视化编辑", preview: "所见即所得…", depth: 1 },
  { id: "b6", type: "divider",   label: "Divider", preview: "——", depth: 0 },
  { id: "b7", type: "section",   label: "Section · HTML Showcase", preview: "纯 HTML 排版效果展示", depth: 0 },
  { id: "b8", type: "tags",      label: "Tags · 标签徽章", preview: "Hot · New · AI Agent…", depth: 1 },
  { id: "b9", type: "gradient",  label: "Gradient Card", preview: "Write Once, Publish Everywhere", depth: 1 },
  { id: "b10", type: "stats",    label: "Stats · 数据看板", preview: "3 · 100% · API", depth: 1 },
  { id: "b11", type: "timeline", label: "Timeline · 时间线", preview: "创建 → 编辑 → 发布", depth: 1 },
  { id: "b12", type: "code",     label: "Code · curl 示例", preview: "POST /api/v1/articles", depth: 1 },
];

const BLOCK_ICON = {
  hero: I.doc, section: I.doc, card: I.doc, divider: I.list,
  tags: I.list, gradient: I.image, stats: I.cpu, timeline: I.list,
  code: I.terminal,
};

function Editor({ articleId, go }) {
  const [selected, setSelected] = useStateEd("b1");
  const [mode, setMode] = useStateEd("html");        // html | markdown
  const [view, setView] = useStateEd("split");       // code | split | preview
  const [tab, setTab] = useStateEd("html");          // html | css | js
  const [agentOpen, setAgentOpen] = useStateEd(true);
  const [saved, setSaved] = useStateEd(true);

  return (
    <div style={{display:"grid", gridTemplateColumns:`280px 1fr ${agentOpen ? "360px" : "44px"}`, height:"100%", minHeight:0}}>
      <StructurePanel selected={selected} setSelected={setSelected} mode={mode} setMode={setMode}/>

      <CenterStage
        view={view} setView={setView}
        tab={tab} setTab={setTab}
        mode={mode}
        saved={saved} setSaved={setSaved}
        selected={selected}
      />

      <AgentCopilot open={agentOpen} setOpen={setAgentOpen}/>
    </div>
  );
}

// ---------------- Structure panel (left) ----------------
function StructurePanel({ selected, setSelected, mode, setMode }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column",
      borderRight:"1px solid var(--border)",
      background: "var(--bg-deep)",
      minHeight: 0, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{padding: "16px 20px 14px", borderBottom:"1px solid var(--border)"}}>
        <div className="caps" style={{marginBottom: 8}}>文件 · FILE</div>
        <input
          defaultValue="让公众号排版回归内容本身"
          style={{
            all:"unset", width:"100%",
            fontFamily:"var(--f-display)", fontSize: 20, lineHeight: 1.25,
            color:"var(--fg)",
          }}
        />
        <div style={{display:"flex", alignItems:"center", gap:8, marginTop:10}}>
          <div className="seg">
            <button className={mode==="html" ? "active":""} onClick={()=>setMode("html")}>HTML</button>
            <button className={mode==="markdown" ? "active":""} onClick={()=>setMode("markdown")}>MD</button>
          </div>
          <span className="mono" style={{fontSize:10, color:"var(--fg-5)", letterSpacing:"0.1em"}}>MB-2604-018</span>
        </div>
      </div>

      {/* Block tree */}
      <div style={{padding: "14px 12px 8px", borderBottom:"1px solid var(--border)"}}>
        <div className="caps" style={{padding:"0 8px 10px"}}>结构 · OUTLINE</div>
        <div>
          {MOCK_BLOCKS.map((b, i) => {
            const icoFn = BLOCK_ICON[b.type] || I.doc;
            const active = selected === b.id;
            return (
              <div key={b.id}
                onClick={()=>setSelected(b.id)}
                style={{
                  display:"flex", alignItems:"center", gap: 8,
                  padding: "6px 8px",
                  paddingLeft: 8 + b.depth * 14,
                  borderRadius: 4,
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-3)",
                  cursor:"pointer",
                  transition: "background 0.12s",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background="var(--surface)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background="transparent"; }}
              >
                {active && <span style={{position:"absolute", left:-1, top:6, bottom:6, width:2, background:"var(--accent)", borderRadius:2}}/>}
                <span className="mono tnum" style={{fontSize:9, color:"var(--fg-5)", width:16}}>{String(i+1).padStart(2,"0")}</span>
                {icoFn(12)}
                <div style={{flex:1, minWidth:0, lineHeight:1.2}}>
                  <div style={{fontSize:12, color: active ? "var(--fg)" : "var(--fg-2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                    {b.label}
                  </div>
                  <div className="mono" style={{fontSize:9, color:"var(--fg-5)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                    {b.preview}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Images */}
      <div style={{padding: "14px 20px 14px"}}>
        <div className="caps" style={{marginBottom: 10}}>素材 · ASSETS</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6}}>
          {["#C14A3A","#C4A76C","#6B9872","#7588B8","#8A6D5B","#302629"].map((c,i)=>(
            <div key={i} style={{
              aspectRatio:"1", borderRadius: 4, position:"relative", overflow:"hidden",
              background: `linear-gradient(135deg, ${c}, ${c}88)`,
              border: "1px solid var(--border-2)",
            }}>
              <div style={{position:"absolute", inset:0, backgroundImage:`repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,0.04) 4px 5px)`}}/>
              <span style={{position:"absolute", left:4, bottom:2, fontFamily:"var(--f-mono)", fontSize:8, color:"#fff8", letterSpacing:"0.1em"}}>
                {String(i+1).padStart(2,"0")}
              </span>
            </div>
          ))}
          <div style={{aspectRatio:"1", borderRadius: 4, border:"1px dashed var(--border-2)", display:"grid", placeItems:"center", color:"var(--fg-4)"}}>
            {I.plus(14)}
          </div>
        </div>
      </div>

      <div style={{flex:1}}/>

      {/* Footer */}
      <div style={{padding:"12px 20px", borderTop:"1px solid var(--border)", fontFamily:"var(--f-mono)", fontSize:10, color:"var(--fg-5)", display:"flex", justifyContent:"space-between"}}>
        <span>12 BLOCKS</span>
        <span>· · ·</span>
        <span>2,340 字</span>
      </div>
    </div>
  );
}

// ---------------- Center stage: code + paper preview ----------------
function CenterStage({ view, setView, tab, setTab, mode, saved, setSaved, selected }) {
  const showCode = view==="code" || view==="split";
  const showPrev = view==="preview" || view==="split";

  return (
    <div style={{display:"flex", flexDirection:"column", minHeight:0, minWidth:0, background: "var(--bg)"}}>
      {/* Sub toolbar */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding: "10px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <div className="caps">编辑 · STAGE</div>
        <div style={{flex:1}}/>

        <div className="seg">
          <button className={view==="code"?"active":""} onClick={()=>setView("code")}>代码</button>
          <button className={view==="split"?"active":""} onClick={()=>setView("split")}>分屏</button>
          <button className={view==="preview"?"active":""} onClick={()=>setView("preview")}>预览</button>
        </div>

        <span className="chip" style={{color: saved ? "var(--forest)" : "var(--warn)"}}>
          <span style={{width:6, height:6, borderRadius:"50%", background: saved ? "var(--forest)":"var(--warn)"}}/>
          {saved ? "已保存" : "保存中"}
        </span>
        <button className="btn btn-outline btn-sm">{I.eye(12)} 预览</button>
        <button className="btn btn-primary btn-sm">{I.send(12)} 投递草稿</button>
      </div>

      <div style={{display:"flex", flex:1, minHeight:0}}>
        {/* Code column */}
        {showCode && (
          <div style={{flex: showPrev?1:2, display:"flex", flexDirection:"column", minWidth:0, borderRight: showPrev?"1px solid var(--border)":"none"}}>
            {/* Lang tabs */}
            <div style={{display:"flex", borderBottom:"1px solid var(--border)", background:"var(--bg-deep)"}}>
              {["html","css","js"].map(t=>(
                <button key={t}
                  onClick={()=>setTab(t)}
                  style={{
                    all:"unset",
                    padding:"8px 18px",
                    fontFamily:"var(--f-mono)", fontSize: 11,
                    textTransform:"uppercase", letterSpacing:"0.1em",
                    color: tab===t ? "var(--fg)" : "var(--fg-4)",
                    background: tab===t ? "var(--surface)" : "transparent",
                    borderRight: "1px solid var(--border)",
                    cursor:"pointer",
                    position:"relative",
                  }}>
                  {t}
                  {tab===t && <span style={{position:"absolute", left:0, right:0, bottom:-1, height:2, background:"var(--accent)"}}/>}
                </button>
              ))}
              <div style={{flex:1, borderBottom:"1px solid var(--border)"}}/>
              <div style={{padding:"8px 16px", fontFamily:"var(--f-mono)", fontSize:10, color:"var(--fg-5)", letterSpacing:"0.1em"}}>
                UTF-8 · LF · {selected}
              </div>
            </div>

            <CodePane tab={tab}/>
          </div>
        )}

        {/* Preview column — paper inside dark shell */}
        {showPrev && (
          <div style={{
            flex: 1, minWidth: 0,
            background:"var(--bg-deep)",
            padding: "32px 28px",
            overflow: "auto",
            position: "relative",
          }} className="dots-bg">
            {/* Preview header */}
            <div style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              maxWidth: 420, margin: "0 auto 14px", gap: 8,
            }}>
              <div className="caps">公众号预览 · iPhone 15</div>
              <div className="mono" style={{fontSize:10, color:"var(--fg-5)"}}>375 × 812</div>
            </div>

            <ArticlePreview/>
          </div>
        )}
      </div>

      {/* Command bar */}
      <div style={{
        display:"flex", alignItems:"center", gap: 14,
        padding: "8px 20px",
        borderTop:"1px solid var(--border)",
        background:"var(--bg-deep)",
        fontFamily:"var(--f-mono)", fontSize: 10,
        color:"var(--fg-4)", letterSpacing:"0.08em", textTransform:"uppercase",
      }}>
        <span style={{color:"var(--forest)"}}>● READY</span>
        <span>LN 42 · COL 8</span>
        <span>{mode.toUpperCase()}</span>
        <span>SELECTION · {selected}</span>
        <div style={{flex:1}}/>
        <span>2,340 字</span>
        <span>· 16KB</span>
        <span>· ⌘K COMMAND</span>
      </div>
    </div>
  );
}

// ---------------- Mock code pane with syntax highlight ----------------
function CodePane({ tab }) {
  const lines = tab === "html" ? HTML_LINES : tab === "css" ? CSS_LINES : JS_LINES;
  return (
    <div style={{flex:1, overflow:"auto", background:"var(--bg-deep)", padding: "14px 0"}}>
      <pre style={{margin:0, fontFamily:"var(--f-mono)", fontSize:12.5, lineHeight:1.75, color:"var(--fg-2)"}}>
        {lines.map((ln, i) => (
          <div key={i} style={{display:"flex", gap:16, padding:"0 20px 0 14px"}}>
            <span style={{width:28, textAlign:"right", color:"var(--fg-5)", userSelect:"none", flexShrink:0}}>{i+1}</span>
            <span style={{whiteSpace:"pre-wrap", wordBreak:"break-word"}} dangerouslySetInnerHTML={{__html: ln}}/>
          </div>
        ))}
      </pre>
    </div>
  );
}

const COL = {
  kw: "#C14A3A", attr: "#C4A76C", str: "#6B9872", com: "#6B5E55",
  tag: "#D97860", punc: "#A89A87", num: "#7588B8",
};
const c = (s, k) => `<span style="color:${COL[k]}">${s}</span>`;

const HTML_LINES = [
  `${c("&lt;!-- Hero --&gt;", "com")}`,
  `${c("&lt;section", "tag")} ${c("style", "attr")}=${c(`"padding:40px 0 24px;text-align:center;"`, "str")}${c("&gt;", "tag")}`,
  `  ${c("&lt;section", "tag")} ${c("style", "attr")}=${c(`"display:inline-block;padding:4px 16px;"`, "str")}${c("&gt;", "tag")}`,
  `    OPEN SOURCE EDITOR`,
  `  ${c("&lt;/section&gt;", "tag")}`,
  `  ${c("&lt;h1", "tag")} ${c("style", "attr")}=${c(`"font-size:26px;font-weight:700;"`, "str")}${c("&gt;", "tag")}`,
  `    让公众号排版<span style="color:var(--gold)">&lt;br/&gt;</span>回归内容本身`,
  `  ${c("&lt;/h1&gt;", "tag")}`,
  `  ${c("&lt;p", "tag")} ${c("style", "attr")}=${c(`"font-size:15px;color:#8a7e6e;"`, "str")}${c("&gt;", "tag")}`,
  `    MBEditor — 首款支持 AI Agent 的公众号编辑器`,
  `  ${c("&lt;/p&gt;", "tag")}`,
  `${c("&lt;/section&gt;", "tag")}`,
  ``,
  `${c("&lt;!-- Stats Grid --&gt;", "com")}`,
  `${c("&lt;section", "tag")} ${c("style", "attr")}=${c(`"display:flex;gap:12px;"`, "str")}${c("&gt;", "tag")}`,
  `  ${c("&lt;section", "tag")} ${c("style", "attr")}=${c(`"flex:1;padding:20px 16px;"`, "str")}${c("&gt;", "tag")}`,
  `    ${c("&lt;section", "tag")} ${c("style", "attr")}=${c(`"font-size:28px;color:#e8553a;"`, "str")}${c("&gt;", "tag")}3${c("&lt;/section&gt;", "tag")}`,
  `    ${c("&lt;section", "tag")} ${c("style", "attr")}=${c(`"font-size:12px;color:#8a7e6e;"`, "str")}${c("&gt;", "tag")}编辑模式${c("&lt;/section&gt;", "tag")}`,
  `  ${c("&lt;/section&gt;", "tag")}`,
  `${c("&lt;/section&gt;", "tag")}`,
];

const CSS_LINES = [
  `${c("/* MBEditor 示例样式 */", "com")}`,
  `${c("::selection", "kw")} { ${c("background", "attr")}: ${c("rgba(196,167,108,0.2)", "num")}; }`,
  ``,
  `${c("a", "kw")} {`,
  `  ${c("color", "attr")}: ${c("#c4a76c", "num")};`,
  `  ${c("text-decoration", "attr")}: ${c("none", "str")};`,
  `  ${c("border-bottom", "attr")}: ${c("1px solid rgba(196,167,108,0.3)", "num")};`,
  `}`,
];

const JS_LINES = [
  `${c("// 阅读进度条 — 暖金色细线", "com")}`,
  `${c("(function", "kw")}() {`,
  `  ${c("const", "kw")} bar = document.${c("createElement", "attr")}(${c("'div'", "str")});`,
  `  bar.style.${c("cssText", "attr")} = ${c("'position:fixed;top:0;left:0;height:2px;background:#c4a76c'", "str")};`,
  `  document.body.${c("appendChild", "attr")}(bar);`,
  `  window.${c("addEventListener", "attr")}(${c("'scroll'", "str")}, ${c("function", "kw")}() {`,
  `    ${c("const", "kw")} h = document.documentElement.scrollHeight - window.innerHeight;`,
  `    bar.style.width = h &gt; ${c("0", "num")} ? (window.scrollY / h * ${c("100", "num")}) + ${c("'%'", "str")} : ${c("'0'", "str")};`,
  `  });`,
  `})();`,
];

// ---------------- Paper article preview (phone-ish) ----------------
function ArticlePreview() {
  return (
    <div className="paper" style={{
      maxWidth: 420, margin: "0 auto",
      padding: "36px 28px 40px",
      fontSize: 14,
    }}>
      {/* Hero */}
      <div style={{textAlign:"center", paddingBottom: 16}}>
        <div style={{
          display:"inline-block", padding:"4px 16px",
          border:"1px solid #c4b5a0", borderRadius: 20,
          fontSize: 10, color:"#8a7e6e", letterSpacing:"0.2em",
          marginBottom: 16,
        }}>OPEN SOURCE EDITOR</div>
        <h1 style={{fontSize: 26, fontWeight: 700, margin:"8px 0", color:"#1a1714", lineHeight: 1.35, fontFamily:"var(--f-display)"}}>
          让公众号排版<br/>回归内容本身
        </h1>
        <p style={{fontSize: 13, color:"#8a7e6e", margin: 0, lineHeight: 1.7}}>
          MBEditor — 首款支持 AI Agent 的公众号编辑器
        </p>
      </div>

      <div style={{height:1, background: "linear-gradient(90deg, transparent, #d4c9b8, transparent)", margin:"12px 0 24px"}}/>

      {/* Section label */}
      <div style={{fontSize:9, color:"#b8a99a", letterSpacing:"0.3em", marginBottom: 6}}>WHAT IS MBEDITOR</div>
      <h2 style={{fontSize: 18, fontWeight: 600, color:"#1a1714", margin:"0 0 10px", fontFamily:"var(--f-display)"}}>
        三种模式，一个目标
      </h2>
      <p style={{fontSize: 13, color:"#5c5650", lineHeight: 1.8, margin:"0 0 16px"}}>
        好的编辑器应该让创作者忘记工具的存在。无论你习惯写代码、写 Markdown，还是直接拖拽排版。
      </p>

      {/* Three mode cards */}
      {[
        {t:"HTML 模式", d:"完全掌控每一个像素。HTML / CSS / JS 三栏编辑。"},
        {t:"Markdown 模式", d:"用最简洁的语法写作，自动转换为精美排版。"},
        {t:"可视化编辑", d:"所见即所得，在预览区直接编辑。"},
      ].map((c,i)=>(
        <div key={i} style={{
          padding: "14px 16px",
          background:"#faf8f5",
          borderRadius: 8,
          border:"1px solid #ece6dd",
          marginBottom: 10,
        }}>
          <div style={{fontSize: 13, fontWeight: 600, color:"#1a1714", marginBottom: 3}}>{c.t}</div>
          <div style={{fontSize: 11, color:"#8a7e6e", lineHeight: 1.7}}>{c.d}</div>
        </div>
      ))}

      {/* Stats grid */}
      <div style={{height:1, background: "linear-gradient(90deg, transparent, #d4c9b8, transparent)", margin:"20px 0"}}/>
      <div style={{fontSize:9, color:"#b8a99a", letterSpacing:"0.3em", marginBottom: 10}}>STATS</div>
      <div style={{display:"flex", gap: 8}}>
        {[{n:"3",l:"编辑模式",c:"#e8553a"},{n:"100%",l:"开源",c:"#c4a76c"},{n:"API",l:"AI 原生",c:"#0d9488"}].map((s,i)=>(
          <div key={i} style={{flex:1, padding:"14px 8px", background:"#faf8f5", borderRadius:8, border:"1px solid #ece6dd", textAlign:"center"}}>
            <div style={{fontSize:22, fontWeight:700, color:s.c, fontFamily:"var(--f-display)"}}>{s.n}</div>
            <div style={{fontSize:10, color:"#8a7e6e", marginTop: 2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Code block */}
      <div style={{marginTop: 20, background:"#1c1b1a", borderRadius: 8, padding: "14px 16px", fontFamily:"var(--f-mono)", fontSize:10.5, lineHeight: 1.8, color:"#a09888"}}>
        <div style={{color:"#6b8e6b"}}># 创建一篇新文章</div>
        <div>curl -X POST /api/v1/articles</div>
        <div style={{color:"#6b8e6b", marginTop:6}}># 推送到草稿箱</div>
        <div>curl -X POST /api/v1/publish</div>
      </div>

      {/* Footer */}
      <div style={{textAlign:"center", marginTop: 28, fontSize:10, color:"#b8a99a", letterSpacing:"0.1em"}}>
        MBEditor · OPEN SOURCE · MIT
      </div>
    </div>
  );
}

// ---------------- Agent Co-Pilot (right) ----------------
const MOCK_AGENT_STREAM = [
  { t:"17:02:14", kind:"user", text:"把第三段卡片改成带图的样式，图用刚上传的 warm 01" },
  { t:"17:02:15", kind:"think", text:"识别 Block b4 · Card · Markdown 模式" },
  { t:"17:02:16", kind:"tool", method:"GET", path:"/api/v1/articles/MB-2604-018" },
  { t:"17:02:17", kind:"tool", method:"PUT", path:"/api/v1/articles/MB-2604-018" },
  { t:"17:02:18", kind:"diff", add:6, remove:2, hint:"Card b4 + img" },
  { t:"17:02:19", kind:"assistant", text:"已为卡片 Markdown 模式加上顶部图片，保留原文字节奏。需要同步到其他卡片吗？" },
  { t:"17:04:03", kind:"user", text:"预览一下微信兼容样式" },
  { t:"17:04:04", kind:"tool", method:"POST", path:"/api/v1/publish/preview" },
  { t:"17:04:05", kind:"assistant", text:"已内联所有 CSS，剥除 Wx 不兼容属性。可推送草稿。" },
];

function AgentCopilot({ open, setOpen }) {
  const [input, setInput] = useStateEd("");
  const [stream, setStream] = useStateEd(MOCK_AGENT_STREAM);
  const scrollerRef = useRefEd(null);

  useEffectEd(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [stream]);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    const newItems = [
      { t, kind:"user", text: input },
      { t, kind:"think", text: "分析意图 · 规划调用链" },
      { t, kind:"tool", method:"POST", path:"/api/v1/publish/process" },
      { t, kind:"assistant", text: "已按要求处理，可在预览中查看效果。" },
    ];
    setStream(prev => [...prev, ...newItems]);
    setInput("");
  };

  if (!open) {
    return (
      <div style={{
        borderLeft: "1px solid var(--border)",
        background: "var(--bg-deep)",
        display:"flex", flexDirection:"column", alignItems:"center", padding: "12px 0",
      }}>
        <button className="rail-btn active" onClick={()=>setOpen(true)} title="打开 Agent 面板">{I.agent(16)}</button>
        <div className="rail-vlabel" style={{marginTop: 18}}>
          CLAUDE · AGENT · CO-PILOT
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      borderLeft:"1px solid var(--border)",
      background: "var(--bg-deep)",
      minHeight: 0, overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{padding:"16px 20px 14px", borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom: 8}}>
          <div style={{width:28, height:28, borderRadius:"50%", background:"var(--gold-soft)", border:"1px solid var(--gold-border)", display:"grid", placeItems:"center", color:"var(--gold)"}}>
            {I.agent(14)}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13, color:"var(--fg)", fontFamily:"var(--f-display)", fontSize:16}}>Claude · Agent</div>
            <div className="mono" style={{fontSize:10, color:"var(--fg-4)"}}>claude-sonnet-4.5 · mbeditor.skill</div>
          </div>
          <button onClick={()=>setOpen(false)} className="btn btn-ghost btn-sm" style={{padding:4}}>{I.close(12)}</button>
        </div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          <Chip tone="forest"><span className="pulse" style={{width:6,height:6}}/>LIVE</Chip>
          <Chip tone="gold">已连接编辑器</Chip>
          <Chip>3 TOOLS</Chip>
        </div>
      </div>

      {/* Stream */}
      <div ref={scrollerRef} style={{flex:1, overflow:"auto", padding: "14px 18px", minHeight:0}}>
        <div className="caps" style={{marginBottom:10}}>活动流 · STREAM</div>
        {stream.map((e, i) => <AgentStreamItem key={i} e={e}/>)}
      </div>

      {/* Suggested actions */}
      <div style={{padding: "10px 18px", borderTop:"1px solid var(--border)"}}>
        <div className="caps" style={{marginBottom:8}}>建议 · SUGGESTED</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {["生成封面图", "改写第一段", "加入对比表格", "推送到草稿箱"].map(t => (
            <button key={t} className="btn btn-outline btn-sm" style={{fontSize:11}}>{t}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{padding: "12px 16px 16px", borderTop:"1px solid var(--border)"}}>
        <div style={{
          display:"flex", alignItems:"center",
          padding: "6px 6px 6px 14px",
          border:"1px solid var(--border-2)", borderRadius: 10,
          background: "var(--surface)",
        }}>
          <span className="mono" style={{color:"var(--accent)", fontSize:12, marginRight: 8}}>→</span>
          <input
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") send(); }}
            placeholder="给 Agent 下一条指令…"
            style={{all:"unset", flex:1, fontSize:13, color:"var(--fg)", fontFamily:"var(--f-sans)"}}
          />
          <button onClick={send} className="btn btn-primary btn-sm" style={{padding:"6px 10px"}}>
            {I.send(12)}
          </button>
        </div>
        <div className="mono" style={{marginTop: 8, fontSize: 10, color:"var(--fg-5)", display:"flex", justifyContent:"space-between"}}>
          <span>⌘↵ 发送 · ⎋ 撤销最后一步</span>
          <span>{stream.filter(e=>e.kind==="tool").length} TOOL CALLS</span>
        </div>
      </div>
    </div>
  );
}

function AgentStreamItem({ e }) {
  if (e.kind === "user") {
    return (
      <div className="slide-up" style={{marginBottom: 12}}>
        <div className="mono" style={{fontSize: 9, color:"var(--fg-5)", letterSpacing:"0.1em", marginBottom: 4}}>
          USER · {e.t}
        </div>
        <div style={{padding:"8px 12px", background:"var(--surface-2)", borderRadius:8, borderLeft:"2px solid var(--fg-4)", fontSize:13, color:"var(--fg-2)", lineHeight:1.6}}>
          {e.text}
        </div>
      </div>
    );
  }
  if (e.kind === "assistant") {
    return (
      <div className="slide-up" style={{marginBottom: 12}}>
        <div className="mono" style={{fontSize: 9, color:"var(--gold)", letterSpacing:"0.1em", marginBottom: 4}}>
          CLAUDE · {e.t}
        </div>
        <div style={{padding:"8px 12px", background:"var(--gold-soft)", borderRadius:8, borderLeft:"2px solid var(--gold)", fontSize:13, color:"var(--fg)", lineHeight:1.6, fontFamily:"var(--f-sans)"}}>
          {e.text}
        </div>
      </div>
    );
  }
  if (e.kind === "think") {
    return (
      <div className="slide-up" style={{marginBottom: 8, display:"flex", gap:8, alignItems:"center", color:"var(--fg-4)", fontSize:11, fontFamily:"var(--f-mono)"}}>
        <span style={{opacity:0.5}}>◇</span>
        <span style={{fontStyle:"italic"}}>{e.text}</span>
      </div>
    );
  }
  if (e.kind === "tool") {
    return (
      <div className="slide-up" style={{marginBottom: 8, padding:"5px 8px", background:"var(--surface)", borderRadius: 4, fontFamily:"var(--f-mono)", fontSize: 10.5, display:"flex", alignItems:"center", gap: 8}}>
        <span style={{color: e.method==="POST" ? "var(--accent)" : e.method==="PUT" ? "var(--warn)" : "var(--info)", fontWeight: 600}}>{e.method}</span>
        <span style={{color:"var(--fg-2)"}}>{e.path}</span>
        <span style={{flex:1}}/>
        <span style={{color:"var(--forest)"}}>200</span>
      </div>
    );
  }
  if (e.kind === "diff") {
    return (
      <div className="slide-up" style={{marginBottom: 10, padding:"8px 10px", border:"1px solid var(--border-2)", borderRadius: 6, background: "var(--surface)"}}>
        <div className="mono" style={{fontSize:10, color:"var(--fg-4)", marginBottom: 4}}>DIFF · {e.hint}</div>
        <div style={{display:"flex", gap:10, fontFamily:"var(--f-mono)", fontSize: 10.5}}>
          <span style={{color:"var(--forest)"}}>+{e.add}</span>
          <span style={{color:"var(--accent)"}}>−{e.remove}</span>
          <span style={{flex:1, display:"flex", gap:2}}>
            {[...Array(e.add)].map((_,i)=><span key={"a"+i} style={{flex:1, height:3, background:"var(--forest)", opacity:0.7}}/>)}
            {[...Array(e.remove)].map((_,i)=><span key={"r"+i} style={{flex:1, height:3, background:"var(--accent)", opacity:0.6}}/>)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

Object.assign(window, { Editor });
