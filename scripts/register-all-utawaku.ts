import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ParsedSong {
  title: string;
  artist: string;
  start: number;
  end: number;
}

interface ParsedStream {
  videoId: string;
  videoTitle: string;
  publishedAt: string;
  videoLength: number;
  singers: string[];
  songs: ParsedSong[];
}

async function registerAllStreams() {
  const streams: ParsedStream[] = JSON.parse(
    fs.readFileSync('scripts/parsed-utawaku-streams-refined.json', 'utf8')
  );

  console.log(`全 ${streams.length} 配信の一括登録を開始します...`);

  // 1. 既存の singing_stream を取得して重複チェック用 Set を構築
  const { data: existingStreams, error: streamFetchError } = await supabase
    .from('singing_stream')
    .select('video_id, start');

  if (streamFetchError) {
    console.error('既存 singing_stream 取得エラー:', streamFetchError);
    return;
  }

  const existingSet = new Set(
    (existingStreams || []).map(s => `${s.video_id}_${s.start}`)
  );
  console.log(`DB内の既存 (video_id, start) レコード数: ${existingSet.size}`);

  let totalSongsRegistered = 0;
  let totalStreamsProcessed = 0;

  const now = new Date().toISOString();

  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    if (!stream.videoId) continue;

    const url = `https://www.youtube.com/watch?v=${stream.videoId}`;

    // A. video レコードの確保 (既存チェック)
    const { data: existingVideo } = await supabase
      .from('video')
      .select('id')
      .eq('video_id', stream.videoId)
      .maybeSingle();

    let videoPkId = existingVideo?.id;

    if (!videoPkId) {
      videoPkId = crypto.randomUUID();
      const { error: videoError } = await supabase.from('video').insert({
        id: videoPkId,
        video_id: stream.videoId,
        title: stream.videoTitle,
        url: url,
        length: stream.videoLength || 3600,
        published_at: stream.publishedAt || now,
        created_at: now,
        updated_at: now,
      });

      if (videoError) {
        console.error(`  ✗ video 登録エラー [${stream.videoId}]:`, videoError);
        continue;
      }
    }

    // B. 各楽曲の登録
    let streamSongCount = 0;
    for (const song of stream.songs) {
      const key = `${stream.videoId}_${song.start}`;
      if (existingSet.has(key)) {
        // すでに登録済み
        continue;
      }

      const songId = crypto.randomUUID();

      // song テーブル
      const { error: songError } = await supabase.from('song').insert({
        id: songId,
        title: song.title,
        artist: song.artist,
        created_at: now,
        updated_at: now,
      });

      if (songError) {
        console.error(`    ✗ song 登録エラー (${song.title}):`, songError);
        continue;
      }

      // singing_stream テーブル
      const { error: streamError } = await supabase.from('singing_stream').insert({
        id: songId,
        video_id: stream.videoId,
        start: song.start,
        end: song.end,
        published_at: stream.publishedAt || now,
        singers: stream.singers,
        created_at: now,
        updated_at: now,
      });

      if (streamError) {
        console.error(`    ✗ singing_stream 登録エラー (${song.title}):`, streamError);
        continue;
      }

      existingSet.add(key);
      streamSongCount++;
      totalSongsRegistered++;
    }

    totalStreamsProcessed++;
    console.log(`[${i + 1}/${streams.length}] ✓ [${stream.videoId}] 新規登録: ${streamSongCount}曲 / 全${stream.songs.length}曲 (${stream.videoTitle.slice(0, 25)}...)`);
  }

  console.log(`\n========================================`);
  console.log(`🎉 登録完了: 処理配信数 ${totalStreamsProcessed} 本, 新規追加曲数 ${totalSongsRegistered} 曲`);
  console.log(`========================================\n`);
}

registerAllStreams().catch(console.error);
