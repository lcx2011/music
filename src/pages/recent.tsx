import type { PlaybackHistoryEntry } from "@/types/auth";
import type { MusicItem } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

import qqMusicClient from "@/services/qqMusicClient";
import usePlayerStore from "@/store/playerStore";
import { getStoredAuthUser, setStoredAuthUser } from "@/utils/authStorage";

type StatusState = {
  loading: boolean;
  error: string | null;
};

const createStatus = (loading = false): StatusState => ({
  loading,
  error: null,
});

const RecentPage = () => {
  const playSong = usePlayerStore((state) => state.playSong);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const [history, setHistory] = useState<PlaybackHistoryEntry[]>([]);
  const [status, setStatus] = useState<StatusState>(createStatus(true));
  const [email, setEmail] = useState<string | null>(() => getStoredAuthUser()?.email ?? null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = () => {
      setEmail(getStoredAuthUser()?.email ?? null);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const loadHistory = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!email) {
        setHistory([]);
        setStatus(createStatus(false));

        return;
      }

      if (!options?.silent && history.length === 0) {
        setStatus(createStatus(true));
      }

      try {
        const response = await qqMusicClient.fetchPlaybackHistory(email);
        const entries = response.playbackHistory ?? [];
        setHistory(entries);
        const stored = getStoredAuthUser();
        if (stored) {
          setStoredAuthUser({ ...stored, playbackHistory: entries });
        }
        setStatus({ loading: false, error: null });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "加载最近播放失败";
        if (!options?.silent) {
          setStatus({ loading: false, error: message });
        }
      }
    },
    [email, history.length],
  );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!email || !currentSong?.songmid) {
      return;
    }
    void loadHistory({ silent: true });
  }, [currentSong?.songmid, email, loadHistory]);

  const handlePlayEntry = useCallback(
    (entry: PlaybackHistoryEntry) => {
      const song: MusicItem = {
        id: entry.songmid,
        songmid: entry.songmid,
        title: entry.title,
        artist: entry.artist,
        artwork: entry.artwork,
        album: entry.album,
      };

      void playSong(song);
    },
    [playSong],
  );

  const content = useMemo(() => {
    if (!email) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-white/80">
          <p className="text-sm">请登录以查看最近播放记录</p>
        </div>
      );
    }

    if (status.error) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-red-400">
          {status.error}
        </div>
      );
    }

    if (status.loading && history.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-white/60">
          加载中...
        </div>
      );
    }

    if (!status.loading && history.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-white/60">
          暂无播放记录
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {history.map((entry) => (
          <button
            key={`${entry.songmid}-${entry.playedAt}`}
            className="group space-y-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            type="button"
            onClick={() => {
              handlePlayEntry(entry);
            }}
          >
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-white/10">
              {entry.artwork ? (
                <img
                  alt={entry.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  src={entry.artwork}
                />
              ) : null}
            </div>
            <div className="space-y-1 text-sm">
              <h3 className="truncate text-base font-semibold text-white">
                {entry.title}
              </h3>
              {entry.artist ? (
                <p className="truncate text-sm text-gray-400">{entry.artist}</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    );
  }, [email, handlePlayEntry, history, status.error, status.loading]);

  return (
    <section className="space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        {status.loading && history.length > 0 ? (
          <span className="text-sm text-gray-400">更新中...</span>
        ) : null}
      </div>
      {content}
    </section>
  );
};

export default RecentPage;
