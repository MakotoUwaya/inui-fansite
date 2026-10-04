import './load-env';
import * as fs from 'fs';
import { supabase } from '../utils/supabaseClient';
import { detectSongBoundariesWithGemini } from '../utils/geminiSongLengthDetector';

/**
 * 秒数を MM:SS または HH:MM:SS 形式に変換
 */
function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 時間文字列 (秒数 or MM:SS or HH:MM:SS) を秒数にパース
 */
function parseTimeString(timeStr: string): number {
  const trimmed = timeStr.trim();
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) {
    throw new Error(`無効な時間フォーマットです: ${timeStr}`);
  }
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  throw new Error(`無効な時間フォーマットです: ${timeStr}`);
}

type SongRecord = {
  id: string;
  start: number;
  end: number | null;
  video_id: string;
  published_at: string;
  is_length_checked: boolean;
  length_checked_at: string | null;
  song: {
    title: string;
    artist: string;
  } | null;
  video: {
    title: string;
    url: string;
  } | null;
};

// ヘルプ表示
function printHelp() {
  console.log(`
🎵 曲の長さチェック・修正ツール (check-song-length)

使い方:
  pnpm exec tsx scripts/check-song-length.ts [コマンド / オプション]

コマンド / オプション:
  --stats                       全体の集計（5分以上の曲数、チェック済み数など）を表示
  --list                        5分以上かつ未チェックの曲を一覧表示
    --threshold <秒数|MM:SS>     対象とする最小の曲長（デフォルト: 300秒 = 5分）
    --limit <件数>               取得件数（デフォルト: 20）
    --order <desc|asc>          長さ順（デフォルト: desc）
    --video-id <videoId>        特定の動画IDに絞り込み
    --all                       チェック済みも含めて表示
  --update <id> --end <秒|MM:SS> 指定した曲の終了時刻を更新し、チェック済みにする
  --mark-ok <id>                指定した曲の長さを変更せず、確認済みにする
  --auto-check                  Gemini / iTunes による歌唱区間自動判定・雑談カットを実行
    --video-id <videoId>        特定の動画内の曲のみ自動チェック
    --limit <件数>               処理件数の上限
  --batch <jsonまたはファイルパス> 複数曲を一括更新
                                JSON形式: [{"id": "...", "end": 240}, {"id": "...", "markOk": true}]
  --help                        このヘルプを表示

例:
  pnpm exec tsx scripts/check-song-length.ts --stats
  pnpm exec tsx scripts/check-song-length.ts --list --limit 10
  pnpm exec tsx scripts/check-song-length.ts --update e5d73... --end 4:15
  pnpm exec tsx scripts/check-song-length.ts --mark-ok e5d73...
`);
}

async function showStats() {
  console.log('📊 曲の長さチェック進捗を集計中...');

  let allData: { id: string; start: number; end: number | null; is_length_checked: boolean }[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('singing_stream')
      .select('id, start, end, is_length_checked')
      .range(from, from + pageSize - 1);

    if (error || !data) {
      console.error('❌ 集計データの取得に失敗しました:', error);
      process.exit(1);
    }

    allData = allData.concat(data);
    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  const total = allData.length;
  let over5Min = 0;
  let over10Min = 0;
  let checkedCount = 0;
  let uncheckedOver5Min = 0;
  let uncheckedOver10Min = 0;

  for (const item of allData) {
    const end = item.end ?? item.start;
    const duration = end - item.start;
    const isChecked = item.is_length_checked;

    if (isChecked) {
      checkedCount++;
    }

    if (duration >= 300) {
      over5Min++;
      if (!isChecked) uncheckedOver5Min++;
    }
    if (duration >= 600) {
      over10Min++;
      if (!isChecked) uncheckedOver10Min++;
    }
  }

  console.log(`
=========================================
 📈 曲の長さチェック 集計レポート
=========================================
 全登録曲数:             ${total} 曲
 チェック済み曲数:       ${checkedCount} 曲 (${((checkedCount / total) * 100).toFixed(1)}%)
 未チェック曲数:         ${total - checkedCount} 曲

 [5分以上（300秒〜）の長尺曲]
   合計:                 ${over5Min} 曲
   うち未チェック:       ${uncheckedOver5Min} 曲
   うちチェック済み:     ${over5Min - uncheckedOver5Min} 曲

 [10分以上（600秒〜）の極長曲]
   合計:                 ${over10Min} 曲
   うち未チェック:       ${uncheckedOver10Min} 曲
=========================================
`);
}

async function listSongs(args: string[]) {
  let threshold = 300; // 5分
  let limit = 20;
  let orderDesc = true;
  let videoIdFilter: string | null = null;
  let includeAll = false;

  const thresholdIdx = args.indexOf('--threshold');
  if (thresholdIdx !== -1 && args[thresholdIdx + 1]) {
    threshold = parseTimeString(args[thresholdIdx + 1]);
  }

  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }

  const orderIdx = args.indexOf('--order');
  if (orderIdx !== -1 && args[orderIdx + 1]) {
    orderDesc = args[orderIdx + 1].toLowerCase() !== 'asc';
  }

  const videoIdIdx = args.indexOf('--video-id');
  if (videoIdIdx !== -1 && args[videoIdIdx + 1]) {
    videoIdFilter = args[videoIdIdx + 1];
  }

  includeAll = args.includes('--all');

  console.log(`🔍 検索条件: 長さ >= ${formatTime(threshold)} (${threshold}秒) / 未チェック: ${includeAll ? '全て' : '未チェックのみ'} / 最大 ${limit} 件`);

  let allData: SongRecord[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase
      .from('singing_stream')
      .select(`
        id,
        start,
        end,
        video_id,
        published_at,
        is_length_checked,
        length_checked_at,
        song(title, artist),
        video!video_id(title, url)
      `)
      .range(from, from + pageSize - 1);

    if (!includeAll) {
      query = query.eq('is_length_checked', false);
    }

    if (videoIdFilter) {
      query = query.eq('video_id', videoIdFilter);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('❌ データ取得に失敗しました:', error);
      process.exit(1);
    }

    allData = allData.concat(data as unknown as SongRecord[]);
    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  // クライアント側で長さの計算とフィルタリング・ソートを行う
  // （Supabase の REST API では (end - start) による直接の where/order が難しいため）
  const records = allData
    .map((r) => {
      const end = r.end ?? r.start;
      const duration = end - r.start;
      return { ...r, duration };
    })
    .filter((r) => r.duration >= threshold)
    .sort((a, b) => (orderDesc ? b.duration - a.duration : a.duration - b.duration))
    .slice(0, limit);

  if (records.length === 0) {
    console.log('\n✨ 条件に該当する楽曲はありませんでした。');
    return;
  }

  console.log(`\n📋 該当楽曲: ${records.length} 件 (上位 ${limit} 件を表示)\n`);

  records.forEach((r, idx) => {
    const songTitle = r.song?.title || '（曲名不明）';
    const artist = r.song?.artist || '（アーティスト不明）';
    const videoTitle = r.video?.title || '（動画タイトル不明）';
    const playUrl = `https://youtu.be/${r.video_id}?t=${r.start}`;
    const endSec = r.end ?? r.start;
    const endNearUrl = `https://youtu.be/${r.video_id}?t=${Math.max(r.start, endSec - 15)}`;

    console.log(`[#${idx + 1}] ID: ${r.id}`);
    console.log(`    曲名:       ${songTitle} / ${artist}`);
    console.log(`    長さ:       ${formatTime(r.duration)} (${r.duration}秒) [${formatTime(r.start)} (${r.start}s) 〜 ${formatTime(endSec)} (${endSec}s)]`);
    console.log(`    動画:       ${videoTitle} (ID: ${r.video_id})`);
    console.log(`    再生リンク: 開始: ${playUrl}`);
    console.log(`                終了直前(-15s): ${endNearUrl}`);
    console.log(`    状態:       ${r.is_length_checked ? '✅ 確認済み' : '⚠️ 未確認'}`);
    console.log('------------------------------------------------------------');
  });

  console.log(`\n💡 修正方法の例:`);
  console.log(`  終了時刻を修正: pnpm exec tsx scripts/check-song-length.ts --update ${records[0].id} --end 4:15`);
  console.log(`  長さは正しいと承認: pnpm exec tsx scripts/check-song-length.ts --mark-ok ${records[0].id}`);
}

async function updateSong(id: string, endTimeStr: string) {
  let endSeconds: number;
  try {
    endSeconds = parseTimeString(endTimeStr);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ ${message}`);
    process.exit(1);
  }

  // 現行レコードを取得
  const { data: current, error: getError } = await supabase
    .from('singing_stream')
    .select('id, start, end, song(title, artist)')
    .eq('id', id)
    .single();

  if (getError || !current) {
    console.error(`❌ ID: ${id} の楽曲が見つかりませんでした:`, getError);
    process.exit(1);
  }

  const currentRecord = current as unknown as SongRecord;
  if (endSeconds <= currentRecord.start) {
    console.error(`❌ 終了時刻 (${formatTime(endSeconds)}) が開始時刻 (${formatTime(currentRecord.start)}) 以下です。`);
    process.exit(1);
  }

  const oldDuration = (currentRecord.end ?? currentRecord.start) - currentRecord.start;
  const newDuration = endSeconds - currentRecord.start;

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('singing_stream')
    .update({
      end: endSeconds,
      is_length_checked: true,
      length_checked_at: now,
      updated_at: now,
    })
    .eq('id', id);

  if (updateError) {
    console.error(`❌ 更新に失敗しました:`, updateError);
    process.exit(1);
  }

  const title = currentRecord.song?.title || '不明';
  const artist = currentRecord.song?.artist || '不明';

  console.log(`✅ 終了時刻を更新しました！`);
  console.log(`   曲名: ${title} / ${artist} (ID: ${id})`);
  console.log(`   旧: ${formatTime(currentRecord.end ?? 0)} (${formatTime(oldDuration)}) -> 新: ${formatTime(endSeconds)} (${formatTime(newDuration)})`);
}

async function markSongOk(id: string) {
  // 現行レコードを取得
  const { data: current, error: getError } = await supabase
    .from('singing_stream')
    .select('id, start, end, song(title, artist)')
    .eq('id', id)
    .single();

  if (getError || !current) {
    console.error(`❌ ID: ${id} の楽曲が見つかりませんでした:`, getError);
    process.exit(1);
  }

  const currentRecord = current as unknown as SongRecord;
  const duration = (currentRecord.end ?? currentRecord.start) - currentRecord.start;

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('singing_stream')
    .update({
      is_length_checked: true,
      length_checked_at: now,
      updated_at: now,
    })
    .eq('id', id);

  if (updateError) {
    console.error(`❌ 確認済みへの更新に失敗しました:`, updateError);
    process.exit(1);
  }

  const title = currentRecord.song?.title || '不明';
  const artist = currentRecord.song?.artist || '不明';

  console.log(`✅ 確認済みに設定しました（長さは変更なし）:`);
  console.log(`   曲名: ${title} / ${artist} (ID: ${id})`);
  console.log(`   長さ: ${formatTime(duration)} (${duration}秒)`);
}

type BatchItem = {
  id: string;
  end?: number | string;
  markOk?: boolean;
};

async function batchUpdate(jsonOrPath: string) {
  let content = jsonOrPath.trim();
  if (fs.existsSync(content)) {
    content = fs.readFileSync(content, 'utf-8');
  }

  let items: BatchItem[];
  try {
    items = JSON.parse(content);
  } catch (err) {
    console.error('❌ JSONのパースに失敗しました:', err);
    process.exit(1);
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.error('❌ 一括更新のデータは1件以上の配列である必要があります。');
    process.exit(1);
  }

  console.log(`🚀 ${items.length} 件の一括処理を開始します...`);

  let successCount = 0;
  let failCount = 0;

  for (const item of items) {
    try {
      if (item.markOk) {
        await markSongOk(item.id);
        successCount++;
      } else if (item.end !== undefined) {
        await updateSong(item.id, item.end.toString());
        successCount++;
      } else {
        console.warn(`⚠️ スキップ (end または markOk がありません): ${item.id}`);
        failCount++;
      }
    } catch (err) {
      console.error(`❌ 失敗 ID: ${item.id}`, err);
      failCount++;
    }
  }

  console.log(`\n🎉 一括処理完了: 成功 ${successCount} 件 / 失敗 ${failCount} 件`);
}

async function fetchTrackDuration(title: string, artist: string): Promise<number | null> {
  const cleanTitle = title
    .replace(/[\(（].*?[\)）]/g, '')
    .replace(/[【\[].*?[】\]]/g, '')
    .trim();
  const cleanArtist = artist
    .replace(/[\(（].*?[\)）]/g, '')
    .replace(/[【\[].*?[】\]]/g, '')
    .trim();

  // 1. アーティスト + タイトルで検索
  try {
    const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&country=JP&entity=song&limit=3`);
    if (res.ok) {
      const data: any = await res.json();
      if (data.results && data.results.length > 0) {
        return Math.round(data.results[0].trackTimeMillis / 1000);
      }
    }
  } catch {}

  // 2. タイトルのみで検索
  try {
    const query = encodeURIComponent(cleanTitle);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&country=JP&entity=song&limit=3`);
    if (res.ok) {
      const data: any = await res.json();
      if (data.results && data.results.length > 0) {
        return Math.round(data.results[0].trackTimeMillis / 1000);
      }
    }
  } catch {}

  return null;
}

export async function autoCheckVideo(videoId: string) {
  // 新規登録動画内の曲は、曲長に関わらず全曲 Gemini による歌唱区間判定を行う
  return autoCheckAll(['--video-id', videoId, '--threshold', '0']);
}

export async function autoCheckAll(args: string[] = []) {
  const thresholdIdx = args.indexOf('--threshold');
  const threshold = thresholdIdx !== -1 ? parseTimeString(args[thresholdIdx + 1]) : 300;
  const limitIdx = args.indexOf('--limit');
  const limitCount = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const videoIdIdx = args.indexOf('--video-id');
  const videoIdFilter = videoIdIdx !== -1 ? args[videoIdIdx + 1] : undefined;

  console.log(`🤖 Gemini / 自動判定による歌唱区間・雑談カットチェックを開始します...`);
  console.log(`⏱️ 対象最小尺: ${threshold === 0 ? '全曲（新規登録動画モード）' : `${formatTime(threshold)} 以上`}`);
  if (videoIdFilter) console.log(`🎬 対象動画: ${videoIdFilter}`);
  if (limitCount) console.log(`⚡ --limit モード: 最大 ${limitCount} 件を処理します。`);

  // 1. 全対象曲を取得
  let allData: SongRecord[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase
      .from('singing_stream')
      .select(`
        id,
        start,
        end,
        video_id,
        published_at,
        is_length_checked,
        length_checked_at,
        song(title, artist),
        video!video_id(title, url)
      `)
      .eq('is_length_checked', false)
      .range(from, from + pageSize - 1);

    if (videoIdFilter) {
      query = query.eq('video_id', videoIdFilter);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('❌ データ取得に失敗しました:', error);
      process.exit(1);
    }

    allData = allData.concat(data as unknown as SongRecord[]);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // 5分以上の曲に絞り込み、長い順にソート
  const targetSongs = allData
    .map((r) => {
      const end = r.end ?? r.start;
      const duration = end - r.start;
      return { ...r, duration };
    })
    .filter((r) => r.duration >= threshold)
    .sort((a, b) => b.duration - a.duration);

  console.log(`📋 チェック対象: ${targetSongs.length} 曲\n`);

  let updatedCount = 0;
  let okCount = 0;
  let processed = 0;

  for (let i = 0; i < targetSongs.length; i++) {
    if (limitCount && processed >= limitCount) {
      console.log(`\n🛑 上限 ${limitCount} 件に達したため終了します。`);
      break;
    }

    const item = targetSongs[i];
    const indexStr = `[${i + 1}/${targetSongs.length}]`;
    const title = item.song?.title || '不明';
    const artist = item.song?.artist || '不明';

    console.log(`${indexStr} 🔍 調査中: 「${title}」 / ${artist} (現: ${formatTime(item.start)}〜${formatTime(item.end ?? item.start)})`);

    const result = await detectSongBoundariesWithGemini({
      videoId: item.video_id,
      title,
      artist,
      initialStart: item.start,
      initialEnd: item.end,
    });

    const now = new Date().toISOString();
    const hasDiff = result.start !== item.start || result.end !== item.end;

    await supabase
      .from('singing_stream')
      .update({
        start: result.start,
        end: result.end,
        is_length_checked: true,
        length_checked_at: now,
        updated_at: now,
      })
      .eq('id', item.id);

    if (hasDiff) {
      console.log(`  ✂️ 自動補正 [${result.method}]: ${formatTime(item.start)}〜${formatTime(item.end ?? 0)} -> ${formatTime(result.start)}〜${formatTime(result.end)} (${result.reason})`);
      updatedCount++;
    } else {
      console.log(`  ✅ 妥当承認 [${result.method}]: ${formatTime(result.start)}〜${formatTime(result.end)} (${result.reason})`);
      okCount++;
    }

    processed++;
    // レートリミット配慮
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n=======================================');
  console.log(`🎉 自動チェック完了:`);
  console.log(`  - 雑談カット修正: ${updatedCount} 曲`);
  console.log(`  - 正常確認済み  : ${okCount} 曲`);
  console.log(`  - 処理合計      : ${processed} 曲`);
  console.log('=======================================');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--stats')) {
    await showStats();
    return;
  }

  if (args.includes('--list')) {
    await listSongs(args);
    return;
  }

  if (args.includes('--auto-check')) {
    await autoCheckAll(args);
    return;
  }

  const updateIdx = args.indexOf('--update');
  if (updateIdx !== -1) {
    const id = args[updateIdx + 1];
    const endIdx = args.indexOf('--end');
    if (!id || endIdx === -1 || !args[endIdx + 1]) {
      console.error('❌ --update には曲の ID と --end <秒|MM:SS> が必要です。');
      process.exit(1);
    }
    await updateSong(id, args[endIdx + 1]);
    return;
  }

  const markOkIdx = args.indexOf('--mark-ok');
  if (markOkIdx !== -1) {
    const id = args[markOkIdx + 1];
    if (!id) {
      console.error('❌ --mark-ok には曲の ID が必要です。');
      process.exit(1);
    }
    await markSongOk(id);
    return;
  }

  const batchIdx = args.indexOf('--batch');
  if (batchIdx !== -1) {
    const payload = args[batchIdx + 1];
    if (!payload) {
      console.error('❌ --batch には JSON 文字列または JSON ファイルパスが必要です。');
      process.exit(1);
    }
    await batchUpdate(payload);
    return;
  }

  console.error('❌ 不明なオプションです。--help を参照してください。');
  process.exit(1);
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('check-song-length.ts')) {

  main().catch((err) => {
    console.error('予期せぬエラーが発生しました:', err);
    process.exit(1);
  });
}

