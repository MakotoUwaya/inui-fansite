import './load-env';
import { supabase } from '../utils/supabaseClient';

async function main() {
  console.log('🔍 singing_stream の集計中...');

  let allStreams: { id: string; video_id: string; is_length_checked: boolean }[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('singing_stream')
      .select('id, video_id, is_length_checked')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('データ取得エラー:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allStreams = allStreams.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // video_id ごとにグループ化
  const videoCounts = new Map<string, number>();
  for (const s of allStreams) {
    videoCounts.set(s.video_id, (videoCounts.get(s.video_id) || 0) + 1);
  }

  const singleSongStreams = allStreams.filter((s) => videoCounts.get(s.video_id) === 1);
  const multiSongStreams = allStreams.filter((s) => (videoCounts.get(s.video_id) || 0) > 1);

  console.log(`\n=========================================`);
  console.log(`📊 集計結果`);
  console.log(`=========================================`);
  console.log(`総レコード数:              ${allStreams.length} 件`);
  console.log(`ユニーク動画数:            ${videoCounts.size} 件`);
  console.log(`1動画1曲（単曲/MV）の曲数: ${singleSongStreams.length} 件`);
  console.log(`  - うちチェック済み:      ${singleSongStreams.filter((s) => s.is_length_checked).length} 件`);
  console.log(`  - うち未チェック:        ${singleSongStreams.filter((s) => !s.is_length_checked).length} 件`);
  console.log(`1動画複数曲（歌枠等）の曲数: ${multiSongStreams.length} 件`);
  console.log(`  - うちチェック済み:      ${multiSongStreams.filter((s) => s.is_length_checked).length} 件`);
  console.log(`  - うち未チェック:        ${multiSongStreams.filter((s) => !s.is_length_checked).length} 件`);
  console.log(`=========================================\n`);
}

main().catch(console.error);
