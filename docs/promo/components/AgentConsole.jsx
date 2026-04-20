/* global React, I, Chip */
// Agent Console — NEW surface: command center where you observe agent runs
// across multiple articles at once. Terminal + editorial vibe.

const { useState: useStateAg, useEffect: useEffectAg } = React;

const RUNS = [
  { id:"run-018", article:"让公众号排版回归内容本身", status:"running",   step:"写入正文 · 3/5",   pct:58, agent:"Claude",  started:"17:02:14", tools:7 },
  { id:"run-017", article:"从命令行到草稿箱",         status:"success",   step:"已投递草稿",        pct:100, agent:"Claude",  started:"16:44:02", tools:12 },
  { id:"run-016", article:"Docker 一行命令部署",       status:"success",   step:"已投递草稿",        pct:100, agent:"Codex",   started:"14:18:40", tools:9 },
  { id:"run-015", article:"Skill 装进 Claude Code",    status:"waiting",   step:"等待用户确认封面",   pct:72, agent:"Claude",  started:"13:55:11", tools:6 },
  { id:"run-014", article:"为什么我不再手动排版",       status:"failed",    step:"Wx 草稿箱 401",     pct:88, agent:"OpenClaw",started:"昨天 23:40",tools:11},
  { id:"run-013", article:"Markdown × 瑞士极简",       status:"success",   step:"已投递草稿",        pct:100, agent:"Claude",  started:"昨天 22:01", tools:8 },
];

const STATUS_TONE = { running:"warn", success:"forest", waiting:"info", failed:"accent" };
const STATUS_LABEL = { running:"运行中", success:"成功", waiting:"待确认", failed:"失败" };

function AgentConsole({ go }) {
  const [sel, setSel] = useStateAg("run-018");
  const active = RUNS.find(r => r.id===sel) || RUNS[0];

  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 520px", height:"100%", minHeight:0, background:"var(--bg)"}}>
      {/* Left: masthead + runs ledger */}
      <div style={{overflow:"auto", padding:"36px 40px 40px", borderRight:"1px solid var(--border)"}}>
        <div style={{display:"flex", alignItems:"baseline", gap:12, marginBottom:10}}>
          <span className="caps caps-gold">CONTROL ROOM · 代理控制台</span>
          <div className="hair-rule" style={{flex:1}}/>
          <span className="caps tnum">6 RUNS · 3 AGENTS</span>
        </div>
        <h1 className="title-serif" style={{fontSize:64, margin:"6px 0 6px"}}>
          所有 Agent 的<br/>
          <span style={{color:"var(--gold)", fontStyle:"italic"}}>工作现场</span><span style={{color:"var(--accent)"}}>.</span>
        </h1>
        <p style={{margin:"6px 0 28px", color:"var(--fg-3)", fontSize:14, fontFamily:"var(--f-display)", fontStyle:"italic"}}>
          Observe, intervene, approve — never babysit.
        </p>

        {/* KPI strip */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom: 28}}>
          {[
            { k:"活跃任务", v:"01", d:"CLAUDE · 正在写入", tone:"gold" },
            { k:"今日投递", v:"12", d:"↑ 33% vs 昨日", tone:"forest" },
            { k:"工具调用", v:"284", d:"avg 12/run", tone:"" },
            { k:"平均用时", v:"4′22″", d:"p95 8′10″", tone:"" },
          ].map((k,i)=>(
            <div key={i} style={{padding:"16px 16px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 10, position:"relative", overflow:"hidden"}}>
              <div className="caps" style={{marginBottom: 10}}>{k.k}</div>
              <div className="title-serif tnum" style={{fontSize: 40, color: k.tone==="gold"?"var(--gold)":k.tone==="forest"?"var(--forest)":"var(--fg)"}}>{k.v}</div>
              <div className="mono" style={{fontSize:10, color:"var(--fg-4)", marginTop: 4, letterSpacing:"0.05em"}}>{k.d}</div>
              <div style={{position:"absolute", right:10, top:10, fontFamily:"var(--f-mono)", fontSize:9, color:"var(--fg-5)"}}>{String(i+1).padStart(2,"0")}</div>
            </div>
          ))}
        </div>

        {/* Runs table */}
        <div style={{display:"flex", alignItems:"baseline", gap: 10, marginBottom: 10}}>
          <span className="caps">运行记录 · RUNS</span>
          <div className="hair-rule" style={{flex:1}}/>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"90px 1fr 100px 80px 90px", padding:"8px 10px", borderBottom:"1px solid var(--border)", marginBottom: 4}}>
          <span className="caps">ID</span>
          <span className="caps">文章 / 步骤</span>
          <span className="caps">AGENT</span>
          <span className="caps">状态</span>
          <span className="caps tnum" style={{textAlign:"right"}}>开始</span>
        </div>
        {RUNS.map(r => (
          <div key={r.id}
            onClick={()=>setSel(r.id)}
            style={{
              display:"grid", gridTemplateColumns:"90px 1fr 100px 80px 90px",
              gap:"8px", padding:"14px 10px", alignItems:"center",
              borderBottom:"1px solid var(--border)",
              cursor:"pointer",
              background: sel===r.id ? "var(--surface)" : "transparent",
              position: "relative",
            }}
          >
            {sel===r.id && <span style={{position:"absolute", left:0, top:10, bottom:10, width:2, background:"var(--accent)"}}/>}
            <span className="mono tnum" style={{fontSize:11, color:"var(--fg-3)"}}>{r.id}</span>
            <div style={{minWidth:0}}>
              <div className="title-serif" style={{fontSize: 17, color:"var(--fg)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                {r.article}
              </div>
              <div style={{marginTop: 6, display:"flex", alignItems:"center", gap: 10}}>
                <div style={{flex:1, height: 3, background:"var(--border)", borderRadius: 2, overflow:"hidden"}}>
                  <div style={{height:"100%", width: `${r.pct}%`, background: r.status==="failed" ? "var(--accent)" : r.status==="waiting" ? "var(--info)" : r.status==="running" ? "var(--gold)" : "var(--forest)"}}/>
                </div>
                <span className="mono" style={{fontSize:10, color:"var(--fg-4)", width:120, whiteSpace:"nowrap"}}>{r.step}</span>
              </div>
            </div>
            <span className="mono" style={{fontSize:11, color:"var(--fg-2)"}}>{r.agent}</span>
            <Chip tone={STATUS_TONE[r.status]}>
              {r.status==="running" && <span className="pulse" style={{width:5,height:5}}/>}
              {STATUS_LABEL[r.status]}
            </Chip>
            <span className="mono tnum" style={{fontSize:10, color:"var(--fg-4)", textAlign:"right"}}>{r.started}</span>
          </div>
        ))}

        <div style={{marginTop: 40, display:"flex", justifyContent:"space-between", fontFamily:"var(--f-mono)", fontSize:10, color:"var(--fg-5)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
          <span>MBEditor · Control Room</span>
          <span>Endpoint :7072/api/v1/runs</span>
        </div>
      </div>

      {/* Right: live terminal of active run */}
      <LiveRunPanel run={active} go={go}/>
    </div>
  );
}

function LiveRunPanel({ run, go }) {
  const [lines, setLines] = useStateAg(initialTerm(run));
  useEffectAg(() => { setLines(initialTerm(run)); }, [run.id]);

  useEffectAg(() => {
    if (run.status !== "running") return;
    const lib = [
      { k:"tool", t:"POST /api/v1/images/upload  →  ok (200, 142KB)" },
      { k:"think", t:"rewriting hero; tone=克制 ; length≤48" },
      { k:"tool", t:"PUT  /api/v1/articles/MB-2604-018  →  ok" },
      { k:"log", t:"block b4 · Card · content rewritten" },
      { k:"tool", t:"POST /api/v1/publish/preview  →  ok" },
      { k:"log", t:"inlined 14 css rules, stripped 3 non-wx" },
    ];
    let i = 0;
    const tick = setInterval(() => {
      const pick = lib[i % lib.length];
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      setLines(prev => [...prev.slice(-80), { ts, ...pick }]);
      i++;
    }, 1800);
    return () => clearInterval(tick);
  }, [run.id, run.status]);

  return (
    <div style={{display:"flex", flexDirection:"column", minHeight:0, background:"var(--bg-deep)"}}>
      <div style={{padding: "16px 22px 14px", borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex", alignItems:"center", gap: 10}}>
          <div style={{width:36, height:36, borderRadius:"50%", background:"var(--accent-soft)", border:"1px solid var(--accent-glow)", display:"grid", placeItems:"center", color:"var(--accent)"}}>
            {I.terminal(16)}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div className="mono" style={{fontSize:10, color:"var(--fg-4)", letterSpacing:"0.1em"}}>{run.id} · {run.agent}</div>
            <div className="title-serif" style={{fontSize: 20, color:"var(--fg)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{run.article}</div>
          </div>
          <Chip tone={STATUS_TONE[run.status]}>
            {run.status==="running" && <span className="pulse" style={{width:5,height:5}}/>}
            {STATUS_LABEL[run.status]}
          </Chip>
        </div>

        <div style={{display:"flex", gap:8, marginTop:12, flexWrap:"wrap"}}>
          <Chip>{run.tools} TOOLS</Chip>
          <Chip tone="gold">{run.pct}% 进度</Chip>
          <Chip tone="info">开始 {run.started}</Chip>
          <div style={{flex:1}}/>
          <button className="btn btn-outline btn-sm">暂停</button>
          <button className="btn btn-accent btn-sm" onClick={()=>go("editor",{articleId: run.id})}>打开编辑器 {I.arrowRight(10)}</button>
        </div>
      </div>

      <div style={{flex:1, overflow:"auto", padding:"10px 18px", fontFamily:"var(--f-mono)", fontSize: 12, lineHeight: 1.7, color:"var(--fg-3)", minHeight:0}}>
        {lines.map((l, i) => <TermLine key={i} {...l}/>)}
        {run.status==="running" && (
          <div style={{color:"var(--accent)"}}>
            <span style={{color:"var(--fg-5)"}}>{lines[lines.length-1]?.ts || "--:--:--"}</span>
            &nbsp;&nbsp;<span className="caret">▌</span>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid var(--border)", padding:"10px 16px", display:"flex", gap: 8, alignItems:"center"}}>
        <span className="mono" style={{color:"var(--accent)", fontSize:12}}>&gt;</span>
        <input placeholder="对 Agent 下指令…" style={{all:"unset", flex:1, fontFamily:"var(--f-mono)", fontSize:12, color:"var(--fg-2)"}} />
        <span className="mono" style={{fontSize:10, color:"var(--fg-5)"}}>⌘↵</span>
      </div>
    </div>
  );
}

function initialTerm(run) {
  return [
    { ts:"17:02:14", k:"meta", t:`>> start ${run.id} · agent=${run.agent}` },
    { ts:"17:02:14", k:"log",  t:"loaded skill · mbeditor.skill.md" },
    { ts:"17:02:14", k:"tool", t:"GET  /api/v1/articles/MB-2604-018  →  ok" },
    { ts:"17:02:15", k:"think",t:"plan: rewrite hero, upload cover, update 3 cards, preview, draft" },
    { ts:"17:02:15", k:"log",  t:"tone: 克制 · length: 短 · image: warm_01" },
    { ts:"17:02:16", k:"tool", t:"POST /api/v1/images/upload  →  ok" },
    { ts:"17:02:16", k:"log",  t:"image stored /images/warm_01.png" },
    { ts:"17:02:17", k:"tool", t:"PUT  /api/v1/articles/MB-2604-018  →  ok" },
    { ts:"17:02:18", k:"log",  t:"block b1 · Hero · content rewritten" },
  ];
}

function TermLine({ ts, k, t }) {
  const color = k==="tool" ? "var(--gold)" : k==="think" ? "var(--fg-4)" : k==="meta" ? "var(--accent)" : k==="log" ? "var(--forest)" : "var(--fg-3)";
  const marker = k==="tool" ? "→" : k==="think" ? "◇" : k==="meta" ? "⊳" : k==="log" ? "·" : " ";
  return (
    <div className="slide-up" style={{display:"flex", gap: 10}}>
      <span style={{color:"var(--fg-5)", userSelect:"none"}}>{ts}</span>
      <span style={{color, width: 12, textAlign:"center", userSelect:"none"}}>{marker}</span>
      <span style={{color, flex:1, fontStyle: k==="think" ? "italic" : "normal"}}>{t}</span>
    </div>
  );
}

window.AgentConsole = AgentConsole;
