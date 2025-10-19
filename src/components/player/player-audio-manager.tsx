import { useEffect, useRef } from "react";

import usePlayerStore from "@/store/playerStore";

const PlayerAudioManager = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setAudio = usePlayerStore((state) => state.setAudio);
  const handleAudioPlay = usePlayerStore((state) => state.handleAudioPlay);
  const handleAudioPause = usePlayerStore((state) => state.handleAudioPause);
  const handleAudioEnded = usePlayerStore((state) => state.handleAudioEnded);
  const currentSong = usePlayerStore((state) => state.currentSong);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setAudio(audio);

    const onPlay = () => handleAudioPlay();
    const onPause = () => handleAudioPause();
    const onEnded = () => {
      void handleAudioEnded();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [handleAudioEnded, handleAudioPause, handleAudioPlay, setAudio]);

  // Persist per-song playback progress and restore on metadata loaded
  useEffect(() => {
    const audio = audioRef.current;
    const songmid = currentSong?.songmid;

    if (!audio || !songmid) {
      return;
    }

    const key = `progress:${songmid}`;
    let ticking = false;
    let lastSaved = -1;
    const SAVE_INTERVAL_MS = 800;
    let lastTs = 0;

    const saveProgress = (t: number) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ t: Math.max(0, Math.min(isFinite(audio.duration) ? audio.duration : t, t)), ts: Date.now() })
        );
      } catch {}
    };

    const onTime = () => {
      const now = Date.now();
      if (!ticking && now - lastTs >= SAVE_INTERVAL_MS) {
        ticking = true;
        lastTs = now;
        const t = audio.currentTime || 0;
        if (Math.abs(t - lastSaved) >= 0.5) {
          lastSaved = t;
          saveProgress(t);
        }
        // release tick asap
        setTimeout(() => {
          ticking = false;
        }, 0);
      }
    };

    const onLoaded = () => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { t?: number; ts?: number };
        const saved = typeof parsed.t === "number" ? parsed.t : 0;
        const savedAt = typeof parsed.ts === "number" ? parsed.ts : 0;
        const tooOld = Date.now() - savedAt > 7 * 24 * 60 * 60 * 1000; // 7d
        if (!isFinite(saved) || saved <= 0 || tooOld) return;
        const dur = audio.duration;
        if (isFinite(dur) && dur > 0) {
          const at = Math.max(0, Math.min(saved, dur));
          // do not seek if near end (e.g. >95%)
          if (at / dur < 0.95) {
            audio.currentTime = at;
          }
        }
      } catch {}
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [currentSong?.songmid]);

  return <audio ref={audioRef} className="hidden" preload="auto" />;
};

export default PlayerAudioManager;
