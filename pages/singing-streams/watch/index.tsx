import { motion } from 'framer-motion';
import { shuffle, without } from 'lodash-es';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdQueueMusic } from 'react-icons/md';
import { Layout } from '../../../components/Layout/Layout';
import { MobilePlayerController } from '../../../components/MobilePlayerController/MobilePlayerController';
import { PlayerController } from '../../../components/PlayerController/PlayerController';
import { Playlist } from '../../../components/Playlist/Playlist';
import type { RepeatType } from '../../../components/RepeatButton/RepeatButton';
import { YTPlayer } from '../../../components/YTPlayer/YTPlayer';
import { useSingingStreamForWatch, useSingingStreamsForSearch } from '../../../hooks/singing-stream';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useIsPlayedVideos } from '../../../hooks/useIsPlayedVideos';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useYTPlayer } from '../../../hooks/useYTPlayer';
import { filterStreams, getFilterSummary } from '../../../utils/songFilter';
import type { SingingStreamForSearch } from '../../../types';
import styles from './index.module.scss';

// Since player.removeEventListener doesn't work, manage state used in onStateChange as local variable.
let repeatTypeVariable: RepeatType = 'none';
let startSeconds = 0;
let endSeconds = 0;

function SingingStreamsWatchPage() {
  const reqIdRef = useRef<number>();
  const router = useRouter();
  const streamId = useMemo(() => {
    if (router.query.v && typeof router.query.v === 'string') {
      return router.query.v;
    }
    return;
  }, [router]);

  // クエリパラメータから絞り込み条件を抽出
  const filterQuery = typeof router.query.filter === 'string' ? router.query.filter : undefined;
  const singerQuery = typeof router.query.singer === 'string' ? router.query.singer : undefined;
  const keywordQuery = typeof router.query.keyword === 'string' ? router.query.keyword : undefined;

  const filterOptions = useMemo(
    () => ({ filter: filterQuery, singer: singerQuery, keyword: keywordQuery }),
    [filterQuery, singerQuery, keywordQuery],
  );

  const filterSummary = useMemo(() => getFilterSummary(filterOptions), [filterOptions]);

  const { stream: currentStream } = useSingingStreamForWatch(streamId);
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

  const [isPlaying, setPlaying] = useState(false);
  const [isEnded, setEnded] = useState(false);
  const [isPlayedOnce, setPlayedOnce] = useState(false);
  const [isShuffledOnce, setShuffledOnce] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMobilePlaylistVisible, setMobilePlaylistVisible] = useState(false);
  const [streams, setStreams] = useState<SingingStreamForSearch[]>([]);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const isAutoPlayRef = useRef(true);

  const enableAutoPlay = useCallback(() => {
    isAutoPlayRef.current = true;
    setIsAutoPlay(true);
  }, []);

  const [isMute, setMute] = useLocalStorage('isMute', false);
  const [repeatType, setRepeatType] = useLocalStorage<RepeatType>('repeatType', 'none');
  const [volume, setVolume] = useLocalStorage('volume', 80);

  const isMobile = useIsMobile();
  const { isPlayedVideo, addPlayedVideo } = useIsPlayedVideos();

  const isFirstStream = useMemo(
    () => (streams ? streams.findIndex((stream) => stream.id === streamId) === 0 : false),
    [streams, streamId],
  );
  const isLastStream = useMemo(
    () => (streams ? streams.findIndex((stream) => stream.id === streamId) === streams.length - 1 : false),
    [streams, streamId],
  );

  // 絞り込みクエリパラメータを保持したまま曲を切り替えるヘルパー
  const navigateToStream = useCallback(
    (targetStreamId: string) => {
      const query: Record<string, string> = { v: targetStreamId };
      if (filterQuery) query.filter = filterQuery;
      if (singerQuery) query.singer = singerQuery;
      if (keywordQuery) query.keyword = keywordQuery;
      router.push({ pathname: '/singing-streams/watch', query });
    },
    [filterQuery, singerQuery, keywordQuery, router],
  );

  // 全曲再生モードに切り替える（フィルター解除）
  const onClearFilter = useCallback(() => {
    if (!streamId) return;
    router.push({
      pathname: '/singing-streams/watch',
      query: { v: streamId },
    });
  }, [streamId, router]);

  const { player, ...ytPlayerProps } = useYTPlayer({
    mountId: 'singing-stream-player',
    controls: true,
    autoplay: false,
    width: '100%',
    height: '100%',
  });

  const onPlay = useCallback(() => {
    if (!player) return;
    enableAutoPlay();
    player.playVideo();
  }, [player, enableAutoPlay]);

  const onPause = useCallback(() => {
    if (!player) return;
    player.pauseVideo();
  }, [player]);

  const onSkipPrev = useCallback(() => {
    if (!streams || !currentStream || !player) return;
    enableAutoPlay();
    if (currentTime >= 5) {
      player.seekTo(currentStream.start);
      setCurrentTime(0);
      return;
    }
    const playingStreamIndex = streams.findIndex((stream) => stream.id === currentStream.id);
    if (playingStreamIndex === 0) return;
    const prevStream = streams[playingStreamIndex - 1];
    if (prevStream) {
      navigateToStream(prevStream.id);
    }
  }, [currentStream, currentTime, player, streams, enableAutoPlay, navigateToStream]);

  const onSkipNext = useCallback(() => {
    if (!streams || !currentStream) return;
    enableAutoPlay();
    const playingStreamIndex = streams.findIndex((stream) => stream.id === currentStream.id);
    if (playingStreamIndex === streams.length - 1) return;
    const nextStream = streams[playingStreamIndex + 1];
    if (nextStream) {
      navigateToStream(nextStream.id);
    }
  }, [currentStream, streams, enableAutoPlay, navigateToStream]);

  const onVolumeChange = useCallback(
    (value: number) => {
      if (!player) return;
      player.setVolume(value);
      setVolume(value);
    },
    [player, setVolume],
  );

  const onMute = useCallback(
    (mute: boolean) => {
      mute ? player?.mute() : player?.unMute();
      setMute(mute);
    },
    [player, setMute],
  );

  const onSeek = useCallback(
    (time: number) => {
      if (!player || !currentStream) return;
      player.seekTo(currentStream.start + time);
    },
    [player, currentStream],
  );

  const onRepeat = useCallback(
    (repeat: RepeatType) => {
      repeatTypeVariable = repeat;
      setRepeatType(repeat);
    },
    [setRepeatType],
  );

  const onStateChange = useCallback((event: { target: YT.Player; data: number }) => {
    // unplayed
    if (event.data === -1) {
      setPlayedOnce(false);
    }

    // ended
    if (event.data === 0) {
      if (repeatTypeVariable === 'repeatOne') {
        event.target.seekTo(startSeconds);
      } else {
        setEnded(true);
      }
    } else {
      setEnded(false);
    }

    // playing
    if (event.data === 1) {
      enableAutoPlay();
      const currentTime = event.target.getCurrentTime();
      if (currentTime < startSeconds) {
        event.target.seekTo(startSeconds);
      } else if (currentTime > endSeconds) {
        setEnded(true);
        setPlaying(false);
      } else {
        setPlaying(true);
        setPlayedOnce(true);
      }
    } else {
      setPlaying(false);
    }
  }, [enableAutoPlay]);

  const onMobilePlayerVisibleChange = useCallback(() => {
    setMobilePlaylistVisible((visible) => !visible);
  }, []);

  const onShuffle = useCallback(() => {
    if (!streams || !streamId) return;
    const current = streams.find((stream) => stream.id === streamId);
    if (!current) return;
    setStreams([current].concat(shuffle(without(streams, current))));
    setShuffledOnce(true);
  }, [streamId, streams]);

  useEffect(() => {
    if (baseStreams.length > 0) {
      setStreams(baseStreams);
    }
  }, [baseStreams]);

  // When repeatType is changed, the local variable is also changed.
  useEffect(() => {
    repeatTypeVariable = repeatType;
  }, [repeatType]);

  // When the start and end of the stream are changed, the local variables are also changed.
  useEffect(() => {
    startSeconds = currentStream?.start ?? 0;
    endSeconds = currentStream?.end ?? 0;
  }, [currentStream?.start, currentStream?.end]);

  // Update current time
  useEffect(() => {
    const step = () => {
      if (!player || !currentStream) return;
      const currentTime = player.getCurrentTime() - currentStream.start;
      setCurrentTime(isNaN(currentTime) ? 0 : Math.max(0, currentTime));
      if (isPlaying) {
        reqIdRef.current = requestAnimationFrame(step);
      }
    };
    reqIdRef.current = requestAnimationFrame(step);
    return () => {
      reqIdRef.current && cancelAnimationFrame(reqIdRef.current);
    };
  }, [isPlaying, player, currentStream]);

  // Change mute status.
  useEffect(() => {
    if (!player) return;
    isMute ? player.mute() : player.unMute();
  }, [isMute, player]);

  // Update volume.
  useEffect(() => {
    if (!player) return;
    player.setVolume(volume);
  }, [player, volume]);

  // Add onStateChange event listener.
  useEffect(() => {
    if (!player) return;
    player.addEventListener('onStateChange', onStateChange);
    return () => {
      try {
        player.removeEventListener('onStateChange', onStateChange);
      } catch {
        // ignore detached player errors
      }
    };
  }, [onStateChange, player]);

  // when stream changes, load the video.
  useEffect(() => {
    if (currentStream && player && !isPlayedOnce) {
      const param = {
        videoId: currentStream.video_id,
        startSeconds: currentStream.start,
        endSeconds: currentStream.end,
      };
      player.loadVideoById(param);
    }
  }, [player, currentStream, isPlayedOnce]);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentTime(0);
      setPlayedOnce(false);
      setEnded(false);
      setMobilePlaylistVisible(false);
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  // When the video ends, streams will be played in order.
  useEffect(() => {
    if (!streams || !isEnded || !isPlayedOnce || !currentStream) return;
    enableAutoPlay();
    const playingStreamIndex = streams.findIndex((s) => s.id === currentStream.id);
    const nextStreamId =
      playingStreamIndex === streams.length - 1
        ? repeatType === 'repeat'
        ? streams[0].id
        : null
        : streams[playingStreamIndex + 1]?.id;
    if (nextStreamId) {
      navigateToStream(nextStreamId);
    }
  }, [isEnded, isPlayedOnce, currentStream, streams, repeatType, enableAutoPlay, navigateToStream]);

  useEffect(() => {
    if (!isPlayedOnce || !currentStream) return;

    if (!isPlayedVideo(currentStream.video_id)) {
      addPlayedVideo(currentStream.video_id);
    }
  }, [currentStream, isPlayedOnce, isPlayedVideo, addPlayedVideo]);

  const needNativePlayPush = false;

  return (
    <Layout className={styles.root} title={currentStream?.song.title || ''} padding={isMobile ? 'all' : 'horizontal'}>
      <main className={styles.main}>
        <div className={styles.player}>
          <YTPlayer {...ytPlayerProps} hidden={!currentStream || !player} />
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
                  <span className={styles.playlistCount}>({streams.length}曲)</span>
                </div>
                {filterSummary.isFiltered && (
                  <button
                    type="button"
                    className={styles.clearFilterButton}
                    onClick={onClearFilter}
                    title="フィルターを解除して全曲再生モードに切り替えます"
                  >
                    全曲再生にする
                  </button>
                )}
              </div>
              <Playlist className={styles.playlist} streams={streams} />
            </div>
          )
        ) : null}
      </main>
      {currentStream && player ? (
        <motion.div
          className={styles.controller}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ ease: 'circOut', duration: 0.5 }}
        >
          {isMobile ? (
            <MobilePlayerController
              isPlaying={isPlaying}
              isSkipPrevDisabled={isFirstStream}
              isSkipNextDisabled={isLastStream}
              isShuffled={isShuffledOnce}
              needNativePlayPush={needNativePlayPush}
              length={currentStream.end - currentStream.start}
              videoId={currentStream.video_id}
              publishedAt={currentStream.published_at}
              songTitle={currentStream.song.title}
              songArtist={currentStream.song.artist}
              currentTime={currentTime}
              repeatType={repeatType}
              onPlay={onPlay}
              onPause={onPause}
              onRepeat={onRepeat}
              onShuffle={onShuffle}
              onSeek={onSeek}
              onSkipPrev={onSkipPrev}
              onSkipNext={onSkipNext}
            />
          ) : (
            <PlayerController
              isPlaying={isPlaying}
              isMute={isMute}
              isSkipPrevDisabled={isFirstStream}
              isSkipNextDisabled={isLastStream}
              isShuffled={isShuffledOnce}
              needNativePlayPush={needNativePlayPush}
              length={currentStream.end - currentStream.start}
              repeatType={repeatType}
              volume={volume}
              videoId={currentStream.video_id}
              songTitle={currentStream.song.title}
              songArtist={currentStream.song.artist}
              publishedAt={currentStream.published_at}
              currentTime={currentTime}
              onPlay={onPlay}
              onPause={onPause}
              onSkipPrev={onSkipPrev}
              onSkipNext={onSkipNext}
              onRepeat={onRepeat}
              onShuffle={onShuffle}
              onSeek={onSeek}
              onMute={onMute}
              onVolumeChange={onVolumeChange}
            />
          )}
        </motion.div>
      ) : null}
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
          <button className={styles.mobilePlaylistVisibilityToggle} onClick={onMobilePlayerVisibleChange}>
            <MdQueueMusic />
          </button>
          <div className={styles.playlistHeader}>
            <div className={styles.playlistTitleGroup}>
              <span className={styles.playlistTitle}>
                {filterSummary.isFiltered ? filterSummary.label : '再生リスト'}
              </span>
              <span className={styles.playlistCount}>({streams.length}曲)</span>
            </div>
            {filterSummary.isFiltered && (
              <button
                type="button"
                className={styles.clearFilterButton}
                onClick={onClearFilter}
                title="フィルターを解除して全曲再生モードに切り替えます"
              >
                全曲再生にする
              </button>
            )}
          </div>
          <Playlist
            className={styles.mobilePlaylist}
            streams={streams}
            isVisible={isMobilePlaylistVisible}
          />
        </motion.div>
      ) : null}
    </Layout>
  );
}

export default SingingStreamsWatchPage;
