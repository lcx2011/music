import { Tabs, Tab } from "@heroui/tabs";
import { Key, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SearchIcon, SidebarIcon } from "@/components/icons";

type HeaderTabsProps = {
  onOpenSidebar: () => void;
};

type TabItem = {
  key: string;
  title: ReactNode;
  path?: string;
};

const TAB_ITEMS: TabItem[] = [
  {
    key: "sidebar",
    title: <SidebarIcon className="h-5 w-5" />,
  },
  {
    key: "/",
    title: "主页",
    path: "/",
  },
  {
    key: "/discover",
    title: "发现",
    path: "/discover",
  },
  {
    key: "/favorites",
    title: "收藏",
    path: "/favorites",
  },
  {
    key: "/recent",
    title: "最近播放",
    path: "/recent",
  },
  {
    key: "/search",
    title: <SearchIcon className="h-4 w-4" />,
    path: "/search",
  },
];

const HeaderTabs = ({ onOpenSidebar }: HeaderTabsProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = useMemo(() => {
    const match = TAB_ITEMS.find((item) => item.path === location.pathname);

    return match?.key ?? "/";
  }, [location.pathname]);

  const handleSelectionChange = (key: Key) => {
    if (typeof key !== "string") {
      return;
    }

    const item = TAB_ITEMS.find((tab) => tab.key === key);

    if (key === "sidebar") {
      onOpenSidebar();

      return;
    }

    if (item?.path) {
      navigate(item.path);
    }
  };

  return (
    <Tabs
      aria-label="主导航"
      radius="full"
      selectedKey={selectedKey}
      onSelectionChange={handleSelectionChange}
      variant="solid"
      className="justify-center w-full max-w-3xl dark"
    >
      {TAB_ITEMS.map((item) => (
        <Tab key={item.key} title={item.title} />
      ))}
    </Tabs>
  );
};

export default HeaderTabs;
