import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { memo, useContext, useEffect, useMemo } from 'react';
import { YTPlayerContext } from '../../contexts/ytplayer';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobilePlayerController } from '../MobilePlayerController/MobilePlayerController';
import { PlayerController } from '../PlayerController/PlayerController';
import styles from './GlobalPlayer.module.scss';

export const GlobalPlayer = memo(function GlobalPlayer() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const {
    player,
    scriptLoaded,
    apiReady,
    setYTPlayer,
    currentStream,
    currentStreamId,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMute,
    repeatType,
    isShuffled,
    isFirstStream,
    isLastStream,
    placeholderRect,
    filterOptions,
    play,
    pause,
    seekTo,
    skipNext,
    skipPrev,
    setVolume,
    setMute,
    setRepeat,
    toggleShuffle,
  } = useContext(YTPlayerContext);

  // マウント時にグローバル YouTube プレイヤーを初期化
  useEffect(() => {
    if (!scriptLoaded || !apiReady) return;
    setYTPlayer('singing-stream-player', {
      width: '100%',
      height: '100%',
      playerVars: {
        controls: 1,
        autoplay: 0,
        origin: location.origin,
        widget_referrer: location.origin,
      },
    });
  }, [apiReady, scriptLoaded, setYTPlayer]);

  const isWatchPage = router.pathname === '/singing-streams/watch';

  // watch ページ復帰用のリンクURL（フィルター・歌い手・キーワード条件を完全保持）
  const watchHref = useMemo(() => {
    if (!currentStreamId) return undefined;
    const query: Record<string, string> = { v: currentStreamId };
    if (filterOptions.filter) query.filter = filterOptions.filter;
    if (filterOptions.singer) query.singer = filterOptions.singer;
    if (filterOptions.keyword) query.keyword = filterOptions.keyword;
    return { pathname: '/singing-streams/watch', query };
  }, [currentStreamId, filterOptions]);

  // 映像の表示位置計算（watch ページかつプレースホルダー矩形がある場合はその位置に吸着、それ以外は画面外退避）
  const videoContainerStyle = useMemo<React.CSSProperties>(() => {
    if (isWatchPage && placeholderRect && currentStream) {
      return {
        position: 'fixed',
        top: placeholderRect.top,
        left: placeholderRect.left,
        width: placeholderRect.width,
        height: placeholderRect.height,
        zIndex: 10,
        opacity: 1,
        pointerEvents: 'auto',
      };
    }
    return {
      position: 'fixed',
      top: -9999,
      left: -9999,
      width: 160,
      height: 90,
      zIndex: -1,
      opacity: 0.001,
      pointerEvents: 'none',
    };
  }, [currentStream, isWatchPage, placeholderRect]);

  const needNativePlayPush = false;

  return (
    <>
      {/* 常駐 YouTube Player コンテナ */}
      <div className={styles.videoContainer} style={videoContainerStyle}>
        <div id="singing-stream-player" className={styles.iframeWrapper} />
      </div>

      {/* グローバルフッタープレイヤーコントローラー */}
      {currentStream ? (
        <motion.div
          className={styles.controller}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ ease: 'circOut', duration: 0.4 }}
        >
          {isMobile ? (
            <MobilePlayerController
              isPlaying={isPlaying}
              isSkipPrevDisabled={isFirstStream}
              isSkipNextDisabled={isLastStream}
              isShuffled={isShuffled}
              needNativePlayPush={needNativePlayPush}
              length={duration}
              videoId={currentStream.video_id}
              publishedAt={currentStream.published_at}
              songTitle={currentStream.song.title}
              songArtist={currentStream.song.artist}
              currentTime={currentTime}
              repeatType={repeatType}
              onPlay={play}
              onPause={pause}
              onRepeat={setRepeat}
              onShuffle={toggleShuffle}
              onSeek={seekTo}
              onSkipPrev={skipPrev}
              onSkipNext={skipNext}
              streamId={currentStreamId ?? undefined}
              watchHref={watchHref}
            />
          ) : (
            <PlayerController
              isPlaying={isPlaying}
              isMute={isMute}
              isSkipPrevDisabled={isFirstStream}
              isSkipNextDisabled={isLastStream}
              isShuffled={isShuffled}
              needNativePlayPush={needNativePlayPush}
              length={duration}
              repeatType={repeatType}
              volume={volume}
              videoId={currentStream.video_id}
              songTitle={currentStream.song.title}
              songArtist={currentStream.song.artist}
              publishedAt={currentStream.published_at}
              currentTime={currentTime}
              onPlay={play}
              onPause={pause}
              onSkipPrev={skipPrev}
              onSkipNext={skipNext}
              onRepeat={setRepeat}
              onShuffle={toggleShuffle}
              onSeek={seekTo}
              onMute={setMute}
              onVolumeChange={setVolume}
              streamId={currentStreamId ?? undefined}
              watchHref={watchHref}
            />
          )}
        </motion.div>
      ) : null}
    </>
  );
});
