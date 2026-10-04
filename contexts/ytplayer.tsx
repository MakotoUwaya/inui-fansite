import Script from 'next/script';
import { useRouter } from 'next/router';
import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shuffle, without } from 'lodash-es';
import type { RepeatType } from '../components/RepeatButton/RepeatButton';
import { useIsPlayedVideos } from '../hooks/useIsPlayedVideos';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SingingStreamForSearch, SingingStreamForWatch } from '../types';
import { filterStreams, getFilterSummary } from '../utils/songFilter';

export type FilterOptions = {
  filter?: string;
  singer?: string;
  keyword?: string;
};

export type PlayerContextType = {
  player: YT.Player | null;
  scriptLoaded: boolean;
  apiReady: boolean;
  playerReady: boolean;
  isPlaying: boolean;
  isEnded: boolean;
  isPlayedOnce: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMute: boolean;
  repeatType: RepeatType;
  isShuffled: boolean;
  currentStream: (SingingStreamForSearch | SingingStreamForWatch) | null;
  currentStreamId: string | null;
  streams: SingingStreamForSearch[];
  filterOptions: FilterOptions;
  filterSummary: { isFiltered: boolean; label: string };
  isFirstStream: boolean;
  isLastStream: boolean;
  isMobilePlaylistVisible: boolean;
  placeholderRect: DOMRect | null;
  setPlaceholderRect: (rect: DOMRect | null) => void;
  setMobilePlaylistVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setStreams: React.Dispatch<React.SetStateAction<SingingStreamForSearch[]>>;
  playSong: (
    stream: SingingStreamForSearch | SingingStreamForWatch,
    playlist?: SingingStreamForSearch[],
    filterOpts?: FilterOptions,
  ) => void;
  syncPlaylist: (playlist: SingingStreamForSearch[], filterOpts: FilterOptions, targetStreamId?: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVolume: (value: number) => void;
  setMute: (mute: boolean) => void;
  setRepeat: (repeat: RepeatType) => void;
  toggleShuffle: () => void;
  setYTPlayer: (mountId: string, options?: ConstructorParameters<typeof YT.Player>[1]) => void;
  unmountYTPlayer: () => void;
};

export const YTPlayerContext = createContext<PlayerContextType>({} as PlayerContextType);

// YouTube API イベントハンドラ内で参照するクロージャ用変数
let repeatTypeVariable: RepeatType = 'none';
let startSecondsVariable = 0;
let endSecondsVariable = 0;

export function YTPlayerContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reqIdRef = useRef<number | undefined>(undefined);
  const isNavigatingRef = useRef(false);

  // ルート遷移中は shallow replace 等によるルーティング干渉を防ぐ
  useEffect(() => {
    const handleStart = () => {
      isNavigatingRef.current = true;
    };
    const handleComplete = () => {
      isNavigatingRef.current = false;
    };
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router.events]);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const playerRef = useRef<YT.Player | null>(null);

  // 再生ステート
  const [currentStream, setCurrentStream] = useState<(SingingStreamForSearch | SingingStreamForWatch) | null>(null);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [streams, setStreams] = useState<SingingStreamForSearch[]>([]);
  const [originalStreams, setOriginalStreams] = useState<SingingStreamForSearch[]>([]);
  const [isPlaying, setPlaying] = useState(false);
  const [isEnded, setEnded] = useState(false);
  const [isPlayedOnce, setPlayedOnce] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isShuffled, setShuffled] = useState(false);
  const [isMobilePlaylistVisible, setMobilePlaylistVisible] = useState(false);
  const [placeholderRect, setPlaceholderRect] = useState<DOMRect | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  const [isMute, setMuteState] = useLocalStorage('isMute', false);
  const [repeatType, setRepeatTypeState] = useLocalStorage<RepeatType>('repeatType', 'none');
  const [volume, setVolumeState] = useLocalStorage('volume', 80);

  const { isPlayedVideo, addPlayedVideo } = useIsPlayedVideos();

  const isAutoPlayRef = useRef(true);

  // repeatType をクロージャ用変数と同期
  useEffect(() => {
    repeatTypeVariable = repeatType;
  }, [repeatType]);

  // currentStream の start / end をクロージャ用変数と同期
  useEffect(() => {
    startSecondsVariable = currentStream?.start ?? 0;
    endSecondsVariable = currentStream?.end ?? 0;
  }, [currentStream?.start, currentStream?.end]);

  const currentStreamRef = useRef<(SingingStreamForSearch | SingingStreamForWatch) | null>(null);

  // currentStream を ref と同期
  useEffect(() => {
    currentStreamRef.current = currentStream;
  }, [currentStream]);

  const onScriptLoad = useCallback(() => {
    setScriptLoaded(true);
  }, []);

  const onPlayerReady = useCallback(() => {
    setPlayerReady(true);
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      const stream = currentStreamRef.current;
      if (stream) {
        playerRef.current.loadVideoById({
          videoId: stream.video_id,
          startSeconds: stream.start,
          endSeconds: stream.end,
        });
      }
    }
  }, []);

  const enableAutoPlay = useCallback(() => {
    isAutoPlayRef.current = true;
  }, []);

  const filterSummary = useMemo(() => getFilterSummary(filterOptions), [filterOptions]);

  const duration = useMemo(() => {
    if (!currentStream) return 0;
    return Math.max(0, currentStream.end - currentStream.start);
  }, [currentStream]);

  const isFirstStream = useMemo(() => {
    if (!streams.length || !currentStreamId) return true;
    const index = streams.findIndex((s) => s.id === currentStreamId);
    return index <= 0;
  }, [streams, currentStreamId]);

  const isLastStream = useMemo(() => {
    if (!streams.length || !currentStreamId) return true;
    const index = streams.findIndex((s) => s.id === currentStreamId);
    if (index === -1) return true;
    return index >= streams.length - 1;
  }, [streams, currentStreamId]);

  // watch ページかどうか判定
  const isWatchPage = router.pathname === '/singing-streams/watch';

  // 絞り込み条件を保持したまま watch ページへ遷移
  const navigateToStream = useCallback(
    (targetStreamId: string) => {
      const query: Record<string, string> = { v: targetStreamId };
      if (filterOptions.filter) query.filter = filterOptions.filter;
      if (filterOptions.singer) query.singer = filterOptions.singer;
      if (filterOptions.keyword) query.keyword = filterOptions.keyword;
      router.push({ pathname: '/singing-streams/watch', query });
    },
    [filterOptions, router],
  );

  // 指定した stream をロードして再生
  const loadAndPlayStream = useCallback(
    (target: SingingStreamForSearch | SingingStreamForWatch) => {
      currentStreamRef.current = target;
      setCurrentStream(target);
      setCurrentStreamId(target.id);
      setCurrentTime(0);
      setEnded(false);
      setPlayedOnce(false);

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: target.video_id,
          startSeconds: target.start,
          endSeconds: target.end,
        });
      }

      // watch ページにいる場合は URL のクエリ v を現在の曲IDに追従同期（shallow）
      // ※ 他ページへの遷移中(isNavigatingRef)はページ遷移をキャンセルしないよう実行しない
      if (
        router.pathname === '/singing-streams/watch' &&
        router.isReady &&
        !isNavigatingRef.current
      ) {
        const queryParams = new URLSearchParams();
        const currentQuery = router.query;
        for (const [k, v] of Object.entries(currentQuery)) {
          if (k !== 'v' && typeof v === 'string') {
            queryParams.set(k, v);
          }
        }
        queryParams.set('v', target.id);
        const newUrl = `/singing-streams/watch?${queryParams.toString()}`;
        try {
          router.replace(newUrl, undefined, {
            shallow: true,
            scroll: false,
          });
        } catch {
          // ignore
        }
      }
    },
    [router],
  );

  // IDから対象曲を見つけて再生する
  const playStreamById = useCallback(
    (targetId: string, customStreams?: SingingStreamForSearch[]) => {
      const list = customStreams || streams;
      const target = list.find((s) => s.id === targetId);
      if (target) {
        loadAndPlayStream(target);
      }
    },
    [loadAndPlayStream, streams],
  );

  // 曲再生開始（プレイリストやフィルターも必要に応じてセット）
  const playSong = useCallback(
    (
      stream: SingingStreamForSearch | SingingStreamForWatch,
      playlist?: SingingStreamForSearch[],
      filterOpts?: FilterOptions,
    ) => {
      if (filterOpts) {
        setFilterOptions((prev) => {
          if (
            prev.filter === filterOpts.filter &&
            prev.singer === filterOpts.singer &&
            prev.keyword === filterOpts.keyword
          ) {
            return prev;
          }
          return filterOpts;
        });
      }
      if (playlist && playlist.length > 0) {
        setStreams((prev) => {
          if (prev.length === playlist.length && prev[0]?.id === playlist[0]?.id) {
            return prev;
          }
          return playlist;
        });
        setOriginalStreams(playlist);
        setShuffled(false);
      }
      enableAutoPlay();
      loadAndPlayStream(stream);
    },
    [enableAutoPlay, loadAndPlayStream],
  );

  // プレイリストの同期（watch ページ初期化時など）
  const syncPlaylist = useCallback(
    (playlist: SingingStreamForSearch[], filterOpts: FilterOptions, targetStreamId?: string) => {
      setFilterOptions((prev) => {
        if (
          prev.filter === filterOpts.filter &&
          prev.singer === filterOpts.singer &&
          prev.keyword === filterOpts.keyword
        ) {
          return prev;
        }
        return filterOpts;
      });

      setStreams((prev) => {
        if (
          prev.length === playlist.length &&
          prev.every((s, idx) => s.id === playlist[idx]?.id)
        ) {
          return prev;
        }
        return playlist;
      });

      setOriginalStreams((prev) => {
        if (
          prev.length === playlist.length &&
          prev.every((s, idx) => s.id === playlist[idx]?.id)
        ) {
          return prev;
        }
        return playlist;
      });

      if (targetStreamId) {
        const stream = playlist.find((s) => s.id === targetStreamId);
        if (stream) {
          if (currentStreamId !== targetStreamId) {
            enableAutoPlay();
            loadAndPlayStream(stream);
          }
        }
      }
    },
    [currentStreamId, enableAutoPlay, loadAndPlayStream],
  );

  const play = useCallback(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;
    enableAutoPlay();
    playerRef.current.playVideo();
  }, [enableAutoPlay]);

  const pause = useCallback(() => {
    if (!playerRef.current || typeof playerRef.current.pauseVideo !== 'function') return;
    playerRef.current.pauseVideo();
  }, []);

  const seekTo = useCallback(
    (time: number) => {
      if (!playerRef.current || !currentStream || typeof playerRef.current.seekTo !== 'function') return;
      const targetTime = currentStream.start + Math.max(0, time);
      if (currentStream.end > 0 && targetTime >= currentStream.end) {
        setEnded(true);
        setPlaying(false);
        try {
          playerRef.current.pauseVideo();
        } catch {
          // ignore
        }
        return;
      }
      playerRef.current.seekTo(targetTime);
      setCurrentTime(Math.max(0, time));
      setEnded(false);
    },
    [currentStream],
  );

  const skipPrev = useCallback(() => {
    if (!currentStream || !playerRef.current) return;
    enableAutoPlay();
    if (currentTime >= 5 && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(currentStream.start);
      setCurrentTime(0);
      return;
    }
    if (!streams.length) return;
    const playingIndex = streams.findIndex((s) => s.id === currentStream.id);
    if (playingIndex <= 0) {
      // 先頭曲の場合は先頭に巻き戻す
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(currentStream.start);
      }
      setCurrentTime(0);
      return;
    }
    const prev = streams[playingIndex - 1];
    if (prev) {
      playStreamById(prev.id);
    }
  }, [currentTime, currentStream, enableAutoPlay, playStreamById, streams]);

  const skipNext = useCallback(() => {
    if (!streams.length || !currentStream) return;
    enableAutoPlay();
    const playingIndex = streams.findIndex((s) => s.id === currentStream.id);
    if (playingIndex < 0 || playingIndex >= streams.length - 1) return;
    const next = streams[playingIndex + 1];
    if (next) {
      playStreamById(next.id);
    }
  }, [currentStream, enableAutoPlay, playStreamById, streams]);

  const setVolume = useCallback(
    (value: number) => {
      if (playerRef.current) {
        playerRef.current.setVolume(value);
      }
      setVolumeState(value);
    },
    [setVolumeState],
  );

  const setMute = useCallback(
    (mute: boolean) => {
      if (playerRef.current) {
        mute ? playerRef.current.mute() : playerRef.current.unMute();
      }
      setMuteState(mute);
    },
    [setMuteState],
  );

  const setRepeat = useCallback(
    (repeat: RepeatType) => {
      repeatTypeVariable = repeat;
      setRepeatTypeState(repeat);
    },
    [setRepeatTypeState],
  );

  const toggleShuffle = useCallback(() => {
    if (!streams.length || !currentStreamId) return;
    const current = streams.find((s) => s.id === currentStreamId);
    if (!current) return;

    if (isShuffled) {
      // 元の並び順に戻す
      setStreams(originalStreams);
      setShuffled(false);
    } else {
      // 現在の曲を先頭にして残りをシャッフル
      const shuffled = [current, ...shuffle(without(streams, current))];
      setStreams(shuffled);
      setShuffled(true);
    }
  }, [currentStreamId, isShuffled, originalStreams, streams]);

  // onStateChange ハンドラ
  const onStateChange = useCallback(
    (event: { target: YT.Player; data: number }) => {
      // unplayed
      if (event.data === -1) {
        setPlayedOnce(false);
      }

      // ended
      if (event.data === 0) {
        if (repeatTypeVariable === 'repeatOne') {
          event.target.seekTo(startSecondsVariable);
        } else {
          setEnded(true);
        }
      } else {
        setEnded(false);
      }

      // playing
      if (event.data === 1) {
        enableAutoPlay();
        const current = event.target.getCurrentTime();
        if (current < startSecondsVariable) {
          event.target.seekTo(startSecondsVariable);
        } else if (endSecondsVariable > 0 && current > endSecondsVariable) {
          setEnded(true);
          setPlaying(false);
        } else {
          setPlaying(true);
          setPlayedOnce(true);
        }
      } else {
        setPlaying(false);
      }
    },
    [enableAutoPlay],
  );

  // 再生時間の常時更新 (requestAnimationFrame)
  useEffect(() => {
    const step = () => {
      if (!playerRef.current || !currentStream) return;
      let ytCurrentTime = 0;
      try {
        ytCurrentTime = playerRef.current.getCurrentTime();
      } catch {
        return;
      }

      // 曲終了時刻（end）到達判定
      if (currentStream.end > 0 && ytCurrentTime >= currentStream.end) {
        if (repeatTypeVariable === 'repeatOne') {
          try {
            playerRef.current.seekTo(currentStream.start);
            setCurrentTime(0);
          } catch {
            // ignore
          }
          return;
        }
        setEnded(true);
        setPlaying(false);
        try {
          playerRef.current.pauseVideo();
        } catch {
          // ignore
        }
        return;
      }

      const time = ytCurrentTime - currentStream.start;
      setCurrentTime(isNaN(time) ? 0 : Math.max(0, time));
      if (isPlaying) {
        reqIdRef.current = requestAnimationFrame(step);
      }
    };
    reqIdRef.current = requestAnimationFrame(step);
    return () => {
      reqIdRef.current && cancelAnimationFrame(reqIdRef.current);
    };
  }, [isPlaying, currentStream]);

  // 曲終了時の次曲自動再生
  useEffect(() => {
    if (!streams.length || !isEnded || !isPlayedOnce || !currentStream) return;
    enableAutoPlay();
    const playingIndex = streams.findIndex((s) => s.id === currentStream.id);
    let nextStream: SingingStreamForSearch | null = null;
    if (playingIndex !== -1) {
      if (playingIndex === streams.length - 1) {
        nextStream = repeatType === 'repeat' ? streams[0] : null;
      } else {
        nextStream = streams[playingIndex + 1];
      }
    } else {
      nextStream = streams[0] || null;
    }

    if (nextStream) {
      loadAndPlayStream(nextStream);
    } else {
      setEnded(false);
      setPlaying(false);
    }
  }, [
    currentStream,
    enableAutoPlay,
    isEnded,
    isPlayedOnce,
    loadAndPlayStream,
    repeatType,
    streams,
  ]);

  // 再生履歴の追加
  useEffect(() => {
    if (!isPlayedOnce || !currentStream) return;
    if (!isPlayedVideo(currentStream.video_id)) {
      addPlayedVideo(currentStream.video_id);
    }
  }, [currentStream, isPlayedOnce, isPlayedVideo, addPlayedVideo]);

  // ミュート状態の適用
  useEffect(() => {
    if (!playerRef.current) return;
    isMute ? playerRef.current.mute() : playerRef.current.unMute();
  }, [isMute]);

  // 音量の適用
  useEffect(() => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(volume);
  }, [volume]);

  // YouTube Player の初期化
  const setYTPlayer = useCallback(
    (mountId: string, options?: ConstructorParameters<typeof YT.Player>[1]) => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
      const newPlayer = new YT.Player(mountId, {
        ...options,
        events: {
          ...options?.events,
          onReady: (e) => {
            onPlayerReady();
            options?.events?.onReady?.(e);
          },
          onStateChange: (e) => {
            onStateChange(e);
            options?.events?.onStateChange?.(e);
          },
        },
      });
      playerRef.current = newPlayer;
      setPlayer(newPlayer);
    },
    [onPlayerReady, onStateChange],
  );

  const unmountYTPlayer = useCallback(() => {
    setPlayerReady(false);
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    }
    setPlayer(null);
  }, []);

  // YouTube IFrame API Ready 監視
  useEffect(() => {
    if (scriptLoaded) {
      window.onYouTubeIframeAPIReady = () => {
        setApiReady(true);
      };
    }
  }, [scriptLoaded]);

  return (
    <YTPlayerContext.Provider
      value={{
        player: playerReady ? player : null,
        scriptLoaded,
        apiReady,
        playerReady,
        isPlaying,
        isEnded,
        isPlayedOnce,
        currentTime,
        duration,
        volume,
        isMute,
        repeatType,
        isShuffled,
        currentStream,
        currentStreamId,
        streams,
        filterOptions,
        filterSummary,
        isFirstStream,
        isLastStream,
        isMobilePlaylistVisible,
        placeholderRect,
        setPlaceholderRect,
        setMobilePlaylistVisible,
        setStreams,
        playSong,
        syncPlaylist,
        play,
        pause,
        seekTo,
        skipNext,
        skipPrev,
        setVolume,
        setMute,
        setRepeat,
        toggleShuffle,
        setYTPlayer,
        unmountYTPlayer,
      }}
    >
      {children}
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" onLoad={onScriptLoad} />
    </YTPlayerContext.Provider>
  );
}
