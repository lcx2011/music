import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";

import AuthButton from "@/components/auth/auth-button";
import HeaderTabs from "@/components/layout/header-tabs";

type MainHeaderProps = {
  onOpenSidebar: () => void;
};

const MainHeader = ({ onOpenSidebar }: MainHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isPlaylistPage = location.pathname.startsWith("/playlist/");

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur">
      <div className="dark flex h-9 w-9 items-center justify-start">
        {isPlaylistPage ? (
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-1 justify-center">
        <HeaderTabs onOpenSidebar={onOpenSidebar} />
      </div>
      <AuthButton className="ml-4" />
    </header>
  );
};

export default MainHeader;
