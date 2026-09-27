import crypto from 'crypto';
import { supabase } from '../utils/supabaseClient';

interface SingleSongDef {
  videoId: string;
  title: string;
  artist: string;
  singers: string[];
}

const SINGLE_SONGS: SingleSongDef[] = [
  { videoId: 'qX9-vM-Vhmk', title: 'Broken', artist: '戌亥とこ', singers: ['戌亥とこ'] },
  { videoId: '7jZPj94UWzs', title: 'flos', artist: 'R Sound Design', singers: ['戌亥とこ', '天宮こころ'] },
  { videoId: 'D9f7hePtEio', title: '小悪魔だってかまわない!', artist: 'めいちゃん', singers: ['戌亥とこ', 'アンジュ・カトリーナ', 'リゼ・ヘルエスタ'] },
  { videoId: 't7HlVWkKnWI', title: 'Gimme×Gimme', artist: '八王子P × Giga', singers: ['戌亥とこ', '珠乃井ナナ'] },
  { videoId: '66sT_6P9P_8', title: 'JANE DOE', artist: '米津玄師, 宇多田ヒカル', singers: ['戌亥とこ', '宇佐美リト'] },
  { videoId: '2NiaHtal5t4', title: 'Summer and Peace!', artist: 'にじさんじ', singers: ['戌亥とこ', '町田ちま'] },
  { videoId: 'tar5SFOS9vM', title: '唄を教えてくれたあなたへ', artist: 'ミセカイ', singers: ['戌亥とこ', '町田ちま'] },
  { videoId: 'bLpae3ueW1U', title: '花占い', artist: 'Vaundy', singers: ['戌亥とこ', '榊ネス'] },
  { videoId: 'VFpUlMEXBKI', title: 'アイ', artist: '秦 基博', singers: ['戌亥とこ'] },
  { videoId: 'AzuGTbbDQB4', title: 'お願いマッスル', artist: '紗倉ひびき(ファイルーズあい)&街雄鳴造(石川界人)', singers: ['戌亥とこ', '町田ちま'] },
  { videoId: 'ampPAff8BmA', title: '東京流星群', artist: 'SUPER BEAVER', singers: ['戌亥とこ'] },
  { videoId: 'v3EC-kRIphg', title: '旅路', artist: '藤井 風', singers: ['戌亥とこ'] },
  { videoId: 'BsnSQLoe5KE', title: 'トレモロ降る夜', artist: '秦 基博', singers: ['戌亥とこ'] },
  { videoId: 'KxgQapYwojg', title: 'ハートにドン', artist: '戌亥とこ', singers: ['戌亥とこ'] },
  { videoId: 'tum-7yi8qJ8', title: 'Hello', artist: '戌亥とこ', singers: ['戌亥とこ'] },
  { videoId: 'OarzCYSujBs', title: 'Ever', artist: 'GACKT', singers: ['戌亥とこ', '渡会雲雀'] },
  { videoId: 'jAn_GIQln9k', title: '晴る', artist: 'ヨルシカ', singers: ['戌亥とこ'] },
  { videoId: 'qbbIeBnozL0', title: 'らしさ', artist: 'SUPER BEAVER', singers: ['戌亥とこ'] },
  { videoId: 'Dhtaq4tfdpA', title: 'ダーリン', artist: '須田景凪', singers: ['戌亥とこ'] },
  { videoId: 'z7NrcTD0lb8', title: '傾奇浄瑠璃', artist: '戌亥とこ', singers: ['戌亥とこ'] },
  { videoId: 'aTkPHMixt4k', title: '絶え間なく藍色', artist: '獅子志司', singers: ['戌亥とこ'] },
  { videoId: 'ReIaGLXXSCI', title: 'Twilight Road', artist: '戌亥とこ', singers: ['戌亥とこ'] },
  { videoId: 'JRYdJA-QsVI', title: '六道伍感さんぽ', artist: '戌亥とこ', singers: ['戌亥とこ'] },
  { videoId: '_9dvHL1njz8', title: 'ワールド・ランプシェード', artist: 'buzzG', singers: ['戌亥とこ', '渡会雲雀'] },
  { videoId: 'QQLecSzU0h4', title: 'RUMOR', artist: 'ポリスピカデリー', singers: ['戌亥とこ'] },
  { videoId: '86jv7aZmm5c', title: 'テレスコープ', artist: '戌亥とこ', singers: ['戌亥とこ'] },
];

async function fetchVideoMeta(videoId: string) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9',
    },
  });

  const html = await res.text();
  let title = '不明な動画';
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    title = titleMatch[1].replace(' - YouTube', '').trim();
  }

  let publishedAt: string | null = null;
  const dateMatch = html.match(/itemprop="datePublished" content="(.*?)"/) || html.match(/"publishDate":"(.*?)"/);
  if (dateMatch) {
    publishedAt = dateMatch[1];
  }

  let lengthSeconds = 0;
  const lenMatch = html.match(/"approxDurationMs":"(\d+)"/) || html.match(/"lengthSeconds":"(\d+)"/);
  if (lenMatch) {
    lengthSeconds = lenMatch[0].includes('approxDurationMs')
      ? Math.round(Number(lenMatch[1]) / 1000)
      : Number(lenMatch[1]);
  }

  return { title, publishedAt, lengthSeconds };
}

async function main() {
  console.log(`戌亥とこの単発歌唱動画（計 ${SINGLE_SONGS.length} 曲）の登録を開始します...\n`);

  let successCount = 0;

  for (let i = 0; i < SINGLE_SONGS.length; i++) {
    const item = SINGLE_SONGS[i];
    console.log(`[${i + 1}/${SINGLE_SONGS.length}] 登録中: ${item.title} / ${item.artist} (${item.videoId})...`);

    // すでに登録済みか確認
    const { data: existingStream } = await supabase
      .from('singing_stream')
      .select('id')
      .eq('video_id', item.videoId)
      .maybeSingle();

    if (existingStream) {
      console.log(`  ↪ 既に登録済みのためスキップ (ID: ${existingStream.id})`);
      successCount++;
      continue;
    }

    // YouTubeメタデータを取得
    const meta = await fetchVideoMeta(item.videoId);
    const videoUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
    const now = new Date().toISOString();
    const finalPublishedAt = meta.publishedAt || now;

    // 1. video レコードの確認または作成
    const { data: existingVideo } = await supabase
      .from('video')
      .select('id')
      .eq('video_id', item.videoId)
      .maybeSingle();

    let videoDbId = existingVideo?.id;
    if (!videoDbId) {
      videoDbId = crypto.randomUUID();
      const { error: videoError } = await supabase.from('video').insert([
        {
          id: videoDbId,
          video_id: item.videoId,
          title: meta.title,
          url: videoUrl,
          length: meta.lengthSeconds || 300,
          published_at: finalPublishedAt,
          created_at: now,
          updated_at: now,
        },
      ]);

      if (videoError) {
        console.error(`  ❌ video登録エラー (${item.videoId}):`, videoError);
        continue;
      }
    }

    // 2. song レコードの作成
    const songId = crypto.randomUUID();
    const { error: songError } = await supabase.from('song').insert([
      {
        id: songId,
        title: item.title,
        artist: item.artist,
        created_at: now,
        updated_at: now,
      },
    ]);

    if (songError) {
      console.error(`  ❌ song登録エラー (${item.title}):`, songError);
      continue;
    }

    // 3. singing_stream レコードの作成 (0秒〜動画末尾)
    const { error: streamError } = await supabase.from('singing_stream').insert([
      {
        id: songId,
        video_id: item.videoId,
        start: 0,
        end: meta.lengthSeconds || 300,
        published_at: finalPublishedAt,
        singers: item.singers,
        created_at: now,
        updated_at: now,
      },
    ]);

    if (streamError) {
      console.error(`  ❌ singing_stream登録エラー (${item.title}):`, streamError);
      continue;
    }

    console.log(`  ✓ 登録成功: ${item.title} / ${item.artist} [歌唱: ${item.singers.join(', ')}] (長さ: ${meta.lengthSeconds}秒)`);
    successCount++;
  }

  console.log(`\n========================================`);
  console.log(`🎉 登録完了: ${successCount} / ${SINGLE_SONGS.length} 件`);
  console.log(`========================================`);
}

main().catch(console.error);
