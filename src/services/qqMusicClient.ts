import type {
  MediaSourceResponse,
  MusicItem,
  RecommendSheetsResponse,
  RecommendSheetTagsResponse,
  SearchResponse,
  TopListDetail,
  TopListGroup,
} from "@/types";
import type { PlaybackHistoryEntry } from "@/types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type RequestOptions = Omit<RequestInit, "body"> & { body?: BodyInit | null };

const buildUrl = (
  path: string,
  params?: Record<string, string | number | undefined>,
) => {
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

const request = async <T>(
  path: string,
  options?: RequestOptions,
  params?: Record<string, string | number | undefined>,
) => {
  const finalUrl = params
    ? buildUrl(path, params)
    : new URL(path, API_BASE_URL).toString();
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
    request<TopListDetail>(
      `/api/top-lists/${encodeURIComponent(id)}`,
      undefined,
      period ? { period } : undefined,
    ),
  fetchRecommendSheetTags: () =>
    request<RecommendSheetTagsResponse>("/api/recommend/tags"),
  fetchRecommendSheetsByTag: (categoryId?: string | number, page = 1) =>
    request<RecommendSheetsResponse>("/api/recommend/sheets", undefined, {
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
      page,
    }),
  fetchMusicSheetInfo: (id: string) =>
    request<{ musicList: MusicItem[]; isEnd: boolean }>(
      `/api/music-sheets/${encodeURIComponent(id)}`,
    ),
  fetchMediaSource: (
    songmid: string,
    quality: "low" | "standard" | "high" | "super" = "standard",
  ) =>
    request<MediaSourceResponse>(
      `/api/media-source/${encodeURIComponent(songmid)}`,
      undefined,
      { quality },
    ),
  searchMusic: (keyword: string, page = 1) =>
    request<SearchResponse>("/api/search", undefined, {
      keyword,
      page,
      type: "music",
    }),
  fetchLyrics: (songmid: string) =>
    request<{ rawLrc: string; translation?: string }>(
      `/api/lyrics/${encodeURIComponent(songmid)}`
    ),
  fetchPlaybackHistory: (email: string) =>
    request<{ playbackHistory: PlaybackHistoryEntry[] }>(
      `/api/users/${encodeURIComponent(email)}/playback-history`,
    ),
  addPlaybackHistory: (email: string, entry: PlaybackHistoryEntry) =>
    request<{ playbackHistory: PlaybackHistoryEntry[] }>(
      `/api/users/${encodeURIComponent(email)}/playback-history`,
      {
        method: "POST",
        body: JSON.stringify({ entry }),
      },
    ),
};

export default qqMusicClient;
export type { PlaybackHistoryEntry };
export type {
  MediaSourceResponse,
  MusicItem,
  SearchResponse,
  TopListGroup,
  TopListDetail,
  RecommendSheetTagsResponse,
  RecommendSheetsResponse,
};
