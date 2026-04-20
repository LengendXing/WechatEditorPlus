/* global React */
// Shared UI primitives and icons for MBEditor

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// =================== ICONS (minimal stroke SVGs, not full illustrations) ===================
const I = {
  logo: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 9v6l2.5-3.5L12 15l2.5-3.5L17 15V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  list: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h10"/>
    </svg>
  ),
  edit: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
    </svg>
  ),
  agent: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8"/>
      <path d="M8 12l3 3 5-6"/>
    </svg>
  ),
  plus: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  search: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  trash: (s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </svg>
  ),
  send: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
  ),
  play: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
  ),
  pause: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
  ),
  check: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
  ),
  sparkle: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M18.5 5.5l-2.8 2.8M8.3 15.7l-2.8 2.8"/>
    </svg>
  ),
  terminal: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  ),
  eye: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  image: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
    </svg>
  ),
  doc: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
  settings: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  tweak: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  close: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  arrowRight: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  wechat: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  cpu: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
    </svg>
  ),
};

// =================== Brand logo block (used in top-left + promo) ===================
function BrandLogo({ size = 20, showTag = true }) {
  return (
    <div className="brand">
      <div className="brand-mark" style={{width: size+4, height: size+4}}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M3 20V5l6 8 3-5 3 5 6-8v15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="3" cy="20" r="1.2" fill="currentColor"/>
          <circle cx="21" cy="20" r="1.2" fill="currentColor"/>
        </svg>
      </div>
      <span>MBEditor</span>
      {showTag && <span className="brand-tag">v5 · AGENT</span>}
    </div>
  );
}

// =================== Chip ===================
function Chip({ children, tone = "", className = "", ...p }) {
  return <span className={`chip ${tone ? "chip-"+tone : ""} ${className}`} {...p}>{children}</span>;
}

// =================== Rail (left vertical nav) ===================
function Rail({ route, go }) {
  const items = [
    { k: "list", icon: I.list(16), label: "列表" },
    { k: "editor", icon: I.edit(16), label: "编辑" },
    { k: "agent", icon: I.agent(16), label: "代理" },
    { k: "promo", icon: I.sparkle(14), label: "宣传" },
  ];
  return (
    <div className="rail">
      {items.map(it => (
        <button
          key={it.k}
          title={it.label}
          className={"rail-btn " + (route === it.k ? "active" : "")}
          onClick={() => go(it.k)}
        >
          {it.icon}
        </button>
      ))}
      <div className="rail-vlabel">MBEDITOR · 2026</div>
    </div>
  );
}

// =================== Topbar ===================
function Topbar({ route, go, onTweaks }) {
  const time = useClock();
  return (
    <div className="topbar">
      <BrandLogo size={18} />
      <div className="topnav">
        <button className={route==="list" ? "active":""} onClick={()=>go("list")}>稿库</button>
        <button className={route==="editor" ? "active":""} onClick={()=>go("editor")}>编辑台</button>
        <button className={route==="agent" ? "active":""} onClick={()=>go("agent")}>代理控制台</button>
        <button className={route==="promo" ? "active":""} onClick={()=>go("promo")}>宣传片</button>
      </div>
      <div className="topbar-right">
        <span className="chip chip-forest" style={{gap:8}}>
          <span className="pulse"/>ONLINE · localhost:7072
        </span>
        <span className="chip mono tnum" style={{color:"var(--fg-3)"}}>{time}</span>
        <button className="btn btn-ghost btn-sm" onClick={onTweaks} title="Tweaks">
          {I.tweak(13)} TWEAKS
        </button>
      </div>
    </div>
  );
}

function useClock() {
  const [t, setT] = useState(() => fmtClock(new Date()));
  useEffect(() => {
    const id = setInterval(() => setT(fmtClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
function fmtClock(d) {
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// =================== Label with mono prefix ===================
function MonoLabel({ prefix, children, tone }) {
  return (
    <div style={{display:"flex", alignItems:"baseline", gap:10}}>
      <span className={`caps ${tone==="gold"?"caps-gold":tone==="accent"?"caps-accent":""}`}>{prefix}</span>
      <span style={{color:"var(--fg-3)", fontSize:12}}>{children}</span>
    </div>
  );
}

// Expose to window
Object.assign(window, {
  I, BrandLogo, Chip, Rail, Topbar, MonoLabel, useClock, fmtClock,
});
