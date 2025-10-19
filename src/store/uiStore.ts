import { create } from "zustand";

interface UIState {
  musicDetailOpen: boolean;
  openMusicDetail: () => void;
  closeMusicDetail: () => void;
  toggleMusicDetail: () => void;
}

const useUIStore = create<UIState>((set) => ({
  musicDetailOpen: false,
  openMusicDetail: () => set({ musicDetailOpen: true }),
  closeMusicDetail: () => set({ musicDetailOpen: false }),
  toggleMusicDetail: () =>
    set((s) => ({ musicDetailOpen: !s.musicDetailOpen })),
}));

export default useUIStore;
