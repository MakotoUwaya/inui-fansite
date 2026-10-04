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

  // URL の指定曲 ID
  const urlStreamId = typeof router.query.v === 'string' ? router.query.v : undefined;

  // 再生対象曲 ID（再生中の曲があればそれを優先し、なければ URL の指定曲）
  const streamId = currentStreamId || urlStreamId;

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

  const prevUrlStreamIdRef = useRef<string | undefined>(undefined);
  const isInitializedRef = useRef(false);

  // 初回ロード時、またはブラウザの進む/戻る等で URL の v が外部変更された際に曲を再生
  useEffect(() => {
    if (!router.isReady) return;

    // 初回マウント時、または URL の v が外部から変更された場合のみ処理
    const isUrlChanged = prevUrlStreamIdRef.current !== urlStreamId;
    prevUrlStreamIdRef.current = urlStreamId;

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      // 初回訪問時: URL の指定曲を優先、なければ現在再生中の曲、どちらもなければリスト先頭
      const targetId = urlStreamId || currentStreamId || baseStreams[0]?.id;
      if (!targetId) return;

      // 既に再生中の曲と同じであれば再ロードせず継続
      if (currentStreamId === targetId) return;

      const targetStream =
        (fetchedStream && fetchedStream.id === targetId ? fetchedStream : null) ||
        baseStreams.find((s) => s.id === targetId) ||
        rawStreams?.find((s) => s.id === targetId);

      if (targetStream) {
        playSong(targetStream, baseStreams.length > 0 ? baseStreams : undefined, filterOptions);
      }
      return;
    }

    // 初回以降: ブラウザの戻る/進む等で URL の v が明示的に変わった場合のみ反応
    if (isUrlChanged && urlStreamId) {
      // 既に内部でその曲を再生中（shallow 同期によって URL が変わった場合）は何もしない
      if (currentStreamId === urlStreamId) return;

      const targetStream =
        (fetchedStream && fetchedStream.id === urlStreamId ? fetchedStream : null) ||
        baseStreams.find((s) => s.id === urlStreamId) ||
        rawStreams?.find((s) => s.id === urlStreamId);

      if (targetStream) {
        playSong(targetStream, baseStreams.length > 0 ? baseStreams : undefined, filterOptions);
      }
    }
  }, [
    router.isReady,
    urlStreamId,
    currentStreamId,
    fetchedStream,
    baseStreams,
    rawStreams,
    filterOptions,
    playSong,
  ]);

  // プレイリストの同期（watch ページかつ URL の条件に基づく baseStreams と同期）
  useEffect(() => {
    if (!router.isReady || router.pathname !== '/singing-streams/watch') return;
    if (baseStreams.length > 0) {
      syncPlaylist(baseStreams, filterOptions);
    }
  }, [router.isReady, router.pathname, baseStreams, filterOptions, syncPlaylist]);

  const onMobilePlayerVisibleChange = useCallback(() => {
    setMobilePlaylistVisible((visible) => !visible);
  }, [setMobilePlaylistVisible]);

  const displayStream = (currentStream && currentStream.id === streamId ? currentStream : null) || fetchedStream;
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
