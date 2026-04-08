import { useState, useEffect, useRef, useCallback } from "react";
import { X, Upload, ImagePlus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "@/stores/toastStore";
import type { ImageRecord } from "@/types";

interface ImageManagerModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (urls: string[]) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageManagerModal({
  open,
  onClose,
  onInsert,
}: ImageManagerModalProps) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload } = useImageUpload();

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/images")
      .then((res) => {
        if (res.data.code === 0) setImages(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) {
      load();
      setSelected(new Set());
    }
  }, [open, load]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const record = await upload(file);
      if (record) {
        toast.success("上传成功", record.filename);
      } else {
        toast.error("上传失败", file.name);
      }
    }
    load();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFiles(files);
    }
    e.target.value = "";
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleInsertSelected = () => {
    const urls = images
      .filter((img) => selected.has(img.id))
      .map((img) => `/images/${img.filename}`);
    if (urls.length > 0) {
      onInsert(urls);
      onClose();
    }
  };

  const handleDelete = async (record: ImageRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/images/${record.id}`);
      toast.success("已删除", record.filename);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
      load();
    } catch {
      toast.error("删除失败");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[720px] max-h-[80vh] flex flex-col bg-surface-secondary rounded-2xl border border-border-primary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-primary shrink-0">
          <h2 className="text-sm font-semibold text-fg-primary">
            图片管理
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-surface-tertiary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Upload area */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClickUpload}
            className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              dragging
                ? "border-accent bg-accent/5"
                : "border-border-primary hover:border-accent"
            }`}
          >
            <Upload
              size={18}
              className={dragging ? "text-accent" : "text-fg-muted"}
            />
            <span className="text-xs text-fg-muted">
              拖拽图片到此处，或点击上传（支持多文件）
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto px-5 py-2 min-h-[200px]">
          {loading && images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-fg-muted">
              <ImagePlus size={32} className="mb-2 opacity-40" />
              <span className="text-xs">暂无图片</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img) => {
                const isSelected = selected.has(img.id);
                const isHovered = hoveredId === img.id;
                return (
                  <div
                    key={img.id}
                    onClick={() => toggleSelect(img.id)}
                    onMouseEnter={() => setHoveredId(img.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`group relative rounded-lg overflow-hidden bg-surface-tertiary cursor-pointer transition-all border-2 ${
                      isSelected
                        ? "border-accent ring-1 ring-accent/30"
                        : "border-transparent hover:border-border-primary"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={`/images/${img.filename}`}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {/* Info */}
                    <div className="px-2 py-1.5 bg-surface-secondary border-t border-border-secondary">
                      <div className="text-[11px] text-fg-secondary truncate">
                        {img.filename}
                      </div>
                      <div className="text-[10px] text-fg-muted">
                        {formatSize(img.size)}
                      </div>
                    </div>
                    {/* Selection check */}
                    {isSelected && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Delete button on hover */}
                    {isHovered && (
                      <button
                        onClick={(e) => handleDelete(img, e)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-bg-primary/80 text-fg-muted hover:text-error hover:bg-bg-primary transition-colors"
                        title="删除图片"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-primary shrink-0 flex items-center justify-between">
          <span className="text-xs text-fg-muted">
            {selected.size > 0
              ? `已选: ${selected.size} 张`
              : `共 ${images.length} 张图片`}
          </span>
          <button
            onClick={handleInsertSelected}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ImagePlus size={13} />
            插入图片
          </button>
        </div>
      </div>
    </div>
  );
}
