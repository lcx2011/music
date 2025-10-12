import type {
  MusicItem,
  RecommendSheetsResponse,
  RecommendSheetTagsResponse,
  TopListDetail,
  TopListGroup,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

const request = async <T>(path: string, options?: RequestOptions, params?: Record<string, string | number | undefined>) => {
  const finalUrl = params ? buildUrl(path, params) : new URL(path, API_BASE_URL).toString();
  const init: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  };

  const response = await fetch(finalUrl, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
};

const qqMusicClient = {
  fetchTopLists: () => request<TopListGroup[]>("/api/top-lists"),
  fetchTopListDetail: (id: string, period?: string) =>
    request<TopListDetail>(`/api/top-lists/${encodeURIComponent(id)}`, undefined, period ? { period } : undefined),
  fetchRecommendSheetTags: () => request<RecommendSheetTagsResponse>("/api/recommend/tags"),
  fetchRecommendSheetsByTag: (categoryId?: string | number, page = 1) =>
    request<RecommendSheetsResponse>("/api/recommend/sheets", undefined, {
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
      page,
    }),
  fetchMusicSheetInfo: (id: string) =>
    request<{ musicList: MusicItem[]; isEnd: boolean }>(`/api/music-sheets/${encodeURIComponent(id)}`),
};

export default qqMusicClient;
export type {
  MusicItem,
  TopListGroup,
  TopListDetail,
  RecommendSheetTagsResponse,
  RecommendSheetsResponse,
};
