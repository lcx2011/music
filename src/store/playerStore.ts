import type { MusicItem } from "@/types";
import type { PlaybackHistoryEntry } from "@/types/auth";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import qqMusicClient from "@/services/qqMusicClient";
import { getStoredAuthUser, setStoredAuthUser } from "@/utils/authStorage";

type PlayerStatus = "idle" | "loading" | "playing" | "paused";

interface PlayerState {
  audio: HTMLAudioElement | null;
  queue: MusicItem[];
  currentIndex: number;
  currentSong: MusicItem | null;
  currentUrl: string | null;
  status: PlayerStatus;
  volume: number;
  currentRequestId: number | null;
  mediaSourceCache: Record<string, string>;
  loop: boolean;
  shuffle: boolean;
  setAudio: (audio: HTMLAudioElement) => void;
  setVolume: (value: number) => void;
  playQueue: (songs: MusicItem[], startIndex?: number) => Promise<void>;
  playSong: (song: MusicItem) => Promise<void>;
  playAt: (index: number, queueOverride?: MusicItem[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  handleAudioPlay: () => void;
  handleAudioPause: () => void;
  handleAudioEnded: () => Promise<void>;
  toggleLoop: () => void;
  toggleShuffle: () => void;
}

const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      audio: null,
      queue: [],
      currentIndex: -1,
      currentSong: null,
      currentUrl: null,
      status: "idle",
      volume: 0.8,
      currentRequestId: null,
      mediaSourceCache: {},
      loop: false,
      shuffle: false,
      setAudio: (audio) => {
        audio.volume = get().volume;
        set({ audio });
      },
      setVolume: (value) => {
        const audio = get().audio;

        if (audio) {
          audio.volume = value;
        }
        set({ volume: value });
      },
      playQueue: async (songs, startIndex = 0) => {
        await get().playAt(startIndex, songs);
      },
      playSong: async (song) => {
        const audio = get().audio;

        if (!audio) {
          return;
        }

        const queue = [song];

        set({ queue, currentIndex: 0 });
        await get().playAt(0);
      },
      playAt: async (index, queueOverride) => {
        const audio = get().audio;

        if (!audio) {
          return;
        }
        const queueSource = queueOverride ?? get().queue;

        if (!queueSource || !queueSource[index]) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
          set({
            queue: queueSource,
            currentIndex: -1,
            currentSong: null,
            currentUrl: null,
            status: "idle",
          });

          return;
        }

        const song = queueSource[index];
        const requestId = Date.now();

        set((state) => ({
          queue: queueSource,
          currentIndex: index,
          currentSong: song,
          status: "loading",
          currentRequestId: requestId,
          currentUrl: state.currentUrl,
        }));

        const recordPlaybackHistory = async (song: MusicItem) => {
          const auth = getStoredAuthUser();

          if (!auth?.email) {
            return;
          }

          const entry: PlaybackHistoryEntry = {
            songmid: song.songmid,
            title: song.title,
            artist: song.artist,
            artwork: song.artwork,
            album: song.album,
            playedAt: new Date().toISOString(),
          };

          try {
            const response = await qqMusicClient.addPlaybackHistory(
              auth.email,
              entry,
            );
            const history = response.playbackHistory ?? [];

            setStoredAuthUser({ ...auth, playbackHistory: history });
          } catch (error) {
            console.warn("记录播放历史失败", error);
          }
        };

        const applyUrl = async (url: string) => {
          const activeRequest = get().currentRequestId;

          if (activeRequest !== requestId) {
            return;
          }
          const currentAudio = get().audio;

          if (!currentAudio) {
            return;
          }
          try {
            const key = `progress:${song.songmid}`;
            localStorage.removeItem(key);
          } catch {}
          currentAudio.src = url;
          currentAudio.currentTime = 0;
          try {
            await currentAudio.play();
            set({ status: "playing", currentUrl: url });
            void recordPlaybackHistory(song);
          } catch (error) {
            console.error("音频播放失败", error);
            set({ status: "paused", currentUrl: url });
          }
        };

        const cachedUrl = get().mediaSourceCache[song.songmid];

        if (cachedUrl) {
          await applyUrl(cachedUrl);

          return;
        }

        try {
          const { url } = await qqMusicClient.fetchMediaSource(song.songmid);

          if (!url) {
            throw new Error("未获取到有效音源");
          }
          set((state) => ({
            mediaSourceCache: {
              ...state.mediaSourceCache,
              [song.songmid]: url,
            },
          }));
          await applyUrl(url);
        } catch (error) {
          console.error("加载音源失败", error);
          set({ status: "paused" });
        }
      },
      togglePlay: async () => {
        const audio = get().audio;

        if (!audio) {
          return;
        }
        const status = get().status;

        if (status === "playing") {
          audio.pause();
          set({ status: "paused" });

          return;
        }

        if (status === "paused" && audio.src) {
          try {
            await audio.play();
            set({ status: "playing" });
          } catch (error) {
            console.error("恢复播放失败", error);
          }

          return;
        }

        const queue = get().queue;
        const index = get().currentIndex >= 0 ? get().currentIndex : 0;

        if (queue.length > 0) {
          await get().playAt(index);
        }
      },
      next: async () => {
        const queue = get().queue;
        const audio = get().audio;
        const shuffle = get().shuffle;

        if (!audio) {
          return;
        }
        if (queue.length === 0) {
          audio.pause();

          return;
        }
        if (shuffle) {
          const currentIndex = get().currentIndex;

          if (queue.length === 1) {
            await get().playAt(0);

            return;
          }
          let randomIndex = Math.floor(Math.random() * queue.length);

          while (randomIndex === currentIndex) {
            randomIndex = Math.floor(Math.random() * queue.length);
          }
          await get().playAt(randomIndex);

          return;
        }
        const nextIndex = get().currentIndex + 1;

        if (nextIndex >= queue.length) {
          audio.pause();
          set({ status: "idle" });

          return;
        }
        await get().playAt(nextIndex);
      },
      previous: async () => {
        const queue = get().queue;
        const audio = get().audio;

        if (!audio) {
          return;
        }
        if (queue.length === 0) {
          audio.pause();

          return;
        }
        const prevIndex = get().currentIndex - 1;

        if (prevIndex < 0) {
          await get().playAt(0);

          return;
        }
        await get().playAt(prevIndex);
      },
      handleAudioPlay: () => {
        set({ status: "playing" });
      },
      handleAudioPause: () => {
        if (get().status !== "loading") {
          set({ status: "paused" });
        }
      },
      handleAudioEnded: async () => {
        const queue = get().queue;
        const shuffle = get().shuffle;
        const loop = get().loop;
        const currentIndex = get().currentIndex;

        if (shuffle && queue.length > 0) {
          if (queue.length === 1) {
            await get().playAt(0);

            return;
          }
          let randomIndex = Math.floor(Math.random() * queue.length);

          while (randomIndex === currentIndex) {
            randomIndex = Math.floor(Math.random() * queue.length);
          }
          await get().playAt(randomIndex);

          return;
        }
        if (loop && currentIndex >= 0) {
          await get().playAt(currentIndex);

          return;
        }
        const nextIndex = currentIndex + 1;

        if (nextIndex < queue.length) {
          await get().playAt(nextIndex);

          return;
        }
        const audio = get().audio;

        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        set({
          status: "idle",
          currentIndex: -1,
          currentSong: null,
          currentUrl: null,
        });
      },
      toggleLoop: () => {
        set((state) => ({ loop: !state.loop }));
      },
      toggleShuffle: () => {
        set((state) => ({ shuffle: !state.shuffle }));
      },
    }),
    {
      name: "player_store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentSong: state.currentSong,
        volume: state.volume,
        loop: state.loop,
        shuffle: state.shuffle,
      }),
      migrate: (persisted) => {
        return {
          queue: (persisted as any)?.queue ?? [],
          currentIndex: (persisted as any)?.currentIndex ?? -1,
          currentSong: (persisted as any)?.currentSong ?? null,
          volume: (persisted as any)?.volume ?? 0.8,
          loop: (persisted as any)?.loop ?? false,
          shuffle: (persisted as any)?.shuffle ?? false,
        } as Partial<PlayerState> as any;
      },
    },
  ),
);

export default usePlayerStore;
