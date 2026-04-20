/* global React, Stage, Sprite, useSprite, Easing, clamp */
// MBEditor promo v5 — 面向用户的宣传片
// 1920x1080, 36s, 6 场景

const PC = {
  bg: "#141013", bgDeep: "#0E0B0D", surface: "#1C1719",
  border: "#2A2225", border2: "#3A3033",
  fg: "#F0E8D8", fg2: "#C9BBA4", fg3: "#A89A87", fg4: "#6B5E55",
  accent: "#C14A3A", gold: "#C4A76C", forest: "#6B9872", info: "#7588B8",
  paper: "#FAF6EB", ink: "#1A1512",
};

function Scene({ bg = PC.bg, children }) {
  return <div style={{position:"absolute", inset:0, background:bg, overflow:"hidden"}}>{children}</div>;
}

function RegMarks({ opacity = 1 }) {
  return (
    <>
      {[[80,80],[1840,80],[80,1000],[1840,1000]].map(([x,y],i)=>(
        <div key={i} style={{position:"absolute", left:x-6, top:y-6, width:12, height:12, opacity}}>
          <div style={{position:"absolute", left:5, top:0, width:1, height:12, background:PC.gold}}/>
          <div style={{position:"absolute", top:5, left:0, height:1, width:12, background:PC.gold}}/>
        </div>
      ))}
    </>
  );
}

function Header({ idx, title }) {
  return (
    <div style={{position:"absolute", left:120, top:80, right:120, display:"flex", alignItems:"center", gap:22}}>
      <span style={{fontFamily:"var(--f-mono)", fontSize:13, color:PC.gold, letterSpacing:"0.28em", fontWeight:500}}>
        0{idx} · {title}
      </span>
      <div style={{flex:1, borderTop:`1px solid ${PC.border2}`}}/>
    </div>
  );
}

// ============ 0: Title (0–4s) ============
function S0() {
  const { localTime: t } = useSprite();
  const show = (s, d=0.6) => clamp((t - s)/d, 0, 1);
  return (
    <Scene>
      <div style={{position:"absolute", inset:0, backgroundImage:`radial-gradient(${PC.border} 1px, transparent 1px)`, backgroundSize:"28px 28px", opacity: 0.35}}/>
      <div style={{position:"absolute", left:120, right:120, top:120, borderTop:`1px solid ${PC.border2}`, transform:`scaleX(${show(0.1)})`, transformOrigin:"left"}}/>
      <div style={{position:"absolute", left:120, right:120, top:128, borderTop:`1px solid ${PC.border2}`, transform:`scaleX(${show(0.25)})`, transformOrigin:"right"}}/>

      <div style={{position:"absolute", left:120, top:148, right:120, display:"flex", justifyContent:"space-between", fontFamily:"var(--f-mono)", fontSize:13, color:PC.gold, letterSpacing:"0.3em", opacity:show(0.5)}}>
        <span>MBEDITOR</span>
        <span style={{color:PC.fg4}}>面向 AGENT 的公众号编辑器</span>
        <span style={{color:PC.fg4}}>二〇二六</span>
      </div>

      <div style={{position:"absolute", left:120, top:270, fontFamily:"var(--f-display)", fontSize:240, color:PC.fg, lineHeight:0.95, letterSpacing:"-0.02em", opacity: show(0.8, 0.8), transform:`translateY(${(1-Easing.easeOutCubic(show(0.8)))*30}px)`}}>
        动动嘴，
      </div>
      <div style={{position:"absolute", left:120, top:510, fontFamily:"var(--f-display)", fontSize:240, color:PC.fg, lineHeight:0.95, letterSpacing:"-0.02em", fontStyle:"italic", opacity: show(1.2, 0.8), transform:`translateY(${(1-Easing.easeOutCubic(show(1.2)))*30}px)`}}>
        <span style={{color:PC.gold}}>排版</span>就好了<span style={{color:PC.accent}}>。</span>
      </div>

      <div style={{position:"absolute", left:120, top:820, fontFamily:"var(--f-sans)", fontSize:30, color:PC.fg3, lineHeight:1.5, maxWidth:1200, opacity:show(1.9)}}>
        用中文告诉 Agent 你想要什么 —— <br/>
        MBEditor 把公众号文章排好、配好图、投进草稿箱。
      </div>

      <RegMarks opacity={show(0)*0.7}/>
    </Scene>
  );
}

// ============ 1: The old way (4–8s) ============
function S1() {
  const { localTime: t } = useSprite();
  const show = (s, d=0.4) => clamp((t - s)/d, 0, 1);

  return (
    <Scene bg={PC.bgDeep}>
      <Header idx={1} title="过去"/>

      <div style={{position:"absolute", left:120, top:180, right:120, height:640, background:PC.surface, border:`1px solid ${PC.border}`, borderRadius:14, overflow:"hidden", opacity:show(0)}}>
        <div style={{padding:"10px 14px", borderBottom:`1px solid ${PC.border}`, display:"flex", flexWrap:"wrap", gap:4}}>
          {Array.from({length: 38}).map((_,i) => (
            <div key={i} style={{width: 32, height: 28, background: PC.bgDeep, border:`1px solid ${PC.border}`, borderRadius:4, display:"grid", placeItems:"center", fontFamily:"var(--f-mono)", fontSize:11, color: i===3 ? PC.accent : PC.fg4, opacity: show(0.2 + i*0.008)}}>
              {["B","I","U","S","H1","H2","H3","¶","•","≡","—","⎘","🎨","📎","📷","📊","🔗","⇧","⌘","↺","↻"][i%21] || "·"}
            </div>
          ))}
        </div>
        <div style={{padding:30, display:"flex", gap:20}}>
          <div style={{flex:1, background:PC.paper, borderRadius:8, padding:"30px 40px", position:"relative"}}>
            <div style={{height:28, width:300, background:"#e8e2d0", borderRadius:4, marginBottom:12}}/>
            <div style={{height:12, width:500, background:"#efe8d7", borderRadius:2, marginBottom:8}}/>
            <div style={{height:12, width:480, background:"#efe8d7", borderRadius:2, marginBottom:8}}/>
            <div style={{height: 160, background:"repeating-linear-gradient(45deg, #e5dcc9, #e5dcc9 8px, #d8ccb3 8px, #d8ccb3 16px)", borderRadius:6, marginBottom:12, marginTop:16, border: `2px solid ${PC.accent}`, outline: `1px dashed ${PC.accent}`, outlineOffset: 4, position:"relative"}}>
              {[[0,0],[1,0],[0,1],[1,1]].map(([x,y],i)=>(
                <div key={i} style={{position:"absolute", left:x?"auto":-4, right:x?-4:"auto", top:y?"auto":-4, bottom:y?-4:"auto", width:8, height:8, background:PC.accent}}/>
              ))}
            </div>
            <div style={{height:12, width:450, background:"#efe8d7", borderRadius:2, marginBottom:8}}/>
            <div style={{height:12, width:380, background:"#efe8d7", borderRadius:2}}/>
            {show(1.0) > 0 && <div style={{position:"absolute", left:200, top:280, width:180, background:"#fff", borderRadius:6, boxShadow:"0 12px 32px -8px rgba(0,0,0,0.3)", padding:"4px 0", fontSize:12, color:"#444", opacity: show(1.0)}}>
              {["字号","行高","颜色","对齐","链接","删除"].map((t,i)=>(
                <div key={i} style={{padding:"6px 14px"}}>{t}</div>
              ))}
            </div>}
          </div>
        </div>
        <div style={{position:"absolute", right: 40, bottom: 30, fontFamily:"var(--f-mono)", fontSize:14, color:PC.fg4, opacity: show(1.2)}}>
          排版耗时 <span style={{color:PC.accent, fontSize: 34, fontWeight:500}}>{Math.floor(show(1.2)*47)}</span> 分钟
        </div>
      </div>

      <div style={{position:"absolute", left:200, top:400, fontFamily:"var(--f-display)", fontSize:170, color:PC.accent, fontStyle:"italic", lineHeight:0.95, letterSpacing:"-0.02em", opacity: show(1.6, 0.5), transform:`rotate(-3deg) translateX(${(1-show(1.6, 0.6))*-20}px)`, textShadow: `2px 2px 0 ${PC.bgDeep}`, pointerEvents:"none"}}>
        点来<br/>点去。
      </div>

      <div style={{position:"absolute", left:120, bottom:80, right:120, fontFamily:"var(--f-sans)", fontSize:30, color:PC.fg, fontWeight:300, opacity:show(2.2)}}>
        调字号、改行高、拖图片 ——&nbsp;&nbsp;一篇稿折腾半小时。
      </div>
    </Scene>
  );
}

// ============ 2: Chat → live-builds draft on phone (8–22s, 14s) ============
function S2() {
  const { localTime: t } = useSprite();
  const show = (s, d=0.4) => clamp((t - s)/d, 0, 1);

  // Editorial-minded script — each prompt shapes one layout element.
  const script = [
    { at: 0.3,  blockAt: 0.9,  prompt: "帮我把这周写成一篇公众号，调性克制一点。",               block: "masthead" },
    { at: 2.3,  blockAt: 2.9,  prompt: "标题用大字衬线，留白大些。",                             block: "title"    },
    { at: 4.0,  blockAt: 4.6,  prompt: "首段加一个首字下沉。",                                    block: "lede"     },
    { at: 5.8,  blockAt: 6.4,  prompt: "在旁边加一条边注，写关键数字。",                         block: "marginalia" },
    { at: 7.6,  blockAt: 8.2,  prompt: "中间来一条装饰线。",                                      block: "ornament" },
    { at: 9.0,  blockAt: 9.6,  prompt: "把那句用户反馈做成大引言。",                             block: "pullquote" },
    { at: 10.6, blockAt: 11.2, prompt: "结尾再放一张抽象主视觉。",                                block: "coda"     },
  ];

  const visibleMsgs = script.filter(s => t > s.at);

  const B = Object.fromEntries(script.map(s => [s.block, show(s.blockAt, 0.35)]));

  return (
    <Scene>
      <Header idx={2} title="现在 · 一句话就够了"/>

      {/* LEFT: conversation stream (show only last 3 msgs, older fade out) */}
      <div style={{position:"absolute", left:120, top:180, width: 720, bottom: 80, display:"flex", flexDirection:"column", gap: 14}}>
        <div style={{fontFamily:"var(--f-mono)", fontSize:12, color:PC.gold, letterSpacing:"0.25em", marginBottom:4}}>你 · 对 AGENT 说</div>

        {visibleMsgs.slice(-3).map((msg, i, arr) => {
          const age = t - msg.at;
          const slide = clamp(age / 0.3, 0, 1);
          const isLast = i === arr.length - 1;
          const ageIdx = arr.length - 1 - i;
          const fade = ageIdx === 0 ? 1 : ageIdx === 1 ? 0.55 : 0.3;
          return (
            <div key={msg.at} style={{
              background: isLast ? PC.surface : `${PC.surface}66`,
              border: `1px solid ${isLast ? PC.border2 : PC.border}`,
              borderRadius: 14,
              padding: isLast ? "20px 24px" : "12px 20px",
              opacity: slide * fade,
              transform: `translateX(${(1-slide)*-30}px)`,
            }}>
              <div style={{fontFamily:"var(--f-sans)", fontSize: isLast ? 28 : 18, color: isLast ? PC.fg : PC.fg3, lineHeight: 1.45, fontWeight: isLast ? 400 : 300}}>
                {msg.prompt}
              </div>
              {isLast && age > 0.5 && (
                <div style={{marginTop:10, fontFamily:"var(--f-mono)", fontSize:11, color:PC.forest, letterSpacing:"0.2em", display:"flex", alignItems:"center", gap:8}}>
                  <span style={{width:6, height:6, borderRadius:"50%", background:PC.forest, opacity: 0.4 + (Math.sin(t*8)+1)/2 * 0.6}}/>
                  AGENT · 排版中
                </div>
              )}
            </div>
          );
        })}

        <div style={{marginTop: "auto", fontFamily:"var(--f-sans)", fontSize: 20, color: PC.fg3, fontWeight: 300, lineHeight: 1.6, opacity: show(0.5)}}>
          <span style={{color: PC.gold, fontFamily:"var(--f-mono)", fontSize: 11, letterSpacing:"0.25em"}}>→&nbsp;&nbsp;</span>
          每一句指令，落到版面上的一个决定 —— 大标题、首字下沉、边注、引言。
        </div>
      </div>

      {/* RIGHT: phone — tall, editorial article */}
      <div style={{position:"absolute", right: 140, top: 100, width: 540, height: 940, background:"#000", borderRadius: 54, border:`10px solid #0a0a0a`, boxShadow:"0 50px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px #1a1a1c", overflow:"hidden"}}>
        {/* status bar */}
        <div style={{height: 38, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 30px", fontFamily:"var(--f-sans)", fontSize:14, background:"#faf8f3", color:"#111", fontWeight:600}}>
          <span>17:02</span>
          <span style={{fontSize:12, fontWeight:500}}>●●●&nbsp;&nbsp;5G&nbsp;&nbsp;▮</span>
        </div>
        {/* WeChat draft header */}
        <div style={{background:"#faf8f3", padding:"13px 22px", borderBottom:"1px solid #ece6dd", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{fontSize: 16, color:"#888"}}>&lt;&nbsp;草稿箱</span>
          <span style={{fontSize: 14, color:"#2a2421", fontWeight:500, fontFamily:"var(--f-display)"}}>预览</span>
          <span style={{fontSize: 13, color:"#07c160", fontWeight:500}}>发布</span>
        </div>

        {/* Article — editorial layout, cream paper */}
        <div style={{background:"#fdfaf3", padding: "30px 30px 24px", height: 820, overflow:"hidden", position:"relative"}}>

          {/* MASTHEAD — tiny rule + kicker (not a big label block) */}
          <div style={{opacity: B.masthead, transform:`translateY(${(1-B.masthead)*8}px)`, display:"flex", alignItems:"center", gap:10, marginBottom: 18}}>
            <div style={{width: 22, height: 1, background:"#c14a3a"}}/>
            <div style={{fontFamily:"var(--f-mono)", fontSize:10, color:"#8a7e6e", letterSpacing:"0.3em", textTransform:"uppercase"}}>MBEDITOR 笔记 · vol.14</div>
          </div>

          {/* TITLE — big serif display, generous leading */}
          <div style={{opacity: B.title, transform:`translateY(${(1-B.title)*8}px)`, marginBottom: 6}}>
            <div style={{fontFamily:"var(--f-display)", fontSize: 38, fontWeight: 700, color:"#1f1a17", lineHeight:1.12, letterSpacing:"-0.01em"}}>
              让 Agent 替<br/>我排版的<br/><span style={{fontStyle:"italic", fontWeight:500, color:"#8a6622"}}>第一周</span>
            </div>
            <div style={{marginTop: 14, fontFamily:"var(--f-sans)", fontSize:10.5, color:"#9b8e82", letterSpacing:"0.08em", display:"flex", gap: 8}}>
              <span>文 / 周翊</span>
              <span style={{color:"#d4c9b8"}}>·</span>
              <span>二〇二六 · 四月</span>
            </div>
          </div>

          {/* LEDE — drop cap + body */}
          <div style={{opacity: B.lede, transform:`translateY(${(1-B.lede)*8}px)`, marginTop: 20, position:"relative", display:"flex", gap: 12}}>
            {/* Drop cap */}
            <div style={{fontFamily:"var(--f-display)", fontSize: 56, fontWeight: 700, color:"#c14a3a", lineHeight: 0.85, fontStyle:"italic", flexShrink: 0, marginTop: 2}}>过</div>
            <div style={{fontFamily:"var(--f-sans)", fontSize: 12.5, color:"#3c3530", lineHeight: 1.85, letterSpacing:"0.01em"}}>
              去每出一篇推文，<br/>都要点几十下。加粗、<br/>换色、调行高，像做针<br/>线活。现在我只说一句。
            </div>
          </div>

          {/* MARGINALIA — floating right-side note */}
          {B.marginalia > 0 && (
            <div style={{position:"absolute", right: 26, top: 430, width: 120, opacity: B.marginalia, transform:`translateX(${(1-B.marginalia)*10}px)`, borderLeft:"1px solid #c4a76c", paddingLeft: 10}}>
              <div style={{fontFamily:"var(--f-mono)", fontSize:9, color:"#c4a76c", letterSpacing:"0.2em", marginBottom: 4}}>边&nbsp;注</div>
              <div style={{fontFamily:"var(--f-display)", fontSize: 26, fontWeight: 700, color:"#1f1a17", lineHeight: 1}}>12<span style={{fontSize: 13, color:"#8a7e6e", marginLeft: 2}}>秒</span></div>
              <div style={{fontFamily:"var(--f-sans)", fontSize: 10, color:"#5c5650", marginTop:4, lineHeight: 1.4}}>
                从我说话到草稿完成的时间
              </div>
            </div>
          )}

          {/* ORNAMENT — an elegant horizontal rule with center glyph */}
          <div style={{opacity: B.ornament, marginTop: 26, display:"flex", alignItems:"center", gap: 12, justifyContent:"center"}}>
            <div style={{width: 60, height: 1, background:"linear-gradient(to right, transparent, #c4a76c)"}}/>
            <div style={{fontFamily:"var(--f-display)", fontSize: 14, color:"#c4a76c", fontStyle:"italic"}}>§</div>
            <div style={{width: 60, height: 1, background:"linear-gradient(to left, transparent, #c4a76c)"}}/>
          </div>

          {/* PULL QUOTE — large, typographic, no box */}
          {B.pullquote > 0 && (
            <div style={{opacity: B.pullquote, transform:`translateY(${(1-B.pullquote)*8}px)`, marginTop: 22, padding: "0 4px"}}>
              <div style={{fontFamily:"var(--f-display)", fontSize: 14, color:"#c14a3a", lineHeight: 1, marginBottom: 2}}>"</div>
              <div style={{fontFamily:"var(--f-display)", fontStyle:"italic", fontSize: 20, fontWeight: 500, color:"#1f1a17", lineHeight: 1.4, letterSpacing:"-0.005em"}}>
                我只管写。<br/>
                <span style={{color:"#8a6622"}}>排版</span>，它全包了。
              </div>
              <div style={{fontFamily:"var(--f-sans)", fontSize: 10, color:"#9b8e82", marginTop: 10, letterSpacing:"0.1em"}}>
                ——&nbsp;读者&nbsp;@yz
              </div>
            </div>
          )}

          {/* CODA — abstract typographic visual instead of gradient box */}
          {B.coda > 0 && (
            <div style={{opacity: B.coda, transform:`translateY(${(1-B.coda)*8}px)`, position:"absolute", bottom: 24, left: 30, right: 30, textAlign:"center", padding: "20px 0", borderTop:"1px solid #e8dfc9", borderBottom:"1px solid #e8dfc9"}}>
              <div style={{fontFamily:"var(--f-display)", fontSize: 42, fontWeight: 700, color:"#1f1a17", lineHeight: 0.9, letterSpacing:"-0.02em"}}>
                动动<span style={{fontStyle:"italic", color:"#c14a3a"}}>嘴</span>
              </div>
              <div style={{fontFamily:"var(--f-mono)", fontSize:10, color:"#8a7e6e", letterSpacing:"0.3em", marginTop: 8}}>排版就好了</div>
            </div>
          )}
        </div>

        {/* Live badge on phone */}
        {t > 0.8 && t < 13 && (
          <div style={{position:"absolute", bottom: 20, right: 20, padding:"6px 11px", background:`${PC.gold}22`, border:`1px solid ${PC.gold}99`, borderRadius: 12, fontFamily:"var(--f-mono)", fontSize: 10, color: PC.gold, display:"flex", alignItems:"center", gap:6, backdropFilter:"blur(8px)"}}>
            <span style={{width: 5, height: 5, borderRadius:"50%", background: PC.gold, opacity: 0.5 + (Math.sin(t*7)+1)/2 * 0.5}}/>
            AGENT 编辑中
          </div>
        )}
      </div>
    </Scene>
  );
}

// ============ 3: Block library (22–26s) ============
function S3() {
  const { localTime: t } = useSprite();
  const show = (s, d=0.4) => clamp((t - s)/d, 0, 1);

  const blocks = [
    { name:"标题组",   preview: <HeroP/>  },
    { name:"数据看板", preview: <StatsP/> },
    { name:"代码块",   preview: <CodeP/>  },
    { name:"引用",     preview: <QuoteP/> },
    { name:"渐变卡",   preview: <GradP/>  },
    { name:"时间线",   preview: <TimeP/>  },
    { name:"标签",     preview: <TagsP/>  },
    { name:"分隔线",   preview: <DivP/>   },
  ];

  return (
    <Scene bg={PC.bgDeep}>
      <Header idx={3} title="要什么版块，都有"/>

      <div style={{position:"absolute", left:120, top:170, right:120, display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:22, gridAutoRows:"300px"}}>
        {blocks.map((b, i) => {
          const op = show(0 + i*0.08);
          return (
            <div key={i} style={{background:PC.surface, border:`1px solid ${PC.border}`, borderRadius: 12, padding: 18, display:"flex", flexDirection:"column", opacity: op, transform:`translateY(${(1-Easing.easeOutCubic(op))*20}px)`}}>
              <div style={{fontFamily:"var(--f-display)", fontSize:24, color:PC.fg, marginBottom: 12}}>{b.name}</div>
              <div style={{flex:1, background:PC.paper, borderRadius: 6, overflow:"hidden", padding: 12, display:"flex", alignItems:"center", justifyContent:"center"}}>
                {b.preview}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{position:"absolute", left:120, bottom:80, right:120, display:"flex", justifyContent:"space-between", alignItems:"baseline", fontFamily:"var(--f-sans)", fontSize: 28, color:PC.fg, fontWeight: 300}}>
        <span>告诉 Agent "加个数据看板" —— 它自己挑块、自己填。</span>
        <span style={{fontFamily:"var(--f-mono)", fontSize: 13, color:PC.gold, letterSpacing:"0.25em"}}>十余种预置版块</span>
      </div>
    </Scene>
  );
}

function HeroP() {
  return (
    <div style={{textAlign:"center"}}>
      <div style={{display:"inline-block", padding:"3px 10px", border:"1px solid #c4b5a0", borderRadius:12, fontSize:9, color:"#8a7e6e", letterSpacing:"0.2em"}}>公众号 · V5</div>
      <div style={{fontFamily:"var(--f-display)", fontSize:20, color:"#1A1512", marginTop:8, lineHeight:1.2}}>这周的更新</div>
      <div style={{height:1, background:"linear-gradient(90deg, transparent, #d4c9b8, transparent)", margin:"8px auto", width:"80%"}}/>
    </div>
  );
}
function StatsP() {
  return (
    <div style={{display:"flex", gap: 5, width:"100%"}}>
      {[{n:"3", l:"模式"},{n:"12", l:"版块"},{n:"1s", l:"生成"}].map((s,i)=>(
        <div key={i} style={{flex:1, padding:"10px 2px", background:"#faf8f5", borderRadius:4, border:"1px solid #ece6dd", textAlign:"center"}}>
          <div style={{fontSize:18, fontWeight:700, color:"#e8553a", fontFamily:"var(--f-display)"}}>{s.n}</div>
          <div style={{fontSize:8, color:"#8a7e6e"}}>{s.l}</div>
        </div>
      ))}
    </div>
  );
}
function CodeP() {
  return (
    <div style={{width:"100%", background:"#1c1b1a", borderRadius: 4, padding: 10, fontFamily:"var(--f-mono)", fontSize:10, color:"#a09888", lineHeight:1.6}}>
      <div style={{color:"#6b8e6b"}}># 一行起</div>
      <div>mbe new "新稿"</div>
      <div style={{color:"#c4a76c"}}>● 完成</div>
    </div>
  );
}
function QuoteP() {
  return (
    <div style={{borderLeft: "3px solid #c4a76c", padding: "6px 12px", fontFamily:"var(--f-display)", fontStyle:"italic", fontSize:14, color:"#5c5650", lineHeight:1.4}}>
      "我只管写，排版它全包了"
      <div style={{fontSize:9, color:"#9b8e82", marginTop:4, fontStyle:"normal"}}>—— 一位早期用户</div>
    </div>
  );
}
function GradP() {
  return (
    <div style={{width:"100%", padding:"16px 10px", background:"linear-gradient(135deg, #C14A3A, #C4A76C)", borderRadius:6, color:"#fff", textAlign:"center"}}>
      <div style={{fontFamily:"var(--f-display)", fontSize:17}}>动动嘴</div>
      <div style={{fontSize:10, opacity:0.9, letterSpacing:"0.2em", marginTop:3}}>排版就好了</div>
    </div>
  );
}
function TimeP() {
  return (
    <div style={{width:"100%", display:"flex", alignItems:"center", gap:5, fontSize:9, color:"#5c5650"}}>
      {["写","排","投"].map((s, i, a) => (
        <React.Fragment key={i}>
          <span style={{width:22, height:22, borderRadius:"50%", background: i===2 ? "#6b9872" : "#c4a76c", color:"#fff", display:"grid", placeItems:"center", fontSize:11, fontWeight:600}}>{s}</span>
          {i < a.length-1 && <div style={{flex:1, height:1, background:"#d4c9b8"}}/>}
        </React.Fragment>
      ))}
    </div>
  );
}
function TagsP() {
  return (
    <div style={{display:"flex", flexWrap:"wrap", gap:5, justifyContent:"center"}}>
      {[{t:"新",c:"#C14A3A"},{t:"热门",c:"#6b9872"},{t:"Agent",c:"#c4a76c"},{t:"实用",c:"#7588B8"}].map((x,i)=>(
        <span key={i} style={{fontFamily:"var(--f-sans)", fontSize:10, padding:"3px 10px", border:`1px solid ${x.c}66`, color: x.c, borderRadius: 12}}>{x.t}</span>
      ))}
    </div>
  );
}
function DivP() {
  return (
    <div style={{width:"80%", display:"flex", alignItems:"center", gap: 8, color:"#c4a76c", fontSize:11}}>
      <div style={{flex:1, height:1, background:"linear-gradient(to right, transparent, #c4a76c)"}}/>
      <span>❋</span>
      <div style={{flex:1, height:1, background:"linear-gradient(to left, transparent, #c4a76c)"}}/>
    </div>
  );
}

// ============ 4: Publish (26–32s) ============
function S5() {
  const { localTime: t } = useSprite();
  const show = (s, d=0.4) => clamp((t - s)/d, 0, 1);

  return (
    <Scene bg={PC.bgDeep}>
      <Header idx={4} title="写完，直接进草稿箱"/>

      <div style={{position:"absolute", left:120, top:230, width: 820}}>
        <div style={{fontFamily:"var(--f-mono)", fontSize:13, color:PC.fg4, letterSpacing:"0.25em", marginBottom:30}}>从说话到上线</div>
        {[
          { t: "生成正文与配图", ok: false, s: 0.1 },
          { t: "按微信规范调整格式", ok: false, s: 0.5 },
          { t: "投递到你的公众号后台", ok: false, s: 0.9 },
          { t: "草稿已就绪", ok: true, s: 1.4 },
        ].map((st, i, a) => {
          const op = show(st.s);
          return (
            <div key={i} style={{display:"flex", gap: 22, alignItems:"center", padding:"20px 0", borderBottom: i < a.length - 1 ? `1px dashed ${PC.border2}` : "none", opacity: op, transform:`translateX(${(1-op)*-20}px)`}}>
              <span style={{fontFamily:"var(--f-mono)", fontSize:16, color: st.ok ? PC.forest : PC.gold, width:20}}>{st.ok ? "●" : "→"}</span>
              <span style={{fontFamily:"var(--f-sans)", fontSize: 26, color: st.ok ? PC.forest : PC.fg, fontWeight: st.ok ? 500 : 400}}>{st.t}</span>
            </div>
          );
        })}

        {show(2.0) > 0 && (
          <div style={{marginTop: 40, opacity: show(2.0)}}>
            <div style={{fontFamily:"var(--f-mono)", fontSize:13, color:PC.fg4, letterSpacing:"0.25em"}}>全程用时</div>
            <div style={{fontFamily:"var(--f-display)", fontSize: 120, color:PC.fg, lineHeight:1, marginTop: 6}}>
              <span style={{color:PC.gold}}>12</span>
              <span style={{fontSize: 56, color:PC.fg3, marginLeft: 10}}>秒</span>
            </div>
          </div>
        )}
      </div>

      <div style={{position:"absolute", right:180, top:130, width: 500, height: 900, background:"#000", borderRadius: 48, border:`9px solid #1a1a1c`, boxShadow:"0 40px 80px -30px rgba(0,0,0,0.9)", overflow:"hidden"}}>
        <div style={{height: 34, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 26px", fontFamily:"var(--f-sans)", fontSize:13, background:"#faf8f3", color:"#111", fontWeight:600}}>
          <span>17:02</span>
          <span style={{fontSize:12}}>●●●&nbsp;&nbsp;5G&nbsp;&nbsp;▮</span>
        </div>
        <div style={{background:"#faf8f3", padding:"13px 22px", borderBottom:"1px solid #ece6dd", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{fontSize: 15, color:"#888"}}>&lt; 草稿箱</span>
          <span style={{fontSize: 13, color:"#2a2421", fontWeight:500, fontFamily:"var(--f-display)"}}>预览</span>
          <span style={{fontSize: 13, color:"#07c160", fontWeight:500}}>发布</span>
        </div>

        {/* Editorial article — cream, serif, spacious */}
        <div style={{background:"#fdfaf3", padding:"28px 28px 26px", height: 780, overflow:"hidden", position:"relative"}}>

          {/* Masthead */}
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom: 16}}>
            <div style={{width: 20, height: 1, background:"#c14a3a"}}/>
            <div style={{fontFamily:"var(--f-mono)", fontSize:9.5, color:"#8a7e6e", letterSpacing:"0.3em", textTransform:"uppercase"}}>MBEDITOR 笔记 · vol.14</div>
          </div>

          {/* Title */}
          <div style={{fontFamily:"var(--f-display)", fontSize: 34, fontWeight: 700, color:"#1f1a17", lineHeight:1.12, letterSpacing:"-0.01em"}}>
            让 Agent 替<br/>我排版的<br/><span style={{fontStyle:"italic", fontWeight:500, color:"#8a6622"}}>第一周</span>
          </div>

          <div style={{marginTop: 12, fontFamily:"var(--f-sans)", fontSize:10, color:"#9b8e82", letterSpacing:"0.08em", display:"flex", gap: 8}}>
            <span>文 / 周翊</span>
            <span style={{color:"#d4c9b8"}}>·</span>
            <span>二〇二六 · 四月</span>
          </div>

          {/* Lede with drop cap */}
          <div style={{marginTop: 18, display:"flex", gap: 11}}>
            <div style={{fontFamily:"var(--f-display)", fontSize: 50, fontWeight: 700, color:"#c14a3a", lineHeight: 0.85, fontStyle:"italic", flexShrink: 0, marginTop: 2}}>过</div>
            <div style={{fontFamily:"var(--f-sans)", fontSize: 11.5, color:"#3c3530", lineHeight: 1.85, letterSpacing:"0.01em"}}>
              去每出一篇推文，都要<br/>点几十下。加粗、换色、<br/>调行高，像做针线活。<br/>现在，我只说一句。
            </div>
          </div>

          {/* Ornament */}
          <div style={{marginTop: 22, display:"flex", alignItems:"center", gap: 12, justifyContent:"center"}}>
            <div style={{width: 50, height: 1, background:"linear-gradient(to right, transparent, #c4a76c)"}}/>
            <div style={{fontFamily:"var(--f-display)", fontSize: 13, color:"#c4a76c", fontStyle:"italic"}}>§</div>
            <div style={{width: 50, height: 1, background:"linear-gradient(to left, transparent, #c4a76c)"}}/>
          </div>

          {/* Pull quote */}
          <div style={{marginTop: 20, padding: "0 4px"}}>
            <div style={{fontFamily:"var(--f-display)", fontSize: 13, color:"#c14a3a", lineHeight: 1}}>"</div>
            <div style={{fontFamily:"var(--f-display)", fontStyle:"italic", fontSize: 19, fontWeight: 500, color:"#1f1a17", lineHeight: 1.4, letterSpacing:"-0.005em", marginTop: 2}}>
              我只管写。<br/>
              <span style={{color:"#8a6622"}}>排版</span>，它全包了。
            </div>
            <div style={{fontFamily:"var(--f-sans)", fontSize: 10, color:"#9b8e82", marginTop: 8, letterSpacing:"0.1em"}}>
              ——&nbsp;读者&nbsp;@yz
            </div>
          </div>

          {/* Coda */}
          <div style={{position:"absolute", bottom: 24, left: 28, right: 28, textAlign:"center", padding: "18px 0", borderTop:"1px solid #e8dfc9", borderBottom:"1px solid #e8dfc9"}}>
            <div style={{fontFamily:"var(--f-display)", fontSize: 38, fontWeight: 700, color:"#1f1a17", lineHeight: 0.9, letterSpacing:"-0.02em"}}>
              动动<span style={{fontStyle:"italic", color:"#c14a3a"}}>嘴</span>
            </div>
            <div style={{fontFamily:"var(--f-mono)", fontSize:9.5, color:"#8a7e6e", letterSpacing:"0.3em", marginTop: 7}}>排版就好了</div>
          </div>
        </div>

        {show(1.8) > 0 && (
          <div style={{position:"absolute", bottom: 28, left: 22, right: 22, background:"#07c160", color:"#fff", padding:"13px 18px", borderRadius: 12, display:"flex", gap: 10, alignItems:"center", fontFamily:"var(--f-sans)", fontSize:13, opacity: show(1.8), boxShadow:"0 14px 40px -10px rgba(7,193,96,0.7)"}}>
            <span style={{fontSize:16}}>✓</span>
            <span><strong>草稿已就绪</strong>，打开微信公众平台就能预览</span>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ============ 5: Colophon (32–36s) ============
function S6() {
  const { localTime: t } = useSprite();
  const show = (s, d=0.5) => clamp((t - s)/d, 0, 1);
  return (
    <Scene>
      <div style={{position:"absolute", left:120, right:120, top:120, borderTop:`1px solid ${PC.border2}`, transform:`scaleX(${show(0)})`, transformOrigin:"left"}}/>
      <div style={{position:"absolute", left:120, right:120, top:128, borderTop:`1px solid ${PC.border2}`, transform:`scaleX(${show(0.15)})`, transformOrigin:"right"}}/>

      <div style={{position:"absolute", left:120, top:148, right:120, display:"flex", justifyContent:"space-between", fontFamily:"var(--f-mono)", fontSize:13, color:PC.gold, letterSpacing:"0.3em", opacity: show(0.3)}}>
        <span>结&nbsp;·&nbsp;FIN</span>
        <span style={{color:PC.fg4}}>MBEDITOR · 面向 AGENT 的公众号编辑器</span>
        <span style={{color:PC.fg4}}>二〇二六</span>
      </div>

      <div style={{position:"absolute", left:120, top: 280, fontFamily:"var(--f-display)", fontSize: 180, color:PC.fg, lineHeight: 0.95, letterSpacing:"-0.02em", opacity: show(0.5, 0.7)}}>
        专注<span style={{color:PC.gold}}>内容</span>，
      </div>
      <div style={{position:"absolute", left:120, top: 470, fontFamily:"var(--f-display)", fontSize: 180, fontStyle:"italic", color:PC.fg, lineHeight: 0.95, letterSpacing:"-0.02em", opacity: show(0.9, 0.7)}}>
        <span style={{color:PC.accent}}>排版</span>&nbsp;交给 MBEditor<span style={{color:PC.gold}}>。</span>
      </div>

      <div style={{position:"absolute", left:120, top: 780, right: 120, opacity: show(1.5)}}>
        <div style={{fontFamily:"var(--f-sans)", fontSize: 26, color:PC.fg3, lineHeight:1.6}}>
          支持 <span style={{color:PC.fg}}>Claude Code · Codex · OpenClaw</span> 等主流 Agent。<br/>
          开源 · 自部署 · 一行 Docker 命令启动。
        </div>
      </div>

      <div style={{position:"absolute", left:120, right:120, bottom: 120, display:"flex", justifyContent:"space-between", fontFamily:"var(--f-mono)", fontSize: 13, color:PC.gold, letterSpacing:"0.25em", opacity: show(2.0)}}>
        <span style={{color:PC.fg4}}>GITHUB</span>
        <span>AAAAAnson / mbeditor</span>
        <span style={{color:PC.fg4}}>MIT · 开源</span>
      </div>
      <div style={{position:"absolute", left:120, right:120, bottom:155, borderTop:`1px solid ${PC.border2}`, transform:`scaleX(${show(2.0)})`, transformOrigin:"right"}}/>

      <RegMarks opacity={show(0)*0.7}/>
    </Scene>
  );
}

function Promo() {
  return (
    <Stage width={1920} height={1080} duration={36} background={PC.bg} persistKey="mbpromo-v5">
      <Sprite start={0}   end={4}>   <S0/> </Sprite>
      <Sprite start={4}   end={8}>   <S1/> </Sprite>
      <Sprite start={8}   end={22}>  <S2/> </Sprite>
      <Sprite start={22}  end={26}>  <S3/> </Sprite>
      <Sprite start={26}  end={32}>  <S5/> </Sprite>
      <Sprite start={32}  end={36}>  <S6/> </Sprite>
      <div style={{position:"absolute", left: 24, bottom: 24, fontFamily:"var(--f-mono)", fontSize: 12, color:PC.fg4, letterSpacing:"0.2em"}}>MBEDITOR · 二〇二六</div>
      <div style={{position:"absolute", right: 24, bottom: 24, fontFamily:"var(--f-mono)", fontSize: 12, color:PC.fg4, letterSpacing:"0.2em"}}>36.00"</div>
    </Stage>
  );
}

window.Promo = Promo;
