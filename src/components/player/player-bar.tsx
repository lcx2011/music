import {
  ArrowPathRoundedSquareIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useMemo } from "react";

import usePlayerStore from "@/store/playerStore";

type PlayerBarProps = {
  sidebarOpen: boolean;
};

const PlayerBar = ({ sidebarOpen }: PlayerBarProps) => {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const status = usePlayerStore((state) => state.status);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const loop = usePlayerStore((state) => state.loop);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const toggleLoop = usePlayerStore((state) => state.toggleLoop);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const isPlaying = status === "playing";
  const displayTitle = currentSong?.title ?? "未播放歌曲";
  const displayArtist = currentSong?.artist ?? "";
  const artwork = useMemo(() => currentSong?.artwork, [currentSong?.artwork]);

  return (
    <div
      className="fixed bottom-0 z-50 flex justify-center pb-4 transition-[left]
      duration-300"
      style={{
        left: sidebarOpen ? "calc(18rem + 1.5rem)" : "1.5rem",
        right: "1.5rem",
      }}
    >
      <div className="flex w-full max-w-4xl items-center justify-between rounded-2xl border-none bg-zinc-900/90 px-6 py-1.5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/10">
            {artwork ? (
              <img
                alt={displayTitle}
                className="h-full w-full object-cover"
                src={artwork}
              />
            ) : null}
          </div>
          <div className="flex flex-col text-sm">
            <span className="font-semibold">{displayTitle}</span>
            {displayArtist ? (
              <span className="text-white/60">{displayArtist}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <button
            className={`rounded-full p-2 transition hover:bg-white/10 ${shuffle ? "bg-white/20" : ""}`}
            type="button"
            onClick={() => {
              toggleShuffle();
            }}
          >
            <ArrowPathRoundedSquareIcon className="h-6 w-6" />
          </button>
          <button
            className="rounded-full p-2 transition hover:bg-white/10"
            type="button"
            onClick={() => {
              void previous();
            }}
          >
            <img
              alt="上一首"
              className="h-6 w-6"
              src="/icon/上.svg"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </button>
          <button
            className="rounded-full p-2 transition hover:bg-white/10"
            disabled={!currentSong}
            type="button"
            onClick={() => {
              void togglePlay();
            }}
          >
            <img
              alt={isPlaying ? "暂停" : "播放"}
              className="h-6 w-6"
              src={isPlaying ? "/icon/暂停.svg" : "/icon/开始.svg"}
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </button>
          <button
            className="rounded-full p-2 transition hover:bg-white/10"
            type="button"
            onClick={() => {
              void next();
            }}
          >
            <img
              alt="下一首"
              className="h-6 w-6"
              src="/icon/下.svg"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </button>
          <button
            className={`rounded-full p-2 transition hover:bg-white/10 ${loop ? "bg-white/20" : ""}`}
            type="button"
            onClick={() => {
              toggleLoop();
            }}
          >
            <ArrowPathIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
