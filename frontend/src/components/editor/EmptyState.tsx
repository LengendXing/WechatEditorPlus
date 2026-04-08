import {
  PenLine,
  Sparkles,
  FilePlus,
  LayoutGrid,
  Code,
  Send,
  Palette,
} from "lucide-react";

interface EmptyStateProps {
  onCreateSample: () => void;
  onCreateBlank: () => void;
}

const features = [
  {
    icon: LayoutGrid,
    color: "text-info",
    bg: "bg-[#6B7FBF1A]",
    title: "可视化编辑",
    desc: "拖拽组件、实时预览\n所见即所得",
  },
  {
    icon: Code,
    color: "text-accent",
    bg: "bg-[#E8553A1A]",
    title: "代码 & Markdown",
    desc: "语法高亮、实时预览\n极客也友好",
  },
  {
    icon: Send,
    color: "text-success",
    bg: "bg-[#3A9E7E14]",
    title: "一键发布",
    desc: "直推公众号草稿箱\nAPI 自动化集成",
  },
  {
    icon: Palette,
    color: "text-warning",
    bg: "bg-[#C9923E0D]",
    title: "主题排版",
    desc: "多款精选主题\n深色/浅色模式",
  },
];

export default function EmptyState({
  onCreateSample,
  onCreateBlank,
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      {/* Hero section */}
      <div className="flex flex-col items-center gap-4 w-[520px]">
        {/* Icon */}
        <div className="w-20 h-20 rounded-[20px] bg-[#E8553A14] border border-[#E8553A33] flex items-center justify-center">
          <PenLine size={36} className="text-accent" />
        </div>

        {/* Title */}
        <h1 className="text-[28px] font-bold text-fg-primary text-center">
          首款支持 AI Agent 直接使用的公众号编辑器
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] text-fg-muted text-center leading-[1.7] w-[520px]">
          可视化排版、Markdown 写作、代码编辑三种模式，让公众号创作更高效
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateSample}
          className="flex items-center gap-2 bg-accent text-white rounded-[10px] px-7 py-3 shadow-[0_4px_16px_#E8553A44] text-[15px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Sparkles size={18} />
          从示例文章开始
        </button>
        <button
          onClick={onCreateBlank}
          className="flex items-center gap-2 border border-border-secondary text-fg-secondary rounded-[10px] px-7 py-3 text-[15px] hover:bg-surface-tertiary transition-colors cursor-pointer"
        >
          <FilePlus size={18} />
          创建空白文章
        </button>
      </div>

      {/* Feature cards */}
      <div className="flex gap-4 w-[800px]">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex-1 flex flex-col items-center gap-2.5 bg-surface-secondary border border-border-primary rounded-xl px-[18px] py-5"
          >
            <div
              className={`w-10 h-10 rounded-[10px] ${f.bg} flex items-center justify-center`}
            >
              <f.icon size={20} className={f.color} />
            </div>
            <div className="text-[14px] font-semibold text-fg-primary">
              {f.title}
            </div>
            <div className="text-[12px] text-fg-muted text-center leading-[1.6] whitespace-pre-line">
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
