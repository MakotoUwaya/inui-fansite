import { useEffect, useRef } from 'react';
import type { SingingStreamForSearch, SingingStreamForWatch } from '../types';

export type UseMediaSessionProps = {
  currentStream: (SingingStreamForSearch | SingingStreamForWatch) | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  seekTo: (time: number) => void;
};

export function useMediaSession({
  currentStream,
  isPlaying,
  currentTime,
  duration,
  play,
  pause,
  skipNext,
  skipPrev,
  seekTo,
}: UseMediaSessionProps) {
  // アクションハンドラ内で最新の関数や値を参照するための ref
  const playRef = useRef(play);
  const pauseRef = useRef(pause);
  const skipNextRef = useRef(skipNext);
  const skipPrevRef = useRef(skipPrev);
  const seekToRef = useRef(seekTo);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);

  useEffect(() => {
    playRef.current = play;
    pauseRef.current = pause;
    skipNextRef.current = skipNext;
    skipPrevRef.current = skipPrev;
    seekToRef.current = seekTo;
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
  });

  // 1. アクションハンドラの設定（マウント時に1度だけ登録）
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => playRef.current()],
      ['pause', () => pauseRef.current()],
      ['previoustrack', () => skipPrevRef.current()],
      ['nexttrack', () => skipNextRef.current()],
      ['stop', () => pauseRef.current()],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined) {
            seekToRef.current(details.seekTime);
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          const offset = details.seekOffset || 10;
          seekToRef.current(Math.max(0, currentTimeRef.current - offset));
        },
      ],
      [
        'seekforward',
        (details) => {
          const offset = details.seekOffset || 10;
          seekToRef.current(Math.min(durationRef.current, currentTimeRef.current + offset));
        },
      ],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // 一部ブラウザで未対応のアクションはスキップ
      }
    }

    return () => {
      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        for (const [action] of actionHandlers) {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch {
            // ignore
          }
        }
      }
    };
  }, []);

  // 2. メタデータの更新（曲が切り替わったとき）
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (!currentStream) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const videoId = currentStream.video_id;
    const title = currentStream.song?.title || '歌枠楽曲';
    const originalArtist = currentStream.song?.artist;
    const singers =
      currentStream.singers && currentStream.singers.length > 0
        ? currentStream.singers.join(', ')
        : '戌亥とこ';
    const artist = originalArtist ? `${originalArtist} (歌: ${singers})` : singers;
    const album =
      'video' in currentStream && currentStream.video?.title
        ? currentStream.video.title
        : '戌亥とこ 歌枠アーカイブ';

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: [
        {
          src: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
          sizes: '120x90',
          type: 'image/jpeg',
        },
        {
          src: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          sizes: '320x180',
          type: 'image/jpeg',
        },
        {
          src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          sizes: '480x360',
          type: 'image/jpeg',
        },
        {
          src: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          sizes: '1280x720',
          type: 'image/jpeg',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    });
  }, [currentStream]);

  // 3. 再生ステート（playbackState）の更新
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (!currentStream) {
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying, currentStream]);

  // 4. 再生位置（positionState）の更新
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('mediaSession' in navigator) ||
      !('setPositionState' in navigator.mediaSession)
    ) {
      return;
    }

    if (!currentStream || duration <= 0) return;

    try {
      const position = Math.min(Math.max(0, currentTime), duration);
      navigator.mediaSession.setPositionState({
        duration: Math.max(0.1, duration),
        playbackRate: 1,
        position,
      });
    } catch {
      // positionState 範囲外例外等の安全な無視
    }
  }, [currentTime, duration, currentStream]);
}
