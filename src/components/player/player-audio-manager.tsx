import { useEffect, useRef } from "react";

import usePlayerStore from "@/store/playerStore";

const PlayerAudioManager = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setAudio = usePlayerStore((state) => state.setAudio);
  const handleAudioPlay = usePlayerStore((state) => state.handleAudioPlay);
  const handleAudioPause = usePlayerStore((state) => state.handleAudioPause);
  const handleAudioEnded = usePlayerStore((state) => state.handleAudioEnded);

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

  return <audio ref={audioRef} className="hidden" preload="auto" />;
};

export default PlayerAudioManager;
