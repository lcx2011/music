import type { MusicItem, TopListDetail } from "@/types";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import PlaylistView from "@/components/playlist/playlist-view";
import qqMusicClient from "@/services/qqMusicClient";
import usePlayerStore from "@/store/playerStore";

type PlaylistLocationState = {
  title?: string;
  coverImg?: string;
  period?: string;
  description?: string;
};

type StatusState = {
  loading: boolean;
  error: string | null;
};

const createInitialStatus = (): StatusState => ({ loading: true, error: null });

const PlaylistPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = (location.state ?? {}) as PlaylistLocationState;

  const [status, setStatus] = useState<StatusState>(createInitialStatus);
  const [detail, setDetail] = useState<TopListDetail | null>(null);

  const playQueue = usePlayerStore((state) => state.playQueue);

  const songs: MusicItem[] = useMemo(
    () => detail?.musicList ?? [],
    [detail?.musicList],
  );

  useEffect(() => {
    if (!id) {
      setStatus({ loading: false, error: "未找到歌单" });

      return;
    }

    let active = true;

    const fetchDetail = async () => {
      setStatus(createInitialStatus());
      try {
        const data = await qqMusicClient.fetchTopListDetail(
          id,
          locationState.period,
        );

        if (!active) return;
        setDetail(data);
        setStatus({ loading: false, error: null });
      } catch (error) {
        if (!active) return;
        setStatus({
          loading: false,
          error: error instanceof Error ? error.message : "加载歌单失败",
        });
      }
    };

    fetchDetail();

    return () => {
      active = false;
    };
  }, [id, locationState.period]);

  const headerTitle = detail?.title ?? locationState.title ?? "歌单";
  const coverImg = detail?.coverImg ?? locationState.coverImg;
  const description = detail?.description ?? locationState.description;

  const handleSelectSong = (index: number) => {
    if (songs.length === 0) {
      return;
    }
    void playQueue(songs, index);
  };

  if (status.loading && !detail) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-white/60">歌单加载中...</p>
      </section>
    );
  }

  if (status.error && songs.length === 0) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-400">{status.error}</p>
      </section>
    );
  }

  return (
    <PlaylistView
      coverImg={coverImg}
      description={description}
      songs={songs}
      title={headerTitle}
      onSelectSong={handleSelectSong}
    />
  );
};

export default PlaylistPage;
