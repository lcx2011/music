import type { MusicItem } from "@/types";

import { Input } from "@heroui/input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import qqMusicClient from "@/services/qqMusicClient";
import usePlayerStore from "@/store/playerStore";

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M22 22L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

type StatusState = {
  loading: boolean;
  error: string | null;
};

const createInitialStatus = (): StatusState => ({
  loading: false,
  error: null,
});

const SearchPage = () => {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusState>(createInitialStatus);
  const [results, setResults] = useState<MusicItem[]>([]);
  const [page, setPage] = useState(1);
  const [isEnd, setIsEnd] = useState(true);
  const [touched, setTouched] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  const playQueue = usePlayerStore((state) => state.playQueue);
  const handlePlaySong = useCallback(
    (index: number) => {
      if (results.length === 0) return;
      void playQueue(results, index);
    },
    [results, playQueue],
  );

  // Debounce keyword
  const debouncedKeyword = useDebounce(keyword, 400);

  const canSearch = useMemo(
    () => debouncedKeyword.trim().length > 0,
    [debouncedKeyword],
  );

  // Perform search when debounced keyword changes
  useEffect(() => {
    let active = true;

    const fetchFirst = async () => {
      if (!canSearch) {
        setResults([]);
        setIsEnd(true);
        setStatus(createInitialStatus());

        return;
      }
      setStatus({ loading: true, error: null });
      try {
        const res = await qqMusicClient.searchMusic(debouncedKeyword, 1);

        if (!active) return;
        const data = res?.data ?? [];

        setResults(data);
        setPage(1);
        setIsEnd(Boolean(res?.isEnd ?? true) || data.length === 0);
        setStatus({ loading: false, error: null });
      } catch (error) {
        if (!active) return;
        setResults([]);
        setIsEnd(true);
        setStatus({
          loading: false,
          error: error instanceof Error ? error.message : "搜索失败",
        });
      }
    };

    void fetchFirst();

    return () => {
      active = false;
    };
  }, [debouncedKeyword, canSearch]);

  // Infinite load more
  useEffect(() => {
    if (!observerRef.current) return;
    const node = observerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (!entry.isIntersecting) return;
          if (status.loading) return;
          if (isEnd) return;
          if (!canSearch) return;
          if (!hasScrolledRef.current) return;

          hasScrolledRef.current = false;
          try {
            setStatus((s) => ({ ...s, loading: true }));
            const next = page + 1;
            const res = await qqMusicClient.searchMusic(debouncedKeyword, next);
            const more = res?.data ?? [];

            setResults((prev) => [...prev, ...more]);
            setPage(next);
            setIsEnd(Boolean(res?.isEnd ?? true) || more.length === 0);
            setStatus({ loading: false, error: null });
          } catch (error) {
            setStatus({
              loading: false,
              error: error instanceof Error ? error.message : "加载更多失败",
            });
          }
        });
      },
      { threshold: 1.0 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [status.loading, isEnd, canSearch, page, debouncedKeyword]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) hasScrolledRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        {status.loading && <span className="text-sm text-gray-400" />}
      </div>
      <div className="flex items-center gap-4">
        <div className="mx-auto w-full max-w-xl dark">
          <Input
            isClearable
            classNames={{
              label: "text-black/50 dark:text-white/90",
              input: [
                "bg-transparent",
                "text-black/90 dark:text-white/90",
                "placeholder:text-default-700/50 dark:placeholder:text-white/60",
              ],
              innerWrapper: "bg-transparent",
              inputWrapper: [
                "shadow-sm",
                "bg-default-200/50",
                "dark:bg-default/60",
                "backdrop-blur-xl",
                "backdrop-saturate-200",
                "hover:bg-default-200/70",
                "dark:hover:bg-default/70",
                "group-data-[focus=true]:bg-default-200/50",
                "dark:group-data-[focus=true]:bg-default/60",
                "cursor-text!",
              ],
            }}
            label="Search"
            placeholder="Type to search..."
            radius="lg"
            startContent={
              <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none shrink-0" />
            }
            value={keyword}
            onClear={() => {
              setKeyword("");
              setTouched(false);
            }}
            onValueChange={(v: string) => {
              setTouched(true);
              setKeyword(v);
            }}
          />
        </div>
      </div>

      {status.error && <p className="text-sm text-red-400">{status.error}</p>}

      {results.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((song, index) => (
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
                      搜索结果
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
        </>
      ) : (
        touched &&
        !status.loading && (
          <p className="text-sm text-gray-400">未找到相关结果</p>
        )
      )}
    </section>
  );
};

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default SearchPage;
