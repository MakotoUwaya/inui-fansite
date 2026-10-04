import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdClear, MdSearch, MdPlayArrow, MdPause, MdSave, MdCheck, MdArrowForward, MdArrowBack, MdRefresh } from 'react-icons/md';
import { supabase } from '../../../utils/supabaseClient';
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
  start: number;
  end: number | null;
  video_id: string;
  published_at: string;
  singers: string[] | null;
  is_length_checked: boolean;
  length_checked_at: string | null;
  song: {
    title: string;
    artist: string;
  };
  video: {
    title: string;
    url: string;
  };
};

type CheckFilter = 'unchecked' | 'checked' | 'all';
type LengthFilter = 'all' | 'long' | 'no-end';
type SortOrder = 'newest' | 'oldest' | 'duration-desc' | 'duration-asc' | 'title';

export default function AdjustSongLengthPage() {
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

  // 編集フォーム状態
  const [editStart, setEditStart] = useState<number>(0);
  const [editEnd, setEditEnd] = useState<number | null>(null);
  const [startInputStr, setStartInputStr] = useState('');
  const [endInputStr, setEndInputStr] = useState('');

  // プレイヤー状態
  const playerRef = useRef<any>(null);
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
        .select('id, start, end, video_id, published_at, singers, is_length_checked, length_checked_at, song!inner(title, artist), video!video_id(title, url)')
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

    // キーワード検索（曲名、アーティスト、動画タイトル）
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter((s) => {
        const title = (s.song?.title || '').toLowerCase();
        const artist = (s.song?.artist || '').toLowerCase();
        const videoTitle = (s.video?.title || '').toLowerCase();
        return title.includes(kw) || artist.includes(kw) || videoTitle.includes(kw);
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

  // 曲選択時の処理
  const handleSelectSong = useCallback((song: SongRecord) => {
    setSelectedId(song.id);
    setEditStart(song.start);
    setEditEnd(song.end);
    setStartInputStr(formatTime(song.start));
    setEndInputStr(song.end !== null ? formatTime(song.end) : '');
    setStatusMessage(null);

    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    // YouTubeプレイヤーの動画読み込み
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById({
        videoId: song.video_id,
        startSeconds: Math.max(0, song.start - 3),
      });
    }
  }, []);

  // 初期ロード時またはフィルター変更時に先頭曲を選択
  useEffect(() => {
    if (!selectedId && filteredSongs.length > 0) {
      handleSelectSong(filteredSongs[0]);
    }
  }, [filteredSongs, selectedId, handleSelectSong]);

  // YouTube IFrame API 初期化
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const initPlayer = () => {
      if (!(window as any).YT || !(window as any).YT.Player) return;

      if (!playerRef.current) {
        playerRef.current = new (window as any).YT.Player('adjust-yt-player', {
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: () => {
              setPlayerReady(true);
              if (currentSong) {
                playerRef.current.cueVideoById({
                  videoId: currentSong.video_id,
                  startSeconds: Math.max(0, currentSong.start - 3),
                });
              }
            },
            onStateChange: (event: any) => {
              // 1: playing, 2: paused
              setIsPlaying(event.data === 1);
            },
          },
        });
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
  }, [currentSong]);

  // 再生時間の定期更新
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          setCurrentTime(Math.floor(time));
        }
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

  // 1. 開始から再生（前3秒から）
  const playStart = useCallback(() => {
    if (!playerRef.current) return;
    clearStopTimer();
    const seekSec = Math.max(0, editStart - 3);
    playerRef.current.seekTo(seekSec, true);
    playerRef.current.playVideo();
  }, [editStart]);

  // 2. 終了前7秒〜終了まで再生（終了地点で自動一時停止）
  const playEndBefore = useCallback(() => {
    if (!playerRef.current || editEnd === null) return;
    clearStopTimer();
    const playLength = 7;
    const seekSec = Math.max(editStart, editEnd - playLength);
    playerRef.current.seekTo(seekSec, true);
    playerRef.current.playVideo();

    // 終了時刻に達したら停止
    const durationMs = (editEnd - seekSec) * 1000 / playbackRate;
    stopTimerRef.current = setTimeout(() => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }, durationMs + 200);
  }, [editStart, editEnd, playbackRate]);

  // 3. 終了地点から5秒再生（雑談が入っていないか確認・自動停止）
  const playEndAfter = useCallback(() => {
    if (!playerRef.current || editEnd === null) return;
    clearStopTimer();
    playerRef.current.seekTo(editEnd, true);
    playerRef.current.playVideo();

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
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
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
    if (!playerRef.current) return;
    const time = Math.floor(playerRef.current.getCurrentTime());
    setEditStart(time);
    setStartInputStr(formatTime(time));
  };

  // 現在位置を終了にセット
  const setCurrentAsEnd = () => {
    if (!playerRef.current) return;
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

  // 保存処理
  const handleSave = async (andNext: boolean = false, markOkOnly: boolean = false) => {
    if (!currentSong) return;
    setSaving(true);
    setStatusMessage(null);

    const saveStart = markOkOnly ? currentSong.start : editStart;
    const saveEnd = markOkOnly ? currentSong.end : editEnd;

    try {
      const res = await fetch('/api/admin/update-song-length', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSong.id,
          start: saveStart,
          end: saveEnd,
          is_length_checked: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || '保存に失敗しました');
      }

      // ローカル state を更新
      setSongs((prev) =>
        prev.map((s) =>
          s.id === currentSong.id
            ? { ...s, start: saveStart, end: saveEnd, is_length_checked: true, length_checked_at: new Date().toISOString() }
            : s
        )
      );

      setStatusMessage(`✅ 「${currentSong.song.title}」をチェック済みに保存しました`);

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
      setStatusMessage(`↩️ 「${currentSong.song.title}」を未チェックに戻しました`);
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
      // input 要素にフォーカスがあるときは一部ショートカットを除外
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
        <title>楽曲再生時間・開始終了 微調整ツール (Local Admin)</title>
      </Head>

      <div className={styles.container}>
        {/* ヘッダー */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>
              <span>🎵</span> 楽曲再生時間 微調整ツール
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
                  placeholder="曲名・アーティスト・動画名で検索..."
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
                          <span className={styles.artistName} title={song.song?.artist}>
                            {song.song?.artist}
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

          {/* 右ペイン：プレイヤー＆微調整 */}
          <main className={styles.mainContent}>
            {!currentSong ? (
              <div className={styles.noSelected}>
                <span>👈 左のリストから調整したい楽曲を選択してください</span>
              </div>
            ) : (
              <>
                {/* プレイヤー領域 */}
                <section className={styles.playerSection}>
                  <div className={styles.videoWrapper}>
                    <div id="adjust-yt-player" />
                  </div>

                  <div className={styles.songHeader}>
                    <div className={styles.songDetails}>
                      <h2 className={styles.title}>{currentSong.song?.title}</h2>
                      <div className={styles.artist}>アーティスト: {currentSong.song?.artist}</div>
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
                        title="曲の開始3秒前から再生して歌い出しを確認 [キー: 1]"
                      >
                        <MdPlayArrow /> 歌い出し確認 (前3s)
                      </button>

                      <button
                        className={styles.btnPlayEndBefore}
                        onClick={playEndBefore}
                        title="終了時刻の手前7秒〜終了までを再生して歌が切れていないか確認 [キー: 2]"
                      >
                        <MdPlayArrow /> 歌い終わり確認 (前7s)
                      </button>

                      <button
                        className={styles.btnPlayEndAfter}
                        onClick={playEndAfter}
                        title="終了時刻から5秒再生して雑談が入っていないか確認 [キー: 3]"
                      >
                        <MdPlayArrow /> 終了後の雑談確認 (+5s)
                      </button>

                      <button
                        className={styles.btnTogglePlay}
                        onClick={togglePlay}
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
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 時間微調整コントロール */}
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
                        <MdCheck /> この長さでOKにして次へ
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
                        title="保存して次の曲へ進む [Ctrl + Enter]"
                      >
                        <MdSave /> 保存して次へ (Ctrl+Enter)
                      </button>
                    </div>
                  </div>

                  {/* ショートカットキーガイド */}
                  <div className={styles.shortcutHelp}>
                    <span>⌨️ ショートカット:</span>
                    <span><kbd>Space</kbd> 再生/停止</span>
                    <span><kbd>[</kbd> 開始セット</span>
                    <span><kbd>]</kbd> 終了セット</span>
                    <span><kbd>1</kbd> 歌い出し確認</span>
                    <span><kbd>2</kbd> 歌い終わり確認</span>
                    <span><kbd>3</kbd> 雑談確認</span>
                    <span><kbd>Ctrl+Enter</kbd> 保存して次へ</span>
                    <span><kbd>Alt+←/→</kbd> 前後曲へ移動</span>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
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
