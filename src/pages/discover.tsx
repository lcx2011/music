import type { MusicItem } from "@/types";

import { useCallback, useEffect, useRef, useState } from "react";

import qqMusicClient from "@/services/qqMusicClient";
import usePlayerStore from "@/store/playerStore";

type StatusState = {
  loading: boolean;
  error: string | null;
};

const createInitialStatus = (): StatusState => ({ loading: true, error: null });
const CHUNK_SIZE = 20;

const DiscoverPage = () => {
  const [status, setStatus] = useState<StatusState>(createInitialStatus);
  const [displaySongs, setDisplaySongs] = useState<MusicItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);
  const pendingSongsRef = useRef<MusicItem[]>([]);
  const loadedSongIdsRef = useRef<Set<string>>(new Set());

  const appendChunk = useCallback(
    (replace = false) => {
      if (pendingSongsRef.current.length === 0) {
        return false;
      }

      const chunk = pendingSongsRef.current.splice(0, CHUNK_SIZE);

      if (chunk.length === 0) {
        return false;
      }

      setDisplaySongs((prev) => (replace ? chunk : [...prev, ...chunk]));

      return chunk.length === CHUNK_SIZE;
    },
    [setDisplaySongs],
  );

  const playQueue = usePlayerStore((state) => state.playQueue);
  const handlePlaySong = useCallback(
    (index: number) => {
      if (displaySongs.length === 0) {
        return;
      }
      void playQueue(displaySongs, index);
    },
    [displaySongs, playQueue],
  );

  useEffect(() => {
    let active = true;

    const loadSongs = async () => {
      try {
        setStatus((prev) => ({ ...prev, loading: true, error: null }));
        const sheetsResponse = await qqMusicClient.fetchRecommendSheetsByTag(
          undefined,
          page,
        );

        if (!active) return;

        const sheets = sheetsResponse.data ?? [];

        if (sheets.length === 0) {
          setHasMore(false);
          setStatus({ loading: false, error: null });

          return;
        }

        const targetSheets = sheets.slice(0, 6);

        const sheetSongs = await Promise.all(
          targetSheets.map(async (sheet) => {
            try {
              const detail = await qqMusicClient.fetchMusicSheetInfo(sheet.id);

              return detail.musicList ?? [];
            } catch (error) {
              console.warn("Failed to load music sheet", sheet.id, error);

              return [] as MusicItem[];
            }
          }),
        );

        if (!active) return;

        const pooledSongs = sheetSongs.flat();
        const uniqueMap = new Map<string, MusicItem>();

        pooledSongs.forEach((song) => {
          if (song?.songmid && !uniqueMap.has(song.songmid)) {
            uniqueMap.set(song.songmid, song);
          }
        });

        const freshSongs = Array.from(uniqueMap.values()).filter((song) => {
          if (!song?.songmid) {
            return false;
          }
          if (loadedSongIdsRef.current.has(song.songmid)) {
            return false;
          }
          loadedSongIdsRef.current.add(song.songmid);

          return true;
        });

        if (freshSongs.length > 0) {
          const shuffled = [...freshSongs].sort(() => Math.random() - 0.5);

          pendingSongsRef.current.push(...shuffled);
          appendChunk(page === 1);
        }

        if (sheets.length < 20 && pendingSongsRef.current.length === 0) {
          setHasMore(false);
        } else if (sheets.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setStatus({ loading: false, error: null });
      } catch (error) {
        if (!active) return;
        setStatus({
          loading: false,
          error: error instanceof Error ? error.message : "加载推荐内容失败",
        });
      }
    };

    loadSongs();

    return () => {
      active = false;
    };
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        hasScrolledRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!observerRef.current) return;

    const node = observerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || status.loading) {
            return;
          }

          if (!hasScrolledRef.current) {
            return;
          }

          hasScrolledRef.current = false;
          const appended = appendChunk();

          if (!appended && hasMore) {
            setPage((prev) => prev + 1);
          }
        });
      },
      { threshold: 1.0 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [appendChunk, hasMore, status.loading]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">发现</h1>
        {status.loading && (
          <span className="text-sm text-gray-400">加载中...</span>
        )}
      </div>

      {status.error ? (
        <p className="text-sm text-red-400">{status.error}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {displaySongs.map((song, index) => (
              <button
                key={song.songmid}
                className="group space-y-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                type="button"
                onClick={() => handlePlaySong(index)}
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-white/10">
                  {song.artwork ? (
                    <img
                      alt={song.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      src={song.artwork}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-300">
                      推荐曲目
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <h3 className="truncate text-base font-semibold text-white">
                    {song.title}
                  </h3>
                  {song.artist && (
                    <p className="truncate text-sm text-gray-400">
                      {song.artist}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div ref={observerRef} className="h-10" />
          {!status.loading && displaySongs.length === 0 && (
            <p className="text-sm text-gray-400">暂无推荐曲目</p>
          )}
        </>
      )}
    </section>
  );
};

export default DiscoverPage;
