import type { MusicItem } from "@/types";

import { create } from "zustand";

import qqMusicClient from "@/services/qqMusicClient";

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

const usePlayerStore = create<PlayerState>((set, get) => ({
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
    await get().playAt(0, [song]);
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

    const applyUrl = async (url: string) => {
      const activeRequest = get().currentRequestId;

      if (activeRequest !== requestId) {
        return;
      }
      const currentAudio = get().audio;

      if (!currentAudio) {
        return;
      }
      currentAudio.src = url;
      currentAudio.currentTime = 0;
      try {
        await currentAudio.play();
        set({ status: "playing", currentUrl: url });
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
}));

export default usePlayerStore;
