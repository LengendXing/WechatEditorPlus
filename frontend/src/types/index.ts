export interface Article {
  id: string;
  title: string;
  mode: "html" | "markdown";
  html: string;
  css: string;
  js: string;
  markdown: string;
  cover: string;
  author: string;
  digest: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  mode: string;
  cover: string;
  created_at: string;
  updated_at: string;
}

export interface ImageRecord {
  id: string;
  md5: string;
  filename: string;
  path: string;
  size: number;
  width: number;
  height: number;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
