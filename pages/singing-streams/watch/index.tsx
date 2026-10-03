import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { MdQueueMusic } from 'react-icons/md';
import { Layout } from '../../../components/Layout/Layout';
import { Playlist } from '../../../components/Playlist/Playlist';
import { YTPlayerContext } from '../../../contexts/ytplayer';
import { useSingingStreamForWatch, useSingingStreamsForSearch } from '../../../hooks/singing-stream';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { filterStreams, getFilterSummary } from '../../../utils/songFilter';
import styles from './index.module.scss';

function SingingStreamsWatchPage() {
  const router = useRouter();
  const placeholderRef = useRef<HTMLDivElement>(null);

  const {
    currentStream,
    currentStreamId,
    streams: globalStreams,
    isMobilePlaylistVisible,
    setMobilePlaylistVisible,
    setPlaceholderRect,
    playSong,
    syncPlaylist,
  } = useContext(YTPlayerContext);

  const streamId = useMemo(() => {
    if (router.query.v && typeof router.query.v === 'string') {
      return router.query.v;
    }
    return currentStreamId ?? undefined;
  }, [router.query.v, currentStreamId]);

  // クエリパラメータから絞り込み条件を抽出
  const filterQuery = typeof router.query.filter === 'string' ? router.query.filter : undefined;
  const singerQuery = typeof router.query.singer === 'string' ? router.query.singer : undefined;
  const keywordQuery = typeof router.query.keyword === 'string' ? router.query.keyword : undefined;

  const filterOptions = useMemo(
    () => ({ filter: filterQuery, singer: singerQuery, keyword: keywordQuery }),
    [filterQuery, singerQuery, keywordQuery],
  );

  const filterSummary = useMemo(() => getFilterSummary(filterOptions), [filterOptions]);

  const { stream: fetchedStream } = useSingingStreamForWatch(streamId);
  const { streams: rawStreams } = useSingingStreamsForSearch();

  // 絞り込み条件に合致するストリーム一覧（現在再生中の曲が含まれない場合はリスト先頭に追加）
  const baseStreams = useMemo(() => {
    if (!rawStreams) return [];
    const filtered = filterStreams(rawStreams, filterOptions);
    if (streamId && !filtered.some((s) => s.id === streamId)) {
      const currentSearchStream = rawStreams.find((s) => s.id === streamId);
      if (currentSearchStream) {
        return [currentSearchStream, ...filtered];
      }
    }
    return filtered;
  }, [rawStreams, filterOptions, streamId]);

  const isMobile = useIsMobile();

  // プレースホルダーの DOMRect をグローバルプレイヤーに追従同期
  useEffect(() => {
    const updateRect = () => {
      if (placeholderRef.current) {
        const rect = placeholderRef.current.getBoundingClientRect();
        setPlaceholderRect(rect);
      }
    };

    updateRect();

    let resizeObserver: ResizeObserver | null = null;
    if (placeholderRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateRect);
      resizeObserver.observe(placeholderRef.current);
    }

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      setPlaceholderRect(null);
    };
  }, [setPlaceholderRect]);

  // URLの streamId が変わり、まだ再生中の曲と一致していない場合、新曲を再生
  useEffect(() => {
    if (!router.isReady || !streamId) return;

    // 現在再生中の曲と同一であれば再ロードしない
    if (currentStreamId === streamId) return;

    // watch用の詳細データがあれば優先（IDが一致する場合のみ）、なければ baseStreams / rawStreams からフォールバック
    const targetStream =
      (fetchedStream && fetchedStream.id === streamId ? fetchedStream : null) ||
      baseStreams.find((s) => s.id === streamId) ||
      rawStreams?.find((s) => s.id === streamId);

    if (targetStream) {
      playSong(targetStream, baseStreams.length > 0 ? baseStreams : undefined, filterOptions);
    }
  }, [
    router.isReady,
    streamId,
    currentStreamId,
    fetchedStream,
    baseStreams,
    rawStreams,
    filterOptions,
    playSong,
  ]);

  // プレイリストの同期（URL の条件に基づく baseStreams と同期）
  useEffect(() => {
    if (!router.isReady) return;
    if (baseStreams.length > 0) {
      syncPlaylist(baseStreams, filterOptions);
    }
  }, [router.isReady, baseStreams, filterOptions, syncPlaylist]);

  const onMobilePlayerVisibleChange = useCallback(() => {
    setMobilePlaylistVisible((visible) => !visible);
  }, [setMobilePlaylistVisible]);

  const displayStream = fetchedStream || (currentStreamId === streamId ? currentStream : null);
  const activeStreams = globalStreams.length > 0 ? globalStreams : baseStreams;

  return (
    <Layout className={styles.root} title={displayStream?.song.title || ''} padding={isMobile ? 'all' : 'horizontal'}>
      <main className={styles.main}>
        <div className={styles.player}>
          <div ref={placeholderRef} className={styles.playerPlaceholder} />
        </div>
        {!isMobile ? (
          !rawStreams ? (
            <div className={styles.sidePanelSkeleton} />
          ) : (
            <div className={styles.sidePanel}>
              <div className={styles.playlistHeader}>
                <div className={styles.playlistTitleGroup}>
                  <span className={styles.playlistTitle}>
                    {filterSummary.isFiltered ? filterSummary.label : '再生リスト'}
                  </span>
                  <span className={styles.playlistCount}>({activeStreams.length}曲)</span>
                </div>
              </div>
              <Playlist className={styles.playlist} streams={activeStreams} />
            </div>
          )
        ) : null}
      </main>

      {/* モバイル表示時の再生リストドロワー */}
      {isMobile && rawStreams ? (
        <motion.div
          className={styles.mobilePlaylistWrapper}
          animate={isMobilePlaylistVisible ? 'visible' : 'hidden'}
          initial="hidden"
          transition={{ ease: 'circOut' }}
          variants={{
            visible: { y: 0 },
            hidden: { y: 'calc(100% - 48px)' },
          }}
        >
          <button
            type="button"
            className={styles.mobilePlaylistVisibilityToggle}
            onClick={onMobilePlayerVisibleChange}
            aria-label="再生リストの表示切替"
          >
            <MdQueueMusic />
          </button>
          <div className={styles.playlistHeader}>
            <div className={styles.playlistTitleGroup}>
              <span className={styles.playlistTitle}>
                {filterSummary.isFiltered ? filterSummary.label : '再生リスト'}
              </span>
              <span className={styles.playlistCount}>({activeStreams.length}曲)</span>
            </div>
          </div>
          <Playlist
            className={styles.mobilePlaylist}
            streams={activeStreams}
            isVisible={isMobilePlaylistVisible}
          />
        </motion.div>
      ) : null}
    </Layout>
  );
}

export default SingingStreamsWatchPage;
