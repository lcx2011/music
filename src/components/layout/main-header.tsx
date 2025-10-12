import { UserCircleIcon } from "@heroicons/react/24/solid";

import HeaderTabs from "@/components/layout/header-tabs";

type MainHeaderProps = {
  onOpenSidebar: () => void;
};

const MainHeader = ({ onOpenSidebar }: MainHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur">
      <div className="h-9 w-9" />
      <div className="flex flex-1 justify-center">
        <HeaderTabs onOpenSidebar={onOpenSidebar} />
      </div>
      <UserCircleIcon className="ml-4 h-9 w-9 text-gray-500" />
    </header>
  );
};

export default MainHeader;
