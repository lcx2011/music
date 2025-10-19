export type PlaybackHistoryEntry = {
  songmid: string;
  title: string;
  artist: string;
  artwork?: string;
  album?: string;
  playedAt: string;
};

export type AuthUser = {
  email: string;
  nickname: string;
  playbackHistory: PlaybackHistoryEntry[];
  favorites: unknown[];
  createdAt: string;
  updatedAt: string;
};
