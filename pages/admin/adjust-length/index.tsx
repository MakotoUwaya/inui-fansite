import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MdClear,
  MdSearch,
  MdPlayArrow,
  MdPause,
  MdSave,
  MdCheck,
  MdArrowForward,
  MdArrowBack,
  MdRefresh,
  MdClose,
  MdAdd,
  MdHelpOutline,
} from 'react-icons/md';
import { supabase } from '../../../utils/supabaseClient';
import { MOOD_LABELS, GENRE_LABELS } from '../../../utils/songMetadata';
import styles from './index.module.scss';

// 秒数を MM:SS または HH:MM:SS に変換
function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '--:--';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// MM:SS または HH:MM:SS または秒数文字列を秒数に変換
function parseTimeString(timeStr: string): number | null {
  const trimmed = timeStr.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) {
    return null;
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

type SongRecord = {
  id: string;
  song_id?: string;
  start: number;
  end: number | null;
  video_id: string;
  published_at: string;
  singers: string[] | null;
  is_length_checked: boolean;
  length_checked_at: string | null;
  song: {
    id?: string;
    title: string;
    artist: string;
    song_metadata?: {
      mood: string | null;
      genre: string | null;
      is_night_pick: boolean;
    } | null;
  };
  video: {
    title: string;
    url: string;
  };
};

type CheckFilter = 'unchecked' | 'checked' | 'all';
type LengthFilter = 'all' | 'long' | 'no-end';
type SortOrder = 'newest' | 'oldest' | 'duration-desc' | 'duration-asc' | 'title';

const COMMON_SINGERS = [
  '戌亥とこ',
  '町田ちま',
  '星川サラ',
  'リゼ・ヘルエスタ',
  'アンジュ・カトリーナ',
  '緑仙',
  '樋口楓',
  '西園チグサ',
  '渡会雲雀',
];

export default function AdjustSongPage() {
  const [songs, setSongs] = useState<SongRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 選択中の曲
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // フィルター・検索状態
  const [searchKeyword, setSearchKeyword] = useState('');
  const [checkFilter, setCheckFilter] = useState<CheckFilter>('unchecked');
  const [lengthFilter, setLengthFilter] = useState<LengthFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // 編集フォーム状態（時間）
  const [editStart, setEditStart] = useState<number>(0);
  const [editEnd, setEditEnd] = useState<number | null>(null);
  const [startInputStr, setStartInputStr] = useState('');
  const [endInputStr, setEndInputStr] = useState('');

  // 編集フォーム状態（歌唱者・タグ）
  const [editSingers, setEditSingers] = useState<string[]>([]);
  const [newSingerInput, setNewSingerInput] = useState('');
  const [editMood, setEditMood] = useState<string | null>(null);
  const [editGenre, setEditGenre] = useState<string | null>(null);
  const [editNightPick, setEditNightPick] = useState<boolean>(false);

  // プレイヤー状態
  const playerRef = useRef<any>(null);
  const currentSongRef = useRef<SongRecord | null>(null);
  const pendingVideoRef = useRef<{ videoId: string; start: number } | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 全曲取得
  const loadSongs = useCallback(async () => {
    setLoading(true);
    let allData: SongRecord[] = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('singing_stream')
        .select(`
          id,
          song_id,
          start,
          end,
          video_id,
          published_at,
          singers,
          is_length_checked,
          length_checked_at,
          song!inner(id, title, artist, song_metadata(mood, genre, is_night_pick)),
          video!video_id(title, url)
        `)
        .order('published_at', { ascending: false })
        .order('start', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('曲データ取得エラー:', error);
        break;
      }
      if (!data || data.length === 0) break;
      allData = allData.concat(data as unknown as SongRecord[]);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    setSongs(allData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // 統計情報
  const stats = useMemo(() => {
    const total = songs.length;
    const checked = songs.filter((s) => s.is_length_checked).length;
    const unchecked = total - checked;
    const longUnchecked = songs.filter((s) => !s.is_length_checked && s.end !== null && s.end - s.start >= 300).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, unchecked, longUnchecked, percentage };
  }, [songs]);

  // フィルタリング＆ソート済み楽曲一覧
  const filteredSongs = useMemo(() => {
    let result = songs;

    // チェック状態フィルター
    if (checkFilter === 'unchecked') {
      result = result.filter((s) => !s.is_length_checked);
    } else if (checkFilter === 'checked') {
      result = result.filter((s) => s.is_length_checked);
    }

    // 長さフィルター
    if (lengthFilter === 'long') {
      result = result.filter((s) => s.end !== null && s.end - s.start >= 300);
    } else if (lengthFilter === 'no-end') {
      result = result.filter((s) => s.end === null);
    }

    // キーワード検索（曲名、アーティスト、動画タイトル、歌唱者）
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter((s) => {
        const title = (s.song?.title || '').toLowerCase();
        const artist = (s.song?.artist || '').toLowerCase();
        const videoTitle = (s.video?.title || '').toLowerCase();
        const singersStr = (s.singers || []).join(' ').toLowerCase();
        return title.includes(kw) || artist.includes(kw) || videoTitle.includes(kw) || singersStr.includes(kw);
      });
    }

    // ソート
    const sorted = [...result];
    switch (sortOrder) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime() || a.start - b.start);
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime() || a.start - b.start);
        break;
      case 'duration-desc':
        sorted.sort((a, b) => {
          const durA = a.end !== null ? a.end - a.start : 99999;
          const durB = b.end !== null ? b.end - b.start : 99999;
          return durB - durA;
        });
        break;
      case 'duration-asc':
        sorted.sort((a, b) => {
          const durA = a.end !== null ? a.end - a.start : 99999;
          const durB = b.end !== null ? b.end - b.start : 99999;
          return durA - durB;
        });
        break;
      case 'title':
        sorted.sort((a, b) => (a.song?.title || '').localeCompare(b.song?.title || '', 'ja'));
        break;
    }

    return sorted;
  }, [songs, checkFilter, lengthFilter, searchKeyword, sortOrder]);

  // 現在選択中の曲
  const currentSong = useMemo(() => {
    return songs.find((s) => s.id === selectedId) || null;
  }, [songs, selectedId]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  // 曲選択時の処理
  const handleSelectSong = useCallback((song: SongRecord) => {
    setSelectedId(song.id);
    setEditStart(song.start);
    setEditEnd(song.end);
    setStartInputStr(formatTime(song.start));
    setEndInputStr(song.end !== null ? formatTime(song.end) : '');

    // 歌唱者・タグを初期化
    setEditSingers(Array.isArray(song.singers) && song.singers.length > 0 ? [...song.singers] : ['戌亥とこ']);
    setNewSingerInput('');

    // メタデータ
    const meta = Array.isArray(song.song?.song_metadata) ? song.song.song_metadata[0] : song.song?.song_metadata;
    setEditMood(meta?.mood || null);
    setEditGenre(meta?.genre || null);
    setEditNightPick(Boolean(meta?.is_night_pick));

    setStatusMessage(null);

    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const seekTime = Math.max(0, song.start);

    // YouTubeプレイヤーの動画読み込み
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        playerRef.current.loadVideoById({
          videoId: song.video_id,
          startSeconds: seekTime,
        });
      } catch (e) {
        console.warn('loadVideoById failed:', e);
      }
    } else {
      pendingVideoRef.current = {
        videoId: song.video_id,
        start: song.start,
      };
    }
  }, []);

  // 初期ロード時またはフィルター変更時に先頭曲を選択
  useEffect(() => {
    if (!selectedId && filteredSongs.length > 0) {
      handleSelectSong(filteredSongs[0]);
    }
  }, [filteredSongs, selectedId, handleSelectSong]);

  // YouTube IFrame API 初期化（マウント時に1回だけ実行）
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const initPlayer = () => {
      const container = document.getElementById('adjust-yt-player');
      if (!container) return;

      if (!(window as any).YT || !(window as any).YT.Player) return;

      if (!playerRef.current) {
        try {
          const newPlayer = new (window as any).YT.Player('adjust-yt-player', {
            width: '100%',
            height: '100%',
            playerVars: {
              controls: 1,
              modestbranding: 1,
              rel: 0,
            },
            events: {
              onReady: (event: any) => {
                playerRef.current = event.target;
                setPlayerReady(true);

                const pending = pendingVideoRef.current;
                const targetSong = currentSongRef.current;

                if (pending && typeof event.target.cueVideoById === 'function') {
                  event.target.cueVideoById({
                    videoId: pending.videoId,
                    startSeconds: Math.max(0, pending.start),
                  });
                  pendingVideoRef.current = null;
                } else if (targetSong && typeof event.target.cueVideoById === 'function') {
                  event.target.cueVideoById({
                    videoId: targetSong.video_id,
                    startSeconds: Math.max(0, targetSong.start),
                  });
                }
              },
              onStateChange: (event: any) => {
                // 1: playing, 2: paused
                setIsPlaying(event.data === 1);
              },
            },
          });
          playerRef.current = newPlayer;
        } catch (e) {
          console.warn('YT.Player init error:', e);
        }
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      interval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          initPlayer();
          if (interval) clearInterval(interval);
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // 再生時間の定期更新
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime();
          if (typeof time === 'number' && !isNaN(time)) {
            setCurrentTime(Math.floor(time));
          }
        } catch {}
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  // 試聴アクション
  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  // 1. 歌い出し確認 (±0s ジャストタイムで再生)
  const playStart = useCallback(() => {
    if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
    clearStopTimer();
    playerRef.current.seekTo(editStart, true);
    if (typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  }, [editStart]);

  // 2. 歌い終わり確認 (前3s〜終了まで再生して自動停止)
  const playEndBefore = useCallback(() => {
    if (!playerRef.current || editEnd === null || typeof playerRef.current.seekTo !== 'function') return;
    clearStopTimer();
    const playLength = 3;
    const seekSec = Math.max(editStart, editEnd - playLength);
    playerRef.current.seekTo(seekSec, true);
    if (typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }

    // 終了時刻に達したら停止
    const durationMs = ((editEnd - seekSec) * 1000) / playbackRate;
    stopTimerRef.current = setTimeout(() => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }, durationMs + 150);
  }, [editStart, editEnd, playbackRate]);

  // 3. 終了後の雑談確認 (終了時刻から5秒再生して自動停止)
  const playEndAfter = useCallback(() => {
    if (!playerRef.current || editEnd === null || typeof playerRef.current.seekTo !== 'function') return;
    clearStopTimer();
    playerRef.current.seekTo(editEnd, true);
    if (typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }

    // 5秒後に停止
    const durationMs = 5000 / playbackRate;
    stopTimerRef.current = setTimeout(() => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }, durationMs + 200);
  }, [editEnd, playbackRate]);

  // 再生 / 一時停止トグル
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    clearStopTimer();
    if (isPlaying) {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    } else {
      if (typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    }
  }, [isPlaying]);

  // 再生速度変更
  const changeRate = (rate: number) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  // 現在位置を開始にセット
  const setCurrentAsStart = () => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
    const time = Math.floor(playerRef.current.getCurrentTime());
    setEditStart(time);
    setStartInputStr(formatTime(time));
  };

  // 現在位置を終了にセット
  const setCurrentAsEnd = () => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
    const time = Math.floor(playerRef.current.getCurrentTime());
    setEditEnd(time);
    setEndInputStr(formatTime(time));
  };

  // 微調整関数
  const adjustStart = (diff: number) => {
    const next = Math.max(0, editStart + diff);
    setEditStart(next);
    setStartInputStr(formatTime(next));
  };

  const adjustEnd = (diff: number) => {
    if (editEnd === null) return;
    const next = Math.max(editStart + 1, editEnd + diff);
    setEditEnd(next);
    setEndInputStr(formatTime(next));
  };

  // 手入力パース
  const handleStartBlur = () => {
    const sec = parseTimeString(startInputStr);
    if (sec !== null && sec >= 0) {
      setEditStart(sec);
      setStartInputStr(formatTime(sec));
    } else {
      setStartInputStr(formatTime(editStart));
    }
  };

  const handleEndBlur = () => {
    const sec = parseTimeString(endInputStr);
    if (sec !== null && sec > editStart) {
      setEditEnd(sec);
      setEndInputStr(formatTime(sec));
    } else if (endInputStr.trim() === '') {
      setEditEnd(null);
      setEndInputStr('');
    } else {
      setEndInputStr(editEnd !== null ? formatTime(editEnd) : '');
    }
  };

  // 歌唱者の追加・削除
  const addSinger = (singerName: string) => {
    const trimmed = singerName.trim();
    if (!trimmed || editSingers.includes(trimmed)) return;
    setEditSingers([...editSingers, trimmed]);
    setNewSingerInput('');
  };

  const removeSinger = (singerName: string) => {
    setEditSingers(editSingers.filter((s) => s !== singerName));
  };

  // 保存処理
  const handleSave = async (andNext: boolean = false, markOkOnly: boolean = false) => {
    if (!currentSong) return;
    setSaving(true);
    setStatusMessage(null);

    const saveStart = markOkOnly ? currentSong.start : editStart;
    const saveEnd = markOkOnly ? currentSong.end : editEnd;
    const targetSongId = currentSong.song_id || currentSong.song?.id;

    try {
      const payload: Record<string, any> = {
        id: currentSong.id,
        song_id: targetSongId,
        start: saveStart,
        end: saveEnd,
        is_length_checked: true,
      };

      if (!markOkOnly) {
        payload.singers = editSingers;
        payload.metadata = {
          mood: editMood,
          genre: editGenre,
          is_night_pick: editNightPick,
        };
      }

      const res = await fetch('/api/admin/update-song-length', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || '保存に失敗しました');
      }

      // ローカル state を更新
      setSongs((prev) =>
        prev.map((s) => {
          if (s.id !== currentSong.id) return s;
          const updatedSong = { ...s, start: saveStart, end: saveEnd, is_length_checked: true, length_checked_at: new Date().toISOString() };
          if (!markOkOnly) {
            updatedSong.singers = editSingers;
            if (updatedSong.song) {
              updatedSong.song.song_metadata = {
                mood: editMood,
                genre: editGenre,
                is_night_pick: editNightPick,
              };
            }
          }
          return updatedSong;
        })
      );

      setStatusMessage(
        markOkOnly
          ? `✅ 「${currentSong.song.title}」を現在の時間のまま確認済みにマークしました`
          : `✅ 「${currentSong.song.title}」の変更を保存し、確認済みにしました`
      );

      if (andNext) {
        // 次の曲へ移動
        const currentIndex = filteredSongs.findIndex((s) => s.id === currentSong.id);
        if (currentIndex >= 0 && currentIndex < filteredSongs.length - 1) {
          handleSelectSong(filteredSongs[currentIndex + 1]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`❌ 保存エラー: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 未チェックに戻す
  const handleUncheck = async () => {
    if (!currentSong) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/update-song-length', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSong.id,
          start: editStart,
          end: editEnd,
          is_length_checked: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '更新に失敗しました');

      setSongs((prev) =>
        prev.map((s) =>
          s.id === currentSong.id
            ? { ...s, is_length_checked: false, length_checked_at: null }
            : s
        )
      );
      setStatusMessage(`↩️ 「${currentSong.song.title}」を未確認に戻しました`);
    } catch (err: any) {
      setStatusMessage(`❌ エラー: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 前の曲 / 次の曲
  const handlePrevSong = () => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex((s) => s.id === currentSong.id);
    if (currentIndex > 0) {
      handleSelectSong(filteredSongs[currentIndex - 1]);
    }
  };

  const handleNextSong = () => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex((s) => s.id === currentSong.id);
    if (currentIndex >= 0 && currentIndex < filteredSongs.length - 1) {
      handleSelectSong(filteredSongs[currentIndex + 1]);
    }
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSave(true);
        return;
      }

      if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
        e.preventDefault();
        handleNextSong();
        return;
      }

      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
        e.preventDefault();
        handlePrevSong();
        return;
      }

      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === '[') {
        e.preventDefault();
        setCurrentAsStart();
      } else if (e.key === ']') {
        e.preventDefault();
        setCurrentAsEnd();
      } else if (e.key === '1') {
        e.preventDefault();
        playStart();
      } else if (e.key === '2') {
        e.preventDefault();
        playEndBefore();
      } else if (e.key === '3') {
        e.preventDefault();
        playEndAfter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleNextSong, handlePrevSong, togglePlay, playStart, playEndBefore, playEndAfter]);

  // 計算された曲の長さ
  const currentDurationSec = useMemo(() => {
    if (editEnd === null || editEnd <= editStart) return null;
    return editEnd - editStart;
  }, [editStart, editEnd]);

  return (
    <>
      <Head>
        <title>歌ってみた動画 調整ツール (Local Admin)</title>
      </Head>

      <div className={styles.container}>
        {/* ヘッダー */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>
              <span>🎤</span> 歌ってみた動画 調整ツール
            </h1>
            <span className={styles.badgeLocal}>LOCAL ONLY</span>
          </div>

          <div className={styles.statsArea}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>全曲:</span>
              <span>{stats.total}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>未確認:</span>
              <span className={styles.statVal}>{stats.unchecked}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>確認済:</span>
              <span style={{ color: '#10b981' }}>{stats.checked}</span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <span className={styles.progressText}>{stats.percentage}%</span>
            </div>
          </div>

          <Link href="/" className={styles.homeLink}>
            ファンサイトへ戻る
          </Link>
        </header>

        {/* メインコンテンツ（左右2カラム） */}
        <div className={styles.body}>
          {/* 左ペイン：検索＆曲一覧 */}
          <aside className={styles.sidebar}>
            <div className={styles.searchSection}>
              {/* 検索入力 */}
              <div className={styles.searchBar}>
                <MdSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="曲名・歌手・歌唱者・動画名で検索..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                {searchKeyword && (
                  <button
                    className={styles.clearBtn}
                    onClick={() => setSearchKeyword('')}
                    title="クリア"
                  >
                    <MdClear />
                  </button>
                )}
              </div>

              {/* フィルター群 */}
              <div className={styles.filterRows}>
                {/* チェック状態 */}
                <div className={styles.filterRow}>
                  <span className={styles.filterLabel}>状態:</span>
                  <div className={styles.filterButtonGroup}>
                    <button
                      className={checkFilter === 'unchecked' ? styles.active : ''}
                      onClick={() => setCheckFilter('unchecked')}
                    >
                      未確認 ({stats.unchecked})
                    </button>
                    <button
                      className={checkFilter === 'checked' ? styles.active : ''}
                      onClick={() => setCheckFilter('checked')}
                    >
                      確認済 ({stats.checked})
                    </button>
                    <button
                      className={checkFilter === 'all' ? styles.active : ''}
                      onClick={() => setCheckFilter('all')}
                    >
                      すべて ({stats.total})
                    </button>
                  </div>
                </div>

                {/* 長さ・ソート */}
                <div className={styles.filterRow}>
                  <span className={styles.filterLabel}>長さ:</span>
                  <select
                    value={lengthFilter}
                    onChange={(e) => setLengthFilter(e.target.value as LengthFilter)}
                  >
                    <option value="all">すべての長さ</option>
                    <option value="long">5分以上のみ (長尺)</option>
                    <option value="no-end">終了時刻未設定</option>
                  </select>

                  <span className={styles.filterLabel} style={{ marginLeft: 6 }}>順序:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  >
                    <option value="newest">配信日 (新しい順)</option>
                    <option value="oldest">配信日 (古い順)</option>
                    <option value="duration-desc">曲長 (長い順)</option>
                    <option value="duration-asc">曲長 (短い順)</option>
                    <option value="title">曲名 (50音順)</option>
                  </select>
                </div>
              </div>

              <div className={styles.listInfo}>
                <span>表示件数: {filteredSongs.length} 曲</span>
                <button
                  style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  onClick={loadSongs}
                >
                  <MdRefresh /> 再取得
                </button>
              </div>
            </div>

            {/* 楽曲リスト */}
            <div className={styles.songList}>
              {loading ? (
                <div className={styles.emptyState}>楽曲を読み込み中...</div>
              ) : filteredSongs.length === 0 ? (
                <div className={styles.emptyState}>条件に一致する曲がありません</div>
              ) : (
                filteredSongs.map((song) => {
                  const isSelected = song.id === selectedId;
                  const durSec = song.end !== null ? song.end - song.start : null;
                  const isLong = durSec !== null && durSec >= 300;
                  const singerDisplay = song.singers && song.singers.length > 0 ? song.singers.join(', ') : '戌亥とこ';

                  return (
                    <button
                      key={song.id}
                      className={`${styles.songItem} ${isSelected ? styles.active : ''}`}
                      onClick={() => handleSelectSong(song)}
                    >
                      <div
                        className={`${styles.statusDot} ${
                          song.is_length_checked ? styles.checked : styles.unchecked
                        }`}
                        title={song.is_length_checked ? '確認済み' : '未確認'}
                      />
                      <div className={styles.songInfo}>
                        <div className={styles.titleRow}>
                          <span className={styles.songTitle} title={song.song?.title}>
                            {song.song?.title}
                          </span>
                          <span
                            className={`${styles.songDuration} ${isLong ? styles.longSong : ''}`}
                          >
                            {formatTime(durSec)}
                          </span>
                        </div>
                        <div className={styles.metaRow}>
                          <span className={styles.artistName} title={`原曲: ${song.song?.artist} | 歌: ${singerDisplay}`}>
                            🎤 {singerDisplay}
                          </span>
                          <span className={styles.timeRange}>
                            {formatTime(song.start)} - {formatTime(song.end)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* 右ペイン：プレイヤー＆調整 */}
          <main className={styles.mainContent}>
            {/* プレイヤー領域（DOMアンマウントによるiframe破壊を防ぐため常駐） */}
            <section className={styles.playerSection}>
              <div className={styles.videoWrapper}>
                <div id="adjust-yt-player" />
              </div>

              {currentSong && (
                <>
                  <div className={styles.songHeader}>
                    <div className={styles.songDetails}>
                      <h2 className={styles.title}>{currentSong.song?.title}</h2>
                      <div className={styles.artist}>原曲アーティスト: {currentSong.song?.artist}</div>
                      <div className={styles.videoTitle}>配信: {currentSong.video?.title}</div>
                    </div>

                    <div className={styles.statusBadgeGroup}>
                      <span
                        className={`${styles.badge} ${
                          currentSong.is_length_checked ? styles.checked : styles.unchecked
                        }`}
                      >
                        {currentSong.is_length_checked ? '✔ 確認済み' : '⏳ 未確認'}
                      </span>
                      {currentSong.is_length_checked && (
                        <button
                          style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                          onClick={handleUncheck}
                          disabled={saving}
                        >
                          未確認に戻す
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 試聴・確認バー */}
                  <div className={styles.auditionBar}>
                    <div className={styles.quickButtons}>
                      <button
                        className={styles.btnPlayStart}
                        onClick={playStart}
                        disabled={!playerReady}
                        title="曲の開始時刻ジャスト（±0s）から再生して歌い出しを確認 [キー: 1]"
                      >
                        <MdPlayArrow /> 歌い出し確認 (±0s)
                      </button>

                      <button
                        className={styles.btnPlayEndBefore}
                        onClick={playEndBefore}
                        disabled={!playerReady || editEnd === null}
                        title="終了時刻の手前3秒〜終了までを再生し、自動停止して歌が切れていないか確認 [キー: 2]"
                      >
                        <MdPlayArrow /> 歌い終わり確認 (前3s)
                      </button>

                      <button
                        className={styles.btnPlayEndAfter}
                        onClick={playEndAfter}
                        disabled={!playerReady || editEnd === null}
                        title="終了時刻から5秒再生し、自動停止して直後に雑談やMCが入っていないか確認 [キー: 3]"
                      >
                        <MdPlayArrow /> 終了後の雑談確認 (+5s)
                      </button>

                      <button
                        className={styles.btnTogglePlay}
                        onClick={togglePlay}
                        disabled={!playerReady}
                        title="再生 / 一時停止 [Space]"
                      >
                        {isPlaying ? <MdPause /> : <MdPlayArrow />}
                        {isPlaying ? '一時停止' : '再生'}
                      </button>
                    </div>

                    <div className={styles.playerRateGroup}>
                      <span>速度:</span>
                      {[1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          className={playbackRate === rate ? styles.active : ''}
                          onClick={() => changeRate(rate)}
                          disabled={!playerReady}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>

            {!currentSong ? (
              <div className={styles.noSelected}>
                <span>👈 左のリストから調整したい楽曲を選択してください</span>
              </div>
            ) : (
              /* 時間微調整＆歌唱者・タグ編集コントロール */
              <section className={styles.adjustSection}>
                {/* 現在の再生位置インジケーター */}
                <div className={styles.currentTimeIndicator}>
                  <span className={styles.label}>▶ 現在の再生位置 (動画全体):</span>
                  <span className={styles.value}>
                    {formatTime(currentTime)} ({currentTime}s)
                  </span>
                </div>

                {/* 開始・終了時刻の入力カード */}
                <div className={styles.timeFieldsGrid}>
                  {/* 開始時刻 */}
                  <div className={styles.timeCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.fieldLabel}>開始時刻 (Start)</span>
                      <span className={styles.calculatedSec}>{editStart} 秒</span>
                    </div>

                    <div className={styles.inputRow}>
                      <input
                        type="text"
                        value={startInputStr}
                        onChange={(e) => setStartInputStr(e.target.value)}
                        onBlur={handleStartBlur}
                        placeholder="MM:SS"
                      />
                      <button
                        className={styles.btnSetCurrent}
                        onClick={setCurrentAsStart}
                        disabled={!playerReady}
                        title="現在の再生位置を開始時刻に設定 [キー: []"
                      >
                        現在位置にセット [ [ ]
                      </button>
                    </div>

                    <div className={styles.adjustButtons}>
                      <button onClick={() => adjustStart(-5)}>-5s</button>
                      <button onClick={() => adjustStart(-1)}>-1s</button>
                      <button onClick={() => adjustStart(1)}>+1s</button>
                      <button onClick={() => adjustStart(5)}>+5s</button>
                    </div>
                  </div>

                  {/* 終了時刻 */}
                  <div className={styles.timeCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.fieldLabel}>終了時刻 (End)</span>
                      <span className={styles.calculatedSec}>
                        {editEnd !== null ? `${editEnd} 秒` : '未設定'}
                      </span>
                    </div>

                    <div className={styles.inputRow}>
                      <input
                        type="text"
                        value={endInputStr}
                        onChange={(e) => setEndInputStr(e.target.value)}
                        onBlur={handleEndBlur}
                        placeholder="MM:SS"
                      />
                      <button
                        className={styles.btnSetCurrent}
                        onClick={setCurrentAsEnd}
                        disabled={!playerReady}
                        title="現在の再生位置を終了時刻に設定 [キー: ]]"
                      >
                        現在位置にセット [ ] ]
                      </button>
                    </div>

                    <div className={styles.adjustButtons}>
                      <button onClick={() => adjustEnd(-5)}>-5s</button>
                      <button onClick={() => adjustEnd(-1)}>-1s</button>
                      <button onClick={() => adjustEnd(1)}>+1s</button>
                      <button onClick={() => adjustEnd(5)}>+5s</button>
                    </div>
                  </div>
                </div>

                {/* 計算された曲長サマリー */}
                <div className={styles.durationSummaryBar}>
                  <span className={styles.durationLabel}>算出された演奏時間:</span>
                  <span
                    className={`${styles.durationValue} ${
                      currentDurationSec && currentDurationSec >= 300
                        ? styles.warning
                        : styles.ok
                    }`}
                  >
                    {currentDurationSec !== null
                      ? `${formatTime(currentDurationSec)} (${currentDurationSec}秒)`
                      : '終了時刻を設定してください'}
                    {currentDurationSec && currentDurationSec >= 300 && ' ⚠️ 5分以上（長尺）'}
                  </span>
                </div>

                {/* 歌唱者・タグ編集セクション */}
                <div className={styles.metaEditSection}>
                  {/* 歌唱者（singers） */}
                  <div className={styles.metaEditRow}>
                    <div className={styles.metaEditHeader}>
                      <span className={styles.label}>🎤 歌唱者 (Singers)</span>
                      <span className={styles.hint}>複数人コラボの場合は全員追加してください</span>
                    </div>

                    <div className={styles.chipsContainer}>
                      {editSingers.map((singer) => (
                        <span key={singer} className={styles.singerChip}>
                          {singer}
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeSinger(singer)}
                            title="削除"
                          >
                            <MdClose />
                          </button>
                        </span>
                      ))}

                      <div className={styles.addSingerInputWrapper}>
                        <input
                          type="text"
                          placeholder="歌唱者名を追加"
                          value={newSingerInput}
                          onChange={(e) => setNewSingerInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSinger(newSingerInput);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => addSinger(newSingerInput)}
                          title="追加"
                        >
                          <MdAdd /> 追加
                        </button>
                      </div>

                      <div className={styles.quickAddSingers}>
                        <span>候補:</span>
                        {COMMON_SINGERS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addSinger(s)}
                          >
                            +{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ムード（Mood） */}
                  <div className={styles.metaEditRow}>
                    <div className={styles.metaEditHeader}>
                      <span className={styles.label}>✨ ムード (Mood)</span>
                      {editMood && (
                        <button
                          style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
                          onClick={() => setEditMood(null)}
                        >
                          クリア
                        </button>
                      )}
                    </div>
                    <div className={styles.tagButtonGroup}>
                      {Object.entries(MOOD_LABELS).map(([key, val]) => (
                        <button
                          key={key}
                          type="button"
                          className={editMood === key ? styles.active : ''}
                          onClick={() => setEditMood(editMood === key ? null : key)}
                        >
                          <span>{val.icon}</span>
                          <span>{val.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ジャンル（Genre） */}
                  <div className={styles.metaEditRow}>
                    <div className={styles.metaEditHeader}>
                      <span className={styles.label}>🎵 ジャンル (Genre)</span>
                      {editGenre && (
                        <button
                          style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
                          onClick={() => setEditGenre(null)}
                        >
                          クリア
                        </button>
                      )}
                    </div>
                    <div className={styles.tagButtonGroup}>
                      {Object.entries(GENRE_LABELS).map(([key, val]) => (
                        <button
                          key={key}
                          type="button"
                          className={editGenre === key ? styles.active : ''}
                          onClick={() => setEditGenre(editGenre === key ? null : key)}
                        >
                          <span>{val.icon}</span>
                          <span>{val.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 夜曲適性（is_night_pick） */}
                  <div className={styles.metaEditRow}>
                    <label className={styles.nightPickToggle}>
                      <input
                        type="checkbox"
                        checked={editNightPick}
                        onChange={(e) => setEditNightPick(e.target.checked)}
                      />
                      <span>🌙 深夜にリラックスして聴きたい「夜曲（今夜聴きたいしっとり）」に設定</span>
                    </label>
                  </div>
                </div>

                {/* ボタンの使い分けヘルプガイド */}
                <div className={styles.helpGuideArea}>
                  <div className={helpTitleClass(styles)}>
                    <MdHelpOutline /> ボタンの使い分けガイド
                  </div>
                  <div className={styles.helpItem}>
                    <strong>✅ 変更なしでOKにして次へ:</strong>
                    <span>試聴して問題ない場合、現在の時間のまま確認済みにマークして次の曲へ進みます（数値変更なし）。</span>
                  </div>
                  <div className={styles.helpItem}>
                    <strong>💾 変更を保存して次へ:</strong>
                    <span>編集した「時間・歌唱者・タグ」をDBに反映保存し、確認済みにマークして次の曲へ進みます。</span>
                  </div>
                </div>

                {/* ステータスメッセージ */}
                {statusMessage && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      backgroundColor: statusMessage.startsWith('✅')
                        ? 'rgba(16, 185, 129, 0.15)'
                        : statusMessage.startsWith('↩️')
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      color: statusMessage.startsWith('✅')
                        ? '#10b981'
                        : statusMessage.startsWith('↩️')
                        ? '#60a5fa'
                        : '#f87171',
                      fontSize: '0.85rem',
                    }}
                  >
                    {statusMessage}
                  </div>
                )}

                {/* アクションボタンバー */}
                <div className={styles.actionButtons}>
                  <div className={styles.navButtons}>
                    <button
                      onClick={handlePrevSong}
                      disabled={saving}
                      title="前の曲 [Alt + ←]"
                    >
                      <MdArrowBack /> 前の曲
                    </button>
                    <button
                      onClick={handleNextSong}
                      disabled={saving}
                      title="次の曲 [Alt + →]"
                    >
                      次の曲 <MdArrowForward />
                    </button>
                  </div>

                  <div className={styles.saveButtons}>
                    <button
                      className={styles.btnMarkOkOnly}
                      onClick={() => handleSave(true, true)}
                      disabled={saving}
                      title="現在の時間のまま確認済みにマークして次の曲へ"
                    >
                      <MdCheck /> 変更なしでOKにして次へ
                    </button>

                    <button
                      className={styles.btnSaveOnly}
                      onClick={() => handleSave(false)}
                      disabled={saving}
                    >
                      <MdSave /> 保存のみ
                    </button>

                    <button
                      className={styles.btnSaveAndNext}
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      title="時間・歌唱者・タグの変更を保存して次の曲へ進む [Ctrl + Enter]"
                    >
                      <MdSave /> 変更を保存して次へ (Ctrl+Enter)
                    </button>
                  </div>
                </div>

                {/* ショートカットキーガイド */}
                <div className={styles.shortcutHelp}>
                  <span>⌨️ ショートカット:</span>
                  <span><kbd>Space</kbd> 再生/停止</span>
                  <span><kbd>[</kbd> 開始セット</span>
                  <span><kbd>]</kbd> 終了セット</span>
                  <span><kbd>1</kbd> 歌い出し確認 (±0s)</span>
                  <span><kbd>2</kbd> 歌い終わり確認 (前3s)</span>
                  <span><kbd>3</kbd> 雑談確認 (+5s)</span>
                  <span><kbd>Ctrl+Enter</kbd> 変更を保存して次へ</span>
                  <span><kbd>Alt+←/→</kbd> 前後曲へ移動</span>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function helpTitleClass(styles: any) {
  return styles.helpTitle || '';
}

// ローカル開発環境でのみ動作するようガード
export const getServerSideProps: GetServerSideProps = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return {
      notFound: true,
    };
  }

  return {
    props: {},
  };
};
