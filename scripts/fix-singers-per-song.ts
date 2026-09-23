import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...values] = trimmed.split('=');
          const val = values.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 動画IDと曲名に基づく正確な歌唱者マッピング
const SONG_SINGER_MAP: Record<string, Record<string, string[]>> = {
  // ① 戌亥とこ / 長尾景 コラボ歌枠
  sz3SGilaOAA: {
    '未来予想図II': ['戌亥とこ'],
    'どんなときも。': ['長尾景'],
    '空も飛べるはず': ['戌亥とこ', '長尾景'],
    'バンザイ〜好きでよかった〜': ['長尾景'],
    'タイミング〜Timing〜': ['戌亥とこ', '長尾景'],
    'ギブス': ['戌亥とこ'],
    '天体観測': ['戌亥とこ', '長尾景'],
    '奏': ['長尾景'],
    '純恋歌': ['長尾景'],
    '蕾': ['戌亥とこ', '長尾景'],
    '深海少女': ['戌亥とこ'],
    '千本桜': ['戌亥とこ', '長尾景'],
    '神のまにまに': ['戌亥とこ', '長尾景'],
    'サイレントマジョリティー': ['戌亥とこ'],
    '打上花火': ['戌亥とこ', '長尾景'],
    'Lemon': ['戌亥とこ', '長尾景'],
  },

  // ② 戌亥とこ / 珠乃井ナナ ジブリ歌枠
  IYYiJwcO2B0: {
    'テルーの唄': ['戌亥とこ', '珠乃井ナナ'],
    '君をのせて': ['戌亥とこ', '珠乃井ナナ'],
    'ひこうき雲': ['戌亥とこ'],
    '地球儀': ['珠乃井ナナ'],
    'やさしさに包まれたなら': ['戌亥とこ', '珠乃井ナナ'],
    '崖の上のポニョ': ['戌亥とこ', '珠乃井ナナ'],
    'いのちの名前': ['戌亥とこ', '珠乃井ナナ'],
    'ルージュの伝言': ['珠乃井ナナ'],
    '時の歌': ['戌亥とこ'],
    '世界の約束': ['戌亥とこ', '珠乃井ナナ'],
    '風になる': ['戌亥とこ', '珠乃井ナナ'],
  },

  // ③ 大型コラボ歌枠 (立伝都々 / 北見遊征 / 珠乃井ナナ / 早乙女ベリー / 渚トラウト)
  jj4bKFqicXM: {
    'カーテンコール': ['立伝都々', '北見遊征', '珠乃井ナナ', '早乙女ベリー', '渚トラウト'],
    'HANDS UP!': ['北見遊征'],
    'ラブソングに襲われる': ['立伝都々', '珠乃井ナナ', '早乙女ベリー'],
    '太陽系デスコ': ['早乙女ベリー'],
    'カメレオン': ['渚トラウト'],
    'ノーダウト': ['北見遊征', '渚トラウト'],
    'メリッサ': ['立伝都々'],
    '瞬間センチメンタル': ['珠乃井ナナ'],
    'フラジール': ['早乙女ベリー', '渚トラウト'],
    'unravel': ['立伝都々', '北見遊征'],
    '容姿端麗な嘘': ['珠乃井ナナ', '渚トラウト'],
    '勿忘': ['北見遊征', '早乙女ベリー'],
    'とくべチュ、して': ['立伝都々', '珠乃井ナナ'],
    'イイじゃん': ['立伝都々', '北見遊征', '珠乃井ナナ', '早乙女ベリー', '渚トラウト'],
  },
};

async function main() {
  console.log('🔄 各曲単位の正確な歌唱者（singers）情報の更新を開始します...\n');

  const { data: streams, error } = await supabase
    .from('singing_stream')
    .select('id, video_id, song(title)');

  if (error || !streams) {
    console.error('❌ データ取得エラー:', error);
    process.exit(1);
  }

  let updatedCount = 0;

  for (const stream of streams) {
    const songTitle = (stream.song as any)?.title;
    const videoMap = SONG_SINGER_MAP[stream.video_id];

    let targetSingers: string[] | null = null;

    if (videoMap && videoMap[songTitle]) {
      targetSingers = videoMap[songTitle];
    } else if (stream.video_id === 'Gapv5ikX3xY') {
      targetSingers = ['戌亥とこ'];
    } else if (stream.video_id === 'oygRG7OrYQI') {
      targetSingers = ['Elira Pendora'];
    } else if (stream.video_id === 'RofmcuWNB2w' || stream.video_id === 'MMCAjfWASa8') {
      targetSingers = ['蝸堂みかる'];
    }

    if (targetSingers) {
      const { error: updateError } = await supabase
        .from('singing_stream')
        .update({ singers: targetSingers })
        .eq('id', stream.id);

      if (updateError) {
        console.error(`  ❌ 更新失敗 (${songTitle}): ${updateError.message}`);
      } else {
        console.log(`  ✓ ${songTitle}: [${targetSingers.join(', ')}]`);
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 合計 ${updatedCount} 曲の歌唱者情報を正しく更新しました！`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
