import { useState } from "react";
import { Route, Routes } from "react-router-dom";

import MainHeader from "@/components/layout/main-header";
import Sidebar from "@/components/layout/sidebar";
import PlayerBar from "@/components/player/player-bar";
import PlayerAudioManager from "@/components/player/player-audio-manager";
import HomePage from "@/pages/home";
import DiscoverPage from "@/pages/discover";
import FavoritesPage from "@/pages/favorites";
import RecentPage from "@/pages/recent";
import SearchPage from "@/pages/search";
import PlaylistPage from "@/pages/playlist";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div
        className={`sticky top-0 h-screen flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${isSidebarOpen ? "w-72" : "w-0"}`}
      >
        <div
          className={`h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <Sidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        {!isSidebarOpen && (
          <MainHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        )}
        <main className="flex-grow px-6 pt-6 pb-28">
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<DiscoverPage />} path="/discover" />
            <Route element={<FavoritesPage />} path="/favorites" />
            <Route element={<RecentPage />} path="/recent" />
            <Route element={<SearchPage />} path="/search" />
            <Route element={<PlaylistPage />} path="/playlist/:id" />
          </Routes>
        </main>
        <PlayerBar sidebarOpen={isSidebarOpen} />
        <PlayerAudioManager />
      </div>
    </div>
  );
}

export default App;
