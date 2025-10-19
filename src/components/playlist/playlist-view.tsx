import type { MusicItem } from "@/types";

import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

type PlaylistViewProps = {
  title: string;
  coverImg?: string;
  description?: string;
  songs: MusicItem[];
  onSelectSong?: (index: number) => void;
};

const PlaylistView = ({
  title,
  coverImg,
  description,
  songs,
  onSelectSong,
}: PlaylistViewProps) => {
  const songsSummary = songs
    .map((song) => song.title?.trim())
    .filter((title): title is string => Boolean(title && title.length > 0))
    .join("，");

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="h-48 w-48 overflow-hidden rounded-2xl bg-white/10 sm:h-66 sm:w-66">
          {coverImg ? (
            <img
              alt={title}
              className="h-full w-full object-cover"
              src={coverImg}
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-4 sm:h-66 sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-1 sm:overflow-hidden">
            <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
            <p className="playlist-scrollbar max-w-2xl text-sm text-white/60 sm:flex-1 sm:overflow-y-auto sm:pr-1">
              {songsSummary || description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg border-none bg-zinc-900 px-40 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              type="button"
            >
              播放
            </button>
            <button
              className="rounded-lg border-none bg-zinc-900 px-40 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/20 hover:text-white"
              type="button"
            >
              随机播放
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        {songs.map((song, index) => {
          const handleKeyDown = (
            event: React.KeyboardEvent<HTMLDivElement>,
          ) => {
            if (!onSelectSong) {
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectSong(index);
            }
          };

          return (
            <div
              key={song.songmid ?? `${song.title}-${index}`}
              className={`grid w-full items-center gap-3 pl-3 pr-4 py-2 border-b border-white/10 last:border-b-0 grid-cols-[minmax(0,1fr)_140px_auto] ${
                onSelectSong
                  ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 hover:bg-white/10"
                  : ""
              }`}
              role={onSelectSong ? "button" : undefined}
              tabIndex={onSelectSong ? 0 : undefined}
              onClick={() => {
                onSelectSong?.(index);
              }}
              onKeyDown={handleKeyDown}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-lg bg-white/10">
                  {song.artwork ? (
                    <img
                      alt={song.title}
                      className="h-full w-full object-cover"
                      src={song.artwork}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {song.title}
                  </p>
                </div>
              </div>
              <div className="truncate text-sm text-white/60">
                {song.artist || "未知歌手"}
              </div>
              <div className="flex shrink-0 items-center text-sm text-white/60">
                <button
                  className="p-2 text-white transition hover:text-white/80"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlaylistView;
