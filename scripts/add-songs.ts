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
 * タイムテーブル行の注記や動画出演者から、その曲の歌唱者を判定する
 */
function resolveSingers(
  note: string,
  videoSingers: string[]
): string[] {
  if (videoSingers.length <= 1) {
    return videoSingers;
  }

  // 1. デュエット・コラボ・全員合唱の表記
  if (/デュエット|コラボ|全員|合唱/i.test(note)) {
    return videoSingers;
  }

  // 2. 絵文字やライバー名によるソロ・歌唱者指定
  const matchedSingers: string[] = [];

  for (const singer of videoSingers) {
    // ライバー名そのものが含まれているか
    if (note.includes(singer) || (singer.length > 2 && note.includes(singer.slice(0, 2)))) {
      matchedSingers.push(singer);
    }
    // 絵文字マッピング
    if (singer === '戌亥とこ' && /🍹|いぬい|戌亥/.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === '長尾景' && /☯|ながお|長尾/.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === '珠乃井ナナ' && /🛼|なな|ナナ|珠乃井/.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === '立伝都々' && /とと|立伝/.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === '北見遊征' && /きたみ|北見/.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === '早乙女ベリー' && /べりー|ベリー|早乙女/.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === '渚トラウト' && /とらうと|トラウト|渚/.test(note)) {
      matchedSingers.push(singer);
    }
    // NIJISANJI EN ライバー
    if (singer === 'Elira Pendora' && /☀️|💙|Elira|エリーラ/i.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === 'Finana Ryugu' && /💚|Finana|フィナーナ/i.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === 'Enna Alouette' && /🐣|Enna|エナ/i.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === 'Millie Parfait' && /🌂|Millie|ミリー/i.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === 'Ren Zotto' && /🥽|Ren|レン/i.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === 'Reimu Endou' && /(?:❤️‍🩹|Reimu|レイム)/i.test(note)) {
      matchedSingers.push(singer);
    }
    if (singer === 'Aster Arcadia' && /🦁|Aster|アスター/i.test(note)) {
      matchedSingers.push(singer);
    }
  }

  const unique = Array.from(new Set(matchedSingers));
  if (unique.length > 0) {
    return unique;
  }

  // 注記がなく判定できない場合はコラボ枠なので全員とする
  return videoSingers;
}

/**
 * タイムテーブルテキストを行ごとにパースする
 */
function parseTimetable(text: string, videoSingers: string[] = ['戌亥とこ']): ParsedSong[] {
  const lines = text.split('\n');
  const results: ParsedSong[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // タイムスタンプの抽出 (先頭または末尾の (H:)?MM:SS)
    let timeStr = '';
    let rest = line;

    const leadingTimeMatch = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.*)$/);
    const trailingTimeMatch = line.match(/^(.*?)\s+(\d{1,2}:\d{2}(?::\d{2})?)$/);

    if (leadingTimeMatch) {
      timeStr = leadingTimeMatch[1];
      rest = leadingTimeMatch[2].trim();
    } else if (trailingTimeMatch) {
      timeStr = trailingTimeMatch[2];
      rest = trailingTimeMatch[1].trim();
    } else {
      continue;
    }

    // 全角英数記号の正規化など
    rest = rest.replace(/^[0-9０-９]+[．\.]\s*/, '').trim();

    // 歌唱でないノイズ行を除外 (OPやEDは単語・境界として判定)
    if (/^(?:声入り|開始|待機|オープニング|エンディング|雑談|挨拶|トーク|SET\s*LIST|(?:OP|ED)(?:[\s:：、\-]|$))/i.test(rest)) {
      continue;
    }

    let title = rest;
    let artist = '';
    let note = '';

    // "曲名 / アーティスト名" または "曲名 - アーティスト名" または "曲名 by アーティスト名" を分割
    const delimiterMatch =
      rest.match(/^(.*?)\s*[\/／]\s*(.*)$/) ||
      rest.match(/^(.*?)\s+[-–—]\s+(.*)$/) ||
      rest.match(/^(.*?)\s+by\s+(.*)$/i) ||
      rest.match(/^(.*?)\s*[-–—]\s*(.*)$/);
    if (delimiterMatch) {
      title = delimiterMatch[1].trim();
      artist = delimiterMatch[2].trim();
    }

    // アーティスト名または曲名末尾の注記（例: "（🍹ソロ", "（🛼ソロ", "(デュエット)", "／💚" など）を抽出
    const noteMatch =
      artist.match(/[(（]([^()（）]+)[)）]?$/) ||
      artist.match(/[\/／]\s*([\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d]+)/u) ||
      artist.match(/([\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d]+)$/u) ||
      title.match(/[(（]([^()（）]+)[)）]?$/);
    if (noteMatch) {
      note = noteMatch[1].trim();
    }

    // アーティスト名末尾の注記を除去してクリーンにする
    artist = artist.replace(/[(（][^()（）]*(?:ソロ|デュエット|コラボ|全員|合唱|🍹|🛼|☯️|☀️|💙|💚|🐣|🌂|🥽|🦁)[^()（）]*[)）]?$/gu, '').trim();
    artist = artist.replace(/[\/／]\s*[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d]+/gu, '').trim();
    artist = artist.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d]+$/gu, '').trim();
    artist = artist.replace(/[(（][^()（）]*$/g, '').trim();

    const songSingers = resolveSingers(note, videoSingers);

    if (title) {
      results.push({
        title,
        artist,
        start: parseSeconds(timeStr),
        startStr: timeStr,
        singers: songSingers,
      });
    }
  }

  return results;
}

/**
 * 動画タイトルから単曲の曲名とアーティスト名を推測
 */
function parseSongFromVideoTitle(videoTitle: string): { title: string; artist: string } {
  let clean = videoTitle.replace(/[【\[(（].*?(?:歌ってみた|MV|Music Video|Official|Cover|オリジナル|Shorts?)[)）\]】]/gi, '').trim();
  clean = clean.replace(/^[-\s/／|｜]+|[-\s/／|｜]+$/g, '').trim();

  const match = clean.match(/^(.*?)\s*[\/／|｜]\s*(.*)$/);
  if (match) {
    const p1 = match[1].trim();
    const p2 = match[2].trim();
    if (/戌亥/i.test(p2)) {
      return { title: p1, artist: p2.replace(/[[(（].*?[)）\]]/g, '').trim() || '戌亥とこ' };
    } else if (/戌亥/i.test(p1)) {
      return { title: p2, artist: p1.replace(/[[(（].*?[)）\]]/g, '').trim() || '戌亥とこ' };
    }
    return { title: p1, artist: p2 };
  }

  return { title: clean || videoTitle, artist: '戌亥とこ' };
}

/**
 * 動画タイトルから歌唱者リストを抽出・推測
 */
function extractSingersFromTitle(title: string): string[] {
  const foundSingers = new Set<string>();

  // 特別なコラボキーワードの検出
  if (/SHEESHFEESH/i.test(title)) {
    foundSingers.add('Elira Pendora');
    foundSingers.add('Finana Ryugu');
  }
  if (/EliraGotCake2025/i.test(title)) {
    foundSingers.add('Elira Pendora');
    foundSingers.add('Millie Parfait');
    foundSingers.add('Ren Zotto');
    foundSingers.add('Aster Arcadia');
  }

  const bracketMatches = title.match(/[【\[(（]([^【\[(（）)\]】]+)[)）\]】]/g) || [];

  for (const bracket of bracketMatches) {
    const inner = bracket.slice(1, -1);
    const parts = inner.split(/[\/／,、|｜]+/).map((s) => s.trim());
    for (const part of parts) {
      if (
        !part ||
        part === 'にじさんじ' ||
        part === 'NIJISANJI' ||
        part === 'NIJISANJI EN' ||
        part === '歌' ||
        part === '歌枠' ||
        part === 'コラボ歌枠' ||
        part.includes('歌枠') ||
        /KARAOKE/i.test(part) ||
        part.startsWith('#')
      ) {
        continue;
      }
      foundSingers.add(part);
    }
  }

  if (foundSingers.size > 0) {
    return Array.from(foundSingers);
  }
  return ['戌亥とこ'];
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
 * YouTube のページからタイトル、配信日時、動画長（秒）を取得
 */
async function fetchYouTubeMetadata(videoId: string): Promise<{ title: string | null; publishedAt: string | null; lengthSeconds: number | null }> {
  let title: string | null = null;
  let publishedAt: string | null = null;
  let lengthSeconds: number | null = null;

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    });
    if (res.ok) {
      const html = await res.text();
      // タイトル
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        title = titleMatch[1].replace(/\s*-\s*YouTube$/, '').trim();
      }
      // 動画の長さ（秒）
      const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
      if (lenMatch) {
        lengthSeconds = Number(lenMatch[1]);
      }
      // 配信日時
      const startMatch = html.match(/"startTimestamp":"(.*?)"/);
      const publishMatch = html.match(/"publishDate":"(.*?)"/) || html.match(/itemprop="datePublished" content="(.*?)"/);
      publishedAt = startMatch ? startMatch[1] : (publishMatch ? publishMatch[1] : null);
    }
  } catch (e) {
    // ignore
  }

  // oEmbed によるタイトルフォールバック
  if (!title) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || null;
      }
    } catch (e) {
      // ignore
    }
  }

  return { title, publishedAt, lengthSeconds };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log(`
使用方法:
  1. 通常の歌枠（URLとタイムテーブル）:
     npm run add-songs -- "<YouTube URL>" "<タイムテーブルテキスト または ファイルパス>"

  2. 単曲動画（9分未満のMVや歌ってみた）:
     npm run add-songs -- "<YouTube URL>"
     ※ URLのみ渡すと、9分未満の動画は自動的に 00:00〜末尾 の単曲として登録されます。
     ※ オプションで曲名・アーティスト名を指定可能:
        npm run add-songs -- "<YouTube URL>" --title "曲名" --artist "アーティスト名"

  3. JSONファイルから登録:
     npm run add-songs -- <JSONファイルパス>
    `);
    process.exit(1);
  }

  let videoId = '';
  let timetableText = '';
  let customSongs: ParsedSong[] = [];
  let customPublishedAt: string | undefined;
  let manualTitle: string | undefined;
  let manualArtist: string | undefined;

  // オプション解析 (--title, --artist)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      manualTitle = args[i + 1];
      i++;
    } else if (args[i] === '--artist' && args[i + 1]) {
      manualArtist = args[i + 1];
      i++;
    }
  }

  // JSONファイル直接指定の場合
  if (args.length === 1 && (args[0].endsWith('.json') || fs.existsSync(args[0]))) {
    try {
      const content = fs.readFileSync(path.resolve(args[0]), 'utf-8');
      const payload = JSON.parse(content);
      videoId = extractVideoId(payload.video?.video_id || payload.video?.url || '');
      customSongs = payload.songs || [];
      customPublishedAt = payload.video?.published_at;
    } catch (e) {
      console.error('JSON読み込みエラー:', e);
      process.exit(1);
    }
  } else {
    videoId = extractVideoId(args[0]);
    const secondArg = args[1] && !args[1].startsWith('--') ? args[1] : '';
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
  const metadata = await fetchYouTubeMetadata(videoId);
  const videoTitle = metadata.title || `動画 (${videoId})`;
  const videoDuration = metadata.lengthSeconds || 0;
  const publishedAt = customPublishedAt || metadata.publishedAt || new Date().toISOString();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`タイトル: ${videoTitle}`);
  console.log(`動画の長さ: ${formatTime(videoDuration)} (${videoDuration}秒)`);
  console.log(`配信日時: ${publishedAt}`);

  let songs: ParsedSong[] = customSongs;
  const videoSingers = extractSingersFromTitle(videoTitle);

  // タイムテーブルテキストがある場合はパース
  if (songs.length === 0 && timetableText.trim()) {
    console.log(`\n[2/4] タイムテーブルの自動パース中...`);
    songs = parseTimetable(timetableText, videoSingers);
    console.log(`${songs.length} 曲のタイムスタンプを検出しました。`);
  }

  // タイムテーブルがなく、動画の長さが 9分 (540秒) 未満の場合は「単曲動画」と自動判定
  if (songs.length === 0) {
    if (videoDuration > 0 && videoDuration < 540) {
      console.log(`\n[2/4] 判定: 再生時間が9分未満 (${formatTime(videoDuration)}) のため、単曲（MV/歌ってみた）として処理します。`);
      const parsed = parseSongFromVideoTitle(videoTitle);
      const singleTitle = manualTitle || parsed.title;
      const singleArtist = manualArtist || parsed.artist;

      songs = [
        {
          title: singleTitle,
          artist: singleArtist,
          start: 0,
          startStr: '00:00',
          end: videoDuration > 0 ? videoDuration : undefined,
          singers: videoSingers,
        },
      ];
      console.log(`単曲登録: 「${singleTitle}」/ ${singleArtist} (00:00 - ${formatTime(videoDuration)})`);
    } else {
      console.error(`\n❌ タイムテーブルが見つかりません。また動画時間が長いため単曲判定されませんでした (${formatTime(videoDuration)})。`);
      console.error(`歌枠の場合はタイムテーブルテキストを渡すか、単曲の場合は --title と --artist を指定してください。`);
      process.exit(1);
    }
  }

  // 歌枠の場合の原曲長補正（単曲でendが決まっている場合はスキップ）
  if (songs.length > 1 || songs[0].end === undefined) {
    console.log(`\n[3/4] iTunes API による原曲長の取得と終了時刻の自動計算...`);
    await Promise.all(
      songs.map(async (s, i) => {
        if (s.end !== undefined) return;
        const nextSong = songs[i + 1];
        const nextStart = nextSong ? nextSong.start : null;
        const trackDuration = await fetchTrackDuration(s.title, s.artist);

        if (trackDuration) {
          const estimatedEnd = s.start + trackDuration + 8; // アウトロ8秒
          s.end = nextStart ? Math.min(estimatedEnd, nextStart) : estimatedEnd;
        } else {
          const defaultEnd = s.start + 270;
          s.end = nextStart ? Math.min(defaultEnd, nextStart) : defaultEnd;
        }
      })
    );
  } else {
    console.log(`\n[3/4] 単曲のため終了時刻計算をスキップ (00:00 - ${formatTime(songs[0].end || 0)})`);
  }

  // データベースへの登録
  console.log(`\n[4/4] データベース (Supabase) への登録を実行中...`);

  // 1. video テーブル
  const finalVideoLength = videoDuration > 0 ? videoDuration : Math.max(...songs.map(s => s.end || s.start)) + 30;
  const { data: existingVideos } = await supabase.from('video').select('id').eq('video_id', videoId);

  if (!existingVideos || existingVideos.length === 0) {
    const { error: videoError } = await supabase.from('video').insert([
      {
        id: crypto.randomUUID(),
        video_id: videoId,
        title: videoTitle,
        length: finalVideoLength,
        url: videoUrl,
        published_at: publishedAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    if (videoError) throw videoError;
  } else {
    await supabase.from('video').update({ published_at: publishedAt, title: videoTitle, length: finalVideoLength }).eq('video_id', videoId);
  }

  // 2. song & singing_stream テーブル一括登録
  let registeredCount = 0;
  const now = new Date().toISOString();

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

    const songSingers = s.singers && s.singers.length > 0 ? s.singers : videoSingers;

    const { error: streamError } = await supabase.from('singing_stream').insert([
      {
        id: songId,
        video_id: videoId,
        start: s.start,
        end: s.end || finalVideoLength,
        published_at: publishedAt,
        singers: songSingers,
        created_at: now,
        updated_at: now,
      },
    ]);
    if (streamError) {
      console.error(`配信曲登録失敗 (${s.title}):`, streamError);
      continue;
    }

    registeredCount++;

    // Jev による自動タグ付け (TYPESAFE_API_KEY が設定されている場合)
    if (process.env.TYPESAFE_API_KEY) {
      try {
        const { TypeSafeClient, choice, noul } = await import('@typesafe-ai/sdk');
        const jev = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });
        const response = await jev.systemOne({
          state: {
            song_title: s.title,
            artist: s.artist || '',
          },
          questions: {
            mood: choice('この楽曲の全体的な雰囲気・ムードに最も近いものはどれですか？', {
              ballad: 'しっとり・バラード・静か・落ち着いた雰囲気（夜に聴きたい）',
              emotional: 'エモい・切ない・ドラマチック・心に深く響く',
              cool: 'クール・かっこいい・力強い・ロック・スタイリッシュ',
              bright: '明るい・ポップ・楽しい・前向き・テンションが上がる',
              jazz_rnb: 'おしゃれ・大人・ジャジー・グルーヴィー',
            }),
            genre: choice('この楽曲が最も認知されているカテゴリ・ジャンルはどれですか？', {
              vocaloid: 'ボカロ曲（VOCALOID・音声合成ソフト歌唱曲、またはツミキ/ナユタン星人等のボカロP制作楽曲）',
              anime: 'アニソン（テレビアニメ主題歌・劇場版映画主題歌・アニソンタイアップ曲）',
              jpop: 'J-POP / J-ROCK / 邦楽アーティスト一般',
              nostalgic: '歌謡曲 / シティポップ / 昭和・平成レトロ名曲',
              vtuber: 'VTuberオリジナルソング / にじさんじ等のバーチャルシンガー楽曲',
            }),
            night_pick: noul('夜や深夜に静かにリラックスして聴くのに特に適した楽曲ですか？'),
          },
        });

        const { answers } = response;
        await supabase.from('song_metadata').upsert({
          song_id: songId,
          mood: answers.mood.choice,
          genre: answers.genre.choice,
          is_night_pick: answers.night_pick.noul >= 0.5,
          confidence_mood: answers.mood.confidence,
          confidence_genre: answers.genre.confidence,
          prob_night_pick: answers.night_pick.noul,
          raw_jev_data: answers,
          updated_at: new Date().toISOString(),
        });
        console.log(`  🏷️  Jev 自動タグ付け完了: ${answers.mood.choice} / ${answers.genre.choice}`);
      } catch (tagErr: any) {
        console.warn(`  ⚠️ Jev タグ付けスキップ (${s.title}):`, tagErr.message);
      }
    }
    console.log(`✓ 登録: ${s.title} / ${s.artist || '不明'} (${formatTime(s.start)} - ${formatTime(s.end || 0)})`);
  }

  console.log(`\n========================================`);
  console.log(`🎉 登録完了: ${registeredCount} / ${songs.length} 曲を登録しました！`);
  console.log(`動画: [${videoId}] ${videoTitle}`);
  console.log(`配信日時: ${publishedAt}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('\n❌ エラーが発生しました:', err);
  process.exit(1);
});
