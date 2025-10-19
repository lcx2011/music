import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowPathRoundedSquareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { LyricPlayer, BackgroundRender, EplorRenderer } from "@applemusic-like-lyrics/react";
import usePlayerStore from "@/store/playerStore";
import useUIStore from "@/store/uiStore";
import ElasticSlider from "./elastic-slider";
import "./music-detail.scss";
import qqMusicClient from "@/services/qqMusicClient";
import { parseLrc } from "@applemusic-like-lyrics/lyric";

const pad = (n: number) => n.toString().padStart(2, "0");
const formatTime = (sec?: number | null) => {
  if (!sec || !isFinite(sec) || sec < 0) return "--:--";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${pad(r)}`;
};

const MusicDetail = () => {
  const open = useUIStore((s) => s.musicDetailOpen);
  const close = useUIStore((s) => s.closeMusicDetail);

  const audio = usePlayerStore((s) => s.audio);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const loop = usePlayerStore((s) => s.loop);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleLoop = usePlayerStore((s) => s.toggleLoop);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const isPlaying = status === "playing";
  const artwork = useMemo(() => currentSong?.artwork ?? "", [currentSong?.artwork]);
  const title = currentSong?.title ?? "未播放歌曲";
  const [fetchedLrc, setFetchedLrc] = useState<string | null>(null);
  const effectiveLrc = currentSong?.lrc ?? fetchedLrc ?? null;
  const lyricLines = useMemo(() => {
    if (!effectiveLrc) return [];
    try {
      return parseLrc(effectiveLrc) ?? [];
    } catch {
      return [];
    }
  }, [effectiveLrc]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onDuration = () => setDuration(audio.duration || 0);
    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(audio.currentTime || 0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("loadedmetadata", onLoaded);
    // sync immediately
    onLoaded();

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [audio]);

  // Fetch lyrics when song changes and no lrc present
  useEffect(() => {
    setFetchedLrc(null);
    const songmid = currentSong?.songmid;
    if (!songmid) return;
    if (currentSong?.lrc && currentSong.lrc.length > 0) return;
    let aborted = false;
    (async () => {
      try {
        const { rawLrc } = await qqMusicClient.fetchLyrics(songmid);
        if (!aborted) setFetchedLrc(rawLrc || "");
      } catch (_e) {
        if (!aborted) setFetchedLrc("");
      }
    })();
    return () => {
      aborted = true;
    };
  }, [currentSong?.songmid, currentSong?.lrc]);

  const seek = useCallback(
    (sec: number) => {
      if (audio && isFinite(sec)) {
        audio.currentTime = Math.max(0, Math.min(sec, isFinite(audio.duration) ? audio.duration : sec));
      }
    },
    [audio]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.code === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.code === "Space") {
        e.preventDefault();
        void togglePlay();
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(currentTime + 5);
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(currentTime - 5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, togglePlay, seek, currentTime]);

  // Lock body scroll while detail is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[3000] bg-black" role="dialog" aria-modal onClick={close}>
      <div className="music-detail--container" onClick={(e) => e.stopPropagation()}>
        <button className="hide-music-detail rounded-full p-2 hover:bg-white/10" onClick={(e) => { e.stopPropagation(); close(); }} aria-label="关闭">
          ✕
        </button>

        <div className="amll-bg">
          {(() => {
            const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:4000";
            const proxied = artwork ? `${API_BASE}/api/proxy-image?url=${encodeURIComponent(artwork)}` : undefined;
            return <BackgroundRender album={proxied} renderer={EplorRenderer} />;
          })()}
        </div>

        <div className="main">
          <div className="left">
            <div className="music-album">
              {artwork ? <img src={artwork} alt={title} /> : null}
            </div>

            <div className="album-controls">
              <div className="row title-row">
                <div className="title" title={title}>{title}</div>
                <button className="menu-btn" aria-label="more">⋯</button>
              </div>

              <div className="row progress-row">
                <ElasticSlider
                  className="progress"
                  startingValue={0}
                  defaultValue={isFinite(duration) ? Math.min(Math.max(0, currentTime), Math.max(0, duration)) : 0}
                  maxValue={isFinite(duration) ? Math.max(0, duration) : 0}
                  showValueIndicator={false}
                  onChange={(val) => seek(val)}
                />
              </div>
              <div className="row time-row">
                <span className="time current">{formatTime(currentTime)}</span>
                <span className="time duration">{formatTime(isFinite(duration) ? duration : undefined)}</span>
              </div>

              <div className="row controls-row">
                <button className={`ctrl shuffle flex items-center justify-center ${shuffle ? "bg-white/20" : ""}`} data-active={shuffle} title="Shuffle" onClick={toggleShuffle}>
                  <ArrowPathRoundedSquareIcon className="h-6 w-6" />
                </button>
                <button className="ctrl prev flex items-center justify-center" title="上一首" onClick={() => void previous()}>
                  <img src="/icon/上.svg" alt="上一首" className="h-6 w-6" style={{ filter: "brightness(0) invert(1)" }} />
                </button>
                <button className="ctrl play flex items-center justify-center" title={isPlaying ? "暂停" : "开始"} onClick={() => void togglePlay()}>
                  <img src={isPlaying ? "/icon/暂停.svg" : "/icon/开始.svg"} alt={isPlaying ? "暂停" : "播放"} className="h-7 w-7" style={{ filter: "brightness(0) invert(1)" }} />
                </button>
                <button className="ctrl next flex items-center justify-center" title="下一首" onClick={() => void next()}>
                  <img src="/icon/下.svg" alt="下一首" className="h-6 w-6" style={{ filter: "brightness(0) invert(1)" }} />
                </button>
                <button className={`ctrl loop flex items-center justify-center ${loop ? "bg-white/20" : ""}`} data-active={loop} title="Loop" onClick={toggleLoop}>
                  <ArrowPathIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="row volume-row">
                <ElasticSlider
                  className="volume"
                  startingValue={0}
                  defaultValue={Math.min(Math.max(0, volume * 100), 100)}
                  maxValue={100}
                  showValueIndicator={false}
                  onChange={(val) => setVolume(val / 100)}
                />
              </div>
            </div>
          </div>

          <div className="music-lyric-only">
            {lyricLines && lyricLines.length > 0 ? (
              <LyricPlayer
                lyricLines={lyricLines}
                currentTime={currentTime * 1000 + 500}
                alignPosition={0.3}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="flex items-center justify-center w-full">
                <div className="text-center">
                  <div className="text-2xl font-semibold opacity-80">{title}</div>
                  <div className="mt-1 text-base opacity-60">暂无歌词</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicDetail;
