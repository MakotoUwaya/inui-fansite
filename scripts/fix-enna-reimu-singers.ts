import { supabase } from '../utils/supabaseClient';

async function main() {
  console.log('Enna Alouette と Reimu Endou の歌唱者タグ修正を開始します...');

  // Enna Alouette または Reimu Endou を含むレコードを取得
  const { data, error } = await supabase
    .from('singing_stream')
    .select('id, start, video_id, singers, song(title, artist)')
    .or('singers.cs.{"Enna Alouette"},singers.cs.{"Reimu Endou"}');

  if (error) {
    console.error('データ取得エラー:', error);
    process.exit(1);
  }

  console.log(`対象レコード件数: ${data.length} 件`);

  for (const record of data) {
    const origSingers: string[] = record.singers || [];
    let updatedSingers = origSingers.filter(
      (s) => s !== 'Enna Alouette' && s !== 'Reimu Endou'
    );

    // 空になった場合は配信主である Elira Pendora を設定
    if (updatedSingers.length === 0) {
      updatedSingers = ['Elira Pendora'];
    }

    const { error: updateError } = await supabase
      .from('singing_stream')
      .update({ singers: updatedSingers })
      .eq('id', record.id);

    if (updateError) {
      console.error(`更新失敗 (ID: ${record.id}):`, updateError);
    } else {
      const songTitle = (record.song as any)?.title || '不明';
      console.log(`✓ [${record.start}s] ${songTitle}: [${origSingers.join(', ')}] -> [${updatedSingers.join(', ')}]`);
    }
  }

  console.log('すべての歌唱者タグの修正が完了しました！');
}

main().catch(console.error);
