import { create } from "zustand";
import api from "@/lib/api";
import type { Article, ArticleFull, ArticleSummary } from "@/types";

interface ArticlesState {
  /** Article list (summaries from the list endpoint, or full articles after fetch) */
  articles: (ArticleSummary | Article)[];
  currentArticleId: string | null;
  loading: boolean;

  fetchArticles: () => Promise<void>;
  fetchArticle: (id: string) => Promise<ArticleFull>;
  createArticle: (title: string, mode: "html" | "markdown") => Promise<ArticleFull>;
  updateArticle: (id: string, data: Partial<Omit<ArticleFull, "id" | "created_at" | "updated_at">>) => Promise<ArticleFull>;
  deleteArticle: (id: string) => Promise<void>;
  setCurrentArticle: (id: string | null) => void;
}

export const useArticlesStore = create<ArticlesState>()((set, get) => ({
  articles: [],
  currentArticleId: null,
  loading: false,

  fetchArticles: async () => {
    set({ loading: true });
    try {
      const res = await api.get<{ code: number; data: ArticleSummary[] }>("/articles");
      set({ articles: res.data.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchArticle: async (id: string) => {
    set({ loading: true });
    try {
      const res = await api.get<{ code: number; data: ArticleFull }>(`/articles/${id}`);
      const article = res.data.data;
      // Merge the full article into the list, replacing any summary with same id
      set((state) => ({
        articles: state.articles.map((a) => (a.id === id ? article : a)),
      }));
      return article;
    } finally {
      set({ loading: false });
    }
  },

  createArticle: async (title: string, mode: "html" | "markdown") => {
    const res = await api.post<{ code: number; data: ArticleFull }>("/articles", { title, mode });
    const article = res.data.data;
    set((state) => ({ articles: [article, ...state.articles] }));
    return article;
  },

  updateArticle: async (id: string, data) => {
    const res = await api.put<{ code: number; data: ArticleFull }>(`/articles/${id}`, data);
    const updated = res.data.data;
    set((state) => ({
      articles: state.articles.map((a) => (a.id === id ? updated : a)),
    }));
    return updated;
  },

  deleteArticle: async (id: string) => {
    await api.delete(`/articles/${id}`);
    set((state) => ({
      articles: state.articles.filter((a) => a.id !== id),
      currentArticleId: state.currentArticleId === id ? null : state.currentArticleId,
    }));
  },

  setCurrentArticle: (id: string | null) => {
    set({ currentArticleId: id });
  },
}));
