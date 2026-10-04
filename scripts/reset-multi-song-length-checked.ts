import './load-env';
import { supabase } from '../utils/supabaseClient';

async function main() {
  console.log('🔄 1動画複数曲の is_length_checked を false にリセットします...');

  // 1. 全レコードを取得
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

  // 2. video_id の出現回数をカウント
  const videoCounts = new Map<string, number>();
  for (const s of allStreams) {
    videoCounts.set(s.video_id, (videoCounts.get(s.video_id) || 0) + 1);
  }

  // 3. 1動画複数曲かつ is_length_checked === true のレコードを抽出
  const targetsToReset = allStreams.filter(
    (s) => (videoCounts.get(s.video_id) || 0) > 1 && s.is_length_checked === true
  );

  console.log(`リセット対象件数: ${targetsToReset.length} 件`);

  if (targetsToReset.length === 0) {
    console.log('リセット対象はありません。');
    return;
  }

  // 4. バッチで更新（100件ずつ）
  const batchSize = 100;
  let updatedCount = 0;

  for (let i = 0; i < targetsToReset.length; i += batchSize) {
    const chunk = targetsToReset.slice(i, i + batchSize);
    const ids = chunk.map((c) => c.id);

    const { error: updateError } = await supabase
      .from('singing_stream')
      .update({
        is_length_checked: false,
        length_checked_at: null,
      })
      .in('id', ids);

    if (updateError) {
      console.error(`バッチ更新エラー (${i}〜${i + chunk.length}):`, updateError);
      process.exit(1);
    }

    updatedCount += chunk.length;
    console.log(`更新完了: ${updatedCount} / ${targetsToReset.length} 件`);
  }

  console.log('✅ リセット完了しました！');
}

main().catch(console.error);
