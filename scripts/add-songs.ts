import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { supabase } from '../utils/supabaseClient';

interface SongInput {
  title: string;
  artist: string;
  start: number;
  end: number;
}

interface VideoInput {
  video_id: string;
  title: string;
  url?: string;
  published_at?: string;
  length?: number;
}

interface AddSongsPayload {
  video: VideoInput;
  songs: SongInput[];
}

function parseTime(timeStr: string): number {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) {
    throw new Error(`無効な時間フォーマットです: ${timeStr}`);
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
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
  const videoTitle = video.title || `歌枠 (${video.video_id})`;
  const publishedAt = video.published_at || now;
  const videoLength = video.length || (songs.length > 0 ? Math.max(...songs.map(s => s.end || s.start)) + 60 : 0);

  console.log(`\n=== 動画情報の処理中: ${video.video_id} ===`);

  // 1. video テーブルの確認・登録
  const { data: existingVideos, error: videoSelectError } = await supabase
    .from('video')
    .select('id, video_id, title')
    .eq('video_id', video.video_id);

  if (videoSelectError) {
    console.error('videoテーブル検索エラー:', videoSelectError);
    process.exit(1);
  }

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
    console.log(`動画を新規登録しました: [${video.video_id}] ${videoTitle}`);
  } else {
    console.log(`動画は既に登録済みです: [${video.video_id}] ${existingVideos[0].title}`);
  }

  // 2. 各曲の登録
  console.log(`\n=== 楽曲登録開始 (${songs.length} 曲) ===`);
  let successCount = 0;

  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
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
        end: s.end || s.start + 240, // 終了時刻が未指定の場合は4分後を暫定値
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
    console.log(`[${i + 1}/${songs.length}] 登録完了: ${s.title} / ${s.artist || '不明'} (${s.start}s - ${s.end}s)`);
  }

  console.log(`\n=== 登録完了: ${successCount} / ${songs.length} 曲 ===\n`);
}

main().catch((err) => {
  console.error('予期せぬエラーが発生しました:', err);
  process.exit(1);
});
