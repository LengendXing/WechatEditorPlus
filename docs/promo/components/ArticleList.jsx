/* global React, I, Chip, MonoLabel */
// Article List — the稿库 surface
// Novel moves: index-page editorial layout, left meta column with dates+status,
// large serif titles, no cards — a typographic ledger.

const { useState: useStateLi, useMemo: useMemoLi } = React;

const MOCK_ARTICLES = [
  { id: "a01", title: "让 Agent 写出可直接投递的公众号文章", mode: "html", status: "草稿", updated: "12分钟前", words: 3420, cover: "warm", author: "Claude", stamp: "MB-2604-018" },
  { id: "a02", title: "从命令行到草稿箱：MBEditor 工作流全景", mode: "markdown", status: "已投递", updated: "今天 09:12", words: 5180, cover: "terminal", author: "Anson", stamp: "MB-2604-017" },
  { id: "a03", title: "为什么我不再手动排版公众号", mode: "html", status: "草稿", updated: "昨天 23:47", words: 2140, cover: "paper", author: "Claude", stamp: "MB-2604-016" },
  { id: "a04", title: "Docker 一行命令部署自己的编辑器", mode: "markdown", status: "已投递", updated: "2天前", words: 1860, cover: "neon", author: "Codex", stamp: "MB-2604-015" },
  { id: "a05", title: "把 Skill 装进 Claude Code —— 15 分钟上手", mode: "html", status: "草稿", updated: "2天前", words: 4720, cover: "earth", author: "Claude", stamp: "MB-2604-014" },
  { id: "a06", title: "Markdown 模式 × 瑞士极简主题的排版实验", mode: "markdown", status: "审稿中", updated: "3天前", words: 3010, cover: "swiss", author: "Anson", stamp: "MB-2604-013" },
  { id: "a07", title: "RESTful 公众号：API 设计笔记", mode: "html", status: "草稿", updated: "5天前", words: 2680, cover: "warm", author: "Claude", stamp: "MB-2604-012" },
  { id: "a08", title: "从选题到发布，完全自动化的一天", mode: "markdown", status: "已投递", updated: "1周前", words: 6120, cover: "terminal", author: "Codex", stamp: "MB-2604-011" },
];

function statusTone(s) {
  if (s === "已投递") return "forest";
  if (s === "审稿中") return "warn";
  if (s === "草稿") return "gold";
  return "";
}

// Decorative placeholder cover — striped SVG, not an illustration
function CoverTile({ variant }) {
  const variants = {
    warm:     { from: "#C14A3A", to: "#8A3B2E", stripe: "#D97860" },
    terminal: { from: "#1A1714", to: "#2A2225", stripe: "#C4A76C" },
    paper:    { from: "#F0E8D8", to: "#C4A76C", stripe: "#8A6D5B" },
    neon:     { from: "#7588B8", to: "#3D3730", stripe: "#C4A76C" },
    earth:    { from: "#8A6D5B", to: "#C89458", stripe: "#F0E8D8" },
    swiss:    { from: "#141013", to: "#302629", stripe: "#F0E8D8" },
  };
  const v = variants[variant] || variants.warm;
  return (
    <div style={{
      width: 56, height: 72, borderRadius: 4, overflow: "hidden",
      background: `linear-gradient(135deg, ${v.from}, ${v.to})`,
      position: "relative", flexShrink: 0,
      boxShadow: "0 4px 10px -4px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 10px, ${v.stripe}22 10px, ${v.stripe}22 11px)`,
      }}/>
      <div style={{
        position: "absolute", left: 5, right: 5, bottom: 5,
        height: 6, background: v.stripe, opacity: 0.85, borderRadius: 1,
      }}/>
      <div style={{
        position: "absolute", left: 5, top: 6,
        fontFamily: "var(--f-mono)", fontSize: 7,
        letterSpacing: 0.5, color: v.stripe, opacity: 0.85,
      }}>MB</div>
    </div>
  );
}

function ArticleList({ go }) {
  const [q, setQ] = useStateLi("");
  const [tab, setTab] = useStateLi("全部");
  const [sort, setSort] = useStateLi("updated");

  const tabs = ["全部", "草稿", "审稿中", "已投递", "回收站"];

  const filtered = useMemoLi(() => {
    return MOCK_ARTICLES.filter(a => {
      if (tab !== "全部" && a.status !== tab) return false;
      if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, tab]);

  const openEditor = (id) => go("editor", { articleId: id });

  return (
    <div style={{height:"100%", overflow:"auto", background:"var(--bg)"}}>
      {/* Editorial masthead */}
      <div style={{maxWidth: 1280, margin: "0 auto", padding: "48px 48px 20px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 32}}>
          <div style={{flex:1}}>
            <div style={{display:"flex", alignItems:"baseline", gap:12, marginBottom: 10}}>
              <span className="caps">EDITION № 2604 · 稿件总库</span>
              <div className="hair-rule" style={{flex:1}}/>
              <span className="caps tnum">{MOCK_ARTICLES.length.toString().padStart(3,"0")} / ENTRIES</span>
            </div>
            <h1 className="title-serif" style={{fontSize:72, margin:"10px 0 8px", color:"var(--fg)"}}>
              稿&nbsp;库<span style={{color:"var(--accent)"}}>.</span>
            </h1>
            <p style={{margin:"6px 0 0", color:"var(--fg-3)", fontSize:14, fontFamily:"var(--f-display)", fontStyle:"italic", letterSpacing:"0.01em"}}>
              A desk where Agent and editor share a draft table.
            </p>
          </div>
          <div style={{textAlign:"right", fontFamily:"var(--f-mono)", fontSize:11, color:"var(--fg-4)", lineHeight:1.7}}>
            <div>LOCAL · {new Date().toLocaleDateString("zh-CN")}</div>
            <div>AGENT · <span style={{color:"var(--gold)"}}>CLAUDE · CODEX · OPENCLAW</span></div>
            <div>ENDPOINT · :7072/api/v1</div>
            <div style={{marginTop:8, color:"var(--fg-2)", fontSize:14, fontFamily:"var(--f-display)"}}>
              &mdash; Vol. III, folio iv
            </div>
          </div>
        </div>

        {/* Filters row */}
        <div style={{display:"flex", alignItems:"center", gap:16, marginTop: 32, paddingBottom:14, borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex", gap:2}}>
            {tabs.map(t => (
              <button key={t}
                onClick={()=>setTab(t)}
                className="btn btn-ghost btn-sm"
                style={{
                  color: tab===t ? "var(--fg)" : "var(--fg-4)",
                  background: tab===t ? "var(--surface-2)" : "transparent",
                  fontFamily: "var(--f-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: 11,
                  padding: "6px 10px",
                }}
              >
                {t} <span className="tnum" style={{marginLeft:4, opacity:0.5}}>{t==="全部" ? MOCK_ARTICLES.length : MOCK_ARTICLES.filter(a=>a.status===t).length}</span>
              </button>
            ))}
          </div>
          <div style={{flex:1}}/>
          <div style={{position:"relative"}}>
            {I.search(12)}
            <input
              value={q} onChange={e=>setQ(e.target.value)}
              placeholder="搜索标题 · grep"
              style={{
                all: "unset",
                fontFamily: "var(--f-mono)", fontSize: 12,
                padding: "6px 10px 6px 26px",
                borderBottom: "1px solid var(--border-2)",
                color: "var(--fg-2)",
                width: 180,
              }}
            />
            <span style={{position:"absolute", left:6, top:"50%", transform:"translateY(-50%)", color:"var(--fg-4)"}}>{I.search(12)}</span>
          </div>
          <select
            value={sort} onChange={e=>setSort(e.target.value)}
            style={{
              all:"unset", fontFamily:"var(--f-mono)", fontSize:11, textTransform:"uppercase",
              letterSpacing:"0.08em", color:"var(--fg-3)", padding:"6px 10px",
              border:"1px solid var(--border-2)", borderRadius: 4, cursor:"pointer",
            }}>
            <option value="updated">↓ 最近修改</option>
            <option value="created">↓ 创建时间</option>
            <option value="words">↓ 字数</option>
          </select>
          <button
            className="btn btn-primary btn-sm"
            onClick={()=>openEditor("new")}
          >
            {I.plus(12)} 新建
          </button>
        </div>
      </div>

      {/* Ledger-style list */}
      <div style={{maxWidth: 1280, margin: "0 auto", padding: "0 48px 80px"}}>
        <div style={{display:"grid", gridTemplateColumns:"48px 72px 1fr 160px 120px 80px 40px", alignItems:"center", padding: "10px 8px", borderBottom:"1px solid var(--border)"}}>
          <span className="caps">№</span>
          <span className="caps">封面</span>
          <span className="caps">标题 / TITLE</span>
          <span className="caps">签署</span>
          <span className="caps">状态</span>
          <span className="caps tnum">字数</span>
          <span/>
        </div>

        {filtered.map((a, i) => (
          <div key={a.id}
            onClick={()=>openEditor(a.id)}
            className="article-row slide-up"
            style={{
              display:"grid", gridTemplateColumns:"48px 72px 1fr 160px 120px 80px 40px",
              alignItems:"center", gap:"8px",
              padding: "18px 8px",
              borderBottom:"1px solid var(--border)",
              cursor:"pointer",
              transition: "background 0.15s",
              animationDelay: (i*30)+"ms",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <div className="mono tnum" style={{color:"var(--fg-4)", fontSize:11}}>
              {String(i+1).padStart(3, "0")}
            </div>
            <CoverTile variant={a.cover}/>
            <div style={{minWidth: 0}}>
              <div style={{display:"flex", alignItems:"baseline", gap:10, marginBottom: 4}}>
                <span className="mono" style={{color:"var(--fg-5)", fontSize:10}}>{a.stamp}</span>
                <Chip tone={a.mode === "markdown" ? "info" : "accent"}>{a.mode}</Chip>
              </div>
              <div className="title-serif" style={{
                fontSize: 22, color:"var(--fg)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {a.title}
              </div>
            </div>
            <div style={{fontFamily:"var(--f-mono)", fontSize:11, color:"var(--fg-3)"}}>
              <div>by · {a.author}</div>
              <div style={{color:"var(--fg-4)", marginTop:2}}>{a.updated}</div>
            </div>
            <Chip tone={statusTone(a.status)}>{a.status}</Chip>
            <div className="mono tnum" style={{color:"var(--fg-3)", fontSize:12}}>
              {a.words.toLocaleString()}
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", color:"var(--fg-4)"}}>
              {I.arrowRight(14)}
            </div>
          </div>
        ))}

        {/* New article prompt row */}
        <div
          onClick={()=>openEditor("new")}
          style={{
            display:"grid", gridTemplateColumns:"48px 1fr 40px",
            alignItems:"center", gap:"8px",
            padding: "22px 8px",
            borderBottom:"1px dashed var(--border-2)",
            cursor:"pointer",
            color:"var(--fg-4)",
            transition:"color 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"}
          onMouseLeave={e=>e.currentTarget.style.color="var(--fg-4)"}
        >
          <span className="mono">+ + +</span>
          <span className="title-serif" style={{fontSize:20, fontStyle:"italic"}}>
            新建一篇 · 或让 Agent 起草
          </span>
          <span>{I.plus(14)}</span>
        </div>

        {/* Footer slug */}
        <div style={{
          display:"flex", justifyContent:"space-between",
          marginTop: 48, padding: "14px 8px",
          fontFamily:"var(--f-mono)", fontSize:10,
          color:"var(--fg-5)", letterSpacing:"0.12em", textTransform:"uppercase",
        }}>
          <span>MBEditor · 稿库 · End of ledger</span>
          <span>— / —</span>
          <span>Press N for new · / to search</span>
        </div>
      </div>
    </div>
  );
}

window.ArticleList = ArticleList;
