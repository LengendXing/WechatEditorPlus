import { useState } from "react";
import { IconDoc, IconList, IconImage, IconCpu, IconTerminal, IconPlus } from "@/components/icons";
import Seg from "@/components/ui/Seg";

interface Block {
  id: string;
  type: string;
  label: string;
  preview: string;
  active?: boolean;
  depth: number;
}

const MOCK_BLOCKS: Block[] = [
  { id: "b1", type: "hero", label: "Hero · 标题组", preview: "让公众号排版回归内容本身", active: true, depth: 0 },
  { id: "b2", type: "section", label: "Section · 什么是", preview: "三种模式，一个目标", depth: 0 },
  { id: "b3", type: "card", label: "Card · HTML 模式", preview: "完全掌控每一个像素…", depth: 1 },
  { id: "b4", type: "card", label: "Card · Markdown 模式", preview: "用最简洁的语法写作…", depth: 1 },
  { id: "b5", type: "card", label: "Card · 可视化编辑", preview: "所见即所得…", depth: 1 },
  { id: "b6", type: "divider", label: "Divider", preview: "——", depth: 0 },
  { id: "b7", type: "section", label: "Section · HTML Showcase", preview: "纯 HTML 排版效果展示", depth: 0 },
  { id: "b8", type: "tags", label: "Tags · 标签徽章", preview: "Hot · New · AI Agent…", depth: 1 },
  { id: "b9", type: "gradient", label: "Gradient Card", preview: "Write Once, Publish Everywhere", depth: 1 },
  { id: "b10", type: "stats", label: "Stats · 数据看板", preview: "3 · 100% · API", depth: 1 },
  { id: "b11", type: "timeline", label: "Timeline · 时间线", preview: "创建 → 编辑 → 发布", depth: 1 },
  { id: "b12", type: "code", label: "Code · curl 示例", preview: "POST /api/v1/articles", depth: 1 },
];

const BLOCK_ICON: Record<string, (size: number) => React.ReactNode> = {
  hero: (s) => <IconDoc size={s} />,
  section: (s) => <IconDoc size={s} />,
  card: (s) => <IconDoc size={s} />,
  divider: (s) => <IconList size={s} />,
  tags: (s) => <IconList size={s} />,
  gradient: (s) => <IconImage size={s} />,
  stats: (s) => <IconCpu size={s} />,
  timeline: (s) => <IconList size={s} />,
  code: (s) => <IconTerminal size={s} />,
};

const ASSET_COLORS = ["#C14A3A", "#C4A76C", "#6B9872", "#7588B8", "#8A6D5B", "#302629"];

interface StructurePanelProps {
  selected: string;
  setSelected: (id: string) => void;
  mode: string;
  setMode: (mode: string) => void;
}

export default function StructurePanel({ selected, setSelected, mode, setMode }: StructurePanelProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border)",
        background: "var(--bg-deep)",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--border)" }}>
        <div className="caps" style={{ marginBottom: 8 }}>
          文件 · FILE
        </div>
        <input
          defaultValue="让公众号排版回归内容本身"
          style={{
            all: "unset",
            width: "100%",
            fontFamily: "var(--f-display)",
            fontSize: 20,
            lineHeight: 1.25,
            color: "var(--fg)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <Seg
            options={[
              { value: "html", label: "HTML" },
              { value: "markdown", label: "MD" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--fg-5)", letterSpacing: "0.1em" }}
          >
            MB-2604-018
          </span>
        </div>
      </div>

      {/* Block tree */}
      <div style={{ padding: "14px 12px 8px", borderBottom: "1px solid var(--border)", overflow: "auto", flex: "0 1 auto" }}>
        <div className="caps" style={{ padding: "0 8px 10px" }}>
          结构 · OUTLINE
        </div>
        <div>
          {MOCK_BLOCKS.map((b, i) => {
            const icoFn = BLOCK_ICON[b.type] || ((s: number) => <IconDoc size={s} />);
            const active = selected === b.id;
            return (
              <div
                key={b.id}
                onClick={() => setSelected(b.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  paddingLeft: 8 + b.depth * 14,
                  borderRadius: 4,
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-3)",
                  cursor: "pointer",
                  transition: "background 0.12s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: -1,
                      top: 6,
                      bottom: 6,
                      width: 2,
                      background: "var(--accent)",
                      borderRadius: 2,
                    }}
                  />
                )}
                <span
                  className="mono tnum"
                  style={{ fontSize: 9, color: "var(--fg-5)", width: 16 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {icoFn(12)}
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: active ? "var(--fg)" : "var(--fg-2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.label}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: "var(--fg-5)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.preview}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assets */}
      <div style={{ padding: "14px 20px 14px" }}>
        <div className="caps" style={{ marginBottom: 10 }}>
          素材 · ASSETS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {ASSET_COLORS.map((c, i) => (
            <div
              key={i}
              onClick={() => alert(`素材 ${String(i + 1).padStart(2, "0")} — 点击查看/替换`)}
              style={{
                aspectRatio: "1",
                borderRadius: 4,
                position: "relative",
                overflow: "hidden",
                background: `linear-gradient(135deg, ${c}, ${c}88)`,
                border: "1px solid var(--border-2)",
                cursor: "pointer",
                transition: "transform 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,0.04) 4px 5px)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 4,
                  bottom: 2,
                  fontFamily: "var(--f-mono)",
                  fontSize: 8,
                  color: "#fff8",
                  letterSpacing: "0.1em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
          <div
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.click();
            }}
            style={{
              aspectRatio: "1",
              borderRadius: 4,
              border: "1px dashed var(--border-2)",
              display: "grid",
              placeItems: "center",
              color: "var(--fg-4)",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--accent)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-glow)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--fg-4)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)";
            }}
          >
            <IconPlus size={14} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          fontFamily: "var(--f-mono)",
          fontSize: 10,
          color: "var(--fg-5)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>12 BLOCKS</span>
        <span>&middot; &middot; &middot;</span>
        <span>2,340 字</span>
      </div>
    </div>
  );
}
