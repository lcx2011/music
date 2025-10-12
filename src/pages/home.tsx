import { useEffect, useMemo, useState } from "react";

import qqMusicClient from "@/services/qqMusicClient";
import type { TopListGroup } from "@/types";

type StatusState = {
  loading: boolean;
  error: string | null;
};

const createInitialStatus = (): StatusState => ({ loading: true, error: null });

type TopListCard = TopListGroup["data"][number] & { groupTitle: string };

const HomePage = () => {
  const [topListStatus, setTopListStatus] = useState<StatusState>(createInitialStatus);
  const [topListGroups, setTopListGroups] = useState<TopListGroup[]>([]);

  useEffect(() => {
    let active = true;

    const loadTopLists = async () => {
      setTopListStatus(createInitialStatus());
      try {
        const data = await qqMusicClient.fetchTopLists();
        if (!active) return;
        setTopListGroups(data);
        setTopListStatus({ loading: false, error: null });
      } catch (error) {
        if (!active) return;
        setTopListStatus({ loading: false, error: error instanceof Error ? error.message : "加载排行榜失败" });
      }
    };

    loadTopLists();
    return () => {
      active = false;
    };
  }, []);

  const topListClassification = useMemo(() => {
    const peak: TopListGroup[] = [];
    const region: TopListGroup[] = [];
    const feature: TopListGroup[] = [];
    const others: TopListGroup[] = [];

    topListGroups.forEach((group: TopListGroup) => {
      if (group.title.includes("巅峰")) {
        peak.push(group);
      } else if (group.title.includes("地区")) {
        region.push(group);
      } else if (group.title.includes("特色")) {
        feature.push(group);
      } else {
        others.push(group);
      }
    });

    const toCards = (groups: TopListGroup[]): TopListCard[] =>
      groups.flatMap((group: TopListGroup) =>
        group.data.map((item): TopListCard => ({ ...item, groupTitle: group.title }))
      );

    return {
      peakCards: toCards(peak.length > 0 ? peak : topListGroups),
      regionCards: toCards(region),
      featureCards: toCards(feature),
      otherCards: toCards(others),
    };
  }, [topListGroups]);

  return (
    <section className="space-y-12">
      {[
        { title: "巅峰榜", cards: topListClassification.peakCards },
        { title: "地区榜", cards: topListClassification.regionCards },
        { title: "特色榜", cards: topListClassification.featureCards },
      ].map(({ title, cards }) => (
        cards.length > 0 || topListStatus.loading ? (
          <div className="space-y-6" key={title}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{title}</h2>
              {topListStatus.loading && <span className="text-sm text-gray-400">加载中...</span>}
            </div>
            {topListStatus.error ? (
              <p className="text-sm text-red-400">{topListStatus.error}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {cards.map((item) => (
                  <article key={`${title}-${item.groupTitle}-${item.id}`} className="space-y-2">
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-white/10">
                      {item.coverImg ? (
                        <img alt={item.title} className="h-full w-full object-cover" src={item.coverImg} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-300">{item.groupTitle}</div>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <h3 className="truncate text-base font-semibold text-white">{item.title}</h3>
                    </div>
                  </article>
                ))}
                {!topListStatus.loading && cards.length === 0 && (
                  <p className="text-sm text-gray-400">暂无榜单数据</p>
                )}
              </div>
            )}
          </div>
        ) : null
      ))}
    </section>
  );
};

export default HomePage;
