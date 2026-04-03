import { useCallback } from "react";
import api from "@/lib/api";
import type { ImageRecord } from "@/types";

export function useImageUpload() {
  const upload = useCallback(async (file: File): Promise<ImageRecord | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.code === 0) return res.data.data;
    } catch (e) {
      console.error("Upload failed:", e);
    }
    return null;
  }, []);

  return { upload };
}
