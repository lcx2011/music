export interface MusicItem {
  id: string | number;
  songmid: string;
  title: string;
  artist: string;
  artwork?: string;
  album?: string;
  lrc?: string;
  albumid?: string | number;
  albummid?: string;
  duration?: number;
}

export interface TopListSummary {
  id: string;
  description?: string;
  title: string;
  period?: string;
  coverImg?: string;
}

export interface TopListGroup {
  title: string;
  data: TopListSummary[];
}

export interface TopListDetail extends TopListSummary {
  musicList: MusicItem[];
}

export interface RecommendTagItem {
  id: string | number;
  title: string;
}

export interface RecommendTagGroup {
  title: string;
  data: RecommendTagItem[];
}

export interface RecommendSheetTagsResponse {
  pinned: RecommendTagItem[];
  data: RecommendTagGroup[];
}

export interface RecommendSheetItem {
  id: string;
  createTime: number | string;
  title: string;
  artwork?: string;
  description?: string;
  playCount?: number;
  artist?: string;
}

export interface RecommendSheetsResponse {
  isEnd: boolean;
  data: RecommendSheetItem[];
}

export interface MediaSourceResponse {
  url: string;
}

export interface SearchResponse {
  data: MusicItem[];
  isEnd: boolean;
}
