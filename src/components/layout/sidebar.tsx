import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  HeartIcon,
  ClockIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

import { SidebarIcon } from "@/components/icons";

const NAV_ITEMS = [
  {
    label: "主页",
    icon: HomeIcon,
    path: "/",
  },
  {
    label: "发现",
    icon: SparklesIcon,
    path: "/discover",
  },
  {
    label: "搜索",
    icon: MagnifyingGlassIcon,
    path: "/search",
  },
  {
    label: "收藏",
    icon: HeartIcon,
    path: "/favorites",
  },
  {
    label: "播放历史",
    icon: ClockIcon,
    path: "/recent",
  },
  {
    label: "添加播放列表",
    icon: PlusCircleIcon,
  },
];

type SidebarProps = {
  onCloseSidebar: () => void;
};

const Sidebar = ({ onCloseSidebar }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-white/10 bg-zinc-900 px-6 py-6">
      <button
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none text-white transition hover:text-gray-400"
        type="button"
        onClick={onCloseSidebar}
      >
        <SidebarIcon className="h-5 w-5" />
      </button>

      <nav className="mt-8 space-y-2">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={path ?? label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              type="button"
              onClick={() => {
                if (path) {
                  handleNavigate(path);
                }
              }}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
