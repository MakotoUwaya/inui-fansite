import { supabase } from '../utils/supabaseClient';

const VIDEO_ID = 'H1UMhuuuXOQ';

// ユーザー提示の正確な歌唱者マッピング（秒数 -> 歌唱者配列）
const TIMETABLE_SINGERS: Array<{ start: number; singers: string[]; label: string }> = [
  { start: 176, singers: ['Elira Pendora'], label: '2:56 新時代 / ☀️' },
  { start: 700, singers: ['Elira Pendora', 'Luca Kaneshiro', 'Doppio Dropscythe', 'Meloco Kyoran', 'Yu Q. Wilson'], label: '11:40 残酷のテーゼ / ☀️🦁🐣🌂🥽' },
  { start: 1112, singers: ['Luca Kaneshiro', 'Doppio Dropscythe', 'Yu Q. Wilson'], label: '18:32 愛♡スクリーム / 🦁🐣🥽' },
  { start: 1484, singers: ['Elira Pendora', 'Maria Marionette', 'Meloco Kyoran'], label: '24:44 soldier game / ☀️❤️🩹🌂' },
  { start: 1841, singers: ['Doppio Dropscythe', 'Meloco Kyoran'], label: '30:41 Before my body is dry / 🐣🌂' },
  { start: 2165, singers: ['Elira Pendora', 'Doppio Dropscythe'], label: '36:05 とんとんまーえ! / ☀️🐣' },
  { start: 2359, singers: ['Luca Kaneshiro'], label: '39:19 BLOODY STREAM / 🦁' },
  { start: 2767, singers: ['Elira Pendora', 'Yu Q. Wilson'], label: '46:07 departure! / ☀️🥽' },
  { start: 3062, singers: ['Yu Q. Wilson'], label: '51:02 忘れられないの / 🥽' },
  { start: 3349, singers: ['Elira Pendora', 'Maria Marionette'], label: '55:49 オトナモード / ☀️❤️🩹' },
  { start: 3662, singers: ['Elira Pendora', 'Meloco Kyoran'], label: '1:01:02 深海少女 / ☀️🌂' },
  { start: 4184, singers: ['Elira Pendora', 'Doppio Dropscythe', 'Yu Q. Wilson'], label: '1:09:44 It’s Going Down Now / ☀️🐣🥽' },
  { start: 4519, singers: ['Elira Pendora', 'Luca Kaneshiro', 'Maria Marionette', 'Meloco Kyoran'], label: '1:15:19 ピースサイン / ☀️🦁❤️🩹🌂' },
  { start: 4884, singers: ['Maria Marionette', 'Meloco Kyoran'], label: '1:21:24 モニタリング / ❤️🩹🌂' },
  { start: 5146, singers: ['Elira Pendora', 'Maria Marionette', 'Doppio Dropscythe', 'Meloco Kyoran'], label: '1:25:46 うまぴょい伝説 / ☀️❤️🩹🐣🌂' },
  { start: 5522, singers: ['Elira Pendora'], label: '1:32:02 プラチナ / ☀️' },
  { start: 5833, singers: ['Luca Kaneshiro', 'Doppio Dropscythe'], label: '1:37:13 DADDY! DADDY! DO! / 🦁🐣' },
  { start: 6133, singers: ['Elira Pendora', 'Maria Marionette', 'Meloco Kyoran'], label: '1:42:13 威風堂々 / ☀️❤️🩹🌂' },
  { start: 6418, singers: ['Elira Pendora'], label: '1:46:58 ライトラグ / ☀️' },
  { start: 6727, singers: ['Elira Pendora', 'Luca Kaneshiro', 'Maria Marionette', 'Doppio Dropscythe', 'Meloco Kyoran', 'Yu Q. Wilson'], label: '1:52:07 God knows… / ☀️🦁❤️🩹🐣🌂🥽' },
  { start: 7106, singers: ['Elira Pendora', 'Doppio Dropscythe'], label: '1:58:26 アウターサイエンス / ☀️🐣' },
  { start: 7425, singers: ['Maria Marionette', 'Doppio Dropscythe'], label: '2:03:45 とんとんまーえ! / ❤️🩹🐣' },
  { start: 7619, singers: ['Luca Kaneshiro', 'Doppio Dropscythe', 'Meloco Kyoran', 'Yu Q. Wilson'], label: '2:06:59 とんとんまーえ! / 🦁🐣🌂🥽' },
  { start: 7771, singers: ['Elira Pendora', 'Maria Marionette'], label: '2:09:31 キミと××××したいだけ / ☀️❤️🩹' },
  { start: 8042, singers: ['Elira Pendora', 'Doppio Dropscythe'], label: '2:14:02 君の記憶 / ☀️🐣' },
  { start: 8499, singers: ['Elira Pendora', 'Luca Kaneshiro', 'Maria Marionette', 'Meloco Kyoran'], label: '2:21:39 少女レイ / ☀️🦁❤️🩹🌂' },
  { start: 8848, singers: ['Elira Pendora', 'Luca Kaneshiro', 'Maria Marionette', 'Doppio Dropscythe', 'Meloco Kyoran', 'Yu Q. Wilson'], label: '2:27:28 ブルーバード / ☀️🦁❤️🩹🐣🌂🥽' },
  { start: 9210, singers: ['Elira Pendora', 'Maria Marionette', 'Doppio Dropscythe'], label: '2:33:30 ブラック★ロックシューター / ☀️❤️🩹🐣' },
  { start: 9579, singers: ['Elira Pendora', 'Luca Kaneshiro', 'Maria Marionette', 'Doppio Dropscythe', 'Meloco Kyoran'], label: '2:39:39 ドレミファロンド / ☀️🦁❤️🩹🐣🌂' },
  { start: 9864, singers: ['Maria Marionette', 'Meloco Kyoran'], label: '2:44:24 怪物 / ❤️🩹🌂' },
  { start: 10117, singers: ['Elira Pendora'], label: '2:48:37 sunbeams / ☀️' },
  { start: 10377, singers: ['Elira Pendora', 'Luca Kaneshiro', 'Maria Marionette', 'Doppio Dropscythe', 'Meloco Kyoran', 'Yu Q. Wilson'], label: '2:52:57 光るなら / ☀️🦁❤️🩹🐣🌂🥽' },
];

async function main() {
  console.log(`動画 ${VIDEO_ID} の全32曲の歌唱者データを更新します...`);

  const { data: dbRecords, error } = await supabase
    .from('singing_stream')
    .select('id, start, song(title)')
    .eq('video_id', VIDEO_ID);

  if (error || !dbRecords) {
    console.error('データ取得エラー:', error);
    process.exit(1);
  }

  for (const item of TIMETABLE_SINGERS) {
    // start 時間が一致（または±3秒以内で一致）するレコードを探索
    const match = dbRecords.find((r) => Math.abs(r.start - item.start) <= 3);
    if (!match) {
      console.warn(`⚠️ 一致するレコードが見つかりません: start=${item.start} (${item.label})`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('singing_stream')
      .update({ singers: item.singers })
      .eq('id', match.id);

    if (updateError) {
      console.error(`❌ 更新失敗 (${item.label}):`, updateError);
    } else {
      const title = (match.song as any)?.title || '';
      console.log(`✓ [${match.start}s] ${title}: -> [${item.singers.join(', ')}]`);
    }
  }

  console.log('すべての歌唱者データの更新が完了しました！');
}

main().catch(console.error);
