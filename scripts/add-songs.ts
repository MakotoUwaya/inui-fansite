import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { supabase } from '../utils/supabaseClient';

interface ParsedSong {
  title: string;
  artist: string;
  start: number;
  startStr: string;
  end?: number;
}

function parseSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function extractVideoId(input: string): string {
  const match = input.match(/(?:v=|\/embed\/|youtu\.be\/|^)([a-zA-Z0-9_-]{11})(?:[?&]|$)/);
  if (match) return match[1];
  return input.trim();
}

/**
 * タイムテーブルテキストを行ごとにパースする
 */
function parseTimetable(text: string): ParsedSong[] {
  const lines = text.split('\n');
  const results: ParsedSong[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // タイムスタンプの抽出 (H:)?MM:SS
    const timeMatch = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.*)$/);
    if (!timeMatch) continue;

    const timeStr = timeMatch[1];
    let rest = timeMatch[2].trim();

    // 絵文字や装飾記号を先頭から除去
    rest = rest.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\s]+/u, '').trim();

    // 曲番号プレフィックス (例: "M01. ", "01. ", "#1 ") を除去
    rest = rest.replace(/^(?:M\d{1,2}|#?\d{1,2})[\.\s、\-:]+\s*/i, '').trim();

    // 歌唱でないノイズ行を除外
    if (/^(声入り|OP|ED|開始|待機|オープニング|エンディング|雑談|挨拶|トーク|SET\s*LIST)/i.test(rest)) {
      continue;
    }

    let title = rest;
    let artist = '';

    // "曲名 / アーティスト名" または "曲名 - アーティスト名" を分割
    const delimiterMatch = rest.match(/^(.*?)\s*[\/／]\s*(.*)$/) || rest.match(/^(.*?)\s+[-–—]\s+(.*)$/);
    if (delimiterMatch) {
      title = delimiterMatch[1].trim();
      artist = delimiterMatch[2].trim();
    }

    // アーティスト名・曲名末尾の注記（例: "（🍹ソロ", "（🛼ソロ", "(デュエット)" など）を除去
    artist = artist.replace(/[(（][^()（）]*(?:ソロ|デュエット|コラボ|🍹|🛼|☯️)[^()（）]*[)）]?$/gu, '').trim();
    // アーティスト名の余分な括弧開き（例: "荒井由実（松任谷由実）" の後の閉じ忘れなど）を整える
    artist = artist.replace(/[(（][^()（）]*$/g, '').trim();

    if (title) {
      results.push({
        title,
        artist,
        start: parseSeconds(timeStr),
        startStr: timeStr,
      });
    }
  }

  return results;
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
    // ignore
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

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log(`
使用方法:
  1. URLとテキスト/ファイルから直接一括登録:
     npm run add-songs -- "<YouTube URL>" "<タイムテーブルテキスト または ファイルパス>"

  2. JSONファイルから一括登録:
     npm run add-songs -- <JSONファイルパス>
    `);
    process.exit(1);
  }

  let videoId = '';
  let timetableText = '';
  let customSongs: ParsedSong[] = [];

  // JSONファイル直接指定の場合
  if (args.length === 1 && (args[0].endsWith('.json') || fs.existsSync(args[0]))) {
    try {
      const content = fs.readFileSync(path.resolve(args[0]), 'utf-8');
      const payload = JSON.parse(content);
      videoId = extractVideoId(payload.video?.video_id || payload.video?.url || '');
      customSongs = payload.songs || [];
    } catch (e) {
      console.error('JSON読み込みエラー:', e);
      process.exit(1);
    }
  } else {
    // 第1引数: 動画URL / Video ID
    videoId = extractVideoId(args[0]);

    // 第2引数: タイムテーブルテキスト または ファイルパス
    const secondArg = args[1] || '';
    if (fs.existsSync(secondArg)) {
      timetableText = fs.readFileSync(path.resolve(secondArg), 'utf-8');
    } else {
      timetableText = secondArg;
    }
  }

  if (!videoId) {
    console.error('有効な YouTube Video ID が取得できませんでした。');
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`[1/4] 動画情報の取得中: ${videoId}`);
  const videoTitle = (await fetchYouTubeTitle(videoId)) || `歌枠 (${videoId})`;
  const now = new Date().toISOString();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`タイトル: ${videoTitle}`);

  // 曲情報の準備
  let songs: ParsedSong[] = customSongs;
  if (songs.length === 0 && timetableText) {
    console.log(`\n[2/4] タイムテーブルの自動パース中...`);
    songs = parseTimetable(timetableText);
    console.log(`${songs.length} 曲のタイムスタンプを検出しました。`);
  }

  if (songs.length === 0) {
    console.error('登録対象の楽曲が見つかりませんでした。');
    process.exit(1);
  }

  // 原曲長の取得と終了時刻の自動計算
  console.log(`\n[3/4] iTunes API による原曲長の取得と終了時刻の自動計算...`);
  await Promise.all(
    songs.map(async (s, i) => {
      const nextSong = songs[i + 1];
      const nextStart = nextSong ? nextSong.start : null;
      const trackDuration = await fetchTrackDuration(s.title, s.artist);

      if (trackDuration) {
        const estimatedEnd = s.start + trackDuration + 8; // アウトロバッファ8秒
        s.end = nextStart ? Math.min(estimatedEnd, nextStart) : estimatedEnd;
      } else {
        const defaultEnd = s.start + 270; // デフォルト4分30秒
        s.end = nextStart ? Math.min(defaultEnd, nextStart) : defaultEnd;
      }
    })
  );

  // データベースへの登録
  console.log(`\n[4/4] データベース (Supabase) への一括登録を実行中...`);

  // 1. video テーブル
  const videoLength = Math.max(...songs.map(s => s.end || s.start)) + 120;
  const { data: existingVideos } = await supabase.from('video').select('id').eq('video_id', videoId);

  if (!existingVideos || existingVideos.length === 0) {
    const { error: videoError } = await supabase.from('video').insert([
      {
        id: crypto.randomUUID(),
        video_id: videoId,
        title: videoTitle,
        length: videoLength,
        url: videoUrl,
        published_at: now,
        created_at: now,
        updated_at: now,
      },
    ]);
    if (videoError) throw videoError;
  }

  // 2. song & singing_stream テーブル一括登録
  let registeredCount = 0;
  for (const s of songs) {
    const songId = crypto.randomUUID();
    const { error: songError } = await supabase.from('song').insert([
      {
        id: songId,
        title: s.title,
        artist: s.artist,
        created_at: now,
        updated_at: now,
      },
    ]);
    if (songError) {
      console.error(`曲登録失敗 (${s.title}):`, songError);
      continue;
    }

    const { error: streamError } = await supabase.from('singing_stream').insert([
      {
        id: songId,
        video_id: videoId,
        start: s.start,
        end: s.end,
        published_at: now,
        created_at: now,
        updated_at: now,
      },
    ]);
    if (streamError) {
      console.error(`配信曲登録失敗 (${s.title}):`, streamError);
      continue;
    }

    registeredCount++;
    console.log(`✓ 登録: ${s.title} / ${s.artist || '不明'} (${formatTime(s.start)} - ${formatTime(s.end || 0)})`);
  }

  console.log(`\n========================================`);
  console.log(`🎉 登録完了: ${registeredCount} / ${songs.length} 曲を登録しました！`);
  console.log(`動画: [${videoId}] ${videoTitle}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('\n❌ エラーが発生しました:', err);
  process.exit(1);
});
