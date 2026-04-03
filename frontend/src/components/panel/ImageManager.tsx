import { useState, useEffect } from "react";
import { Upload, Copy, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { ImageRecord } from "@/types";

interface ImageManagerProps {
  onInsert: (url: string) => void;
}

export default function ImageManager({ onInsert }: ImageManagerProps) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const { upload } = useImageUpload();

  const load = () => {
    api.get("/images").then((res) => {
      if (res.data.code === 0) setImages(res.data.data);
    });
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const record = await upload(file);
      if (record) {
        load();
        onInsert(`/images/${record.path}`);
      }
    };
    input.click();
  };

  const copyUrl = (path: string) => {
    navigator.clipboard.writeText(`/images/${path}`);
  };

  const deleteImage = async (id: string) => {
    await api.delete(`/images/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-fg-secondary">图片管理</span>
        <button onClick={handleUpload} className="p-1 rounded hover:bg-surface-tertiary text-fg-muted hover:text-fg-primary">
          <Upload size={14} />
        </button>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {images.map((img) => (
          <div key={img.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-tertiary text-xs group">
            <img src={`/images/${img.path}`} className="w-8 h-8 rounded object-cover bg-surface-tertiary" alt="" />
            <span className="flex-1 truncate text-fg-secondary">{img.filename}</span>
            <button onClick={() => copyUrl(img.path)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent">
              <Copy size={12} />
            </button>
            <button onClick={() => deleteImage(img.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-error">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
