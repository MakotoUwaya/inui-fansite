import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { supabase } from '../utils/supabaseClient';

interface SongInput {
  title: string;
  artist?: string;
  start: number;
  end?: number;
}

interface VideoInput {
  video_id: string;
  title?: string;
  url?: string;
  published_at?: string;
  length?: number;
}

interface AddSongsPayload {
  video: VideoInput;
  songs: SongInput[];
}

/**
 * iTunes Search API を利用して原曲の長さ（秒）を取得
 */
async function fetchTrackDuration(title: string, artist?: string): Promise<number | null> {
  try {
    const query = `${title} ${artist || ''}`.trim();
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const trackTimeMillis = data.results?.[0]?.trackTimeMillis;
    if (trackTimeMillis && typeof trackTimeMillis === 'number') {
      return Math.round(trackTimeMillis / 1000);
    }
  } catch (e) {
    // ネットワークエラー等は無視してフォールバック
  }
  return null;
}

/**
 * YouTube oEmbed API を利用して動画タイトルを取得
 */
async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.title || null;
  } catch (e) {
    return null;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('使用方法: npx tsx --env-file=.env scripts/add-songs.ts <JSONファイルパスまたはJSON文字列>');
    process.exit(1);
  }

  let payload: AddSongsPayload;
  try {
    if (fs.existsSync(arg)) {
      const content = fs.readFileSync(path.resolve(arg), 'utf-8');
      payload = JSON.parse(content);
    } else {
      payload = JSON.parse(arg);
    }
  } catch (error) {
    console.error('JSONのパースに失敗しました:', error);
    process.exit(1);
  }

  const { video, songs } = payload;
  if (!video || !video.video_id || !songs || !Array.isArray(songs)) {
    console.error('ペイロードに必要なプロパティ(video.video_id, songs[])が不足しています。');
    process.exit(1);
  }

  const now = new Date().toISOString();
  const videoUrl = video.url || `https://www.youtube.com/watch?v=${video.video_id}`;
  let videoTitle = video.title;
  if (!videoTitle) {
    const oembedTitle = await fetchYouTubeTitle(video.video_id);
    videoTitle = oembedTitle || `歌枠 (${video.video_id})`;
  }
  const publishedAt = video.published_at || now;

  console.log(`\n=== 動画情報の処理: [${video.video_id}] ${videoTitle} ===`);

  // 1. video テーブルの確認・登録
  const { data: existingVideos, error: videoSelectError } = await supabase
    .from('video')
    .select('id, video_id, title')
    .eq('video_id', video.video_id);

  if (videoSelectError) {
    console.error('videoテーブル検索エラー:', videoSelectError);
    process.exit(1);
  }

  const videoLength = video.length || (songs.length > 0 ? Math.max(...songs.map(s => s.end || (s.start + 300))) + 120 : 7200);

  if (!existingVideos || existingVideos.length === 0) {
    const newVideoId = crypto.randomUUID();
    const { error: videoInsertError } = await supabase.from('video').insert([
      {
        id: newVideoId,
        video_id: video.video_id,
        title: videoTitle,
        length: videoLength,
        url: videoUrl,
        published_at: publishedAt,
        created_at: now,
        updated_at: now,
      },
    ]);

    if (videoInsertError) {
      console.error('videoテーブル登録エラー:', videoInsertError);
      process.exit(1);
    }
    console.log(`動画を新規登録しました: ${videoTitle}`);
  } else {
    console.log(`動画は既に登録済みです: ${existingVideos[0].title}`);
  }

  // 2. 各曲の終了時刻補完 & 登録
  console.log(`\n=== 楽曲情報の検証と登録開始 (${songs.length} 曲) ===`);
  let successCount = 0;

  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    const nextSong = songs[i + 1];
    let end = s.end;

    // 終了時刻が未指定、または次の曲まで6分以上空いている場合は原曲長でスマート補正
    const nextStart = nextSong ? nextSong.start : null;
    const intervalToNext = nextStart ? nextStart - s.start : null;

    if (!end || (intervalToNext && intervalToNext > 360)) {
      // 原曲の長さを取得
      const trackDuration = await fetchTrackDuration(s.title, s.artist);
      if (trackDuration) {
        // 原曲の長さ + 余韻・アウトロバッファ（8秒）
        const estimatedEnd = s.start + trackDuration + 8;
        end = nextStart ? Math.min(estimatedEnd, nextStart) : estimatedEnd;
        console.log(`[自動計算] 「${s.title}」原曲長: ${formatTime(trackDuration)} -> 終了時刻: ${formatTime(end)} (${end}s)`);
      } else {
        // 原曲が取得できない場合は 4分30秒 (270s) をデフォルトとする
        const defaultEnd = s.start + 270;
        end = nextStart ? Math.min(defaultEnd, nextStart) : defaultEnd;
        console.log(`[デフォルト設定] 「${s.title}」-> 終了時刻: ${formatTime(end)} (${end}s)`);
      }
    }

    const songId = crypto.randomUUID();

    // song テーブル登録
    const { error: songError } = await supabase.from('song').insert([
      {
        id: songId,
        title: s.title,
        artist: s.artist || '',
        created_at: now,
        updated_at: now,
      },
    ]);

    if (songError) {
      console.error(`曲「${s.title}」の登録に失敗しました (songテーブル):`, songError);
      continue;
    }

    // singing_stream テーブル登録
    const { error: streamError } = await supabase.from('singing_stream').insert([
      {
        id: songId,
        video_id: video.video_id,
        start: s.start,
        end: end,
        published_at: publishedAt,
        created_at: now,
        updated_at: now,
      },
    ]);

    if (streamError) {
      console.error(`曲「${s.title}」の登録に失敗しました (singing_streamテーブル):`, streamError);
      continue;
    }

    successCount++;
    console.log(`[${i + 1}/${songs.length}] 登録完了: ${s.title} / ${s.artist || '不明'} (${formatTime(s.start)} - ${formatTime(end)})`);
  }

  console.log(`\n=== 全処理完了: ${successCount} / ${songs.length} 曲 ===\n`);
}

main().catch((err) => {
  console.error('予期せぬエラーが発生しました:', err);
  process.exit(1);
});
