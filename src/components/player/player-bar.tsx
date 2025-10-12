import { ArrowPathRoundedSquareIcon, BackwardIcon, ForwardIcon, PauseIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

type PlayerBarProps = {
  sidebarOpen: boolean;
};

const PlayerBar = ({ sidebarOpen }: PlayerBarProps) => {
  return (
    <div
      className="fixed bottom-0 z-50 flex justify-center pb-4 transition-[left]
      duration-300"
      style={{
        left: sidebarOpen ? "calc(18rem + 1.5rem)" : "1.5rem",
        right: "1.5rem",
      }}
    >
      <div className="flex w-full max-w-4xl items-center justify-between rounded-2xl border-none bg-zinc-900/90 px-6 py-2 shadow-lg backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/10" />
          <div className="flex flex-col text-sm">
            <span className="font-semibold">当前歌曲标题</span>
            <span className="text-white/60">演唱者</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <button className="rounded-full p-2 transition hover:bg-white/10" type="button">
            <ArrowPathRoundedSquareIcon className="h-6 w-6" />
          </button>
          <button className="rounded-full p-2 transition hover:bg-white/10" type="button">
            <BackwardIcon className="h-6 w-6" />
          </button>
          <button className="rounded-full bg-white text-black p-2 transition hover:bg-white/80" type="button">
            <PauseIcon className="h-6 w-6" />
          </button>
          <button className="rounded-full p-2 transition hover:bg-white/10" type="button">
            <ForwardIcon className="h-6 w-6" />
          </button>
          <button className="rounded-full p-2 transition hover:bg-white/10" type="button">
            <ArrowPathIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
